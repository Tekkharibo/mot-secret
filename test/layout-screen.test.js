import { describe, expect, it } from "vitest";
import { CONTROLS_HEIGHT, layoutScreen } from "../src/layout.js";
import { assignPictures } from "../src/picture.js";
import { DEFAULTS } from "../src/state.js";

const SCREENS = {
  "vidéoprojecteur 16:9": { width: 1920, height: 1080 },
  "ordinateur 16:10": { width: 1440, height: 900 },
  "iPad paysage": { width: 1024, height: 768 },
  "iPad portrait": { width: 768, height: 1024 },
  smartphone: { width: 390, height: 844 },
  "fenêtre carrée": { width: 900, height: 900 },
};
const screen = (word, size, opts = {}) => {
  const options = { ...DEFAULTS, ...opts };
  const { pictureOf } = assignPictures(word, { game: options.game, theme: "hiver", seed: 1 });
  return layoutScreen({ word, pictureOf }, options, size);
};
const of = (page, type) => page.items.filter((i) => i.type === type);
const box = (items) => ({
  left: Math.min(...items.map((i) => i.x)),
  right: Math.max(...items.map((i) => i.x + i.w)),
  top: Math.min(...items.map((i) => i.y)),
  bottom: Math.max(...items.map((i) => i.y + i.h)),
});

describe("layoutScreen", () => {
  it.each(Object.entries(SCREENS))("%s : page aux proportions de l'écran", (_, size) => {
    const page = screen("neige", size);
    expect(page.width / page.height).toBeCloseTo(size.width / size.height);
  });

  for (const word of ["neige", "bonhomme de neige", "arc-en-ciel", "anticonstitutionnellement"]) {
    it.each(Object.entries(SCREENS))(`%s : « ${word} » tient au-dessus des boutons`, (_, size) => {
      const page = screen(word, size);
      const all = box([...of(page, "cell"), ...of(page, "strip")]);
      expect(all.left).toBeGreaterThanOrEqual(0);
      expect(all.right).toBeLessThanOrEqual(page.width + 1e-9);
      expect(all.bottom).toBeLessThanOrEqual(page.height - CONTROLS_HEIGHT + 1e-9);
    });
  }

  it("écran large : grille à gauche, bande à droite", () => {
    const page = screen("neige", SCREENS["vidéoprojecteur 16:9"]);
    expect(box(of(page, "strip")).left).toBeGreaterThan(box(of(page, "cell")).right);
  });

  it("écran haut : grille en haut, bande en dessous", () => {
    const page = screen("neige", SCREENS["iPad portrait"]);
    expect(box(of(page, "strip")).top).toBeGreaterThan(box(of(page, "cell")).bottom);
  });

  it("garde le titre et la consigne, sans ligne « Prénom » ni numéro", () => {
    const page = screen("bol", SCREENS.smartphone, { game: "imagier", showName: true, showNumber: true });
    const roles = page.items.filter((i) => i.type === "text").map((i) => i.role);
    expect(roles).toEqual(["title", "instruction"]);
    expect(of(page, "badge")).toHaveLength(0);
  });

  it("Imagier difficile : bande seule, en grand", () => {
    const page = screen("bol", SCREENS["vidéoprojecteur 16:9"], { game: "imagier", level: "nokey" });
    expect(of(page, "cell")).toHaveLength(0);
    expect(of(page, "strip")[0].w).toBeGreaterThan(screen("bol", SCREENS["vidéoprojecteur 16:9"]).items.find((i) => i.type === "strip").w);
  });

  it("donne à chaque colonne de lettre sa lettre, pour pouvoir la révéler", () => {
    expect(of(screen("l'été", SCREENS.smartphone), "strip").map((c) => c.letter ?? c.char)).toEqual(["L", "'", "E", "T", "E"]);
  });
});
