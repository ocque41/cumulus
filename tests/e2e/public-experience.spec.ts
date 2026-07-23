import { expect, test, type Locator, type Page } from "@playwright/test";

import { publishedPosts, searchPublishedPosts } from "../../src/content/posts";
import {
  ARCHIVE_PAGE_SIZE,
  CONTENT_AREAS,
  postsForArea,
} from "../../src/content/areas";
import { WORK_PROJECTS } from "../../src/content/work";
import {
  mockAnonymousNotificationSession,
  mockContributions,
  NOTIFICATION_PROMPT_STORAGE_KEY,
  PRIMARY_ACTIVITY_DATE,
  PRIMARY_ACTIVITY_LABEL,
  SECONDARY_ACTIVITY_DATE,
  SECONDARY_ACTIVITY_LABEL,
  seedNotificationPromptMarker,
  SESSION_ENDPOINT,
} from "./public-test-support";

const PREFERENCES_ENDPOINT = "**/api/notifications/preferences";

const PROJECT_COUNTS = new Map(
  WORK_PROJECTS.map((project) => [
    project.slug,
    publishedPosts.filter((post) => post.project === project.slug).length,
  ]),
);
const PROJECT_POST_COUNT = Array.from(PROJECT_COUNTS.values()).reduce(
  (total, count) => total + count,
  0,
);

async function openNotificationSettings(page: Page): Promise<Locator> {
  const trigger = page.getByRole("button", {
    name: "Notification settings",
  });

  if (!(await trigger.isVisible())) {
    await page.getByRole("button", { name: "Menu", exact: true }).click();
  }

  await expect(trigger).toBeVisible();
  await trigger.click();
  return trigger;
}

async function expectPopoverDoesNotCoverAnchor(
  details: Locator,
  date: string,
) {
  await expect.poll(async () => details.evaluate((popover, anchorDate) => {
    const anchor = document.querySelector<HTMLElement>(
      `.contribution-cell[data-date="${anchorDate}"]`,
    );
    if (!anchor) return false;

    const anchorRect = anchor.getBoundingClientRect();
    const popoverRect = popover.getBoundingClientRect();
    return Math.max(
      anchorRect.left - popoverRect.right,
      popoverRect.left - anchorRect.right,
      anchorRect.top - popoverRect.bottom,
      popoverRect.top - anchorRect.bottom,
    );
  }, date)).toBeGreaterThanOrEqual(-1);
}

async function expectNoInternalScroll(renderer: Locator, label: string) {
  await expect(renderer).toBeVisible();
  const state = await renderer.evaluate((element) => {
    const style = getComputedStyle(element);
    const bounds = element.getBoundingClientRect();
    const childrenFit = Array.from(element.children).every((child) => {
      const childBounds = child.getBoundingClientRect();
      return childBounds.left >= bounds.left - 1
        && childBounds.right <= bounds.right + 1
        && childBounds.top >= bounds.top - 1
        && childBounds.bottom <= bounds.bottom + 1;
    });
    element.scrollLeft = 100;
    element.scrollTop = 100;
    const attemptedScrollLeft = element.scrollLeft;
    const attemptedScrollTop = element.scrollTop;
    element.scrollLeft = 0;
    element.scrollTop = 0;
    return {
      attemptedScrollLeft,
      attemptedScrollTop,
      clientHeight: element.clientHeight,
      clientWidth: element.clientWidth,
      childrenFit,
      overflowX: style.overflowX,
      overflowY: style.overflowY,
      scrollHeight: element.scrollHeight,
      scrollWidth: element.scrollWidth,
    };
  });

  expect([state.overflowX, state.overflowY], `${label} overflow mode`)
    .not.toContain("auto");
  expect([state.overflowX, state.overflowY], `${label} overflow mode`)
    .not.toContain("scroll");
  expect(state.childrenFit, `${label} content fit`).toBe(true);
  expect(state.scrollWidth, `${label} horizontal content fit`)
    .toBeLessThanOrEqual(state.clientWidth + 1);
  expect(state.scrollHeight, `${label} vertical content fit`)
    .toBeLessThanOrEqual(state.clientHeight + 1);
  expect(state.attemptedScrollLeft, `${label} horizontal scroll lock`).toBe(0);
  expect(state.attemptedScrollTop, `${label} vertical scroll lock`).toBe(0);
}

