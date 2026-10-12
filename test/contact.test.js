import { describe, expect, it } from "vitest";
import { contactMailto } from "../src/contact.js";

const mail = contactMailto({ version: "9213fdc", userAgent: "Mozilla/5.0 (iPad; CPU OS 17_0)", shareUrl: "https://tekkharibo.github.io/mot-secret/#v1.abc" });
const parsed = new URL(mail);

describe("e-mail de contact", () => {
  it("s'adresse à mot-secret@beaune.dev", () => {
    expect(parsed.protocol).toBe("mailto:");
    expect(decodeURIComponent(parsed.pathname)).toBe("mot-secret@beaune.dev");
  });

  it("préremplit l'objet", () => {
    expect(parsed.searchParams.get("subject")).toBe("Mot secret — idée / problème");
  });

  it("préremplit le corps avec la version, l'appareil et le lien du lot", () => {
    const body = parsed.searchParams.get("body");
    expect(body).toContain("Version : 9213fdc");
    expect(body).toContain("Appareil et navigateur : Mozilla/5.0 (iPad; CPU OS 17_0)");
    expect(body).toContain("Lot en cours : https://tekkharibo.github.io/mot-secret/#v1.abc");
  });

  it("encode les espaces en %20 (certaines messageries affichent les « + » tels quels)", () => {
    expect(mail).not.toContain("+");
  });
});
