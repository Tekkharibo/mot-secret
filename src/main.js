// Interface : réglages → lot → aperçu SVG ; boutons PDF.
import { buildBatch } from "./batch.js";
import { contactMailto } from "./contact.js";
import { FONTS } from "./data/fonts.js";
import { THEME_GROUPS, THEMES } from "./data/themes.js";
import { buildPdf } from "./pdf.js";
import { startAudience, startPresenter } from "./presentation.js";
import { openProjector } from "./projector.js";
import { renderPage } from "./render.js";
import { decodeShare, encodeShare, isShareHash } from "./share.js";
import { loadState, saveState } from "./state.js";

// localStorage peut être inaccessible (navigation privée, données bloquées) : réglages non mémorisés.
const storage = (() => {
  try {
    return window.localStorage;
  } catch (_) {
    return { getItem: () => null, setItem: () => {} };
  }
})();
const state = loadState(storage);
const $ = (id) => document.getElementById(id);
const preview = $("preview");
const warnings = $("warnings");
const status = (text) => ($("status").textContent = text);
// Version publiée : le ?v=<commit> ajouté au déploiement (tools/build-site.sh) ; « dev » en local.
const VERSION = new URL(import.meta.url).searchParams.get("v") ?? "dev";
const CHECKBOXES = ["showName", "showNumber", "blackWhite", "lowercase", "bigText", "spaced", "colorVowels"];
const FIELDS = ["words", "title", "game", "level", "correction", "font"];

// Aperçu paresseux : Safari coûte ~2 ms par <image> créée (22 fiches ≈ 380 dessins ≈ 1,5 s d'écran figé).
// Chaque page est d'abord une feuille vide de même taille, dessinée quand elle approche de l'écran.
let pages = [];
const lazy = new IntersectionObserver(
  (entries) =>
    entries.forEach(({ isIntersecting, target }) => {
      if (!isIntersecting) return;
      lazy.unobserve(target);
      target.replaceWith(renderPage(pages[target.dataset.page], state));
    }),
  { rootMargin: "100% 0px" }
);

function placeholder(i) {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  for (const [k, v] of Object.entries({ viewBox: "0 0 210 297", width: "210mm", height: "297mm", "data-page": i })) svg.setAttribute(k, v);
  lazy.observe(svg);
  return svg;
}

function render() {
  const batch = buildBatch(state);
  const tooMany = batch.warnings;
  pages = batch.pages;
  lazy.disconnect();
  if (pages.length) preview.replaceChildren(...pages.map((_, i) => placeholder(i)));
  else {
    const empty = document.createElement("p");
    empty.className = "empty";
    empty.textContent = "Ajoute au moins un mot pour générer une fiche.";
    preview.replaceChildren(empty);
  }
  warnings.textContent = tooMany.map((w) => `« ${w} » contient trop de lettres différentes pour ce thème.`).join("\n");
  // Imagier : niveau à choisir ; « Mélanger » ne sert qu'au Mot secret (dessins tirés au sort).
  $("levelField").hidden = state.game !== "imagier";
  $("shuffle").hidden = state.game === "imagier";
  $("contact").href = contactMailto({ version: VERSION, userAgent: navigator.userAgent, shareUrl: shareUrl() });
  saveState(storage, state);
}

function renderThemePicker() {
  $("themes").replaceChildren(
    ...THEME_GROUPS.flatMap((group) => {
      const label = document.createElement("span");
      label.className = "themes-group";
      label.textContent = group.label;
      return [
        label,
        ...group.keys.map((key) => {
          const b = document.createElement("button");
          b.type = "button";
          b.className = "theme-btn";
          b.setAttribute("role", "radio");
          b.setAttribute("aria-checked", String(key === state.theme));
          const emoji = document.createElement("span");
          emoji.textContent = THEMES[key].emoji;
          b.append(emoji, THEMES[key].name);
          b.addEventListener("click", () => {
            state.theme = key;
            renderThemePicker();
            render();
          });
          return b;
        }),
      ];
    })
  );
}

// Remplace la liste par les 20 mots du thème ; confirmation seulement si l'utilisateur a saisi ses propres mots.
function useThemeWords() {
  const current = $("words").value.trim();
  const isThemeList = Object.values(THEMES).some((t) => t.words.join("\n") === current);
  if (current && !isThemeList && !confirm("Remplacer les mots actuels par les 20 mots du thème ?")) return;
  $("words").value = state.words = THEMES[state.theme].words.join("\n");
  render();
}

