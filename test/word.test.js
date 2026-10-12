import { describe, expect, it } from "vitest";
import { parseWord, parseWordList, splitAfterPunctuation } from "../src/word.js";

const letters = (s) => [...s].map((letter) => ({ letter }));

describe("parseWord", () => {
  it("met le mot en majuscules, une lettre par élément", () => {
    expect(parseWord("neige")).toEqual([letters("NEIGE")]);
  });

  it("ignore les accents et la cédille", () => {
    expect(parseWord("Écureuil")).toEqual([letters("ECUREUIL")]);
    expect(parseWord("garçon")).toEqual([letters("GARCON")]);
    expect(parseWord("août")).toEqual([letters("AOUT")]);
  });

  it("déplie œ et æ", () => {
    expect(parseWord("cœur")).toEqual([letters("COEUR")]);
    expect(parseWord("Ægée")).toEqual([letters("AEGEE")]);
  });

  it("sépare les mots aux espaces", () => {
    expect(parseWord("  bonhomme   de neige ")).toEqual([letters("BONHOMME"), letters("DE"), letters("NEIGE")]);
  });

  it("recopie tirets et apostrophes", () => {
    expect(parseWord("arc-en-ciel")).toEqual([
      [...letters("ARC"), { char: "-" }, ...letters("EN"), { char: "-" }, ...letters("CIEL")],
    ]);
    expect(parseWord("l'été")).toEqual([[{ letter: "L" }, { char: "'" }, ...letters("ETE")]]);
  });

  it("renvoie une liste vide sans lettre", () => {
    expect(parseWord("   ")).toEqual([]);
  });
});

describe("splitAfterPunctuation", () => {
  it("coupe après chaque tiret ou apostrophe, pour pouvoir passer à la ligne", () => {
    const [group] = parseWord("arc-en-ciel");
    expect(splitAfterPunctuation(group)).toEqual([
      [...letters("ARC"), { char: "-" }],
      [...letters("EN"), { char: "-" }],
      letters("CIEL"),
    ]);
  });

  it("ne crée pas de morceau vide après un signe final", () => {
    expect(splitAfterPunctuation([{ letter: "A" }, { char: "-" }])).toEqual([[{ letter: "A" }, { char: "-" }]]);
  });
});

describe("parseWordList", () => {
  it("garde une entrée par ligne non vide, sans les espaces autour", () => {
    expect(parseWordList("hiver\n\n  neige \nbonhomme de neige\n")).toEqual(["hiver", "neige", "bonhomme de neige"]);
  });

  it("ignore les lignes sans aucune lettre", () => {
    expect(parseWordList("---\nlune\n' '")).toEqual(["lune"]);
  });
});
