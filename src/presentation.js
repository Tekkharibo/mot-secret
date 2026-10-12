// Mode présentateur (deux écrans branchés sur le même ordinateur, comme PowerPoint) :
// - la fenêtre élèves (index.html?vue=eleves, à mettre sur le TBI) montre la fiche seule, sans boutons ;
// - la vue enseignant montre la même fiche, cliquable case par case, la réponse (en maintenant un bouton),
//   la fiche suivante et les commandes.
// Les deux fenêtres se parlent par BroadcastChannel : aucun serveur, marche hors connexion.
import { layoutScreen } from "./layout.js";
import { KEY_ACTIONS, onSwipe } from "./projector.js";
import { renderPage } from "./render.js";
import { hideLast, revealNext, toggle } from "./reveal.js";
import { parseWord } from "./word.js";

const CHANNEL = "mot-secret-presentation";
const letterCount = (sheet) => parseWord(sheet.word).flat().filter((item) => item.letter).length;
const requestFullscreen = (el) => {
  const request = el.requestFullscreen ?? el.webkitRequestFullscreen;
  if (request) Promise.resolve(request.call(el)).catch(() => {});
};

// ---------- Fenêtre élèves ----------
export function startAudience() {
  const channel = new BroadcastChannel(CHANNEL);
  const root = document.getElementById("projector");
  const stage = root.querySelector(".projector-stage");
  root.querySelector(".projector-controls").hidden = true;
  root.hidden = false;
  document.body.classList.add("is-audience", "is-projecting");
  document.title = "Mot secret — élèves";

  // Le plein écran exige un clic dans cette fenêtre-ci.
  const fullscreen = document.createElement("button");
  fullscreen.type = "button";
  fullscreen.className = "audience-fullscreen";
  fullscreen.textContent = "⛶ Cliquer pour passer en plein écran";
  fullscreen.addEventListener("click", () => {
    requestFullscreen(root);
    fullscreen.hidden = true;
  });
  root.append(fullscreen);

  let current = null;
  const show = () => {
    if (!current) return;
    const { sheets, style, index, revealed } = current;
    const page = layoutScreen(sheets[index], style, { width: root.clientWidth, height: root.clientHeight });
    stage.replaceChildren(renderPage(page, { ...style, revealed }));
  };
  // La vue enseignant met la fiche aux proportions de cet écran.
  const sendSize = () => channel.postMessage({ type: "size", width: root.clientWidth, height: root.clientHeight });

  channel.onmessage = ({ data }) => {
    if (data.type === "state") {
      current = data;
      show();
    } else if (data.type === "end") window.close();
  };
  // Au tableau : glisser au doigt, clavier ou télécommande pilotent aussi la présentation.
  const send = (action) => channel.postMessage({ type: "action", action });
  onSwipe(stage, (delta) => send(delta > 0 ? "next" : "prev"));
  document.addEventListener("keydown", (event) => {
    const action = KEY_ACTIONS[event.key];
    if (!action || action === "close") return;
    event.preventDefault();
    send(action);
  });
  window.addEventListener("resize", () => (show(), sendSize()));
  channel.postMessage({ type: "hello" });
  sendSize();
}

// ---------- Vue enseignant ----------
const root = document.getElementById("presenter");
const $ = (selector) => root.querySelector(selector);
const main = $(".presenter-main");
const status = $(".presenter-status");
const reopenButton = $(".js-reopen");
const hold = $(".presenter-hold");
const answer = $(".presenter-answer");

let channel = null;
let audience = null; // fenêtre élèves
let watcher = null;
let sheets = [];
let style = {};
let index = 0;
let revealed = [];
let screen = { width: 16, height: 9 }; // proportions de l'écran élèves, envoyées par la fenêtre élèves

function show() {
  const sheet = sheets[index];
  const page = layoutScreen(sheet, style, screen);
  main.replaceChildren(renderPage(page, { ...style, revealed }));
  $(".presenter-counter").textContent = `${index + 1} / ${sheets.length}`;
  $(".js-prev").disabled = index === 0;
  $(".js-next").disabled = index === sheets.length - 1;
  const next = sheets[index + 1];
  $(".presenter-next").replaceChildren(...(next ? [renderPage(layoutScreen(next, style, screen), style)] : []));
  $(".presenter-next-label").textContent = next ? "Fiche suivante" : "Dernière fiche";
  channel.postMessage({ type: "state", sheets, style, index, revealed });
}

