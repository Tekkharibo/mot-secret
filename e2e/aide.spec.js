import { expect, test } from "@playwright/test";

const aide = (page) => page.getByRole("dialog", { name: "Tutoriels vidéo" });
const video = (page) => aide(page).locator("video");

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: /Tutoriels vidéo/ }).click();
});

test("ouvre les tutoriels sur la présentation", async ({ page }) => {
  await expect(aide(page)).toBeVisible();
  await expect(aide(page).getByRole("button", { name: "Présentation" })).toHaveAttribute("aria-pressed", "true");
  await expect(video(page)).toHaveAttribute("src", "aide/presentation.mp4");
  await expect(video(page)).toHaveAttribute("poster", "aide/presentation.jpg");
});

test("change de vidéo en choisissant un chapitre", async ({ page }) => {
  const chapter = aide(page).getByRole("button", { name: "Projeter" });
  await chapter.click();
  await expect(chapter).toHaveAttribute("aria-pressed", "true");
  await expect(aide(page).getByRole("button", { name: "Présentation" })).toHaveAttribute("aria-pressed", "false");
  await expect(video(page)).toHaveAttribute("src", "aide/projeter.mp4");
});

test("se ferme avec ✕ ou Échap et arrête la vidéo", async ({ page }) => {
  await aide(page).getByRole("button", { name: "Fermer" }).click();
  await expect(aide(page)).toBeHidden();
  await page.getByRole("button", { name: /Tutoriels vidéo/ }).click();
  await aide(page).getByRole("button", { name: "Imprimer" }).click();
  const paused = () => page.locator("#help video").evaluate((v) => v.paused);
  await expect.poll(paused).toBe(false);
  await page.keyboard.press("Escape");
  await expect(aide(page)).toBeHidden();
  await expect.poll(paused).toBe(true);
});

test("chaque chapitre a sa vidéo et son aperçu", async ({ page, request }) => {
  const files = await aide(page).locator("[data-video]").evaluateAll((bs) => bs.map((b) => b.dataset.video));
  expect(files).toHaveLength(7);
  for (const f of files) {
    for (const ext of ["mp4", "jpg"]) expect((await request.get(`/aide/${f}.${ext}`)).status(), `${f}.${ext}`).toBe(200);
  }
});
