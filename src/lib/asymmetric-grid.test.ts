import { describe, expect, it } from "vitest";

import {
  createAsymmetricGridStyles,
  createDesktopSpanPlan,
  createTabletSpanPlan,
} from "./asymmetric-grid";

function expectCompleteRows(spans: number[]) {
  let rowTotal = 0;
  for (const span of spans) {
    expect(span).toBeGreaterThan(0);
    expect(span).toBeLessThanOrEqual(12);
    rowTotal += span;
    expect(rowTotal).toBeLessThanOrEqual(12);
    if (rowTotal === 12) rowTotal = 0;
  }
  expect(rowTotal).toBe(0);
}

describe("asymmetric editorial grids", () => {
  it("uses the intended uneven four- and five-card mosaics", () => {
    expect(createDesktopSpanPlan(4)).toEqual([7, 5, 5, 7]);
    expect(createDesktopSpanPlan(5)).toEqual([7, 5, 3, 4, 5]);
    expect(createTabletSpanPlan(5)).toEqual([12, 7, 5, 5, 7]);
  });

  it("creates complete desktop and tablet rows for changing content counts", () => {
    for (let count = 1; count <= 24; count += 1) {
      const desktop = createDesktopSpanPlan(count);
      const tablet = createTabletSpanPlan(count);

      expect(desktop).toHaveLength(count);
      expect(tablet).toHaveLength(count);
      expectCompleteRows(desktop);
      expectCompleteRows(tablet);
    }
  });

  it("maps both responsive plans into typed custom properties", () => {
    expect(createAsymmetricGridStyles(2)).toEqual([
      { "--card-span-desktop": 7, "--card-span-tablet": 7 },
      { "--card-span-desktop": 5, "--card-span-tablet": 5 },
    ]);
    expect(createAsymmetricGridStyles(Number.NaN)).toEqual([]);
  });
});
