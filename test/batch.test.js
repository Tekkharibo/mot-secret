import { describe, expect, it } from "vitest";
import { buildBatch } from "../src/batch.js";
import { DEFAULTS } from "../src/state.js";

describe("buildBatch", () => {
  it("fait une fiche numérotée par mot, puis la correction", () => {
    const { pages } = buildBatch({ ...DEFAULTS, words: "hiver\n\nneige\n---" });
    expect(pages.map((p) => p.kind)).toEqual(["sheet", "sheet", "answers"]);
  });

  it("omet la correction si elle n'est pas demandée", () => {
    const { pages } = buildBatch({ ...DEFAULTS, words: "neige", correction: "none" });
    expect(pages.map((p) => p.kind)).toEqual(["sheet"]);
  });

  it("ne fait aucune page sans mot", () => {
    expect(buildBatch({ ...DEFAULTS, words: "  \n" }).pages).toEqual([]);
  });

  it("signale les mots qui ont trop de lettres différentes pour le thème", () => {
    expect(buildBatch({ ...DEFAULTS, words: "neige\nabcdefghijklmnopq" }).warnings).toEqual(["abcdefghijklmnopq"]);
  });

  it("change les dessins quand le tirage change", () => {
    const pictures = (seed) => buildBatch({ ...DEFAULTS, words: "bonhomme", seed }).pages[0].items.filter((i) => i.type === "strip").map((i) => i.picture);
    expect(pictures(1)).not.toEqual(pictures(2));
  });
});

describe("buildBatch — fiches pour la projection", () => {
  it("donne chaque fiche avec son mot, son numéro et ses dessins", () => {
    const { sheets } = buildBatch({ ...DEFAULTS, words: "lune\n\nneige" });
    expect(sheets.map((s) => [s.word, s.number])).toEqual([["lune", 1], ["neige", 2]]);
    expect(Object.keys(sheets[1].pictureOf)).toEqual(["N", "E", "I", "G"]);
  });
});
