// Cumulus brand tokens — derived from the master spec at
// /Users/miguel/Documents/cumulus/CUMULUS-BRAND.md (v1.0).
//
// Foundation: monochrome ink-on-paper plus a single chromatic moment.
// - --ink (#1A1A1A): the deep cool ground
// - --paper (#F5F5F5): the bright lifted form
// - --terracotta (#A44718): the single accent (≤10% of any composition)
//
// Type system: Plus Jakarta Sans (display) + JetBrains Mono (data partner).
// One unified scale (text-9 through text-72); legacy aliases preserved
// so existing consumers keep compiling — retire as we touch them.
//
// Source of truth (do not edit; see master): src/lib/brand/_source-tokens.jsx.txt
// Visual reference: public/brand/cumulus-brand-document.pdf

export const CUMULUS = {
  color: {
    // Foundation
    ink:        "#1A1A1A",
    paper:      "#F5F5F5",
    terracotta: "#A44718",

    // Ink scale — text/dividers on a paper ground
    ink2:        "rgba(26, 26, 26, 0.64)",  // secondary text
    ink3:        "rgba(26, 26, 26, 0.42)",  // tertiary text, mono meta, kickers
    ink4:        "rgba(26, 26, 26, 0.32)",  // nav numbers, micro labels
    ink5:        "rgba(26, 26, 26, 0.10)",  // disabled glyphs
    inkHair:     "rgba(26, 26, 26, 0.14)",  // default 1px dividers
    inkHairSoft: "rgba(26, 26, 26, 0.08)",  // nested dividers
    inkWash:     "rgba(26, 26, 26, 0.04)",  // wash backgrounds

    // Paper scale — text/dividers on an ink ground
    paper2:        "rgba(245, 245, 245, 0.64)",
    paper3:        "rgba(245, 245, 245, 0.42)",
    paper4:        "rgba(245, 245, 245, 0.32)",
    paper5:        "rgba(245, 245, 245, 0.10)",
    paperHair:     "rgba(245, 245, 245, 0.14)",
    paperHairSoft: "rgba(245, 245, 245, 0.08)",
    paperWash:     "rgba(245, 245, 245, 0.04)",

    // -------------------------------------------------------------
    // Legacy aliases — keep so existing consumers keep compiling.
    // Retire as we touch them; new code should use the foundation.
    // -------------------------------------------------------------
    bg:        "#1A1A1A",
    surface:   "#1A1A1A",
    surface2:  "#1A1A1A",
    border:    "rgba(245, 245, 245, 0.14)",
    border2:   "rgba(245, 245, 245, 0.14)",

    title:     "#F5F5F5",
    body:      "rgba(245, 245, 245, 0.64)",
    sub:       "rgba(245, 245, 245, 0.64)",
    muted:     "rgba(245, 245, 245, 0.42)",
    hairline:  "rgba(245, 245, 245, 0.14)",

    paperBg:    "#F5F5F5",
    paperTitle: "#1A1A1A",
    paperBody:  "rgba(26, 26, 26, 0.64)",
    paperSub:   "rgba(26, 26, 26, 0.64)",
    paperMuted: "rgba(26, 26, 26, 0.42)",
    paperBorder:"rgba(26, 26, 26, 0.14)",

    accent:    "#A44718",
    accentDim: "#A44718",
  },
  font: {
    sans: '"Plus Jakarta Sans", -apple-system, BlinkMacSystemFont, "Inter", system-ui, sans-serif',
    mono: '"JetBrains Mono", "SF Mono", ui-monospace, Menlo, monospace',
  },
  base: 8,
  type: {
    text9:    { size: 9,   line: 9,   weight: 400, tracking: 0.12,                family: "mono" as const },
    text10:   { size: 10,  line: 16,  weight: 400, tracking: 0.20, upper: true,   family: "mono" as const },
    text11:   { size: 11,  line: 15,  weight: 600, tracking: 0.22, upper: true,   family: "mono" as const },
    text12:   { size: 12,  line: 18,  weight: 400, tracking: 0.04,                family: "mono" as const },
    text13:   { size: 13,  line: 18,  weight: 400, tracking: 0.04,                family: "mono" as const },
    text14:   { size: 14,  line: 22,  weight: 400, tracking: 0,                   family: "sans" as const },
    text18:   { size: 18,  line: 23,  weight: 400, tracking: -0.18,               family: "mono" as const },
    text22:   { size: 22,  line: 28,  weight: 500, tracking: -0.22,               family: "sans" as const },
    text40:   { size: 40,  line: 38,  weight: 300, tracking: -1.4,                family: "sans" as const },
    text56:   { size: 56,  line: 50,  weight: 300, tracking: -2.24,               family: "sans" as const },
    text60:   { size: 60,  line: 57,  weight: 300, tracking: -2.1,                family: "sans" as const },
    text72:   { size: 72,  line: 65,  weight: 300, tracking: -2.88,               family: "sans" as const },

    // -------------------------------------------------------------
    // Legacy aliases — retire as consumers are rewritten.
    // Each maps to the closest unified-scale entry (master spec).
    // -------------------------------------------------------------
    micro:     { size: 10,  line: 16,  weight: 400, tracking: 0.20, upper: true,  family: "mono" as const },
    label:     { size: 11,  line: 15,  weight: 600, tracking: 0.22, upper: true,  family: "mono" as const },
    mono:      { size: 13,  line: 18,  weight: 400, tracking: 0.04,               family: "mono" as const },
    monoLg:    { size: 18,  line: 23,  weight: 400, tracking: -0.18,              family: "mono" as const },
    caption:   { size: 12,  line: 18,  weight: 400, tracking: 0.04,               family: "mono" as const },
    body:      { size: 14,  line: 22,  weight: 400, tracking: 0,                  family: "sans" as const },
    bodyLg:    { size: 14,  line: 22,  weight: 400, tracking: 0,                  family: "sans" as const },
    h4:        { size: 22,  line: 28,  weight: 500, tracking: -0.22,              family: "sans" as const },
    h3:        { size: 22,  line: 28,  weight: 500, tracking: -0.22,              family: "sans" as const },
    h2:        { size: 40,  line: 38,  weight: 300, tracking: -1.4,               family: "sans" as const },
    h1:        { size: 60,  line: 57,  weight: 300, tracking: -2.1,               family: "sans" as const },
    display:   { size: 60,  line: 57,  weight: 300, tracking: -2.1,               family: "sans" as const },
    displayXl: { size: 72,  line: 65,  weight: 300, tracking: -2.88,              family: "sans" as const },
  },
} as const;

export type CumulusTypeToken = keyof typeof CUMULUS.type;

export function ct(name: CumulusTypeToken, over: React.CSSProperties = {}): React.CSSProperties {
  const t = CUMULUS.type[name];
  return {
    fontFamily: CUMULUS.font[t.family],
    fontSize: t.size,
    lineHeight: `${t.line}px`,
    fontWeight: t.weight,
    letterSpacing: `${t.tracking}px`,
    textTransform: ("upper" in t && t.upper) ? "uppercase" : "none",
    margin: 0,
    ...over,
  };
}
