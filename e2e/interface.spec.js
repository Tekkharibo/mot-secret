import { expect, test } from "@playwright/test";

const pages = (page) => page.locator("#preview svg");

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
});

test("affiche une fiche par mot et la page de correction", async ({ page }) => {
  await expect(pages(page)).toHaveCount(4);
  await page.getByLabel("Mots (un par ligne)").fill("lune");
  await expect(pages(page)).toHaveCount(2);
  await page.getByLabel("Correction").selectOption("none");
  await expect(pages(page)).toHaveCount(1);
});

test("invite à saisir un mot quand la liste est vide", async ({ page }) => {
  await page.getByLabel("Mots (un par ligne)").fill("");
  await expect(page.getByText("Ajoute au moins un mot")).toBeVisible();
});

test("change de thème", async ({ page }) => {
  const mer = page.getByRole("radio", { name: /Mer/ });
  await mer.click();
  await expect(mer).toHaveAttribute("aria-checked", "true");
  await expect(pages(page).first().locator("stop").first()).toHaveAttribute("stop-color", "#c9e8f5");
});

test("Imagier : propose le niveau et masque « Mélanger »", async ({ page }) => {
  const shuffle = page.getByRole("button", { name: /Mélanger/ });
  await expect(page.getByLabel("Niveau de l'imagier")).toBeHidden();
  await expect(shuffle).toBeVisible();
  await page.getByLabel("Jeu").selectOption("imagier");
  await expect(page.getByLabel("Niveau de l'imagier")).toBeVisible();
  await expect(shuffle).toBeHidden();
});

test("« Mélanger » tire d'autres dessins", async ({ page }) => {
  const first = () => pages(page).first().locator('[data-role="strip"] image').first().getAttribute("href");
  const before = await first();
  await page.getByRole("button", { name: /Mélanger/ }).click();
  await expect.poll(first).not.toBe(before);
});

test("remplace la liste par les 20 mots du thème, après confirmation", async ({ page }) => {
  page.once("dialog", (d) => d.accept());
  await page.getByRole("button", { name: /20 mots du thème/ }).click();
  await expect(page.getByLabel("Mots (un par ligne)")).toHaveValue(/^hiver\nneige\nfroid/);
  await expect(pages(page)).toHaveCount(22);
});

// Safari coûte ~2 ms par <image> créée : 22 pages complètes figent l'écran ~1,5 s à chaque réglage.
test("ne dessine que les pages proches de l'écran", async ({ page }) => {
  page.once("dialog", (d) => d.accept());
  await page.getByRole("button", { name: /20 mots du thème/ }).click();
  await expect(pages(page)).toHaveCount(22);
  await expect(pages(page).first().locator("image").first()).toBeAttached();
  await expect(pages(page).last().locator("image")).toHaveCount(0);
  await pages(page).last().scrollIntoViewIfNeeded();
  await expect(pages(page).last().locator('[data-role="title"]')).toHaveText("Correction");
});

test("avertit quand un mot a trop de lettres différentes pour le thème", async ({ page }) => {
  await page.getByLabel("Mots (un par ligne)").fill("abcdefghijklmnopq");
  await expect(page.locator("#warnings")).toContainText("trop de lettres différentes");
});

test("mémorise les réglages", async ({ page }) => {
  await page.getByLabel("Texte agrandi").check();
  await page.getByLabel("Titre de la fiche").fill("Mon titre");
  await page.reload();
  await expect(page.getByLabel("Texte agrandi")).toBeChecked();
  await expect(pages(page).first().locator('[data-role="title"]')).toHaveText("Mon titre");
});

test("télécharge le PDF du lot", async ({ page }) => {
  const download = page.waitForEvent("download");
  await page.locator("#settings").getByRole("button", { name: /Télécharger le PDF/ }).click();
  expect((await download).suggestedFilename()).toBe("mot-secret-hiver.pdf");
});

test("« Imprimer » ouvre le PDF dans un nouvel onglet", async ({ page }) => {
  // Doublure de window.open : Chromium headless télécharge les PDF au lieu de les afficher.
  await page.evaluate(() => {
    window.open = () => (window.tab = { location: {} });
  });
  await page.getByRole("button", { name: /Imprimer/ }).click();
  await expect.poll(() => page.evaluate(() => window.tab?.location.href)).toMatch(/^blob:/);
});

test.describe("sur smartphone", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("affiche la barre de navigation en bas", async ({ page }) => {
    await expect(page.getByRole("navigation", { name: "Navigation" })).toBeVisible();
  });
});

test("propose de soutenir le projet sur Ko-fi, dans un nouvel onglet", async ({ page }) => {
  const link = page.getByRole("link", { name: /Soutenir le projet/ });
  await expect(link).toHaveAttribute("href", "https://ko-fi.com/tekkharibo");
  await expect(link).toHaveAttribute("target", "_blank");
  await expect(link).toHaveAttribute("rel", /noopener/);
});

test("propose d'écrire, sans adresse en clair dans la page", async ({ page }) => {
  const html = await (await page.request.get("/")).text();
  expect(html).not.toContain("beaune.dev");
  const link = page.getByRole("link", { name: /Une idée, un problème/ });
  await expect(link).toHaveAttribute("href", /^mailto:mot-secret@beaune\.dev\?subject=/);
  await page.getByLabel("Mots (un par ligne)").fill("lune");
  const href = decodeURIComponent(await link.getAttribute("href"));
  expect(href).toMatch(/Lot en cours : http.*#v1\./);
});
