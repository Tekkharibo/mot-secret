// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { THEMES } from "../src/data/themes.js";
import { layoutAnswerPages, layoutSheet } from "../src/layout.js";
import { assignPictures } from "../src/picture.js";
import { renderPage } from "../src/render.js";

const layoutOptions = { game: "secret", level: "key", title: "", font: "andika", showName: true, showNumber: true, bigText: false, spaced: false };
const style = { theme: "hiver", font: "andika", blackWhite: false, lowercase: false, colorVowels: false, spaced: false };

const render = (word = "neige", opts = {}) => {
  const lo = { ...layoutOptions, ...opts };
  const { pictureOf } = assignPictures(word, { game: lo.game, theme: "hiver", seed: 1 });
  return renderPage(layoutSheet({ word, number: 3, pictureOf }, lo), { ...style, ...opts });
};
const all = (svg, sel) => [...svg.querySelectorAll(sel)];
const role = (svg, r) => all(svg, `[data-role="${r}"]`);

describe("page SVG", () => {
  it("fait une page A4 en millimètres", () => {
    const svg = render();
    expect(svg.tagName).toBe("svg");
    expect(svg.getAttribute("viewBox")).toBe("0 0 210 297");
    expect(svg.getAttribute("width")).toBe("210mm");
    expect(svg.getAttribute("height")).toBe("297mm");
  });

  it("peint le dégradé du thème et le décor", () => {
    const svg = render();
    const stops = all(svg, "linearGradient stop").map((s) => s.getAttribute("stop-color"));
    expect(stops).toEqual(THEMES.hiver.bg);
    expect(role(svg, "decor")).toHaveLength(8);
  });

  it("noir et blanc : fond blanc, sans décor, dessins à trait noir, titre noir", () => {
    const svg = render("neige", { blackWhite: true });
    expect(all(svg, "linearGradient")).toHaveLength(0);
    expect(role(svg, "decor")).toHaveLength(0);
    expect(all(svg, "image").every((i) => i.getAttribute("href").startsWith("emoji/hc/"))).toBe(true);
    expect(role(svg, "title")[0].getAttribute("fill")).toBe("#111");
  });

  it("écrit le titre en couleur d'accent, dans la police choisie", () => {
    const [title] = role(render("neige", { font: "lexend" }), "title");
    expect(title.textContent).toBe("Trouve le mot secret !");
    expect(title.getAttribute("fill")).toBe(THEMES.hiver.accent);
    expect(title.getAttribute("font-family")).toBe("Lexend");
  });

  it("dessine la ligne « Prénom » et le numéro", () => {
    const svg = render();
    expect(role(svg, "name")[0].textContent).toBe("Prénom :");
    expect(role(svg, "badge")[0].textContent).toBe("3");
  });
});

describe("grille et bande", () => {
  it("met un dessin dans les cases des lettres du mot, la lettre dans les autres", () => {
    const svg = render();
    const letters = role(svg, "letter").map((t) => t.textContent);
    expect(letters).toHaveLength(22);
    expect(letters).not.toContain("N");
    expect(all(svg, '[data-role="cell"] image').map((i) => i.getAttribute("href"))).toContain("emoji/flat/1f9ca.svg");
  });

  it("dessine pour chaque lettre du mot une case dessin et une case réponse", () => {
    const svg = render();
    expect(role(svg, "strip")).toHaveLength(5);
    expect(all(svg, '[data-role="strip"] rect')).toHaveLength(10);
    expect(all(svg, '[data-role="strip"] image')).toHaveLength(5);
  });

  it("recopie un tiret sans case", () => {
    const svg = render("arc-en-ciel");
    const dash = role(svg, "strip").find((g) => g.textContent === "-");
    expect(dash.querySelectorAll("rect")).toHaveLength(0);
  });

  it("arrondit les cases quand elles sont espacées", () => {
    expect(all(render("neige", { spaced: true }), '[data-role="cell"] rect')[0].getAttribute("rx")).toBe("1.5");
    expect(all(render(), '[data-role="cell"] rect')[0].hasAttribute("rx")).toBe(false);
  });
});

describe("lisibilité", () => {
  it("écrit les lettres en minuscules sur demande", () => {
    expect(role(render("neige", { lowercase: true }), "letter")[0].textContent).toBe("a");
  });

  it("colore voyelles en rouge et consonnes en bleu, sauf en noir et blanc", () => {
    const fill = (opts) => role(render("neige", opts), "letter").slice(0, 2).map((t) => t.getAttribute("fill"));
    expect(fill({ colorVowels: true })).toEqual(["#d62828", "#1d4ed8"]);
    expect(fill({ colorVowels: true, blackWhite: true })).toEqual(["#111", "#111"]);
  });
});

describe("page de correction", () => {
  it("écrit les réponses, sans case pour l'espace entre les mots", () => {
    const [page] = layoutAnswerPages([{ word: "pot de miel", number: 1 }], layoutOptions);
    const svg = renderPage(page, style);
    expect(role(svg, "letter").map((t) => t.textContent).join("")).toBe("POTDEMIEL");
    expect(all(svg, '[data-role="answer"] rect')).toHaveLength(9);
  });
});
