import { expect, test, type Page } from "@playwright/test";

async function mockContributions(page: Page) {
  await page.route("**/api/github/contributions", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      json: {
        username: "ocque41",
        contributions: [
          { count: 4, date: "2026-07-16", level: 3 },
          { count: 1, date: "2026-07-15", level: 1 },
        ],
        totalContributions: 5,
        fetchedAt: "2026-07-16T12:00:00.000Z",
      },
    });
  });
}

test.beforeEach(async ({ page }) => {
  await mockContributions(page);
});

test("home exposes the large brand, honest GitHub graph, archive, and auth boundary", async ({
  page,
}) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { level: 1, name: "CUMULUS" })).toBeVisible();
  await expect(page.getByText("lab", { exact: true }).first()).toBeVisible();
  await expect(page.getByRole("heading", { name: "ocque41, in public" })).toBeVisible();
  await expect(page.getByRole("img", { name: /5 GitHub contributions/i })).toBeVisible();
  await expect(page.locator(".contribution-cell")).toHaveCount(364);

  await page.getByRole("button", { name: "Sign in" }).first().click();
  await expect(page.getByRole("dialog", { name: "New log notifications" })).toBeVisible();
  await expect(page.getByText(/All Cumulus logs are public/i)).toBeVisible();
  await page.getByRole("button", { name: "Close notification settings" }).click();

  const logIndexLink = page.getByRole("link", { name: "Log index", exact: true });
  if (!(await logIndexLink.isVisible())) {
    await page.getByRole("button", { name: "Menu" }).click();
  }
  await logIndexLink.click();
  await expect(page).toHaveURL(/\/logs$/);
  await expect(page.getByRole("heading", { level: 1, name: "Log index" })).toBeVisible();

  const firstLog = page.locator('.post-index-row h2 a[href^="/logs/"]').first();
  const title = (await firstLog.textContent())?.trim();
  await firstLog.click();
  await expect(page).toHaveURL(/\/logs\/[a-z0-9-]+$/);
  await expect(page.getByRole("heading", { level: 1, name: title })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Footer navigation" })).toBeVisible();
});

test("archive search and category filters are URL-backed", async ({ page }) => {
  await page.goto("/logs");
  const search = page.getByRole("searchbox", { name: "Search logs" });
  await search.fill("security");
  await page.getByRole("button", { name: "Search", exact: true }).click();
  await expect(page).toHaveURL(/q=security/);
  await expect(page.getByRole("status")).toContainText(/entr|No signal/i);

  await page.getByRole("button", { name: "Clear filters" }).click();
  await expect(page).toHaveURL(/\/logs$/);
  await expect(search).toHaveValue("");
});

test("mobile menu is operable and the page contains horizontal graph overflow", async ({
  page,
}, testInfo) => {
  test.skip(!testInfo.project.name.includes("mobile"), "Mobile layout assertion");
  await page.goto("/");

  const menu = page.getByRole("button", { name: "Menu" });
  await expect(menu).toBeVisible();
  await menu.click();
  await expect(page.getByRole("navigation", { name: "Primary navigation" })).toBeVisible();
  await expect(page.locator("body")).toHaveCSS("overflow-x", "hidden");

  await expect(page.locator(".contribution-frame")).toHaveCSS("overflow-x", "auto");
});
