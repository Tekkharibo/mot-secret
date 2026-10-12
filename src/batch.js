// Lot : liste de mots + réglages → fiches (mot, numéro, dessins), pages mises en page (fiches puis correction)
// et avertissements.
import { layoutAnswerPages, layoutSheet } from "./layout.js";
import { assignPictures } from "./picture.js";
import { parseWordList } from "./word.js";

export function buildBatch(state) {
  const warnings = [];
  const words = parseWordList(state.words).map((word, i) => ({ word, number: i + 1 }));
  const sheets = words.map(({ word, number }) => {
    const { pictureOf, tooMany } = assignPictures(word, state);
    if (tooMany) warnings.push(word);
    return { word, number, pictureOf };
  });
  const answers = state.correction === "end" && words.length ? layoutAnswerPages(words, state) : [];
  return { sheets, pages: [...sheets.map((sheet) => layoutSheet(sheet, state)), ...answers], warnings };
}
