import { expect, test } from "@playwright/test";

test("unsigned founder must sign in before a sandbox starts", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /Easy-mode/i })).toBeVisible();
  await expect(page.getByText(/Roles to shortlist/i)).toHaveCount(0);

  await page.getByLabel(/Goal/i).fill(
    "Build a developer tool that helps Stellar developers debug Soroban transactions in 30 days with a $500 budget.",
  );
  await page.getByRole("button", { name: /Continue/i }).click();

  await expect(page.getByText(/Saved as context/i)).toBeVisible();
  await expect(page.getByText(/Roles to shortlist/i)).toHaveCount(0);

  await Promise.race([
    page.waitForURL(/sign-in/, { timeout: 15_000 }),
    page.getByText(/Welcome back/i).first().waitFor({ timeout: 15_000 }),
  ]);
});