const total = () => letterCount(sheets[index]);
const setRevealed = (next) => ((revealed = next), show());
function go(delta) {
  const target = index + delta;
  if (target < 0 || target >= sheets.length) return;
  index = target;
  revealed = [];
  show();
}
const ACTIONS = {
  next: () => go(1),
  prev: () => go(-1),
  reveal: () => setRevealed(revealNext(revealed, total())),
  hide: () => setRevealed(hideLast(revealed)),
};

function onKey(event) {
  // Espace / Entrée sur le bouton « Maintenir » servent à afficher la réponse.
  if (event.target === hold && (event.key === " " || event.key === "Enter")) return;
  const action = KEY_ACTIONS[event.key];
  if (!ACTIONS[action]) return;
  event.preventDefault();
  ACTIONS[action]();
}

function setStatus(text, closed = false) {
  status.textContent = text;
  status.classList.toggle("is-closed", closed);
  reopenButton.hidden = !closed;
}

// Ouvre la fenêtre élèves ; Chrome / Edge la placent sur le second écran (autorisation demandée une fois).
function openAudience() {
  audience = window.open(`${location.pathname}?vue=eleves`, "mot-secret-eleves", "popup,width=1024,height=640");
  if (!audience) return setStatus("Fenêtre élèves bloquée : autorise les fenêtres surgissantes pour ce site.", true);
  setStatus("Fenêtre élèves ouverte : glisse-la sur le TBI, puis clique sur « plein écran ».");
  placeOnSecondScreen(audience);
}

async function placeOnSecondScreen(win) {
  if (!("getScreenDetails" in window)) return;
  try {
    const { screens, currentScreen } = await window.getScreenDetails();
    const other = screens.find((s) => s !== currentScreen);
    if (!other) return;
    win.moveTo(other.availLeft, other.availTop);
    win.resizeTo(other.availWidth, other.availHeight);
    setStatus("Fenêtre élèves placée sur le second écran : clique dessus pour passer en plein écran.");
  } catch (_) {} // autorisation refusée : on la glisse à la main
}

function onMessage({ data }) {
  if (data.type === "hello") show();
  else if (data.type === "size") {
    screen = { width: data.width, height: data.height };
    show();
  } else if (data.type === "action") ACTIONS[data.action]?.();
}

export function startPresenter(newSheets, newStyle) {
  if (!newSheets.length) return;
  sheets = newSheets;
  style = newStyle;
  index = 0;
  revealed = [];
  channel = new BroadcastChannel(CHANNEL);
  channel.onmessage = onMessage;
  root.hidden = false;
  document.body.classList.add("is-projecting");
  document.addEventListener("keydown", onKey);
  window.addEventListener("resize", show);
  window.addEventListener("pagehide", endPresentation);
  openAudience();
  // La fenêtre élèves fermée (par erreur) : on le signale, avec un bouton pour la rouvrir.
  watcher = setInterval(() => {
    if (audience?.closed && reopenButton.hidden) setStatus("Fenêtre élèves fermée.", true);
  }, 500);
  show();
}

function endPresentation() {
  if (root.hidden) return;
  channel.postMessage({ type: "end" });
  audience?.close();
  channel.close();
  clearInterval(watcher);
  root.hidden = true;
  document.body.classList.remove("is-projecting");
  document.removeEventListener("keydown", onKey);
  window.removeEventListener("resize", show);
  window.removeEventListener("pagehide", endPresentation);
}

$(".js-prev").addEventListener("click", () => go(-1));
$(".js-next").addEventListener("click", () => go(1));
$(".js-reveal").addEventListener("click", () => ACTIONS.reveal());
$(".js-reveal-all").addEventListener("click", () => setRevealed([...Array(total()).keys()]));
$(".js-hide").addEventListener("click", () => setRevealed([]));
$(".js-end").addEventListener("click", endPresentation);
reopenButton.addEventListener("click", openAudience);
// Un clic sur une case de la bande la révèle aux élèves, un second la recache.
main.addEventListener("click", (event) => {
  const box = event.target.closest("[data-pos]");
  if (box) setRevealed(toggle(revealed, Number(box.dataset.pos)));
});

// Réponse en clair seulement tant qu'on appuie (souris, doigt, Espace ou Entrée), comme un mot de passe.
const showAnswer = () => (answer.textContent = sheets[index].word);
const hideAnswer = () => (answer.textContent = "");
hold.addEventListener("pointerdown", showAnswer);
for (const event of ["pointerup", "pointerleave", "pointercancel", "blur"]) hold.addEventListener(event, hideAnswer);
hold.addEventListener("keydown", (e) => (e.key === " " || e.key === "Enter") && (e.preventDefault(), showAnswer()));
hold.addEventListener("keyup", (e) => (e.key === " " || e.key === "Enter") && hideAnswer());
