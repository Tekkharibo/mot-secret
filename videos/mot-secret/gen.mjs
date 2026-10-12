// Génère les compositions (une par vidéo) à partir de scenes.mjs : `node gen.mjs`.
// Chaque étape = une capture réelle de l'app + caméra (zoom sur une zone) + curseur + légende.
import { existsSync, mkdirSync, readFileSync, symlinkSync, writeFileSync } from "node:fs";
import { VIDEOS } from "./scenes.mjs";

const W = 1920, H = 1080;
const CARD = { x: 200, y: 36, w: 1520, h: 855 }; // capture affichée en 16:9
const K = CARD.w / W;
// Mode présentateur : écran élèves (gauche) plus petit, écran enseignant (droite) plus grand pour rester lisible.
const DUAL = { left: { x: 50, y: 300, w: 700 }, right: { x: 790, y: 160, w: 1080 } };
const dualBox = (d) => `left:${d.x}px;top:${d.y}px;width:${d.w}px;height:${(d.w * H) / W}px`;
const dualLabel = (d) => `left:${d.x}px;top:${d.y - 62}px;width:${d.w}px`;
const boxes = JSON.parse(readFileSync(new URL("./assets/shots/boxes.json", import.meta.url)));

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const words = (c) => c.join(" ").split(/\s+/).filter(Boolean).length;
// Temps de lecture : ~3 mots/s + marge, jamais moins de 4,5 s.
const readTime = (c) => Math.max(4.5, 1.4 + words(c) * 0.3);
const center = (b) => [b.x + b.width / 2, b.y + b.height / 2];
const point = (p) => (typeof p === "string" ? center(boxes[p]) : p);
const area = (a) => (typeof a === "string" ? [boxes[a].x, boxes[a].y, boxes[a].width, boxes[a].height] : a);

// Caméra : zoom pour cadrer la zone, recentré, sans sortir de la capture.
function camera(a) {
  if (!a) return { s: K, tx: 0, ty: 0 };
  const [x, y, w, h] = area(a);
  const z = Math.min(2.4, Math.max(1, Math.min(W / (w * 1.25), H / (h * 1.25))));
  const s = K * z;
  const clamp = (v, min) => Math.min(0, Math.max(min, v));
  return {
    s,
    tx: clamp(CARD.w / 2 - (x + w / 2) * s, CARD.w - W * s),
    ty: clamp(CARD.h / 2 - (y + h / 2) * s, CARD.h - H * s),
  };
}

