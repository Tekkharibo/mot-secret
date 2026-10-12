import { expect, test } from "@playwright/test";

const presenter = (page) => page.getByRole("dialog", { name: "Mode présentateur" });
const counter = (page) => presenter(page).locator(".presenter-counter");
const letters = (view) => view.locator('svg [data-role="strip"] [data-role="letter"]');
const audienceSvg = (audience) => audience.locator("#projector svg");

// Ouvre le mode présentateur sur 3 fiches ; renvoie la fenêtre élèves.
async function start(page) {
  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.getByLabel("Mots (un par ligne)").fill("lune\nneige\nsapin");
  const popup = page.waitForEvent("popup");
  await page.getByRole("button", { name: /Mode présentateur/ }).click();
  const audience = await popup;
  await expect(audienceSvg(audience)).toHaveCount(1);
  return audience;
}

test("ouvre la vue élèves (fiche seule, sans boutons) et la vue enseignant", async ({ page }) => {
  const audience = await start(page);
  await expect(presenter(page)).toBeVisible();
  await expect(counter(page)).toHaveText("1 / 3");
  await expect(audience.locator(".projector-controls")).toBeHidden();
  await expect(audience.getByRole("button", { name: /plein écran/ })).toBeVisible();
  await expect(letters(audience)).toHaveCount(0);
});

test("la fiche change des deux côtés", async ({ page }) => {
  const audience = await start(page);
  const firstPicture = () => audience.locator('#projector [data-role="strip"] image').first().getAttribute("href");
  const before = await firstPicture();
  await presenter(page).getByRole("button", { name: "Fiche suivante" }).click();
  await expect(counter(page)).toHaveText("2 / 3");
  await expect.poll(firstPicture).not.toBe(before);
  await expect(audience.locator('#projector [data-role="strip"][data-pos]')).toHaveCount(5); // « neige »
});

test("un clic sur une case la révèle chez les élèves, un second la recache", async ({ page }) => {
  const audience = await start(page);
  const box = presenter(page).locator('.presenter-main [data-role="strip"][data-pos="2"]');
  await box.click();
  await expect(letters(audience)).toHaveText(["N"]);
  await expect(presenter(page).locator('.presenter-main [data-role="strip"] [data-role="letter"]')).toHaveText(["N"]);
  await box.click();
  await expect(letters(audience)).toHaveCount(0);
});

test("« Révéler » prend la case suivante encore cachée ; « Tout révéler » et « Cacher »", async ({ page }) => {
  const audience = await start(page);
  await presenter(page).locator('.presenter-main [data-role="strip"][data-pos="0"]').click();
  await presenter(page).getByRole("button", { name: "👁 Révéler", exact: true }).click();
  await expect(letters(audience)).toHaveText(["L", "U"]);
  await presenter(page).getByRole("button", { name: /Tout révéler/ }).click();
  await expect(letters(audience)).toHaveCount(4);
  await presenter(page).getByRole("button", { name: /Cacher/ }).click();
  await expect(letters(audience)).toHaveCount(0);
});

test("la réponse en clair ne s'affiche que tant qu'on appuie", async ({ page }) => {
  await start(page);
  const hold = presenter(page).getByRole("button", { name: /Maintenir pour voir la réponse/ });
  const answer = presenter(page).locator(".presenter-answer");
  await expect(answer).not.toContainText("lune");
  await hold.hover();
  await page.mouse.down();
  await expect(answer).toContainText("lune");
  await page.mouse.up();
  await expect(answer).not.toContainText("lune");
});

test("se pilote au clavier depuis la vue enseignant ou la fenêtre élèves", async ({ page }) => {
  const audience = await start(page);
  await page.keyboard.press("ArrowRight");
  await expect(counter(page)).toHaveText("2 / 3");
  await audience.keyboard.press("PageDown");
  await expect(counter(page)).toHaveText("3 / 3");
  await audience.keyboard.press("Enter");
  await expect(letters(audience)).toHaveText(["S"]);
});

test("glisser au doigt sur la fenêtre élèves change de fiche", async ({ page }) => {
  const audience = await start(page);
  const stage = audience.locator("#projector .projector-stage");
  const box = await stage.boundingBox();
  const y = box.y + box.height / 2;
  await stage.dispatchEvent("pointerdown", { clientX: box.x + box.width * 0.8, clientY: y, isPrimary: true });
  await stage.dispatchEvent("pointerup", { clientX: box.x + box.width * 0.2, clientY: y, isPrimary: true });
  await expect(counter(page)).toHaveText("2 / 3");
});

test("signale la fenêtre élèves fermée et permet de la rouvrir", async ({ page }) => {
  const audience = await start(page);
  await audience.close({ runBeforeUnload: true });
  await expect(presenter(page).locator(".presenter-status")).toContainText("fermée");
  const popup = page.waitForEvent("popup");
  await presenter(page).getByRole("button", { name: /Rouvrir/ }).click();
  await expect(audienceSvg(await popup)).toHaveCount(1);
});

test("« Terminer » ferme les deux vues", async ({ page }) => {
  const audience = await start(page);
  const closed = audience.waitForEvent("close");
  await presenter(page).getByRole("button", { name: /Terminer/ }).click();
  await closed;
  await expect(presenter(page)).toBeHidden();
});
