import { test, expect } from "@playwright/test";

test.describe("MedLab Production User Journeys", () => {
  test("Journey A: Landing, Navigation and Authentication Structure", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("h1")).toContainText("family's health records");
    await expect(page.locator("text=Open Health Vault")).toBeVisible();

    // Check Login and Signup routes exist
    await page.goto("/login");
    await expect(page.locator("text=Sign In")).toBeVisible();

    await page.goto("/signup");
    await expect(page.locator("text=Create Account")).toBeVisible();
  });

  test("Journey B: Privacy Policy and Legal Non-Diagnostic Disclaimers", async ({ page }) => {
    await page.goto("/privacy");
    await expect(page.locator("h1")).toContainText("Privacy Policy");
    await expect(page.locator("text=Zero AI Model Training")).toBeVisible();

    await page.goto("/terms");
    await expect(page.locator("h1")).toContainText("Terms of Service");
    await expect(page.locator("text=Non-Diagnostic Medical Disclaimer")).toBeVisible();
  });

  test("Journey C: Public Share Link Access State and Safety", async ({ page }) => {
    // When visiting a non-existent or expired share token
    const testToken = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
    await page.goto(`/share/${testToken}`);

    // Verify non-diagnostic disclaimer is always present on public viewer
    await expect(page.locator("text=Medical Disclaimer")).toBeVisible();
  });
});
