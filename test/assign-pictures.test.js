import { describe, expect, it } from "vitest";
import { PICTURE_ALPHABET, THEMES } from "../src/data/themes.js";
import { assignPictures } from "../src/picture.js";

describe("assignPictures — Mot secret", () => {
  const secret = (word, theme = "hiver", seed = 1) => assignPictures(word, { game: "secret", theme, seed });

  it("donne un dessin différent du thème à chaque lettre différente", () => {
    const { pictureOf } = secret("bonhomme de neige");
    const pictures = Object.values(pictureOf);
    expect(Object.keys(pictureOf)).toEqual(["B", "O", "N", "H", "M", "E", "D", "I", "G"]);
    expect(new Set(pictures).size).toBe(pictures.length);
    pictures.forEach((p) => expect(THEMES.hiver.pictures).toContain(p));
  });

  it("reproduit les tirages de l'ancienne version (thème, mot et tirage)", () => {
    expect(secret("neige").pictureOf).toEqual({ N: "🧊", E: "❄️", I: "🎿", G: "🛷" });
    expect(secret("neige", "hiver", 2).pictureOf).toEqual({ N: "🧣", E: "🏔️", I: "❄️", G: "🐻‍❄️" });
    expect(Object.values(secret("bonhomme de neige", "mer").pictureOf).slice(0, 8)).toEqual([
      "🐙", "⚓", "🐚", "🐡", "🦈", "⛵", "🐠", "🐳",
    ]);
  });

  it("signale un mot qui a plus de lettres différentes que de dessins, et laisse les dernières lettres visibles", () => {
    const word = "abcdefghijklmnopq"; // 17 lettres différentes, 16 dessins
    const { pictureOf, tooMany } = secret(word);
    expect(tooMany).toBe(true);
    expect(Object.keys(pictureOf)).toHaveLength(THEMES.hiver.pictures.length);
    expect(pictureOf.Q).toBeUndefined();
    expect(secret("neige").tooMany).toBe(false);
  });
});

describe("assignPictures — Imagier", () => {
  it("donne à chaque lettre le dessin de l'alphabet illustré, quel que soit le tirage", () => {
    const options = { game: "imagier", theme: "hiver" };
    const { pictureOf, tooMany } = assignPictures("bol", { ...options, seed: 1 });
    expect(pictureOf).toEqual({ B: PICTURE_ALPHABET.B[0], O: PICTURE_ALPHABET.O[0], L: PICTURE_ALPHABET.L[0] });
    expect(tooMany).toBe(false);
    expect(assignPictures("bol", { ...options, seed: 7 }).pictureOf).toEqual(pictureOf);
  });
});
