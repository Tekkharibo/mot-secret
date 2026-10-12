import { describe, expect, it } from "vitest";
import { THEMES } from "../src/data/themes.js";
import { decodeShare, encodeShare, isShareHash } from "../src/share.js";
import { DEFAULTS } from "../src/state.js";

const lot = { ...DEFAULTS, theme: "noel", words: "bûche\ncœur\nl'été", title: "Noël « 2026 »", bigText: true, seed: 7 };

describe("lien de partage", () => {
  it("retrouve exactement le lot", () => {
    expect(decodeShare(encodeShare(lot))).toEqual(lot);
  });

  it("commence par la version du format et ne contient que des caractères sûrs dans une URL", () => {
    const hash = encodeShare(lot);
    expect(hash).toMatch(/^v1\.[A-Za-z0-9_-]+$/);
  });

  it("reste court : 20 mots tiennent en moins de 800 caractères", () => {
    expect(encodeShare({ ...DEFAULTS, words: THEMES.automne.words.join("\n") }).length).toBeLessThan(800);
  });

  it("refuse un lien abîmé ou d'un format inconnu", () => {
    const hash = encodeShare(lot);
    expect(decodeShare(hash.slice(0, -10))).toBeNull();
    expect(decodeShare("v9." + hash.slice(3))).toBeNull();
    expect(decodeShare("n'importe quoi")).toBeNull();
  });

  it("remplace une valeur invalide par sa valeur par défaut", () => {
    const forged = "v1." + Buffer.from(JSON.stringify({ theme: "inconnu", seed: 3 })).toString("base64url");
    expect(decodeShare(forged)).toEqual({ ...DEFAULTS, seed: 3 });
  });
});

describe("isShareHash", () => {
  it("reconnaît un lien de partage, pas les ancres de la page", () => {
    expect(isShareHash("#v1.abc")).toBe(true);
    expect(isShareHash("#settings")).toBe(false);
    expect(isShareHash("#apercu")).toBe(false);
    expect(isShareHash("")).toBe(false);
  });
});
