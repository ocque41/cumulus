import { expect, test, type Locator, type Page } from "@playwright/test";

import {
  mockAnonymousNotificationSession,
  mockContributions,
  seedNotificationPromptMarker,
} from "./public-test-support";

interface CountAwareGridSnapshot {
  childCount: number;
  declaredCount: number;
  minCardWidthRatio: number;
  rowCount: number;
  rowMaxGaps: number[];
}

async function countAwareGridSnapshots(
  page: Page,
  selector: string,
): Promise<CountAwareGridSnapshot[]> {
  return page.locator(selector).evaluateAll((grids) => grids.map((grid) => {
    const container = grid.getBoundingClientRect();
    const cards = Array.from(grid.children)
      .filter((child): child is HTMLElement => child instanceof HTMLElement)
      .map((card) => {
        const bounds = card.getBoundingClientRect();
        return {
          left: bounds.left,
          right: bounds.right,
          top: bounds.top,
          width: bounds.width,
        };
      })
      .sort((first, second) => first.top - second.top || first.left - second.left);
    const rows: typeof cards[] = [];

    for (const card of cards) {
      const row = rows.find(
        (candidate) => Math.abs((candidate[0]?.top ?? card.top) - card.top) <= 2,
      );
      if (row) {
        row.push(card);
      } else {
        rows.push([card]);
      }
    }

    const rowMaxGaps = rows.map((row) => {
      row.sort((first, second) => first.left - second.left);
      const gaps = [
        (row[0]?.left ?? container.right) - container.left,
        container.right - (row.at(-1)?.right ?? container.left),
      ];

      for (let index = 1; index < row.length; index += 1) {
        gaps.push(row[index].left - row[index - 1].right);
      }

      return Math.max(...gaps);
    });

    return {
      childCount: cards.length,
      declaredCount: Number.parseInt(grid.getAttribute("data-card-count") ?? "-1", 10),
      minCardWidthRatio: cards.length > 0 && container.width > 0
        ? Math.min(...cards.map((card) => card.width / container.width))
        : 0,
      rowCount: rows.length,
      rowMaxGaps,
    };
  }));
}

async function expectCountAwareGridsFillEveryRow(
  page: Page,
  selector: string,
  route: string,
  viewportName: string,
  mobile: boolean,
) {
  const snapshots = await countAwareGridSnapshots(page, selector);
  expect(snapshots.length, `${route} should expose count-aware grids`).toBeGreaterThan(0);

  for (const [index, snapshot] of snapshots.entries()) {
    const context = `${route} ${viewportName} grid ${index + 1}`;
    expect(snapshot.declaredCount, `${context} declared card count`).toBe(
      snapshot.childCount,
    );
    expect(snapshot.childCount, `${context} rendered children`).toBeGreaterThan(0);
    expect(snapshot.rowCount, `${context} rendered rows`).toBeGreaterThan(0);
    for (const [rowIndex, maxGap] of snapshot.rowMaxGaps.entries()) {
      expect(
        maxGap,
        `${context} row ${rowIndex + 1} should not leave an empty grid track`,
      ).toBeLessThanOrEqual(3);
    }
    if (mobile) {
      expect(
        snapshot.minCardWidthRatio,
        `${context} cards should span the mobile grid`,
      ).toBeGreaterThanOrEqual(0.99);
    }
  }
}

async function expectRendererIsVisuallyStatic(
  page: Page,
  renderer: Locator,
  label: string,
) {
  await renderer.scrollIntoViewIfNeeded();
  await expect(renderer).toBeVisible();
  await page.waitForTimeout(750);
  await renderer.screenshot();
  await page.waitForTimeout(250);
  const firstFrame = await renderer.screenshot();
  await page.waitForTimeout(500);
  const secondFrame = await renderer.screenshot();

  expect(secondFrame.equals(firstFrame), `${label} should remain visually static`)
    .toBe(true);
}

async function expectRendererIsVisuallyAnimated(
  page: Page,
  renderer: Locator,
  label: string,
) {
  await renderer.scrollIntoViewIfNeeded();
  await expect(renderer).toBeVisible();
  await page.waitForTimeout(350);
  let previousFrame = await renderer.screenshot();

  for (let attempt = 0; attempt < 4; attempt += 1) {
    await page.waitForTimeout(250);
    const nextFrame = await renderer.screenshot();
    if (!nextFrame.equals(previousFrame)) return;
    previousFrame = nextFrame;
  }

  expect(false, `${label} should change across normal-motion frames`).toBe(true);
}

test.beforeEach(async ({ page }) => {
  await mockContributions(page);
  await mockAnonymousNotificationSession(page);
});

