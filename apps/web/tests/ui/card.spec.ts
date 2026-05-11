import { expect, test } from "@playwright/test";

test.describe("upgraded /card surface", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/card/");
  });

  test("renders the upgraded card intelligence and ticket controls", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Tonight's Card" })).toBeVisible();
    await expect(page.getByText("Bridge modes")).toBeVisible();
    await expect(page.getByText("Featured heat")).toBeVisible();
    await expect(page.getByText("My Card")).toBeVisible();
    await expect(page.getByText("Compare to community")).toBeVisible();

    await expect(page.getByRole("button", { name: "balanced" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Fade" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Time" })).toBeVisible();

    await expect(page.getByText("Edge").first()).toBeVisible();
    await expect(page.getByText("Move").first()).toBeVisible();
    await expect(page.getByRole("button", { name: "Add YES" }).first()).toBeVisible();
    await expect(page.getByRole("button", { name: "Explain" }).first()).toBeVisible();
  });

  test("adds a pick to My Card and persists the ticket locally", async ({ page }) => {
    await expect(page.getByText("0 picks")).toBeVisible();

    await page.getByRole("button", { name: "Add YES" }).first().click();

    await expect(page.getByText("1 picks")).toBeVisible();
    await expect(page.getByText("Add picks from the feed to preview your card.")).toHaveCount(0);

    const storedTicket = await page.evaluate(() => localStorage.getItem("thecard:my-card-ticket:v1"));
    expect(storedTicket).toContain("\"side\":\"yes\"");
  });

  test("opens explanation drawer with model, market, and mode bridges", async ({ page }) => {
    await page.getByRole("button", { name: "Explain" }).first().click();

    await expect(page.getByText("Pick explanation")).toBeVisible();
    await expect(page.getByText("Conviction", { exact: true })).toBeVisible();
    await expect(page.getByText("Model", { exact: true })).toBeVisible();
    await expect(page.getByText("Market", { exact: true })).toBeVisible();
    const drawer = page.locator(".fixed").filter({ hasText: "Pick explanation" });
    await expect(drawer.getByRole("link", { name: "blitz", exact: true })).toBeVisible();
    await expect(drawer.getByRole("link", { name: "forecast", exact: true })).toBeVisible();

    await page.getByRole("button", { name: "Close" }).click();
    await expect(page.getByText("Pick explanation")).toHaveCount(0);
  });

  test("supports fade, risk, and time grouping controls", async ({ page }) => {
    await page.getByRole("button", { name: "aggressive" }).click();
    await page.getByRole("button", { name: "Fade" }).click();
    await page.getByRole("button", { name: "Time" }).click();

    await expect(page.getByRole("button", { name: "aggressive" })).toHaveClass(/text-white/);
    await expect(page.getByRole("button", { name: "Fade" })).toHaveClass(/text-white/);
    await expect(page.getByRole("button", { name: "Time" })).toHaveClass(/text-white/);
  });
});
