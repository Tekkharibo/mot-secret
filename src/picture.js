import { PICTURE_ALPHABET, THEMES } from "./data/themes.js";
import { parseWord } from "./word.js";

// Dessins : Fluent Emoji (Microsoft, MIT) en SVG dans emoji/{flat,hc}/.
// Nom de fichier = points de code hexadécimaux séparés par « - », sans le sélecteur de variante FE0F.
// « :nom: » désigne un dessin maison (emoji/{flat,hc}/nom.svg), quand l'emoji n'existe pas.
export function pictureFile(picture) {
  const custom = /^:(.+):$/.exec(picture);
  if (custom) return custom[1];
  return [...picture]
    .map((c) => c.codePointAt(0))
    .filter((c) => c !== 0xfe0f)
    .map((c) => c.toString(16))
    .join("-");
}

// ---------- Attribution des dessins aux lettres ----------

// Aléatoire reproductible : même thème, même mot et même tirage → mêmes dessins.
function hash(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
function mulberry32(a) {
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function shuffled(list, rand) {
  const a = list.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Mot secret : dessins du thème tirés au sort, un par lettre différente, dans l'ordre d'apparition.
// Au-delà du nombre de dessins du thème, les lettres restent visibles (tooMany signale le cas).
// Imagier : dessin de l'alphabet illustré.
export function assignPictures(word, { game, theme, seed }) {
  const letters = [...new Set(parseWord(word).flat().filter((item) => item.letter).map((item) => item.letter))];
  if (game === "imagier") {
    return { pictureOf: Object.fromEntries(letters.map((l) => [l, PICTURE_ALPHABET[l][0]])), tooMany: false };
  }
  const pictures = shuffled(THEMES[theme].pictures, mulberry32(hash(`${theme}|${word}|${seed}`)));
  return {
    pictureOf: Object.fromEntries(letters.slice(0, pictures.length).map((l, i) => [l, pictures[i]])),
    tooMany: letters.length > pictures.length,
  };
}