test("count-aware home and work grids fill every row at each responsive width", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name.includes("mobile"), "Controlled responsive viewports");
  test.setTimeout(120_000);
  await seedNotificationPromptMarker(page);
  await page.emulateMedia({ reducedMotion: "reduce" });

  const viewports = [
    { height: 900, mobile: false, name: "desktop", width: 1_440 },
    { height: 1_000, mobile: false, name: "tablet", width: 900 },
    { height: 844, mobile: true, name: "mobile", width: 390 },
  ];
  const surfaces = [
    {
      heading: "CUMULUS",
      route: "/",
      selector: ".post-grid[data-card-count], .field-note-grid[data-card-count]",
    },
    {
      heading: "Public work",
      route: "/work",
      selector: ".work-project__notes > [data-card-count]",
    },
  ];

  for (const viewport of viewports) {
    await page.setViewportSize({ height: viewport.height, width: viewport.width });
    for (const surface of surfaces) {
      await page.goto(surface.route);
      await expect(
        page.getByRole("heading", { level: 1, name: surface.heading }),
      ).toBeVisible();
      await page.evaluate(() => new Promise<void>((resolve) => {
        requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
      }));
      await expectCountAwareGridsFillEveryRow(
        page,
        surface.selector,
        surface.route,
        viewport.name,
        viewport.mobile,
      );
    }
  }
});

test("GFS Neohellenic styles every non-heading typography role", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name.includes("mobile"), "Typography contract is viewport-independent");
  await page.setViewportSize({ height: 900, width: 1_440 });
  await seedNotificationPromptMarker(page);
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1, name: "CUMULUS" }))
    .toBeVisible();
  await page.evaluate(() => document.fonts.ready);

  const typography = await page.evaluate(() => {
    const fontFamily = (selector: string) => {
      const element = document.querySelector<HTMLElement>(selector);
      if (!element) throw new Error(`Missing typography fixture: ${selector}`);
      return getComputedStyle(element).fontFamily;
    };

    return {
      body: fontFamily("body"),
      bodyFontLoaded: document.fonts.check("400 20px 'GFS Neohellenic'"),
      controls: fontFamily(".nav-action"),
      eyebrow: fontFamily(".home-hero .eyebrow"),
      graphTitle: fontFamily(".contribution-heading strong"),
      heading: fontFamily(".home-hero h1"),
      postTitle: fontFamily(".featured-post h3"),
      metadata: fontFamily(".featured-post .post-meta"),
      navigation: fontFamily(".primary-navigation a"),
      nonHeadingFontFailures: Array.from(
        document.querySelectorAll<HTMLElement>("body *"),
      ).flatMap((element) => {
        if (element.closest("h1, h2, h3, h4, h5, h6, .wordmark, svg")) return [];
        const hasDirectText = Array.from(element.childNodes).some(
          (node) => node.nodeType === Node.TEXT_NODE && Boolean(node.textContent?.trim()),
        );
        if (!hasDirectText) return [];
        const style = getComputedStyle(element);
        if (style.display === "none" || style.visibility === "hidden") return [];
        return style.fontFamily.includes("GFS Neohellenic")
          ? []
          : [`${element.tagName.toLowerCase()}.${element.className}: ${style.fontFamily}`];
      }),
      readingCopy: [
        ".home-hero__footer p",
        ".opening-statement__copy > p",
        ".section-intro--split > p",
        ".featured-post__copy > p:not(.eyebrow)",
        ".post-card__body > p",
      ].map(fontFamily),
    };
  });

  expect(typography.body).toContain("GFS Neohellenic");
  expect(typography.bodyFontLoaded).toBe(true);
  expect(typography.nonHeadingFontFailures).toEqual([]);
  for (const family of [
    ...typography.readingCopy,
    typography.eyebrow,
    typography.graphTitle,
    typography.metadata,
    typography.navigation,
    typography.controls,
  ]) {
    expect(family).toContain("GFS Neohellenic");
  }

  expect(typography.heading).toContain("Jacquard 24");
  expect(typography.heading).not.toContain("GFS Neohellenic");
  expect(typography.postTitle).toContain("Jacquard 24");
  expect(typography.postTitle).not.toContain("GFS Neohellenic");
});

test("normal motion visibly animates the hero and independent post dither fields", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name.includes("mobile"), "One browser proves normal motion");
  test.setTimeout(90_000);
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await seedNotificationPromptMarker(page);
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1, name: "CUMULUS" }))
    .toBeVisible();

  const hero = page.locator(".home-hero > [data-slot='home-hero-dither-composition']");
  await expect(hero).toHaveAttribute("data-motion", "active");
  await expect(hero.locator("[data-slot='hero-dither']")).toHaveCount(2);
  await expectRendererIsVisuallyAnimated(page, hero, "Homepage hero dither");

  const postSignals = page.locator(
    ".post-card [data-slot='post-signal-artwork']",
  );
  expect(await postSignals.count()).toBeGreaterThanOrEqual(2);
  const firstSignal = postSignals.nth(0);
  const secondSignal = postSignals.nth(1);
  await firstSignal.scrollIntoViewIfNeeded();

  for (const signal of [firstSignal, secondSignal]) {
    await expect(signal).toHaveAttribute("data-motion", "active");
    await expect(
      signal.locator(":scope > [data-slot='dither-artwork']"),
    ).toHaveAttribute("data-motion", "active");
  }

  const activeSeeds = await postSignals.evaluateAll((signals) => signals
    .filter((signal) => signal.getAttribute("data-motion") === "active")
    .map((signal) => signal.getAttribute("data-dither-seed")));
  expect(activeSeeds.length).toBeGreaterThanOrEqual(2);
  expect(new Set(activeSeeds).size).toBe(activeSeeds.length);
  await expectRendererIsVisuallyAnimated(page, firstSignal, "First post dither");
  await expectRendererIsVisuallyAnimated(page, secondSignal, "Second post dither");
});

