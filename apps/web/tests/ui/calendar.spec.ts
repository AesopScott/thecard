import { expect, test } from "@playwright/test";

test.describe("sports calendar slate planner", () => {
  test("shows the upgraded calendar surface and opens date details", async ({ page }) => {
    await page.goto("/sports-calendar/");

    await expect(page.getByText("Featured slate")).toBeVisible();
    await expect(page.getByText("Upcoming locks")).toBeVisible();
    await expect(page.getByText("Date drawer")).toBeVisible();
    await expect(page.getByText("Build this card")).toBeVisible();
    await expect(page.getByText("Calendar mood")).toBeVisible();

    const locks = page.locator("section").filter({ hasText: "Upcoming locks" });
    await locks.getByRole("button").filter({ hasText: "MLB" }).first().click();

    const drawer = page.locator("section").filter({ hasText: "Date drawer" });
    await expect(drawer.getByText("MLB", { exact: true })).toBeVisible();
    await expect(drawer.getByText("All-Star Game")).toBeVisible();
    await expect(drawer.getByRole("link", { name: "Build this card" })).toHaveAttribute("href", /\/card\/?$/);
  });
});
