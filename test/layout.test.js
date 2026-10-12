import { describe, expect, it } from "vitest";
import { PICTURE_ALPHABET } from "../src/data/themes.js";
import { layoutAnswerPages, layoutSheet, PAGE, shrinkToFit } from "../src/layout.js";
import { assignPictures } from "../src/picture.js";

const defaults = {
  game: "secret",
  level: "key",
  title: "",
  font: "andika",
  showName: false,
  showNumber: true,
  bigText: false,
  spaced: false,
};
const sheet = (word, opts = {}) => {
  const options = { ...defaults, ...opts };
  const { pictureOf } = assignPictures(word, { game: options.game, theme: "hiver", seed: 1 });
  return layoutSheet({ word, number: 1, pictureOf }, options);
};
const of = (page, type, role) => page.items.filter((i) => i.type === type && (!role || i.role === role));
const bottom = (items) => Math.max(...items.map((i) => i.y + i.h));

describe("en-tête de fiche", () => {
  it("affiche le titre par défaut, ou celui saisi", () => {
    expect(of(sheet("neige"), "text", "title")[0].text).toBe("Trouve le mot secret !");
    expect(of(sheet("neige", { title: "  Mon titre " }), "text", "title")[0].text).toBe("Mon titre");
  });

  it("ajoute la ligne « Prénom » sur demande", () => {
    expect(of(sheet("neige"), "text", "name")).toHaveLength(0);
    expect(of(sheet("neige", { showName: true }), "text", "name")[0].text).toBe("Prénom :");
  });

  it("donne la consigne de l'Imagier selon le niveau, aucune en Mot secret", () => {
    expect(of(sheet("neige"), "text", "instruction")).toHaveLength(0);
    const instruction = (level) => of(sheet("bol", { game: "imagier", level }), "text", "instruction")[0].text;
    expect(instruction("key")).toMatch(/imagier/);
    expect(instruction("mid")).toMatch(/alphabet/);
    expect(instruction("nokey")).toMatch(/Écris la première lettre/);
  });

  it("réduit le titre avec une police large (OpenDyslexic)", () => {
    const size = (font) => of(sheet("neige", { font }), "text", "title")[0].size;
    expect(size("opendyslexic")).toBeLessThan(size("andika"));
  });
});

describe("grille", () => {
  const cells = (page) => of(page, "cell");

  it("range les 26 lettres sur 4 colonnes de 42 × 22 mm, centrées, Y et Z au milieu de la dernière ligne", () => {
    const grid = cells(sheet("neige"));
    expect(grid).toHaveLength(26);
    const at = (l) => grid.find((c) => c.letter === l);
    expect(at("A")).toMatchObject({ x: 21, y: 35, w: 42, h: 22 });
    expect(at("D")).toMatchObject({ x: 21 + 3 * 42, y: 35 });
    expect(at("E")).toMatchObject({ x: 21, y: 35 + 22 });
    expect(at("Y")).toMatchObject({ x: 21 + 42, y: 35 + 6 * 22 });
    expect(at("Z")).toMatchObject({ x: 21 + 2 * 42, y: 35 + 6 * 22 });
  });

  it("espace les cases quand l'option est cochée", () => {
    const grid = cells(sheet("neige", { spaced: true }));
    const at = (l) => grid.find((c) => c.letter === l);
    expect(at("A")).toMatchObject({ w: 40, h: 20 });
    expect(at("B").x - at("A").x).toBe(42.5);
  });

  it("Mot secret : cache par leur dessin les seules lettres du mot", () => {
    const grid = cells(sheet("neige"));
    expect(grid.find((c) => c.letter === "N").picture).toBe("🧊");
    expect(grid.find((c) => c.letter === "A").picture).toBeUndefined();
    expect(grid.filter((c) => c.picture)).toHaveLength(4);
    expect(grid.every((c) => c.showLetter === !c.picture)).toBe(true);
  });

  it("Imagier facile : la clé montre dessin et lettre dans chaque case", () => {
    const grid = cells(sheet("bol", { game: "imagier", level: "key" }));
    expect(grid.every((c) => c.picture === PICTURE_ALPHABET[c.letter][0] && c.showLetter)).toBe(true);
  });

  it("Imagier moyen : grille du Mot secret avec les dessins de l'alphabet illustré", () => {
    const grid = cells(sheet("bol", { game: "imagier", level: "mid" }));
    expect(grid.find((c) => c.letter === "B")).toMatchObject({ picture: PICTURE_ALPHABET.B[0], showLetter: false });
    expect(grid.filter((c) => c.picture)).toHaveLength(3);
  });

  it("Imagier difficile : pas de grille", () => {
    expect(cells(sheet("bol", { game: "imagier", level: "nokey" }))).toHaveLength(0);
  });

  it("place le numéro de la fiche dans la case libre à gauche de Y, s'il est demandé", () => {
    expect(of(sheet("neige"), "badge")[0]).toMatchObject({ text: "1", x: 21 + 21, y: 35 + 6 * 22 + 11 });
    expect(of(sheet("neige", { showNumber: false }), "badge")).toHaveLength(0);
  });
});