test.beforeEach(async ({ page }) => {
  await mockContributions(page);
  await mockAnonymousNotificationSession(page);
});

test("the archive reflects the validated post catalog", async ({
  page,
}) => {
  await seedNotificationPromptMarker(page);
  await page.goto("/logs");

  await expect(
    page.getByRole("heading", { level: 1, name: "Log index" }),
  ).toBeVisible();
  await expect(page.getByRole("status")).toHaveText(
    `${publishedPosts.length} entries · page 1 of ${Math.ceil(publishedPosts.length / ARCHIVE_PAGE_SIZE)}`,
  );
  await expect(page.locator(".post-index-row")).toHaveCount(
    ARCHIVE_PAGE_SIZE,
  );
  await expect(page.getByRole("link", { name: "Next" }))
    .toHaveAttribute("href", "/logs/page/2");

  await expect(page.locator("body")).not.toContainText("platform-new");

  const search = page.getByRole("searchbox", { name: "Search logs" });
  await search.fill("Requisia");
  await page.getByRole("button", { name: "Search", exact: true }).click();
  await expect(page).toHaveURL(/\/logs\?q=Requisia$/);
  await expect(page.getByRole("status")).toHaveText(
    `${searchPublishedPosts("Requisia").length} entries matching “Requisia”`,
  );
  const requisiaCount = searchPublishedPosts("Requisia").length;
  await expect(page.locator(".post-index-row")).toHaveCount(requisiaCount);
  await expect(
    page.locator(".post-index-row .post-meta > span:nth-of-type(2)").filter({
      hasText: /^requisia$/i,
    }),
  ).toHaveCount(requisiaCount);

  await page.getByRole("button", { name: "Clear filters" }).click();
  await expect(page).toHaveURL(/\/logs$/);
  await expect(page.getByRole("status")).toHaveText(
    `${publishedPosts.length} entries · page 1 of ${Math.ceil(publishedPosts.length / ARCHIVE_PAGE_SIZE)}`,
  );
  await expect(search).toHaveValue("");
});

test("the homepage stays capped and every area has a crawlable archive", async ({
  page,
}) => {
  await seedNotificationPromptMarker(page);
  await page.goto("/");

  await expect(page.locator(".featured-post")).toHaveCount(1);
  await expect(page.locator(".compact-post-row")).toHaveCount(
    Math.min(4, publishedPosts.length - 1),
  );
  await expect(page.locator(".area-overview-card")).toHaveCount(CONTENT_AREAS.length);

  for (const area of CONTENT_AREAS) {
    await page.goto(`/areas/${area.slug}`);
    await expect(page.getByRole("heading", { level: 1, name: area.category }))
      .toBeVisible();
    await expect(page.locator(".post-index-row")).toHaveCount(
      Math.min(ARCHIVE_PAGE_SIZE, postsForArea(publishedPosts, area).length),
    );
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      "href",
      `https://cumulush.com/areas/${area.slug}`,
    );
  }

  await page.goto("/logs/page/2");
  await expect(page.getByRole("status")).toContainText("page 2 of");
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    "href",
    "https://cumulush.com/logs/page/2",
  );

  await page.goto("/logs/page/999");
  await expect(page.getByRole("heading", { name: "This log is not in the field." }))
    .toBeVisible();
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
    "content",
    "noindex, follow",
  );
});

