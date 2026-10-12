// Interface : réglages → lot → aperçu SVG ; boutons PDF.
import { buildBatch } from "./batch.js";
import { FONTS } from "./data/fonts.js";
import { THEME_GROUPS, THEMES } from "./data/themes.js";
import { buildPdf } from "./pdf.js";
import { renderPage } from "./render.js";
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
const CHECKBOXES = ["showName", "showNumber", "blackWhite", "lowercase", "bigText", "spaced", "colorVowels"];
const FIELDS = ["words", "title", "game", "level", "correction", "font"];

function render() {
  const { pages, warnings: tooMany } = buildBatch(state);
  if (pages.length) preview.replaceChildren(...pages.map((page) => renderPage(page, state)));
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
  const svgs = [...preview.querySelectorAll("svg")];
  if (!svgs.length) return;
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
    $(id).value = state[id];
    $(id).addEventListener(id === "words" || id === "title" ? "input" : "change", () => ((state[id] = $(id).value), render()));
  }
  for (const id of CHECKBOXES) {
    $(id).checked = state[id];
    $(id).addEventListener("change", () => ((state[id] = $(id).checked), render()));
  }
  $("themeWords").addEventListener("click", useThemeWords);
  $("shuffle").addEventListener("click", () => (state.seed++, render()));
  document.querySelectorAll(".js-download").forEach((b) => b.addEventListener("click", () => withPdf(download)));
  document.querySelectorAll(".js-print").forEach((b) =>
    b.addEventListener("click", () => {
      // Onglet ouvert pendant le clic (sinon bloqué comme fenêtre surgissante), rempli une fois le PDF prêt.
      const tab = window.open("", "_blank");
      withPdf((blob) => (tab ? (tab.location.href = URL.createObjectURL(blob)) : download(blob)));
    })
  );
}

renderThemePicker();
bind();
render();
