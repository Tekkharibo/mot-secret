import { describe, expect, it } from "vitest";
import { pictureFile } from "../src/picture.js";

describe("pictureFile", () => {
  it("nomme le fichier d'après les points de code en hexadécimal", () => {
    expect(pictureFile("🐳")).toBe("1f433");
  });

  it("ignore le sélecteur de variante FE0F", () => {
    expect(pictureFile("❄️")).toBe("2744");
  });

  it("sépare les points de code des emojis composés par un tiret", () => {
    expect(pictureFile("🐻‍❄️")).toBe("1f43b-200d-2744");
  });

  it("garde le nom d'un dessin maison « :nom: »", () => {
    expect(pictureFile(":xylophone:")).toBe("xylophone");
  });
});