test("Public Work presents four internal project records without source links", async ({
  page,
}) => {
  await seedNotificationPromptMarker(page);
  await page.goto("/work");

  await expect(
    page.getByRole("heading", { level: 1, name: "Public work" }),
  ).toBeVisible({ timeout: 15_000 });
  await expect(page.locator(".work-project")).toHaveCount(4);
  await expect(page.locator(".work-project__signal.dither-artwork")).toHaveCount(4);
  await expect(page.locator(".work-hero [data-slot='hero-dither']")).toHaveCount(1);
  const projectJournalLinks = page.locator(
    '.work-project__notes a[href^="/logs/"]',
  );
  await expect(projectJournalLinks).toHaveCount(PROJECT_POST_COUNT);
  await expect(
    projectJournalLinks.locator(".work-project__note-plate.dither-artwork"),
  ).toHaveCount(PROJECT_POST_COUNT);
  const projectJournalHrefs = await projectJournalLinks.evaluateAll((links) =>
    links.map((link) => link.getAttribute("href")),
  );
  expect(new Set(projectJournalHrefs).size).toBe(PROJECT_POST_COUNT);

  for (const project of WORK_PROJECTS) {
    await expect(
      page.getByRole("heading", { level: 2, name: project.name }),
    ).toBeVisible();
    await expect(
      page.locator(`#work-${project.slug} .work-project__notes a`),
    ).toHaveCount(PROJECT_COUNTS.get(project.slug) ?? 0);
  }

  await expect(page.getByRole("link", { name: /view source/i })).toHaveCount(0);
  const externalProjectLinks = await page.locator(".work-project a").evaluateAll(
    (links) => links
      .map((link) => link.getAttribute("href"))
      .filter((href): href is string => Boolean(href))
      .filter((href) => new URL(href, window.location.href).origin !== window.location.origin),
  );
  expect(externalProjectLinks).toEqual([]);
  await expect(page.locator("body")).not.toContainText("platform-new");

  const dimensions = await page.evaluate(() => ({
    bodyWidth: document.body.scrollWidth,
    viewportWidth: document.documentElement.clientWidth,
  }));
  expect(dimensions.bodyWidth).toBeLessThanOrEqual(dimensions.viewportWidth + 1);
});

test("desktop graph previews transient details and pins a selected date above the page", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name.includes("mobile"), "Desktop graph interaction");
  // This scenario deliberately exercises the full 371-cell graph interaction
  // lifecycle. Keep its budget stable when shader-heavy visual tests run beside it.
  test.setTimeout(120_000);
  await page.setViewportSize({ height: 650, width: 1_440 });
  await seedNotificationPromptMarker(page);
  await page.goto("/");

  await expect(
    page.getByRole("heading", { level: 1, name: "CUMULUS" }),
  ).toBeVisible();
  await expect(
    page.getByRole("group", { name: /6 GitHub contributions across 2 active days/i }),
  ).toBeVisible();

  const primaryCell = page.getByRole("button", {
    name: new RegExp(
      `${PRIMARY_ACTIVITY_LABEL}: 4 contributions; 4 commits, 1 pull request, 1 issue`,
      "i",
    ),
  });
  const secondaryCell = page.getByRole("button", {
    name: new RegExp(
      `${SECONDARY_ACTIVITY_LABEL}: 2 contributions; 2 commits, 0 pull requests, 0 issues`,
      "i",
    ),
  });
  const details = page.locator(".contribution-popover");

  const primaryCellBox = await primaryCell.boundingBox();
  expect(primaryCellBox?.width ?? 0).toBeGreaterThanOrEqual(24);
  expect(primaryCellBox?.height ?? 0).toBeGreaterThanOrEqual(24);

  await primaryCell.hover();
  await expect(details).toHaveAttribute("data-popover-state", "transient");
  await expect(details).toHaveAttribute("data-anchor-date", PRIMARY_ACTIVITY_DATE);
  await expect(
    details.getByRole("heading", { name: PRIMARY_ACTIVITY_LABEL }),
  ).toBeVisible();
  expect(await details.evaluate((element) => element.parentElement === document.body))
    .toBe(true);
  const portalLayerOrder = await details.evaluate((popover) => {
    const header = document.querySelector<HTMLElement>(".site-header");
    return {
      header: Number.parseInt(header ? getComputedStyle(header).zIndex : "0", 10),
      popover: Number.parseInt(getComputedStyle(popover).zIndex, 10),
    };
  });
  expect(portalLayerOrder.popover).toBeGreaterThan(portalLayerOrder.header);
  await expect(details.getByRole("button", { name: "Close activity details" }))
    .toHaveCount(0);
  await expectPopoverDoesNotCoverAnchor(details, PRIMARY_ACTIVITY_DATE);

  await primaryCell.click();
  await expect(details).toHaveAttribute("data-popover-state", "pinned");
  await expect(primaryCell).toHaveAttribute("aria-pressed", "true");
  await expect(
    details.getByRole("link", { name: "Refine the hero activity field" }),
  ).toBeVisible();
  await expect(
    details.getByRole("button", { name: "Close activity details" }),
  ).toBeVisible();
  await expectPopoverDoesNotCoverAnchor(details, PRIMARY_ACTIVITY_DATE);
  await expectNoInternalScroll(details, "Pinned GitHub contribution details");

  await secondaryCell.hover();
  await expect(details).toHaveAttribute("data-anchor-date", PRIMARY_ACTIVITY_DATE);
  await expect(
    details.getByRole("heading", { name: PRIMARY_ACTIVITY_LABEL }),
  ).toBeVisible();

  await page.getByRole("heading", { level: 1, name: "CUMULUS" }).click();
  await expect(primaryCell).toHaveAttribute("aria-pressed", "false");
  await expect(details).toHaveCount(0);

  await secondaryCell.hover();
  await expect(details).toHaveAttribute("data-popover-state", "transient");
  await expect(details).toHaveAttribute("data-anchor-date", SECONDARY_ACTIVITY_DATE);

  await secondaryCell.click();
  await expect(details).toHaveAttribute("data-popover-state", "pinned");
  await page.keyboard.press("Escape");
  await expect(secondaryCell).toHaveAttribute("aria-pressed", "false");
  await expect(details).toHaveCount(0);

  await page.mouse.move(0, 0);
  await primaryCell.focus();
  await primaryCell.press("Enter");
  await expect(details).toHaveAttribute("data-popover-state", "pinned");
  await expect(details).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(details).toHaveCount(0);
  await expect(primaryCell).toBeFocused();

  await primaryCell.hover();
  await expect(details).toHaveAttribute("data-popover-state", "transient");
});

