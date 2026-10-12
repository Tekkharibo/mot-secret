import { describe, expect, it } from "vitest";
import { hideLast, revealNext, toggle } from "../src/reveal.js";

// Cases révélées : liste des positions (dans l'ordre de lecture des lettres), dans l'ordre où on les a révélées.
describe("révélation case par case", () => {
  it("« Révéler » prend la première case encore cachée", () => {
    expect(revealNext([], 4)).toEqual([0]);
    expect(revealNext([0, 2], 4)).toEqual([0, 2, 1]);
    expect(revealNext([0, 1, 2, 3], 4)).toEqual([0, 1, 2, 3]);
  });

  it("↑ recache la dernière case révélée", () => {
    expect(hideLast([0, 3, 1])).toEqual([0, 3]);
    expect(hideLast([])).toEqual([]);
  });

  it("un clic sur une case la révèle, un second la recache", () => {
    expect(toggle([0], 2)).toEqual([0, 2]);
    expect(toggle([0, 2], 0)).toEqual([2]);
  });
});
