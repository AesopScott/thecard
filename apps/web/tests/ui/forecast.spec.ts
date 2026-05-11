import { expect, test } from "@playwright/test";

test.describe("forecast explainer", () => {
  test("opens a detailed explanation of forecast betting", async ({ page }) => {
    await page.goto("/forecast/");

    await expect(page.getByRole("heading", { name: "Train probability, not vibes." })).toBeVisible();
    await page.getByRole("button", { name: "Explain forecast betting" }).click();

    await expect(page.getByText("Forecast is about probability skill, not just picking winners.")).toBeVisible();
    await expect(page.getByText("What you are setting")).toBeVisible();
    await expect(page.getByText("Market comparison")).toBeVisible();
    await expect(page.getByText("How scoring works")).toBeVisible();
    await expect(page.getByText("How to use it well")).toBeVisible();
  });

  test("answers forecast questions in the AI helper", async ({ page }) => {
    await page.goto("/forecast/");

    await page.getByRole("button", { name: "What is a good Brier score?" }).click();

    await expect(page.getByText("Forecast uses Brier score, where lower is better.")).toBeVisible();
  });
});