test("responsive graph picker focuses details and returns focus when closed", async ({
  page,
}, testInfo) => {
  test.skip(!testInfo.project.name.includes("mobile"), "Responsive graph interaction");
  await seedNotificationPromptMarker(page);
  await page.goto("/");

  const dayPicker = page.getByLabel("Choose a day");
  const details = page.locator(".contribution-popover");
  await expect(dayPicker).toBeVisible();
  await expect(page.locator(".contribution-frame"))
    .toHaveAttribute("data-picker-mode", "true");
  await expect(page.locator(".contribution-grid"))
    .toHaveAttribute("aria-hidden", "true");
  await expect(page.locator(".contribution-grid button:not([disabled])"))
    .toHaveCount(0);

  await dayPicker.focus();
  await dayPicker.selectOption(PRIMARY_ACTIVITY_DATE);
  await expect(details).toHaveAttribute("data-popover-state", "pinned");
  await expect(details).toHaveAttribute("data-popover-side", "inline");
  await expect(details).not.toHaveAttribute("data-viewport-portal");
  await expect(details).toHaveAttribute("data-anchor-date", PRIMARY_ACTIVITY_DATE);
  await expect(details).toBeFocused();
  await expectNoInternalScroll(details, "Responsive GitHub contribution details");
  await details.getByRole("button", { name: "Close activity details" }).click();
  await expect(details).toHaveCount(0);
  await expect(dayPicker).toBeFocused();

  await dayPicker.selectOption(SECONDARY_ACTIVITY_DATE);
  await expect(details).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(details).toHaveCount(0);
  await expect(dayPicker).toBeFocused();

  const graphFits = await page.locator([
    ".github-panel",
    ".contribution-stage",
    ".contribution-frame",
    ".contribution-surface",
    ".contribution-grid",
  ].join(", ")).evaluateAll((elements) => elements.every((element) => {
    const style = getComputedStyle(element);
    const hasScrollOverflow = [style.overflowX, style.overflowY]
      .some((value) => value === "auto" || value === "scroll");
    return !hasScrollOverflow
      && element.scrollWidth <= element.clientWidth + 1
      && element.scrollHeight <= element.clientHeight + 1;
  }));
  expect(graphFits).toBe(true);
});

