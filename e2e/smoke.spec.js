import { expect, test } from "@playwright/test";

test("la page se charge sans erreur", async ({ page }) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  await page.goto("/");
  await expect(page).toHaveTitle("Mot secret");
  expect(errors).toEqual([]);
});
