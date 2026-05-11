import { expect, test } from "@playwright/test";

test.describe("Perfect 10 upgraded surface", () => {
  test("shows ticket builder, par, balance, sweat mode, and recap demos", async ({ page }) => {
    await page.goto("/perfect-ten/");

    await expect(page.getByText("Perfect ticket builder")).toBeVisible();
    await expect(page.getByText("Daily par")).toBeVisible();
    await expect(page.getByText("Lineup balance")).toBeVisible();
    await expect(page.getByText("Sweat mode", { exact: true })).toBeVisible();
    await expect(page.getByText("Perfect path recap", { exact: true })).toBeVisible();
    await expect(page.getByText("Mock options")).toBeVisible();

    await page.getByRole("button", { name: "longshot" }).click();
    await expect(page.getByText("YES-heavy ticket")).toBeVisible();

    await page.getByRole("button", { name: "perfect" }).click();
    await expect(page.getByText("10/10 jackpot path")).toBeVisible();

    await page.getByRole("button", { name: "Bad beat" }).click();
    await expect(page.getByText("9/10 bad beat")).toBeVisible();
  });
});