test("the first eligible visit opens one accessible notification invitation", async ({
  page,
}) => {
  await page.goto("/logs");

  const dialog = page.getByRole("dialog", { name: "New log notifications" });
  const title = dialog.getByRole("heading", { name: "New log notifications" });
  const close = dialog.getByRole("button", {
    name: "Close notification settings",
  });
  const notNow = dialog.getByRole("button", { name: "Not now" });
  const siteFrame = page.locator(".site-frame");

  await expect(dialog).toBeVisible();
  await expect(title).toBeFocused();
  await expect(siteFrame).toHaveAttribute("inert", "");
  await expect(siteFrame).toHaveAttribute("aria-hidden", "true");
  await expect(page.locator("body")).toHaveCSS("overflow", "hidden");
  await expect.poll(() => page.evaluate(
    (key) => window.localStorage.getItem(key),
    NOTIFICATION_PROMPT_STORAGE_KEY,
  )).toBe("1");

  await notNow.focus();
  await page.keyboard.press("Tab");
  await expect(close).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await expect(notNow).toBeFocused();

  await notNow.click();
  await expect(dialog).toHaveCount(0);
  await expect(siteFrame).not.toHaveAttribute("inert", "");
  await expect(siteFrame).not.toHaveAttribute("aria-hidden", "true");
  await expect(page.locator("body")).not.toHaveCSS("overflow", "hidden");
  await expect(page.locator("#main-content")).toBeFocused();

  await page.reload();
  await expect(
    page.getByRole("heading", { level: 1, name: "Log index" }),
  ).toBeVisible();
  await expect(dialog).toHaveCount(0);

  await openNotificationSettings(page);
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole("textbox", { name: "Email address" }))
    .toBeFocused();
  await expect(notNow).toHaveCount(0);
  await close.click();
  await expect(dialog).toHaveCount(0);
});

test("notification invitation closes for privacy navigation and stays closed on Back", async ({
  page,
}) => {
  const post = publishedPosts[0];
  await page.goto(`/logs/${post.slug}`);

  const dialog = page.getByRole("dialog", { name: "New log notifications" });
  await expect(dialog).toBeVisible();
  await dialog
    .getByRole("link", { name: "notification privacy and data rights" })
    .click();

  await expect(page).toHaveURL(/\/privacy$/);
  await expect(dialog).toHaveCount(0);
  await expect(
    page.getByRole("heading", { level: 1, name: "Notification privacy" }),
  ).toBeVisible();
  await expect(page.locator("#main-content")).toBeFocused();

  await page.goBack();
  await expect(page).toHaveURL(new RegExp(`/logs/${post.slug}$`));
  await expect(
    page.getByRole("heading", { level: 1, name: post.title }),
  ).toBeVisible();
  await expect(dialog).toHaveCount(0);
});

test("privacy and unknown routes never consume the first-visit invitation", async ({
  page,
}) => {
  await page.goto("/privacy");
  await expect(
    page.getByRole("heading", { level: 1, name: "Notification privacy" }),
  ).toBeVisible();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.evaluate(
    (key) => window.localStorage.getItem(key),
    NOTIFICATION_PROMPT_STORAGE_KEY,
  )).resolves.toBeNull();

  await page.goto("/this-route-does-not-exist");
  await expect(
    page.getByRole("heading", { level: 1, name: "This log is not in the field." }),
  ).toBeVisible();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.evaluate(
    (key) => window.localStorage.getItem(key),
    NOTIFICATION_PROMPT_STORAGE_KEY,
  )).resolves.toBeNull();
});