test("reduced motion freezes every dither renderer and its visible frames", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name.includes("mobile"), "One browser proves the media contract");
  test.setTimeout(90_000);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await seedNotificationPromptMarker(page);
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1, name: "CUMULUS" }))
    .toBeVisible();

  const hero = page.locator(".home-hero > [data-slot='home-hero-dither-composition']");
  await expect(hero).toHaveAttribute("data-motion", "static");
  const heroFields = hero.locator("[data-slot='hero-dither']");
  await expect(heroFields).toHaveCount(2);
  for (const field of [heroFields.nth(0), heroFields.nth(1)]) {
    await expect(field).toHaveAttribute("data-motion", "static");
    await expect(field).toHaveAttribute("data-renderer", "css");
  }
  await expect(hero.locator("canvas")).toHaveCount(0);
  const fallback = heroFields.nth(0).locator(":scope > [data-slot='hero-dither-fallback']");
  const fallbackVisualState = () => fallback.evaluate((element) =>
    [null, "::before", "::after"].map((pseudoElement) => {
      const style = getComputedStyle(element, pseudoElement);
      return {
        animationName: style.animationName,
        backgroundPosition: style.backgroundPosition,
        opacity: style.opacity,
        transform: style.transform,
      };
    }));
  const firstFallbackState = await fallbackVisualState();
  await page.waitForTimeout(500);
  expect(await fallbackVisualState()).toEqual(firstFallbackState);
  expect(await hero.evaluate((element) => element
    .getAnimations({ subtree: true })
    .filter((animation) => animation.playState === "running").length)).toBe(0);

  const postSignal = page.locator(
    ".post-card [data-slot='post-signal-artwork']",
  ).first();
  await postSignal.scrollIntoViewIfNeeded();
  await expect(postSignal).toHaveAttribute("data-motion", "static");
  await expect(
    postSignal.locator(":scope > [data-slot='dither-artwork']"),
  ).toHaveAttribute("data-motion", "static");
  const ditherCoverage = await postSignal.evaluate((root) => {
    const field = root.querySelector<HTMLElement>(
      ":scope > [data-slot='dither-artwork']",
    );
    const canvas = field?.querySelector<HTMLCanvasElement>(
      ":scope > .dither-artwork__canvas",
    );
    if (!field || !canvas) {
      throw new Error("Post signal is missing its nested dither renderer");
    }

    const rootBounds = root.getBoundingClientRect();
    const fieldBounds = field.getBoundingClientRect();
    const canvasBounds = canvas.getBoundingClientRect();
    return {
      canvasHeightRatio: canvasBounds.height / rootBounds.height,
      canvasWidthRatio: canvasBounds.width / rootBounds.width,
      fieldHeightRatio: fieldBounds.height / rootBounds.height,
      fieldWidthRatio: fieldBounds.width / rootBounds.width,
      hasSize: rootBounds.height > 0
        && rootBounds.width > 0
        && fieldBounds.height > 0
        && fieldBounds.width > 0
        && canvasBounds.height > 0
        && canvasBounds.width > 0,
    };
  });
  expect(ditherCoverage.hasSize).toBe(true);
  expect(ditherCoverage.fieldHeightRatio).toBeGreaterThanOrEqual(0.95);
  expect(ditherCoverage.fieldWidthRatio).toBeGreaterThanOrEqual(0.95);
  expect(ditherCoverage.canvasHeightRatio).toBeGreaterThanOrEqual(0.95);
  expect(ditherCoverage.canvasWidthRatio).toBeGreaterThanOrEqual(0.95);
  await expectRendererIsVisuallyStatic(page, postSignal, "Post signal dither");

  const diagnostics = await page.locator([
    "[data-slot='hero-dither']",
    "[data-slot='post-signal-artwork']",
    "[data-slot='dither-artwork']",
  ].join(", ")).evaluateAll((renderers) => ({
    active: renderers.filter((renderer) => renderer.getAttribute("data-motion") !== "static")
      .length,
    total: renderers.length,
  }));
  expect(diagnostics.total).toBeGreaterThan(0);
  expect(diagnostics.active).toBe(0);
});