// Génère le PDF du lot affiché ; les boutons sont désactivés pendant la génération.
async function withPdf(action) {
  if (!pages.length) return;
  const svgs = pages.map((page) => renderPage(page, state)); // toutes les pages, y compris celles pas encore dessinées
  const buttons = document.querySelectorAll(".js-download, .js-print");
  buttons.forEach((b) => ((b.disabled = true), (b.dataset.label ??= b.textContent), (b.textContent = "⏳ Préparation…")));
  try {
    await action(await buildPdf(svgs, state.font));
  } catch (e) {
    warnings.textContent = `Impossible de créer le PDF (${e.message}).`;
  } finally {
    buttons.forEach((b) => ((b.disabled = false), (b.textContent = b.dataset.label)));
  }
}

function download(blob) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `mot-secret-${state.theme}.pdf`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 60_000);
}

function bind() {
  $("font").replaceChildren(
    ...Object.entries(FONTS).map(([key, f]) => {
      const o = document.createElement("option");
      o.value = key;
      o.textContent = f.name;
      o.style.fontFamily = f.family;
      return o;
    })
  );
  for (const id of FIELDS) {
    $(id).addEventListener(id === "words" || id === "title" ? "input" : "change", () => ((state[id] = $(id).value), render()));
  }
  for (const id of CHECKBOXES) {
    $(id).addEventListener("change", () => ((state[id] = $(id).checked), render()));
  }
  $("themeWords").addEventListener("click", useThemeWords);
  $("shuffle").addEventListener("click", () => (state.seed++, render()));
  $("share").addEventListener("click", share);
  $("project").addEventListener("click", () => openProjector(buildBatch(state).sheets, { ...state }));
  $("present").addEventListener("click", () => startPresenter(buildBatch(state).sheets, { ...state }));
  bindHelp();
  window.addEventListener("hashchange", () => applyShareHash() && refresh());
  document.querySelectorAll(".js-download").forEach((b) => b.addEventListener("click", () => withPdf(download)));
  document.querySelectorAll(".js-print").forEach((b) =>
    b.addEventListener("click", () => {
      // Onglet ouvert pendant le clic (sinon bloqué comme fenêtre surgissante), rempli une fois le PDF prêt.
      const tab = window.open("", "_blank");
      withPdf((blob) => (tab ? (tab.location.href = URL.createObjectURL(blob)) : download(blob)));
    })
  );
}

// Tutoriels vidéo : chaque chapitre lit aide/<data-video>.mp4 (aperçu .jpg) ; fermer la fenêtre arrête la vidéo.
function bindHelp() {
  const help = $("help");
  const video = help.querySelector("video");
  const chapters = [...help.querySelectorAll("[data-video]")];
  const show = (chapter) => {
    chapters.forEach((c) => c.setAttribute("aria-pressed", String(c === chapter)));
    video.poster = `aide/${chapter.dataset.video}.jpg`;
    video.src = `aide/${chapter.dataset.video}.mp4`;
  };
  show(chapters[0]);
  chapters.forEach((c) => c.addEventListener("click", () => (show(c), video.play().catch(() => {}))));
  $("helpOpen").addEventListener("click", () => help.showModal());
  help.querySelector(".js-close").addEventListener("click", () => help.close());
  help.addEventListener("close", () => video.pause());
}

// Champs du panneau ← réglages (au démarrage et après ouverture d'un lien de partage).
function fillControls() {
  for (const id of FIELDS) $(id).value = state[id];
  for (const id of CHECKBOXES) $(id).checked = state[id];
}

function refresh() {
  fillControls();
  renderThemePicker();
  render();
}

// Lien de partage dans l'adresse : il remplace les réglages, puis est retiré de l'adresse
// (sinon un rechargement le réappliquerait par-dessus les modifications). Renvoie true si le lot a changé.
function applyShareHash() {
  if (!isShareHash(location.hash)) return false;
  const lot = decodeShare(location.hash.slice(1));
  history.replaceState(null, "", location.pathname + location.search);
  if (!lot) {
    status("Ce lien de partage est incomplet ou abîmé : réglages inchangés.");
    return false;
  }
  Object.assign(state, lot);
  return true;
}

const shareUrl = () => `${location.origin}${location.pathname}#${encodeShare(state)}`;

async function share() {
  const url = shareUrl();
  if (navigator.share) {
    try {
      await navigator.share({ title: "Mot secret", url });
    } catch (_) {} // partage annulé
    return;
  }
  try {
    await navigator.clipboard.writeText(url);
    status("Lien copié : colle-le dans un e-mail ou un message.");
  } catch (_) {
    status(`Copie impossible, voici le lien : ${url}`);
  }
}

// index.html?vue=eleves : fenêtre élèves du mode présentateur, pilotée par la vue enseignant.
if (new URLSearchParams(location.search).get("vue") === "eleves") startAudience();
else {
  bind();
  applyShareHash();
  refresh();
}
