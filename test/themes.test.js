import { existsSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { PICTURE_ALPHABET, THEME_GROUPS, THEMES } from "../src/data/themes.js";
import { pictureFile } from "../src/picture.js";

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
const fold = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toUpperCase();

describe.each(Object.entries(THEMES))("thème %s", (key, theme) => {
  it("a un nom, un emoji, un dégradé et une couleur d'accent", () => {
    expect(theme.name).toBeTruthy();
    expect(theme.emoji).toBeTruthy();
    expect(theme.bg).toHaveLength(2);
    expect(theme.accent).toMatch(/^#[0-9a-f]{6}$/);
  });

  it("a au moins 14 dessins différents pour cacher les lettres", () => {
    expect(new Set(theme.pictures).size).toBe(theme.pictures.length);
    expect(theme.pictures.length).toBeGreaterThanOrEqual(14);
  });

  it("a un décor et 20 mots", () => {
    expect(theme.decor.length).toBeGreaterThan(0);
    expect(theme.words).toHaveLength(20);
  });
});

describe("groupes de thèmes", () => {
  it("rangent chaque thème exactement une fois", () => {
    const keys = THEME_GROUPS.flatMap((g) => g.keys);
    expect(keys.toSorted()).toEqual(Object.keys(THEMES).toSorted());
  });
});

describe("alphabet illustré", () => {
  it("a un dessin pour chaque lettre, dont le nom commence par cette lettre", () => {
    expect(Object.keys(PICTURE_ALPHABET)).toEqual(ALPHABET);
    for (const [letter, [, name]] of Object.entries(PICTURE_ALPHABET)) expect(fold(name)[0]).toBe(letter);
  });
});

describe("fichiers des dessins", () => {
  const used = new Set([
    ...Object.values(THEMES).flatMap((t) => [...t.pictures, ...t.decor]),
    ...Object.values(PICTURE_ALPHABET).map(([picture]) => picture),
  ]);

  it.each([...used])("%s existe en couleur et en noir et blanc", (picture) => {
    for (const style of ["flat", "hc"]) expect(existsSync(`emoji/${style}/${pictureFile(picture)}.svg`)).toBe(true);
  });
});