function build(video) {
  const imgs = new Map(); // calque|src -> id, pour la pile d'images de chaque calque
  const imgId = (layer, src) => {
    const key = `${layer}|${src}`;
    if (!imgs.has(key)) imgs.set(key, { id: `${layer}-${imgs.size}`, layer, src });
    return imgs.get(key).id;
  };
  let t = 0;
  const steps = video.steps.map((st, i) => {
    const dur = st.dur ?? readTime(st.caption ?? []);
    const s = { ...st, i, start: +t.toFixed(2), dur, layer: st.layer ?? "screen" };
    if (s.layer === "screen") {
      s.imgA = imgId("screen", st.img);
      if (st.after) s.imgB = imgId("screen", st.after);
      s.cam = camera(st.cam);
      s.cam2 = st.cam2 !== undefined ? camera(st.cam2) : null;
      if (st.cursor) {
        const [px, py] = point(st.cursor);
        s.cur = [CARD.x + s.cam.tx + px * s.cam.s, CARD.y + s.cam.ty + py * s.cam.s];
      }
    } else if (s.layer === "dual") {
      s.lA = imgId("left", st.left); s.rA = imgId("right", st.right);
      if (st.after) { s.lB = imgId("left", st.after.left); s.rB = imgId("right", st.after.right); }
      if (st.cursor) {
        const [px, py] = point(st.cursor);
        s.cur = [DUAL.right.x + (px * DUAL.right.w) / W, DUAL.right.y + (py * DUAL.right.w) / W];
      }
    } else if (s.layer === "paper") s.paperId = imgId("paper", st.img);
    t += dur;
    return s;
  });
  const total = +t.toFixed(2);

  const stack = (layer) =>
    [...imgs.values()].filter((m) => m.layer === layer)
      .map((m) => `<img id="${m.id}" class="shot" src="assets/shots/${m.src}" alt="" />`).join("\n          ");
  const captions = steps.filter((s) => s.caption).map((s) => `
      <div id="cap-${s.i}" class="cap">
        <p class="h">${esc(s.caption[0])}</p>${s.caption[1] ? `\n        <p class="sub">${esc(s.caption[1])}</p>` : ""}
      </div>`).join("");
  const titles = steps.filter((s) => s.layer === "title").map((s) => `
      <div id="title-${s.i}" class="title">
        ${s.kicker ? `<p class="kicker">${esc(s.kicker)}</p>` : ""}
        <h1>${esc(s.heading)}</h1>
        ${s.text ? `<p class="lead">${esc(s.text)}</p>` : ""}
        ${s.url ? `<p class="url">${esc(s.url)}</p>` : ""}
      </div>`).join("");
  const deco = (video.deco ?? []).map((d, i) =>
    `<img id="deco-${i}" class="deco" src="assets/emoji/${d.f}" style="left:${d.x}px;top:${d.y}px;width:${d.s}px" alt="" />`).join("\n      ");

  const data = steps.map(({ i, start, dur, layer, imgA, imgB, cam, cam2, cur, lA, rA, lB, rB, paperId, caption, hold }) =>
    ({ i, start, dur, layer, imgA, imgB, cam, cam2, cur, lA, rA, lB, rB, paperId, cap: !!caption, hold: !!hold }));

  return `<!doctype html>
<html lang="fr">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=${W}, height=${H}" />
    <title>${esc(video.title)}</title>
    <script src="https://cdn.jsdelivr.net/npm/gsap@3.14.2/dist/gsap.min.js"></script>
    <style>
      @font-face { font-family: "Andika"; src: url("assets/fonts/andika-400.woff2") format("woff2"); font-weight: 400; }
      @font-face { font-family: "Andika"; src: url("assets/fonts/andika-700.woff2") format("woff2"); font-weight: 700; }
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { background: #eef1f5; }
      #root { position: relative; width: 100%; height: 100%; overflow: hidden; font-family: "Andika", sans-serif; color: #1d2433;
        background: radial-gradient(1200px 700px at 20% 0%, #e3ecfb 0%, #eef1f5 60%); }
      .layer { position: absolute; inset: 0; opacity: 0; }
      #card { position: absolute; left: ${CARD.x}px; top: ${CARD.y}px; width: ${CARD.w}px; height: ${CARD.h}px; overflow: hidden;
        border-radius: 22px; background: #fff; box-shadow: 0 30px 80px rgba(29,36,51,.18), 0 0 0 1px rgba(29,36,51,.08); }
      #cam { position: absolute; left: 0; top: 0; width: ${W}px; height: ${H}px; transform-origin: 0 0; }
      .shot { position: absolute; inset: 0; width: 100%; height: 100%; opacity: 0; }
      .dual { position: absolute; overflow: hidden; border-radius: 18px;
        background: #fff; box-shadow: 0 24px 60px rgba(29,36,51,.18), 0 0 0 1px rgba(29,36,51,.08); }
      .dual .wrap { position: absolute; left: 0; top: 0; width: ${W}px; height: ${H}px; transform-origin: 0 0; }
      .dual-label { position: absolute; text-align: center; font-size: 36px; font-weight: 700; color: #2c6bed; }
      #paper-sheet { position: absolute; left: 665px; top: 40px; width: 590px; height: 834px; overflow: hidden;
        border-radius: 6px; background: #fff; box-shadow: 0 30px 80px rgba(29,36,51,.25); }
      .cap { position: absolute; left: 120px; right: 120px; top: 908px; text-align: center; opacity: 0; }
      .cap .h { font-size: 54px; font-weight: 700; line-height: 1.15; }
      .cap .sub { margin-top: 8px; font-size: 36px; color: #4a5568; line-height: 1.2; }
      .title { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; opacity: 0; }
      .title .kicker { font-size: 40px; font-weight: 700; color: #2c6bed; letter-spacing: .04em; text-transform: uppercase; }
      .title h1 { font-size: 150px; font-weight: 700; line-height: 1.05; color: #1d2433; }
      .title .lead { margin-top: 28px; max-width: 1600px; font-size: 52px; color: #4a5568; line-height: 1.25; }
      .title .url { margin-top: 44px; font-size: 44px; font-weight: 700; color: #fff; background: #2c6bed; padding: 14px 40px; border-radius: 999px; }
      .deco { position: absolute; opacity: 0; }
      #cursor { position: absolute; left: 0; top: 0; width: 56px; height: 56px; opacity: 0; }
      #ripple { position: absolute; left: -60px; top: -60px; width: 120px; height: 120px; border-radius: 50%;
        border: 6px solid #2c6bed; background: rgba(44,107,237,.18); opacity: 0; }
    </style>
  </head>
  <body>
    <div id="root" data-composition-id="${video.id}" data-start="0" data-duration="${total}" data-width="${W}" data-height="${H}">
      <div id="L-title" class="layer">
      ${deco}${titles}
      </div>
      <div id="L-screen" class="layer">
        <div id="card"><div id="cam" data-layout-allow-overflow>
          ${stack("screen")}
        </div></div>
      </div>
      <div id="L-dual" class="layer">
        <p class="dual-label" style="${dualLabel(DUAL.left)}">TBI : ce que voient les élèves</p>
        <p class="dual-label" style="${dualLabel(DUAL.right)}">Ton écran</p>
        <div class="dual" style="${dualBox(DUAL.left)}"><div class="wrap" style="transform:scale(${DUAL.left.w / W})">
          ${stack("left")}
        </div></div>
        <div class="dual" style="${dualBox(DUAL.right)}"><div class="wrap" style="transform:scale(${DUAL.right.w / W})">
          ${stack("right")}
        </div></div>
      </div>
      <div id="L-paper" class="layer">
        <div id="paper-sheet">
          ${stack("paper")}
        </div>
      </div>
      ${captions}
      <div id="ripple"></div>
      <svg id="cursor" viewBox="0 0 28 28"><path d="M5 2 L5 23 L10.5 18 L14.5 26.5 L18 25 L14 16.8 L21.5 16.8 Z" fill="#1d2433" stroke="#fff" stroke-width="2" stroke-linejoin="round"/></svg>
    </div>
    <script>
      const STEPS = ${JSON.stringify(data)};
      const tl = gsap.timeline({ paused: true });
      const camTo = (c, at, d) => tl.to("#cam", { x: c.tx, y: c.ty, scale: c.s, duration: d, ease: "power2.inOut" }, at);
      tl.set("#cam", { x: 0, y: 0, scale: ${K} }, 0);
      tl.set("#cursor", { x: 960, y: 1100 }, 0);
      tl.set("#ripple", { x: 960, y: 1100 }, 0);
      let layer = null, cursorOn = false;
      const shown = {};
      const show = (key, id, at) => {
        if (shown[key] === id) return;
        if (shown[key]) tl.to("#" + shown[key], { opacity: 0, duration: 0.45 }, at);
        tl.to("#" + id, { opacity: 1, duration: 0.45 }, at);
        shown[key] = id;
      };
      STEPS.forEach((s, n) => {
        const t = s.start;
        const first = n === 0;
        if (s.layer !== layer) {
          if (layer) tl.to("#L-" + layer, { opacity: 0, duration: 0.5 }, t);
          tl.fromTo("#L-" + s.layer, { opacity: 0 }, { opacity: 1, duration: first ? 0.01 : 0.5 }, t);
          layer = s.layer;
        }
        if (s.layer === "title") {
          tl.fromTo("#title-" + s.i, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.7, ease: "power3.out" }, t + 0.2);
          tl.to("#title-" + s.i, { opacity: 0, duration: 0.4 }, t + s.dur - 0.4);
          document.querySelectorAll(".deco").forEach((d, k) =>
            tl.fromTo(d, { opacity: 0, scale: 0.6, rotation: -12 }, { opacity: 1, scale: 1, rotation: 0, duration: 0.6, ease: "back.out(1.7)" }, t + 0.1 + k * 0.08));
        }
        if (s.layer === "screen") {
          show("screen", s.imgA, t);
          camTo(s.cam, t + (first ? 0 : 0.1), first ? 0.01 : 1.0);
        }
        if (s.layer === "dual") { show("left", s.lA, t); show("right", s.rA, t); }
        if (s.layer === "paper") {
          show("paper", s.paperId, t);
          tl.fromTo("#paper-sheet", { y: 160, rotation: -3 }, { y: 0, rotation: 0, duration: 0.9, ease: "power3.out" }, t);
        }
        if (s.cap) {
          tl.fromTo("#cap-" + s.i, { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.5, ease: "power2.out" }, t + 0.3);
          tl.to("#cap-" + s.i, { opacity: 0, duration: 0.3 }, t + s.dur - 0.3);
        }
        // Curseur : arrive sur la cible, clique ; l'écran passe à l'état suivant juste après le clic.
        if (s.cur) {
          const click = t + 2.1;
          if (!cursorOn) { tl.to("#cursor", { opacity: 1, duration: 0.3 }, t + 0.6); cursorOn = true; }
          tl.to("#cursor", { x: s.cur[0] - 8, y: s.cur[1] - 4, duration: 0.9, ease: "power2.inOut" }, t + 0.6);
          tl.set("#ripple", { x: s.cur[0], y: s.cur[1] }, click);
          tl.fromTo("#ripple", { opacity: 0.9, scale: 0.3 }, { opacity: s.hold ? 0.6 : 0, scale: 1, duration: 0.6, ease: "power2.out" }, click);
          if (s.hold) tl.to("#ripple", { opacity: 0, duration: 0.3 }, t + s.dur - 0.5);
          tl.to("#cursor", { scale: 0.85, duration: 0.12, yoyo: true, repeat: 1, transformOrigin: "8px 4px" }, click);
          if (s.imgB) show("screen", s.imgB, click + 0.15);
          if (s.lB) { show("left", s.lB, click + 0.15); show("right", s.rB, click + 0.15); }
          if (s.cam2) camTo(s.cam2, click + 0.9, 1.0);
        } else {
          if (cursorOn) { tl.to("#cursor", { opacity: 0, duration: 0.3 }, t); cursorOn = false; }
          if (s.cam2) camTo(s.cam2, t + 1.6, 1.0);
        }
      });
      window.__timelines["${video.id}"] = tl;
    </script>
  </body>
</html>
`;
}


for (const v of VIDEOS) {
  const html = build(v);
  const total = html.match(/data-duration="([\d.]+)"/)[1];
  const dir = new URL(`./clips/${v.id}/`, import.meta.url);
  mkdirSync(dir, { recursive: true });
  if (!existsSync(new URL("assets", dir))) symlinkSync("../../assets", new URL("assets", dir));
  writeFileSync(new URL("index.html", dir), html);
  console.log(`${v.id}: ${total}s`);
}
