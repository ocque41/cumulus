import { expect, test, type Page } from "@playwright/test";

import { publishedPosts } from "../../src/content/posts";

async function mockContributions(page: Page) {
  await page.route("**/api/github/contributions", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      json: {
        username: "ocque41",
        activityDays: [
          {
            commits: 4,
            date: "2026-07-16",
            highlights: [
              {
                kind: "pull-request",
                repository: "cumulus/cloud",
                title: "Refine the hero activity field",
                url: "https://github.com/cumulus/cloud/pull/12",
              },
            ],
            issues: 1,
            pullRequests: 1,
          },
        ],
        activityDetailStatus: "live",
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
}, testInfo) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { level: 1, name: "CUMULUS" })).toBeVisible();
  await expect(page.getByText("lab", { exact: true }).first()).toBeVisible();
  await expect(page.getByRole("heading", { name: "GitHub activity graph" })).toBeAttached();
  await expect(page.getByRole("group", { name: /5 GitHub contributions/i })).toBeVisible();
  await expect(page.getByText("Public activity", { exact: true })).toHaveCount(0);
  await expect(page.locator(".home-hero .github-panel")).toHaveCount(1);
  await expect(page.locator("body")).not.toContainText("ocque41");
  await expect(
    page.locator('.home-hero__footer a[href="https://github.com/ocque41"]'),
  ).toHaveText("GitHub");
  await expect(page.locator(".contribution-grid .contribution-cell")).toHaveCount(371);
  await expect(
    page.locator('.contribution-grid .contribution-cell[data-texture="dither"]'),
  ).toHaveCount(371);
  if (testInfo.project.name.includes("mobile")) {
    await page.getByLabel("Choose a day").selectOption("2026-07-16");
  } else {
    await page.getByRole("button", { name: /Thursday, July 16, 2026: 4 contributions; 4 commits, 1 pull request, 1 issue/i }).hover();
  }
  await expect(page.getByRole("heading", { name: "Thursday, July 16, 2026" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Refine the hero activity field" })).toBeVisible();

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

test("mobile menu is operable and the graph fits the hero width", async ({
  page,
}, testInfo) => {
  test.skip(!testInfo.project.name.includes("mobile"), "Mobile layout assertion");
  await page.goto("/");

  const menu = page.getByRole("button", { name: "Menu" });
  await expect(menu).toBeVisible();
  await menu.click();
  await expect(page.getByRole("navigation", { name: "Primary navigation" })).toBeVisible();
  await expect(page.locator("body")).toHaveCSS("overflow-x", "hidden");

  const graphFits = await page.locator(".contribution-grid").evaluate(
    (element) => element.scrollWidth <= element.clientWidth + 1,
  );
  expect(graphFits).toBe(true);

  const dayPicker = page.getByLabel("Choose a day");
  await expect(dayPicker).toBeVisible();
  await dayPicker.selectOption("2026-07-16");
  await expect(page.getByRole("heading", { name: "Thursday, July 16, 2026" })).toBeVisible();
});

test("every published log resolves directly with its sources and backlinks", async ({ page }) => {
  test.setTimeout(120_000);

  for (const post of publishedPosts) {
    const response = await page.goto(`/logs/${post.slug}`);
    expect(response?.ok(), post.slug).toBe(true);
    await expect(page.getByRole("heading", { level: 1, name: post.title })).toBeVisible();
    await expect(page.getByText("Public links", { exact: true })).toBeVisible();
    await expect(page.locator('.related-logs__grid a[href^="/logs/"]')).toHaveCount(
      post.relatedSlugs?.length ?? 0,
    );
  }
});

test("an unknown public route renders the real not-found experience", async ({ page }) => {
  await page.goto("/this-route-does-not-exist");
  await expect(page.getByRole("heading", { level: 1, name: "This log is not in the field." })).toBeVisible();
  await expect(page.getByRole("link", { name: "Open the log index" })).toBeVisible();
});
