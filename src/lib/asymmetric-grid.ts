import type { CSSProperties } from "react";

export interface AsymmetricGridStyle extends CSSProperties {
  "--card-span-desktop": number;
  "--card-span-tablet": number;
}

const PAIR_ROWS = [
  [7, 5],
  [5, 7],
] as const;

const TRIPLE_ROWS = [
  [5, 4, 3],
  [3, 4, 5],
  [4, 5, 3],
] as const;

function normalizedCount(itemCount: number) {
  return Number.isFinite(itemCount) ? Math.max(0, Math.floor(itemCount)) : 0;
}

/**
 * Builds complete 12-column editorial rows for any positive item count.
 * Two- and three-card patterns alternate direction so repetition never leaves
 * an orphaned white cell or turns the mosaic into a rigid checkerboard.
 */
export function createDesktopSpanPlan(itemCount: number): number[] {
  const spans: number[] = [];
  let remaining = normalizedCount(itemCount);
  let rowIndex = 0;

  while (remaining > 0) {
    if (remaining === 1) {
      spans.push(12);
      break;
    }

    // Four and five divide into complete 2+2 and 2+3 rows. Larger sets begin
    // with a three-card row, leaving another complete pair/triple partition.
    const usePair = remaining === 2 || remaining === 4 || remaining === 5;
    const row = usePair
      ? PAIR_ROWS[rowIndex % PAIR_ROWS.length]
      : TRIPLE_ROWS[rowIndex % TRIPLE_ROWS.length];
    spans.push(...row);
    remaining -= row.length;
    rowIndex += 1;
  }

  return spans;
}

export function createTabletSpanPlan(itemCount: number): number[] {
  const count = normalizedCount(itemCount);
  const spans: number[] = [];
  let pairIndex = 0;
  let remaining = count;

  if (remaining % 2 === 1) {
    spans.push(12);
    remaining -= 1;
  }

  while (remaining > 0) {
    spans.push(...PAIR_ROWS[pairIndex % PAIR_ROWS.length]);
    pairIndex += 1;
    remaining -= 2;
  }

  return spans;
}

export function createAsymmetricGridStyles(
  itemCount: number,
): AsymmetricGridStyle[] {
  const desktop = createDesktopSpanPlan(itemCount);
  const tablet = createTabletSpanPlan(itemCount);

  return desktop.map((desktopSpan, index) => ({
    "--card-span-desktop": desktopSpan,
    "--card-span-tablet": tablet[index] ?? 12,
  }));
}
