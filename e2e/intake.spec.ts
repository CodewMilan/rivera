import { expect, test } from "@playwright/test";

test("founder can submit a goal and reach a Rivera organization", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /Give it a goal/i })).toBeVisible();
  await page.getByLabel(/Goal/i).fill(
    "Build a developer tool that helps Stellar developers debug Soroban transactions in 30 days with a $500 budget.",
  );
  await page.getByRole("button", { name: /Start Rivera/i }).click();
  await page.waitForURL(/\/organizations\//, { timeout: 45_000 });
  await expect(page.getByText(/Budget used/i)).toBeVisible();
});
