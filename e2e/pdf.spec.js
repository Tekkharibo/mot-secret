import { expect, test } from "@playwright/test";

// Construit un PDF (une fiche + sa correction) dans la page et le renvoie en texte brut (latin1).
async function buildPdf(page, { font = "andika", blackWhite = false } = {}) {
  await page.goto("/");
  return page.evaluate(
    async ({ font, blackWhite }) => {
      const { layoutSheet, layoutAnswerPages } = await import("/src/layout.js");
      const { assignPictures } = await import("/src/picture.js");
      const { renderPage } = await import("/src/render.js");
      const { buildPdf } = await import("/src/pdf.js");
      const options = { game: "secret", level: "key", title: "", font, showName: true, showNumber: true, bigText: false, spaced: false };
      const style = { theme: "hiver", font, blackWhite, lowercase: false, colorVowels: true, spaced: false };
      const { pictureOf } = assignPictures("bonhomme de neige", { game: "secret", theme: "hiver", seed: 1 });
      const pages = [
        layoutSheet({ word: "bonhomme de neige", number: 1, pictureOf }, options),
        ...layoutAnswerPages([{ word: "bonhomme de neige", number: 1 }], options),
      ];
      const blob = await buildPdf(pages.map((p) => renderPage(p, style)), font);
      const bytes = new Uint8Array(await blob.arrayBuffer());
      return Array.from(bytes, (b) => String.fromCharCode(b)).join("");
    },
    { font, blackWhite }
  );
}

test("produit une page A4 par fiche et par page de correction", async ({ page }) => {
  const pdf = await buildPdf(page);
  expect(pdf.startsWith("%PDF-")).toBe(true);
  expect(pdf.match(/\/Type \/Page\b/g)).toHaveLength(2);
  expect(pdf).toMatch(/\/MediaBox \[0 0 595\.2[78]\d* 841\.8[89]\d*\]/);
});

test("reste vectoriel : aucune image matricielle", async ({ page }) => {
  const pdf = await buildPdf(page);
  expect(pdf).not.toContain("/Subtype /Image");
});

test("incorpore la police choisie", async ({ page }) => {
  expect(await buildPdf(page)).toMatch(/\/BaseFont \/\w*Andika/);
  expect(await buildPdf(page, { font: "opendyslexic" })).toMatch(/\/BaseFont \/\w*OpenDyslexic/);
});