test("manual notification settings recover after a temporary session outage", async ({
  page,
}) => {
  await seedNotificationPromptMarker(page);
  await page.unroute(SESSION_ENDPOINT);

  let sessionRequests = 0;
  let sessionRecovered = false;
  await page.route(SESSION_ENDPOINT, async (route) => {
    sessionRequests += 1;
    if (!sessionRecovered) {
      await route.fulfill({
        contentType: "application/json",
        json: { error: "temporarily_unavailable" },
        status: 503,
      });
      return;
    }

    await route.fulfill({
      contentType: "application/json",
      json: { user: null },
      status: 200,
    });
  });

  await page.goto("/");
  await expect.poll(() => sessionRequests).toBeGreaterThanOrEqual(1);
  await openNotificationSettings(page);

  const dialog = page.getByRole("dialog", { name: "New log notifications" });
  await expect(dialog.getByText(/temporarily unavailable/i)).toBeVisible();
  const requestsBeforeRetry = sessionRequests;
  sessionRecovered = true;
  await dialog.getByRole("button", { name: "Retry" }).click();

  await expect.poll(() => sessionRequests).toBe(requestsBeforeRetry + 1);
  await expect(dialog.getByRole("textbox", { name: "Email address" }))
    .toBeFocused();
  await expect(dialog.getByRole("button", { name: "Retry" })).toHaveCount(0);
});

test("a recognized session can unsubscribe inside the top-right settings dialog", async ({
  page,
}) => {
  await seedNotificationPromptMarker(page);
  await page.unroute(SESSION_ENDPOINT);
  await page.route(SESSION_ENDPOINT, async (route) => {
    await route.fulfill({
      contentType: "application/json",
      json: { user: { email: "reader@example.com" } },
      status: 200,
    });
  });

  let preference: "active" | "unsubscribed" = "active";
  const updates: string[] = [];
  await page.route(PREFERENCES_ENDPOINT, async (route) => {
    if (route.request().method() === "PUT") {
      const body = route.request().postDataJSON() as { status?: unknown };
      if (body.status === "active" || body.status === "unsubscribed") {
        preference = body.status;
        updates.push(body.status);
      }
    }
    await route.fulfill({
      contentType: "application/json",
      json: { ok: true, status: preference },
      status: 200,
    });
  });

  await page.goto("/");
  await openNotificationSettings(page);
  const dialog = page.getByRole("dialog", { name: "New log notifications" });

  await expect(dialog.getByText(/managing notifications for/i)).toContainText(
    "reader@example.com",
  );
  await expect(dialog.getByText("New-post notifications are on")).toBeVisible();
  await dialog.getByRole("button", {
    name: "Unsubscribe from new-post emails",
  }).click();

  await expect.poll(() => updates).toEqual(["unsubscribed"]);
  await expect(
    dialog.getByText("New-post notifications are off", { exact: true }),
  ).toBeVisible();
  await expect(dialog.getByRole("button", { name: "Turn on notifications" }))
    .toBeEnabled();
});

test("every published journal renders lead, section, and related dither surfaces", async ({
  page,
}) => {
  test.setTimeout(180_000);
  await seedNotificationPromptMarker(page);
  await page.emulateMedia({ reducedMotion: "reduce" });

  for (const post of publishedPosts) {
    const response = await page.goto(`/logs/${post.slug}`);
    expect(response?.ok(), post.slug).toBe(true);
    await expect(
      page.getByRole("heading", { level: 1, name: post.title }),
    ).toBeVisible();

    const sections = page.locator(".article-body > section");
    const relatedCards = page.locator('.related-logs__grid > a[href^="/logs/"]');
    await expect(
      page.locator(".article-visual .dither-plate--article[data-dither-seed]"),
    ).toHaveCount(1);
    await expect(sections).toHaveCount(post.body.length);
    await expect(
      sections.locator(".dither-plate--inline.dither-artwork"),
    ).toHaveCount(post.body.length);
    await expect(relatedCards).toHaveCount(3);
    await expect(
      relatedCards.locator(".related-logs__plate.dither-artwork"),
    ).toHaveCount(3);
    await expect(page.getByText("Public links", { exact: true })).toHaveCount(0);
  }
});
