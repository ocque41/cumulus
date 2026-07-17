import { expect, test, type Page } from "@playwright/test";

import { publishedPosts, searchPublishedPosts } from "../../src/content/posts";

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
          { count: 0, date: "2025-07-13", level: 0 },
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
    const selectedCell = page.getByRole("button", { name: /Thursday, July 16, 2026: 4 contributions; 4 commits, 1 pull request, 1 issue/i });
    await selectedCell.hover();
    await expect(page.locator(".contribution-frame")).toHaveAttribute("data-popover-side", "left");
    const sideAwarePlacement = await page.locator(".contribution-popover").evaluate((popover) => {
      const activeCell = document.querySelector<HTMLElement>('.contribution-cell[data-active="true"]');
      if (!activeCell) return false;
      const cellRect = activeCell.getBoundingClientRect();
      const popoverRect = popover.getBoundingClientRect();
      return (
        popover.closest(".contribution-frame")?.getAttribute("data-popover-side") === "left" &&
        popoverRect.left < cellRect.left &&
        popoverRect.right <= cellRect.right
      );
    });
    expect(sideAwarePlacement).toBe(true);
  }
  await expect(page.getByRole("heading", { name: "Thursday, July 16, 2026" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Refine the hero activity field" })).toBeVisible();

  await page.getByRole("button", { name: "Sign in" }).first().click();
  await expect(page.getByRole("dialog", { name: "New log notifications" })).toBeVisible();
  await expect(page.getByText(/All Cumulus logs are public/i)).toBeVisible();
  await expect(
    page.getByRole("link", { name: "notification privacy and data rights" }),
  ).toHaveAttribute("href", "/privacy");
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

test("archive search and category filters update in place with exact results", async ({ page }) => {
  await page.goto("/logs");
  const search = page.getByRole("searchbox", { name: "Search logs" });
  await search.fill("secret");
  await page.getByRole("button", { name: "Search", exact: true }).click();
  await expect(page).toHaveURL(/q=secret/);
  await expect(page.getByRole("status")).toHaveText(
    `${searchPublishedPosts("secret").length} entries matching “secret”`,
  );

  const rune = page.getByRole("button", { name: "Rune", exact: true });
  await rune.scrollIntoViewIfNeeded();
  const scrollBeforeCategory = await page.evaluate(() => window.scrollY);
  await rune.click();
  await expect(page).toHaveURL(/q=secret&category=Rune/);
  await expect(rune).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByRole("status")).toHaveText(
    `${searchPublishedPosts("secret", "Rune").length} entries matching “secret”`,
  );
  await expect(page.locator(".post-index-row")).toHaveCount(2);
  const scrollAfterCategory = await page.evaluate(() => window.scrollY);
  expect(Math.abs(scrollAfterCategory - scrollBeforeCategory)).toBeLessThanOrEqual(2);

  await page.getByRole("button", { name: "Clear filters" }).click();
  await expect(page).toHaveURL(/\/logs$/);
  await expect(page.getByRole("status")).toHaveText(`${publishedPosts.length} entries`);
  await expect(search).toHaveValue("");
});

test("public work stays inside Cumulus and labels source boundaries", async ({ page }, testInfo) => {
  await page.goto("/");

  const primaryNavigation = page.getByRole("navigation", { name: "Primary navigation" });
  const publicWork = primaryNavigation.getByRole("link", { name: "Public work", exact: true });
  if (!(await publicWork.isVisible())) {
    await page.getByRole("button", { name: "Menu" }).click();
  }
  await publicWork.click();

  await expect(page).toHaveURL(/\/work$/);
  await expect(page.getByRole("heading", { level: 1, name: "Public work" })).toBeVisible();
  await expect(page.locator(".work-project")).toHaveCount(10);
  await expect(page.getByRole("link", { name: /View source/ })).toHaveCount(5);
  await expect(page.locator("body")).not.toContainText("ocque41");

  const metrics = await page.evaluate(() => ({
    bodyWidth: document.body.scrollWidth,
    viewportWidth: document.documentElement.clientWidth,
  }));
  expect(metrics.bodyWidth).toBeLessThanOrEqual(metrics.viewportWidth + 1);

  if (testInfo.project.name.includes("mobile")) {
    await expect(page.locator(".work-index")).toHaveCSS("grid-template-columns", /.+/);
  }
});

test("notification privacy is public, scoped, and reachable without sign-in", async ({ page }) => {
  await page.goto("/privacy");

  await expect(page).toHaveURL(/\/privacy$/);
  await expect(page.getByRole("heading", { level: 1, name: "Notification privacy" }))
    .toBeVisible();
  await expect(page.getByRole("heading", { name: "Withdrawal, correction, and deletion" }))
    .toBeVisible();
  await expect(page.getByText(/does not promise an automatic expiry/i)).toBeVisible();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.locator("body")).not.toContainText("ocque41");
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
