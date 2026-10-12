import { expect, test } from "@playwright/test";

const projector = (page) => page.getByRole("dialog", { name: "Projection" });
const counter = (page) => projector(page).locator(".projector-counter");
const revealed = (page) => projector(page).locator('[data-role="strip"] [data-role="letter"]');

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.getByLabel("Mots (un par ligne)").fill("lune\nneige\nsapin");
  await page.getByRole("button", { name: /Projeter/ }).click();
});

test("projette une fiche à la fois, sans la réponse", async ({ page }) => {
  await expect(projector(page)).toBeVisible();
  await expect(counter(page)).toHaveText("1 / 3");
  await expect(projector(page).locator("svg")).toHaveCount(1);
  await expect(revealed(page)).toHaveCount(0);
});

test("passe d'une fiche à l'autre avec les grands boutons", async ({ page }) => {
  const prev = page.getByRole("button", { name: "Fiche précédente" });
  const next = page.getByRole("button", { name: "Fiche suivante" });
  await expect(prev).toBeDisabled();
  await next.click();
  await expect(counter(page)).toHaveText("2 / 3");
  await next.click();
  await expect(counter(page)).toHaveText("3 / 3");
  await expect(next).toBeDisabled();
  await prev.click();
  await expect(counter(page)).toHaveText("2 / 3");
});

test("se pilote au clavier et à la télécommande de présentation", async ({ page }) => {
  await page.keyboard.press("ArrowRight");
  await expect(counter(page)).toHaveText("2 / 3");
  await page.keyboard.press("PageDown");
  await expect(counter(page)).toHaveText("3 / 3");
  await page.keyboard.press("PageUp");
  await expect(counter(page)).toHaveText("2 / 3");
  await page.keyboard.press("Escape");
  await expect(projector(page)).toBeHidden();
});

test("passe à la fiche suivante en glissant le doigt vers la gauche", async ({ page }) => {
  const stage = projector(page).locator(".projector-stage");
  const box = await stage.boundingBox();
  const y = box.y + box.height / 2;
  await stage.dispatchEvent("pointerdown", { clientX: box.x + box.width * 0.8, clientY: y, isPrimary: true });
  await stage.dispatchEvent("pointerup", { clientX: box.x + box.width * 0.2, clientY: y, isPrimary: true });
  await expect(counter(page)).toHaveText("2 / 3");
});

test("révèle case par case, puis cache tout", async ({ page }) => {
  const button = projector(page).getByRole("button", { name: /Révéler/ });
  await button.click();
  await expect(revealed(page)).toHaveText(["L"]);
  await page.keyboard.press("Enter");
  await page.keyboard.press("ArrowDown");
  await expect(revealed(page)).toHaveText(["L", "U", "N"]);
  await page.keyboard.press("ArrowUp");
  await expect(revealed(page)).toHaveCount(2);
  await button.click();
  await button.click();
  await expect(revealed(page)).toHaveCount(4);
  const hide = projector(page).getByRole("button", { name: /Cacher/ });
  await hide.click();
  await expect(revealed(page)).toHaveCount(0);
});

test("chaque fiche repart cachée", async ({ page }) => {
  await page.keyboard.press("Enter");
  await page.keyboard.press("ArrowRight");
  await expect(revealed(page)).toHaveCount(0);
  await page.keyboard.press("ArrowLeft");
  await expect(revealed(page)).toHaveCount(0);
});

test("ferme la projection et rend la main à la page", async ({ page }) => {
  await page.getByRole("button", { name: "Quitter la projection" }).click();
  await expect(projector(page)).toBeHidden();
  await page.keyboard.press("ArrowRight"); // plus d'effet une fois fermée
  await expect(page.getByLabel("Mots (un par ligne)")).toBeVisible();
});

test.describe("sur iPad en portrait", () => {
  test.use({ viewport: { width: 768, height: 1024 } });

  test("la fiche remplit l'écran, grille au-dessus de la bande", async ({ page }) => {
    const svg = projector(page).locator("svg");
    const box = await svg.boundingBox();
    expect(box.width).toBeGreaterThan(700);
    expect(box.y + box.height).toBeLessThanOrEqual(1024 + 1);
    const grid = await svg.locator('[data-role="cell"]').last().boundingBox();
    const strip = await svg.locator('[data-role="strip"]').first().boundingBox();
    expect(strip.y).toBeGreaterThan(grid.y);
  });
});
