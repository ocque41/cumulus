import { expect, test } from "@playwright/test";

const processors = [
  "Payment provider",
  "Auth provider",
  "Database provider",
  "Object storage provider",
];

const lastUpdatedIso = "2025-10-11";

test.describe("legal pages", () => {
  test("Spanish privacy policy renders with ToC and last updated", async ({ page }) => {
    await page.goto("/es/privacy-policy");

    await expect(page.locator("h1")).toHaveText("Política de privacidad");
    await expect(page.locator("nav[aria-label='En esta página']")).toBeVisible();
    await expect(page.locator(`time[datetime='${lastUpdatedIso}']`)).toBeVisible();
    await expect(page.locator("meta[name='robots']")).toHaveAttribute("content", "noindex, nofollow");
  });

  test("English privacy policy renders", async ({ page }) => {
    await page.goto("/en/privacy-policy");

    await expect(page.locator("h1")).toHaveText("Privacy Policy");
    await expect(page.locator("nav[aria-label='On this page']")).toBeVisible();
  });

  test("Spanish terms of service renders", async ({ page }) => {
    await page.goto("/es/terms-of-service");

    await expect(page.locator("h1")).toHaveText("Términos de servicio");
  });

  test("English terms of service renders", async ({ page }) => {
    await page.goto("/en/terms-of-service");

    await expect(page.locator("h1")).toHaveText("Terms of Service");
  });

  test("processors table lists required vendors", async ({ page }) => {
    await page.goto("/en/privacy-policy");

    for (const processor of processors) {
      await expect(page.locator("table")).toContainText(processor);
    }

    for (const url of [
      "https://cumulush.com/privacy-policy",
    ]) {
      await expect(page.locator(`a[href='${url}']`).first()).toHaveAttribute("target", "_blank");
    }
  });
});
