import { expect, test } from "@playwright/test";

const words = (page) => page.getByLabel("Mots (un par ligne)");

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
});

// Lien de partage produit par le bouton, avec navigator.share remplacé par une doublure.
async function shareLink(page) {
  await page.evaluate(() => {
    navigator.share = async (data) => (window.shared = data);
  });
  await page.getByRole("button", { name: /Partager le lot/ }).click();
  return page.evaluate(() => window.shared.url);
}

test("ouvrir le lien redonne le même lot, remplace les réglages et nettoie l'adresse", async ({ page }) => {
  await page.reload();
  await words(page).fill("bûche\ncœur");
  await page.getByRole("radio", { name: /Noël/ }).click();
  const url = await shareLink(page);
  expect(url).toMatch(/#v1\.[\w-]+$/);

  await page.evaluate(() => localStorage.clear());
  await page.goto("/");
  await words(page).fill("autre chose");
  await page.goto(url);
  await page.reload(); // le lien a déjà été lu : un rechargement ne doit rien changer
  await expect(words(page)).toHaveValue("bûche\ncœur");
  await expect(page.getByRole("radio", { name: /Noël/ })).toHaveAttribute("aria-checked", "true");
  expect(new URL(page.url()).hash).toBe("");
});

test("un lien abîmé est ignoré et signalé", async ({ page }) => {
  await page.reload();
  await words(page).fill("lune");
  await page.goto("/#v1.abîmé");
  await expect(page.locator("#status")).toContainText("incomplet ou abîmé");
  await expect(words(page)).toHaveValue("lune");
});

test("sans partage natif, copie le lien", async ({ page }) => {
  await page.evaluate(() => {
    delete Navigator.prototype.share;
    navigator.clipboard.writeText = async (text) => (window.copied = text);
  });
  await page.getByRole("button", { name: /Partager le lot/ }).click();
  await expect(page.locator("#status")).toContainText("Lien copié");
  expect(await page.evaluate(() => window.copied)).toMatch(/#v1\./);
});

test("les ancres de la barre mobile ne sont pas des liens de partage", async ({ page }) => {
  await page.goto("/#apercu");
  await expect(page.locator("#status")).toBeEmpty();
  expect(new URL(page.url()).hash).toBe("#apercu");
});
