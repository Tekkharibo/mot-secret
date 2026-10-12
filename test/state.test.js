import { describe, expect, it } from "vitest";
import { DEFAULTS, loadState, saveState } from "../src/state.js";

const storage = (content) => {
  const data = new Map(content === undefined ? [] : [["mot-secret:v1", content]]);
  return { getItem: (k) => data.get(k) ?? null, setItem: (k, v) => data.set(k, v), data };
};

describe("réglages mémorisés", () => {
  it("partent des valeurs par défaut au premier passage", () => {
    expect(loadState(storage())).toEqual(DEFAULTS);
  });

  it("relisent ce qui a été enregistré", () => {
    const s = storage();
    saveState(s, { ...DEFAULTS, theme: "mer", bigText: true, seed: 4 });
    expect(loadState(s)).toMatchObject({ theme: "mer", bigText: true, seed: 4 });
  });

  it("ignorent un contenu illisible", () => {
    expect(loadState(storage("{pas du json"))).toEqual(DEFAULTS);
  });

  it("remplacent chaque valeur invalide par sa valeur par défaut", () => {
    const saved = { theme: "inconnu", font: 3, game: "autre", level: "expert", correction: "x", bigText: "oui", seed: -2, title: "Ok", pirate: 1 };
    const state = loadState(storage(JSON.stringify(saved)));
    expect(state).toEqual({ ...DEFAULTS, title: "Ok" });
  });

  it("supportent un stockage indisponible (navigation privée)", () => {
    const broken = { getItem: () => { throw new Error("bloqué"); }, setItem: () => { throw new Error("bloqué"); } };
    expect(loadState(broken)).toEqual(DEFAULTS);
    expect(() => saveState(broken, DEFAULTS)).not.toThrow();
  });
});
