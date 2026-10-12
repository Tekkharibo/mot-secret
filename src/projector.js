// Projection : une fiche à la fois en plein écran (TBI, vidéoprojecteur, iPad), mise en page adaptée à l'écran.
// Navigation : grands boutons ◀ ▶, glisser au doigt, clavier / télécommande de présentation.
// « Révéler » remplit la bande case par case (première case encore cachée) ; changer de fiche recache tout.
import { CONTROLS_HEIGHT, layoutScreen } from "./layout.js";
import { renderPage } from "./render.js";
import { hideLast, revealNext } from "./reveal.js";
import { parseWord } from "./word.js";

const root = document.getElementById("projector");
const stage = root.querySelector(".projector-stage");
const controls = root.querySelector(".projector-controls");
const counter = root.querySelector(".projector-counter");
const prevButton = root.querySelector(".js-prev");
const nextButton = root.querySelector(".js-next");
const revealButton = root.querySelector(".js-reveal");

let sheets = [];
let style = {};
let index = 0;
let revealed = []; // cases révélées sur la fiche en cours (voir reveal.js)

const letterCount = () => parseWord(sheets[index].word).flat().filter((item) => item.letter).length;

function show() {
  const page = layoutScreen(sheets[index], style, { width: root.clientWidth, height: root.clientHeight });
  stage.replaceChildren(renderPage(page, { ...style, revealed }));
  const barHeight = (CONTROLS_HEIGHT / page.height) * root.clientHeight;
  controls.style.height = `${barHeight}px`;
  controls.style.fontSize = `${barHeight * 0.32}px`;
  counter.textContent = `${index + 1} / ${sheets.length}`;
  prevButton.disabled = index === 0;
  nextButton.disabled = index === sheets.length - 1;
  revealButton.textContent = revealed.length >= letterCount() ? "↺ Cacher" : "👁 Révéler";
}

function go(delta) {
  const target = index + delta;
  if (target < 0 || target >= sheets.length) return;
  index = target;
  revealed = [];
  show();
}

function setRevealed(next) {
  revealed = next;
  show();
}

const KEYS = {
  ArrowRight: () => go(1),
  PageDown: () => go(1),
  " ": () => go(1),
  ArrowLeft: () => go(-1),
  PageUp: () => go(-1),
  Enter: () => setRevealed(revealNext(revealed, letterCount())),
  ArrowDown: () => setRevealed(revealNext(revealed, letterCount())),
  ArrowUp: () => setRevealed(hideLast(revealed)),
  Escape: () => closeProjector(),
};

function onKey(event) {
  const action = KEYS[event.key];
  if (!action) return;
  event.preventDefault(); // sinon Entrée / Espace activeraient aussi le bouton qui a le focus
  action();
}

// Glisser horizontalement d'au moins 50 px : fiche suivante (vers la gauche) ou précédente (vers la droite).
let start = null;
stage.addEventListener("pointerdown", (e) => (start = { x: e.clientX, y: e.clientY }));
stage.addEventListener("pointerup", (e) => {
  if (!start) return;
  const dx = e.clientX - start.x;
  const dy = e.clientY - start.y;
  start = null;
  if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) go(dx < 0 ? 1 : -1);
});

// Le bouton reprend le focus du clavier aussitôt cliqué : les touches restent celles de la projection.
const onClick = (button, action) => button.addEventListener("click", () => (action(), root.focus()));
onClick(prevButton, () => go(-1));
onClick(nextButton, () => go(1));
onClick(revealButton, () => setRevealed(revealed.length >= letterCount() ? [] : revealNext(revealed, letterCount())));
onClick(root.querySelector(".js-close"), () => closeProjector());

// Échap en plein écran quitte d'abord le plein écran sans que la page reçoive la touche : on ferme aussi.
// Versions préfixées « webkit » : iPad sous iPadOS antérieur à 16.4.
const fullscreenElement = () => document.fullscreenElement ?? document.webkitFullscreenElement;
for (const event of ["fullscreenchange", "webkitfullscreenchange"]) {
  document.addEventListener(event, () => !fullscreenElement() && closeProjector());
}

export function openProjector(newSheets, newStyle) {
  if (!newSheets.length) return;
  sheets = newSheets;
  style = newStyle;
  index = 0;
  revealed = [];
  root.hidden = false;
  document.body.classList.add("is-projecting");
  // Plein écran quand le navigateur le permet (pas sur iPhone : la projection occupe alors toute la fenêtre).
  const request = root.requestFullscreen ?? root.webkitRequestFullscreen;
  if (request) Promise.resolve(request.call(root)).catch(() => {});
  document.addEventListener("keydown", onKey);
  window.addEventListener("resize", show);
  show();
  root.focus();
}

function closeProjector() {
  if (root.hidden) return;
  root.hidden = true;
  document.body.classList.remove("is-projecting");
  document.removeEventListener("keydown", onKey);
  window.removeEventListener("resize", show);
  if (fullscreenElement()) Promise.resolve((document.exitFullscreen ?? document.webkitExitFullscreen).call(document)).catch(() => {});
}
