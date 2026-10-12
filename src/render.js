// Rendu SVG d'une page mise en page (voir layout.js et docs/adr/0002) : le même SVG sert à l'aperçu et au PDF.
import { FONTS } from "./data/fonts.js";
import { THEMES } from "./data/themes.js";
import { pictureFile } from "./picture.js";

const NS = "http://www.w3.org/2000/svg";
const INK = "#111";
const LINE = { stroke: "#222", "stroke-width": 0.4 };
const VOWELS = "AEIOUY"; // en français, Y est classé avec les voyelles
const COLORS = { vowel: "#d62828", consonant: "#1d4ed8" };
// Décor : position en % de la page, taille en mm, rotation en degrés.
const DECOR_SPOTS = [
  { x: -4, y: -2, s: 46, r: -15 },
  { x: 84, y: 1, s: 34, r: 20 },
  { x: 90, y: 30, s: 22, r: 10 },
  { x: -3, y: 42, s: 26, r: -8 },
  { x: 88, y: 58, s: 30, r: -20 },
  { x: 2, y: 82, s: 40, r: 12 },
  { x: 80, y: 86, s: 44, r: -10 },
  { x: 45, y: 92, s: 20, r: 5 },
];

function el(tag, attrs = {}, ...children) {
  const node = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) if (v !== undefined && v !== null) node.setAttribute(k, v);
  node.append(...children);
  return node;
}

export function renderPage(page, style) {
  const theme = THEMES[style.theme];
  const family = FONTS[style.font].family;
  const accent = style.blackWhite ? INK : theme.accent;

  const picture = (p, cx, cy, size, attrs = {}) =>
    el("image", {
      href: `emoji/${style.blackWhite ? "hc" : "flat"}/${pictureFile(p)}.svg`,
      x: cx - size / 2,
      y: cy - size / 2,
      width: size,
      height: size,
      ...attrs,
    });
  const text = (content, x, y, size, attrs = {}) =>
    el("text", { x, y, "font-size": size, "font-family": family, "text-anchor": "middle", "dominant-baseline": "central", fill: INK, ...attrs }, content);
  // Lettre de l'alphabet : minuscule et couleur selon les options.
  const letter = (l, x, y, size) => {
    const color = style.colorVowels && !style.blackWhite ? COLORS[VOWELS.includes(l) ? "vowel" : "consonant"] : INK;
    return text(style.lowercase ? l.toLowerCase() : l, x, y, size, { fill: color, "data-role": "letter" });
  };
  const box = (x, y, w, h) => el("rect", { x, y, width: w, height: h, fill: "#fff", rx: style.spaced ? 1.5 : null, ...LINE });

  const svg = el("svg", { xmlns: NS, viewBox: "0 0 210 297", width: "210mm", height: "297mm" });
  if (style.blackWhite) svg.append(el("rect", { width: 210, height: 297, fill: "#fff" }));
  else {
    svg.append(
      el("defs", {}, el("linearGradient", { id: "bg", x1: 0, y1: 0, x2: 0, y2: 1 }, el("stop", { offset: 0, "stop-color": theme.bg[0] }), el("stop", { offset: 1, "stop-color": theme.bg[1] }))),
      el("rect", { width: 210, height: 297, fill: "url(#bg)" })
    );
    DECOR_SPOTS.forEach((s, i) => {
      const cx = (s.x * 210) / 100 + s.s / 2;
      const cy = (s.y * 297) / 100 + s.s / 2;
      svg.append(picture(theme.decor[i % theme.decor.length], cx, cy, s.s, { opacity: 0.28, transform: `rotate(${s.r} ${cx} ${cy})`, "data-role": "decor" }));
    });
  }

  for (const item of page.items) {
    const cx = item.x + item.w / 2;
    if (item.type === "text") {
      if (item.role === "name") {
        // « Prénom : » suivi d'une ligne pointillée de 70 mm, l'ensemble centré.
        svg.append(
          text(item.text, item.x - 22, item.y, item.size, { "text-anchor": "end", "data-role": "name" }),
          el("line", { x1: item.x - 20, y1: item.y + item.size * 0.4, x2: item.x + 50, y2: item.y + item.size * 0.4, stroke: "#333", "stroke-width": 0.4, "stroke-dasharray": "0.4 0.8" })
        );
      } else {
        const attrs = item.role === "title" ? { fill: accent, "font-weight": 700 } : { fill: "#333" };
        svg.append(text(item.text, item.x, item.y, item.size, { ...attrs, "data-role": item.role }));
      }
    } else if (item.type === "badge") {
      const fill = style.blackWhite ? { fill: "#fff", stroke: INK, "stroke-width": 0.4 } : { fill: "#4a5a6e" };
      svg.append(
        el("g", { "data-role": "badge" }, el("circle", { cx: item.x, cy: item.y, r: item.size / 2, ...fill }), text(item.text, item.x, item.y, 6, { fill: style.blackWhite ? INK : "#fff" }))
      );
    } else if (item.type === "cell") {
      const g = el("g", { "data-role": "cell" }, box(item.x, item.y, item.w, item.h));
      const cy = item.y + item.h / 2;
      if (item.key) {
        // Clé : dessin au-dessus de sa lettre, l'ensemble centré dans la case.
        const total = 13 + 0.6 + item.letterSize;
        g.append(picture(item.picture, cx, cy - total / 2 + 6.5, 13), letter(item.letter, cx, cy + total / 2 - item.letterSize / 2, item.letterSize));
      } else if (item.picture) g.append(picture(item.picture, cx, cy, 15));
      else g.append(letter(item.letter, cx, cy, item.letterSize));
      svg.append(g);
    } else if (item.type === "strip") {
      const g = el("g", { "data-role": "strip" });
      const answerY = item.y + item.boxH + item.gap;
      if (item.char) g.append(text(item.char, cx, answerY + item.boxH / 2, item.answerSize));
      else {
        g.append(box(item.x, item.y, item.w, item.boxH), box(item.x, answerY, item.w, item.boxH));
        if (item.picture) g.append(picture(item.picture, cx, item.y + item.boxH / 2, item.pictureSize));
        else g.append(text(item.hint, cx, item.y + item.boxH / 2, item.pictureSize)); // lettre donnée en indice
      }
      svg.append(g);
    } else if (item.type === "answer") {
      const g = el("g", { "data-role": "answer" });
      if (!item.blank) g.append(box(item.x, item.y, item.w, item.h));
      if (item.letter) g.append(letter(item.letter, cx, item.y + item.h / 2, item.size));
      else if (item.char) g.append(text(item.char, cx, item.y + item.h / 2, item.size));
      svg.append(g);
    }
  }
  return svg;
}
