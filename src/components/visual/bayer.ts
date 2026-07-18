/** Canonical 4x4 Bayer threshold field, stored in row-major order. */
export const ORDERED_BAYER_4X4 = [
  0, 8, 2, 10,
  12, 4, 14, 6,
  3, 11, 1, 9,
  15, 7, 13, 5,
] as const;