describe("bande", () => {
  const strip = (page) => of(page, "strip");

  it("donne une colonne par signe : dessin en haut, case à remplir en bas", () => {
    const cols = strip(sheet("neige"));
    expect(cols.map((c) => c.picture)).toEqual(["🧊", "❄️", "🎿", "🛷", "❄️"]);
    expect(cols.every((c) => c.w === 30 && c.h === 54)).toBe(true);
  });

  it("centre la bande sous la grille, à 14 mm", () => {
    const cols = strip(sheet("neige"));
    expect(cols[0]).toMatchObject({ x: (210 - 5 * 30) / 2, y: 35 + 7 * 22 + 14 });
  });

  it("recopie tirets et apostrophes sans case", () => {
    const cols = strip(sheet("l'été"));
    expect(cols[1]).toMatchObject({ char: "'" });
    expect(cols[1].picture).toBeUndefined();
  });

  it("laisse visible une lettre sans dessin (thème à court de dessins)", () => {
    const cols = strip(sheet("abcdefghijklmnopq"));
    expect(cols.at(-1)).toMatchObject({ hint: "Q" });
  });

  it("réduit les cases pour que le plus long morceau tienne sur 180 mm", () => {
    const cols = strip(sheet("anticonstitutionnellement"));
    expect(cols[0].w).toBeCloseTo(180 / 25);
  });

  it("passe à la ligne entre les mots, et réduit les cases tant que la bande dépasse le bas de la page", () => {
    const cols = strip(sheet("bonhomme de neige"));
    const rows = [...new Set(cols.map((c) => c.y))];
    expect(rows.length).toBeGreaterThan(1);
    expect(bottom(cols)).toBeLessThanOrEqual(PAGE.height - 12);
  });

  it("garde toutes les colonnes dans la largeur utile de la page", () => {
    for (const word of ["bonhomme de neige", "arc-en-ciel", "anticonstitutionnellement"]) {
      const cols = strip(sheet(word));
      expect(Math.min(...cols.map((c) => c.x))).toBeGreaterThanOrEqual(15 - 1e-9);
      expect(Math.max(...cols.map((c) => c.x + c.w))).toBeLessThanOrEqual(195 + 1e-9);
    }
  });

  it("Imagier difficile : cases plus grandes et numéro au-dessus de la bande", () => {
    const page = sheet("bol", { game: "imagier", level: "nokey" });
    expect(strip(page)[0].w).toBe(38);
    expect(of(page, "badge")[0].y).toBeLessThan(strip(page)[0].y);
  });
});

describe("pages de correction", () => {
  const words = Array.from({ length: 12 }, (_, i) => ({ word: i === 0 ? "bonhomme de neige" : "lune", number: i + 1 }));

  it("met 10 mots par page, une ligne numérotée par mot", () => {
    const pages = layoutAnswerPages(words, defaults);
    expect(pages).toHaveLength(2);
    expect(of(pages[0], "badge").map((b) => b.text)).toEqual(["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"]);
    expect(of(pages[1], "text", "title")[0].text).toBe("Correction");
  });

  it("donne la même largeur à toutes les lignes, une case par signe et une case vide entre les mots", () => {
    const [page] = layoutAnswerPages(words, defaults);
    const rows = Object.groupBy(of(page, "answer"), (b) => b.y);
    const [long, short] = Object.values(rows);
    const width = (row) => row.at(-1).x + row.at(-1).w - row[0].x;
    expect(width(long)).toBeCloseTo(width(short));
    expect(long).toHaveLength(17);
    expect(long[8]).toMatchObject({ blank: true });
    expect(short.map((b) => b.letter).join("")).toBe("LUNE");
  });

  it("réduit la taille des lettres quand les cases deviennent étroites", () => {
    const [page] = layoutAnswerPages(words, defaults);
    const [long, short] = Object.values(Object.groupBy(of(page, "answer"), (b) => b.y));
    expect(long[0].size).toBeLessThan(short[0].size);
    expect(short[0].size).toBe(8);
  });
});

describe("shrinkToFit", () => {
  it("réduit par pas de 1 mm jusqu'à ce que ça tienne", () => {
    expect(shrinkToFit(30, (size) => size > 26.5)).toBe(26);
  });

  it("garde la taille de départ si elle tient", () => {
    expect(shrinkToFit(30, () => false)).toBe(30);
  });

  it("ne descend pas sous 10 mm", () => {
    expect(shrinkToFit(30, () => true)).toBe(10);
  });
});
