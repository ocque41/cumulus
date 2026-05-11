#!/usr/bin/env fontforge
# Run with: /Applications/FontForge.app/Contents/Resources/opt/local/bin/fontforge -script build_full_font.py
#
# Cumulus Sans — full geometric-rounded sans family extrapolated from 5 letters
# traced from the Cumulus logo (C, u, m, l, s).
#
# Design DNA (em = 1000):
#   stem        = 106
#   x-height    = 507
#   cap-height  = 700
#   ascender    = 710
#   descender   = -200
#   round terminals; openings on C/c are wide
#
# Construction primitives:
#   add_pill()       — rounded rectangle (or stem)
#   add_bowl()       — closed annular bowl (O-shape) with hole
#   add_open_bowl()  — single closed contour for C-shapes (parametric)
#   add_arch_top()   — n-shape (open-bottom arch with two stems)
#   add_arch_bottom()— u-shape (open-top arch with two stems)
#   _stroke()        — pill-stroked line segment

import fontforge
import psMat
import os
import math

HERE    = os.path.dirname(os.path.abspath(__file__))
SVG_DIR = os.path.join(HERE, "svg")
OUT_DIR = os.path.join(HERE, "out")

# ============================================================================
# METRICS
# ============================================================================
EM        = 1000
STEM      = 106
HALF_STEM = STEM / 2.0
CAP_H     = 700
X_H       = 507
ASC       = 710
DSC       = -200
OVERSHOOT = 8
SIDE_BEAR = 50
NARROW_SB = 30
WIDE_SB   = 60

BOWL_W_LC = 493     # measured u outer width
BOWL_W_UC = 654     # measured C outer width

OS2_ASC   = 800
OS2_DSC   = 200

KAPPA     = 0.5522847498


# ============================================================================
# PRIMITIVES
# ============================================================================
def add_rect(pen, x, y, w, h):
    pen.moveTo((x, y))
    pen.lineTo((x + w, y))
    pen.lineTo((x + w, y + h))
    pen.lineTo((x, y + h))
    pen.closePath()


def add_round_rect(pen, x, y, w, h, r):
    if r > w / 2: r = w / 2
    if r > h / 2: r = h / 2
    k = r * KAPPA
    pen.moveTo((x + r, y))
    pen.lineTo((x + w - r, y))
    pen.curveTo((x + w - r + k, y), (x + w, y + r - k), (x + w, y + r))
    pen.lineTo((x + w, y + h - r))
    pen.curveTo((x + w, y + h - r + k), (x + w - r + k, y + h), (x + w - r, y + h))
    pen.lineTo((x + r, y + h))
    pen.curveTo((x + r - k, y + h), (x, y + h - r + k), (x, y + h - r))
    pen.lineTo((x, y + r))
    pen.curveTo((x, y + r - k), (x + r - k, y), (x + r, y))
    pen.closePath()


def add_pill(pen, x, y, w, h):
    add_round_rect(pen, x, y, w, h, min(w, h) / 2.0)


def add_circle(pen, cx, cy, r):
    k = r * KAPPA
    pen.moveTo((cx - r, cy))
    pen.curveTo((cx - r, cy + k), (cx - k, cy + r), (cx, cy + r))
    pen.curveTo((cx + k, cy + r), (cx + r, cy + k), (cx + r, cy))
    pen.curveTo((cx + r, cy - k), (cx + k, cy - r), (cx, cy - r))
    pen.curveTo((cx - k, cy - r), (cx - r, cy - k), (cx - r, cy))
    pen.closePath()


def _arc_cubic(pen, cx, cy, rx, ry, a1, a2, move_first=False):
    """Approximate elliptical arc with cubic beziers (split at π/2)."""
    span = a2 - a1
    n = max(1, int(math.ceil(abs(span) / (math.pi / 2))))
    da = span / n
    if move_first:
        pen.moveTo((cx + rx * math.cos(a1), cy + ry * math.sin(a1)))
    for i in range(n):
        b1 = a1 + i * da
        b2 = a1 + (i + 1) * da
        alpha = (4.0 / 3.0) * math.tan((b2 - b1) / 4.0)
        x1, y1 = cx + rx * math.cos(b1), cy + ry * math.sin(b1)
        x2, y2 = cx + rx * math.cos(b2), cy + ry * math.sin(b2)
        c1x = x1 - alpha * rx * math.sin(b1)
        c1y = y1 + alpha * ry * math.cos(b1)
        c2x = x2 + alpha * rx * math.sin(b2)
        c2y = y2 - alpha * ry * math.cos(b2)
        pen.curveTo((c1x, c1y), (c2x, c2y), (x2, y2))


def add_bowl(glyph, x, y, w, h, stem=STEM):
    """Closed bowl (O-shape) — outer CCW + inner CW hole."""
    pen = glyph.glyphPen(replace=False)
    add_pill(pen, x, y, w, h)
    pen = None
    iw = w - 2 * stem
    ih = h - 2 * stem
    if iw <= 0 or ih <= 0:
        return
    pen2 = glyph.glyphPen(replace=False)
    ix, iy = x + stem, y + stem
    ir = min(iw, ih) / 2.0
    k = ir * KAPPA
    # CW hole (right→bottom→left→top→close)
    pen2.moveTo((ix + iw - ir, iy))
    pen2.lineTo((ix + ir, iy))
    pen2.curveTo((ix + ir - k, iy), (ix, iy + ir - k), (ix, iy + ir))
    pen2.lineTo((ix, iy + ih - ir))
    pen2.curveTo((ix, iy + ih - ir + k), (ix + ir - k, iy + ih), (ix + ir, iy + ih))
    pen2.lineTo((ix + iw - ir, iy + ih))
    pen2.curveTo((ix + iw - ir + k, iy + ih), (ix + iw, iy + ih - ir + k), (ix + iw, iy + ih - ir))
    pen2.lineTo((ix + iw, iy + ir))
    pen2.curveTo((ix + iw, iy + ir - k), (ix + iw - ir + k, iy), (ix + iw - ir, iy))
    pen2.closePath()
    pen2 = None


def add_open_bowl(glyph, cx, cy, rx, ry, stem, gap_half_angle, gap_rotation=0.0):
    """Single CCW contour: a C-shape. Opening centered on +x rotated by
    gap_rotation radians (CCW)."""
    rxi = rx - stem
    ryi = ry - stem
    pen = glyph.glyphPen(replace=False)
    a_outer_start = gap_rotation + gap_half_angle
    a_outer_end   = gap_rotation + 2 * math.pi - gap_half_angle
    # Outer CCW
    _arc_cubic(pen, cx, cy, rx, ry, a_outer_start, a_outer_end, move_first=True)
    # Cap radial across stem
    pen.lineTo((cx + rxi * math.cos(a_outer_end), cy + ryi * math.sin(a_outer_end)))
    # Inner CW
    _arc_cubic(pen, cx, cy, rxi, ryi, a_outer_end, a_outer_start, move_first=False)
    pen.closePath()
    pen = None


def add_arch_top(glyph, x, y, w, h, stem=STEM):
    """n-shape (open-bottom arch)."""
    pen = glyph.glyphPen(replace=False)
    r_o = w / 2.0
    r_i = r_o - stem
    cx = x + r_o
    cy = y + h - r_o
    k_o = r_o * KAPPA
    k_i = r_i * KAPPA
    pen.moveTo((x, y))
    pen.lineTo((x, cy))
    pen.curveTo((x, cy + k_o), (cx - k_o, y + h), (cx, y + h))
    pen.curveTo((cx + k_o, y + h), (x + w, cy + k_o), (x + w, cy))
    pen.lineTo((x + w, y))
    pen.lineTo((x + w - stem, y))
    pen.lineTo((x + w - stem, cy))
    pen.curveTo((x + w - stem, cy + k_i), (cx + k_i, y + h - stem), (cx, y + h - stem))
    pen.curveTo((cx - k_i, y + h - stem), (x + stem, cy + k_i), (x + stem, cy))
    pen.lineTo((x + stem, y))
    pen.closePath()
    pen = None


def add_arch_bottom(glyph, x, y, w, h, stem=STEM):
    """u-shape (open-top arch)."""
    pen = glyph.glyphPen(replace=False)
    r_o = w / 2.0
    r_i = r_o - stem
    cx = x + r_o
    cy = y + r_o
    k_o = r_o * KAPPA
    k_i = r_i * KAPPA
    pen.moveTo((x, y + h))
    pen.lineTo((x, cy))
    pen.curveTo((x, cy - k_o), (cx - k_o, y), (cx, y))
    pen.curveTo((cx + k_o, y), (x + w, cy - k_o), (x + w, cy))
    pen.lineTo((x + w, y + h))
    pen.lineTo((x + w - stem, y + h))
    pen.lineTo((x + w - stem, cy))
    pen.curveTo((x + w - stem, cy - k_i), (cx + k_i, y + stem), (cx, y + stem))
    pen.curveTo((cx - k_i, y + stem), (x + stem, cy - k_i), (x + stem, cy))
    pen.lineTo((x + stem, y + h))
    pen.closePath()
    pen = None


def _stroke(pen, x1, y1, x2, y2, w=STEM, cap="round", extend=0.0):
    """Stroked line segment from (x1,y1) to (x2,y2) with width w.
    cap: 'round' (semicircular caps) or 'flat' (rectangular ends).
    extend: extra length added at each end (useful for forcing overlap)."""
    dx = x2 - x1
    dy = y2 - y1
    L = math.hypot(dx, dy)
    if L == 0:
        return
    tx, ty = dx / L, dy / L
    nx, ny = -ty, tx
    hw = w / 2.0
    # Extended endpoints
    x1e, y1e = x1 - tx * extend, y1 - ty * extend
    x2e, y2e = x2 + tx * extend, y2 + ty * extend
    p1 = (x1e + nx * hw, y1e + ny * hw)
    p2 = (x2e + nx * hw, y2e + ny * hw)
    p3 = (x2e - nx * hw, y2e - ny * hw)
    p4 = (x1e - nx * hw, y1e - ny * hw)
    if cap == "flat":
        pen.moveTo(p1)
        pen.lineTo(p2)
        pen.lineTo(p3)
        pen.lineTo(p4)
        pen.closePath()
    else:
        k = hw * KAPPA
        pen.moveTo(p1)
        pen.lineTo(p2)
        pen.curveTo((p2[0] + tx * k, p2[1] + ty * k),
                    (p3[0] + tx * k, p3[1] + ty * k),
                    p3)
        pen.lineTo(p4)
        pen.curveTo((p4[0] - tx * k, p4[1] - ty * k),
                    (p1[0] - tx * k, p1[1] - ty * k),
                    p1)
        pen.closePath()


# ============================================================================
# IMPORT TRACED ORIGINALS
# ============================================================================
def import_traced_glyph(font, name, codepoint, svg_name, target_height,
                        x_offset=0, y_offset=0):
    glyph = font.createChar(codepoint, name)
    glyph.importOutlines(os.path.join(SVG_DIR, svg_name))
    xmin, ymin, xmax, ymax = glyph.boundingBox()
    glyph.transform(psMat.translate(-xmin, -ymin))
    xmin, ymin, xmax, ymax = glyph.boundingBox()
    s = target_height / (ymax - ymin)
    glyph.transform(psMat.scale(s, s))
    if x_offset or y_offset:
        glyph.transform(psMat.translate(x_offset, y_offset))
    return glyph


def clone_traced(font, name, codepoint, svg_name, target_height, y_offset=0):
    """Reuse a traced SVG (e.g., uppercase C → lowercase c at smaller height)."""
    return import_traced_glyph(font, name, codepoint, svg_name, target_height,
                               y_offset=y_offset)


# ============================================================================
# LOWERCASE BUILDERS
# ============================================================================
def build_o(g):
    add_bowl(g, 0, -OVERSHOOT, BOWL_W_LC, X_H + 2 * OVERSHOOT)


def build_n(g):
    add_arch_top(g, 0, 0, BOWL_W_LC, X_H)


def build_h(g):
    pen = g.glyphPen(replace=False)
    add_pill(pen, 0, 0, STEM, ASC)
    pen = None
    add_arch_top(g, 0, 0, BOWL_W_LC, X_H)


def build_b(g):
    pen = g.glyphPen(replace=False)
    add_pill(pen, 0, 0, STEM, ASC)
    pen = None
    add_bowl(g, 0, -OVERSHOOT, BOWL_W_LC, X_H + 2 * OVERSHOOT)


def build_d(g):
    add_bowl(g, 0, -OVERSHOOT, BOWL_W_LC, X_H + 2 * OVERSHOOT)
    pen = g.glyphPen(replace=False)
    add_pill(pen, BOWL_W_LC - STEM, 0, STEM, ASC)
    pen = None


def build_p(g):
    add_bowl(g, 0, -OVERSHOOT, BOWL_W_LC, X_H + 2 * OVERSHOOT)
    pen = g.glyphPen(replace=False)
    add_pill(pen, 0, DSC, STEM, X_H - DSC)
    pen = None


def build_q(g):
    add_bowl(g, 0, -OVERSHOOT, BOWL_W_LC, X_H + 2 * OVERSHOOT)
    pen = g.glyphPen(replace=False)
    add_pill(pen, BOWL_W_LC - STEM, DSC, STEM, X_H - DSC)
    pen = None


def build_a(g):
    """Round single-story 'a' (Futura-style)."""
    add_bowl(g, 0, -OVERSHOOT, BOWL_W_LC, X_H + 2 * OVERSHOOT)
    pen = g.glyphPen(replace=False)
    add_pill(pen, BOWL_W_LC - STEM, 0, STEM, X_H)
    pen = None


def build_e(g):
    """Lowercase e: open-bowl + horizontal crossbar."""
    cx = BOWL_W_LC / 2
    cy = X_H / 2
    rx = BOWL_W_LC / 2
    ry = X_H / 2 + OVERSHOOT
    # Opening on lower-right at angle ~-20°
    add_open_bowl(g, cx, cy, rx, ry, STEM,
                  gap_half_angle=math.radians(20),
                  gap_rotation=math.radians(-20))
    # Crossbar (CCW solid bar across the middle)
    pen = g.glyphPen(replace=False)
    bar_h = STEM * 0.85
    bar_y = cy - bar_h / 2
    add_rect(pen, STEM - 2, bar_y, BOWL_W_LC - 2 * STEM + 4, bar_h)
    pen = None


def build_g(g):
    """Single-story g — bowl + right descender stem + curved hook bottom."""
    add_bowl(g, 0, -OVERSHOOT, BOWL_W_LC, X_H + 2 * OVERSHOOT)
    # Right stem extending all the way down (overlaps the hook)
    pen = g.glyphPen(replace=False)
    add_pill(pen, BOWL_W_LC - STEM, DSC, STEM, X_H - DSC)
    pen = None
    # Hook: a wide pill at bottom of descender, extending leftward
    pen2 = g.glyphPen(replace=False)
    add_pill(pen2, BOWL_W_LC * 0.20, DSC, BOWL_W_LC * 0.80, STEM)
    pen2 = None


def build_i(g):
    pen = g.glyphPen(replace=False)
    add_pill(pen, 0, 0, STEM, X_H)
    pen = None
    pen2 = g.glyphPen(replace=False)
    add_circle(pen2, STEM / 2, X_H + STEM, STEM / 2)
    pen2 = None


def build_j(g):
    """j: half-ring hook descender + tall right stem + dot above."""
    w = STEM * 2.6
    rx = w / 2
    ry = w / 2
    cy = DSC + ry
    add_open_bowl(g, w / 2, cy, rx, ry, STEM,
                  gap_half_angle=math.radians(90),
                  gap_rotation=math.radians(90))
    # Right stem from above hook center up to x-height
    pen = g.glyphPen(replace=False)
    add_pill(pen, w - STEM, cy, STEM, X_H - cy)
    pen = None
    # Dot above
    pen2 = g.glyphPen(replace=False)
    add_circle(pen2, w - STEM / 2, X_H + STEM, STEM / 2)
    pen2 = None


def build_k(g):
    """k: ascender stem + two diagonal arms meeting at mid-stem.
    Adds a square junction-patch to guarantee a solid join."""
    pen = g.glyphPen(replace=False)
    add_pill(pen, 0, 0, STEM, ASC)
    pen = None
    arm_w = X_H * 0.75
    # Junction patch: square at the meeting point, sized to fully cover stem+stroke join
    pen_j = g.glyphPen(replace=False)
    add_rect(pen_j, 0, X_H * 0.5 - STEM * 0.7, STEM * 1.4, STEM * 1.4)
    pen_j = None
    # Diagonals start at the stem's right edge, extending well beyond
    pen2 = g.glyphPen(replace=False)
    _stroke(pen2, STEM, X_H * 0.5, STEM + arm_w, X_H,
            cap="flat", extend=STEM * 0.6)
    pen2 = None
    pen3 = g.glyphPen(replace=False)
    _stroke(pen3, STEM, X_H * 0.5, STEM + arm_w, 0,
            cap="flat", extend=STEM * 0.6)
    pen3 = None


def build_f(g):
    """f: ascender stem with hook on top + crossbar at x-height."""
    # Stem from baseline up to where hook begins
    pen = g.glyphPen(replace=False)
    add_pill(pen, STEM * 0.5, 0, STEM, ASC)
    pen = None
    # Top hook: a horizontal pill extending right at the top
    pen2 = g.glyphPen(replace=False)
    add_pill(pen2, STEM * 0.5, ASC - STEM, STEM * 2.2, STEM)
    pen2 = None
    # Crossbar at x-height
    pen3 = g.glyphPen(replace=False)
    add_rect(pen3, 0, X_H - STEM * 0.42, STEM * 2.5, STEM * 0.85)
    pen3 = None


def build_t(g):
    pen = g.glyphPen(replace=False)
    add_pill(pen, STEM * 0.7, 0, STEM, ASC * 0.78)
    pen = None
    pen2 = g.glyphPen(replace=False)
    add_rect(pen2, 0, X_H - STEM / 2, STEM * 2.5, STEM * 0.85)
    pen2 = None


def build_r(g):
    """r: stem + half-ring hook on top (opens DOWN)."""
    pen = g.glyphPen(replace=False)
    add_pill(pen, 0, 0, STEM, X_H)
    pen = None
    aw = BOWL_W_LC * 0.55
    # Half-ring opening downward, attached to top of stem
    rx = aw / 2
    ry = STEM * 1.3  # short ring
    cx = aw / 2
    cy = X_H - ry
    add_open_bowl(g, cx, cy, rx, ry, STEM,
                  gap_half_angle=math.radians(90),
                  gap_rotation=math.radians(-90))


def build_v(g):
    w = BOWL_W_LC * 0.92
    pen = g.glyphPen(replace=False)
    _stroke(pen, 0, X_H, w / 2, 0, cap="flat", extend=STEM * 0.4)
    pen = None
    pen2 = g.glyphPen(replace=False)
    _stroke(pen2, w, X_H, w / 2, 0, cap="flat", extend=STEM * 0.4)
    pen2 = None


def build_w(g):
    w = BOWL_W_LC * 1.5
    pen = g.glyphPen(replace=False)
    _stroke(pen, 0, X_H, w * 0.25, 0, cap="flat", extend=STEM * 0.4)
    pen = None
    pen2 = g.glyphPen(replace=False)
    _stroke(pen2, w * 0.5, X_H, w * 0.25, 0, cap="flat", extend=STEM * 0.4)
    pen2 = None
    pen3 = g.glyphPen(replace=False)
    _stroke(pen3, w * 0.5, X_H, w * 0.75, 0, cap="flat", extend=STEM * 0.4)
    pen3 = None
    pen4 = g.glyphPen(replace=False)
    _stroke(pen4, w, X_H, w * 0.75, 0, cap="flat", extend=STEM * 0.4)
    pen4 = None


def build_x(g):
    w = BOWL_W_LC * 0.92
    pen = g.glyphPen(replace=False)
    _stroke(pen, 0, 0, w, X_H, cap="flat", extend=STEM * 0.4)
    pen = None
    pen2 = g.glyphPen(replace=False)
    _stroke(pen2, 0, X_H, w, 0, cap="flat", extend=STEM * 0.4)
    pen2 = None


def build_y(g):
    w = BOWL_W_LC * 0.92
    pen = g.glyphPen(replace=False)
    _stroke(pen, 0, X_H, w / 2, 0, cap="flat", extend=STEM * 0.4)
    pen = None
    pen2 = g.glyphPen(replace=False)
    _stroke(pen2, w, X_H, w * 0.15, DSC, cap="flat", extend=STEM * 0.4)
    pen2 = None


def build_z(g):
    w = BOWL_W_LC * 0.85
    pen = g.glyphPen(replace=False)
    add_rect(pen, 0, X_H - STEM, w, STEM)
    pen = None
    pen2 = g.glyphPen(replace=False)
    add_rect(pen2, 0, 0, w, STEM)
    pen2 = None
    pen3 = g.glyphPen(replace=False)
    _stroke(pen3, w, X_H - STEM, 0, STEM, cap="flat", extend=STEM * 0.4)
    pen3 = None


# ============================================================================
# UPPERCASE BUILDERS
# ============================================================================
def build_O_cap(g):
    add_bowl(g, 0, -OVERSHOOT, BOWL_W_UC, CAP_H + 2 * OVERSHOOT)


def build_A(g):
    w = BOWL_W_UC
    # Two diagonals meeting at apex with flat caps and small overlap
    pen = g.glyphPen(replace=False)
    _stroke(pen, 0, 0, w / 2, CAP_H, cap="flat", extend=STEM * 0.4)
    pen = None
    pen2 = g.glyphPen(replace=False)
    _stroke(pen2, w, 0, w / 2, CAP_H, cap="flat", extend=STEM * 0.4)
    pen2 = None
    # Crossbar overlapping both diagonals
    pen3 = g.glyphPen(replace=False)
    add_rect(pen3, 0, CAP_H * 0.40, w, STEM * 0.85)
    pen3 = None


def build_B(g):
    w = BOWL_W_UC * 0.85
    pen = g.glyphPen(replace=False)
    add_pill(pen, 0, 0, STEM, CAP_H)
    pen = None
    add_bowl(g, 0, CAP_H * 0.50, w, CAP_H * 0.50 + OVERSHOOT)
    add_bowl(g, 0, -OVERSHOOT, w, CAP_H * 0.50 + OVERSHOOT)


def build_D(g):
    w = BOWL_W_UC
    add_bowl(g, 0, -OVERSHOOT, w, CAP_H + 2 * OVERSHOOT)
    pen = g.glyphPen(replace=False)
    add_rect(pen, 0, 0, STEM, CAP_H)
    pen = None


def build_E(g):
    w = BOWL_W_UC * 0.78
    pen = g.glyphPen(replace=False)
    add_pill(pen, 0, 0, STEM, CAP_H)
    pen = None
    pen2 = g.glyphPen(replace=False)
    add_rect(pen2, 0, CAP_H - STEM, w, STEM)
    pen2 = None
    pen3 = g.glyphPen(replace=False)
    add_rect(pen3, 0, 0, w, STEM)
    pen3 = None
    pen4 = g.glyphPen(replace=False)
    add_rect(pen4, 0, CAP_H / 2 - STEM / 2 * 0.85, w * 0.85, STEM * 0.85)
    pen4 = None


def build_F(g):
    w = BOWL_W_UC * 0.78
    pen = g.glyphPen(replace=False)
    add_pill(pen, 0, 0, STEM, CAP_H)
    pen = None
    pen2 = g.glyphPen(replace=False)
    add_rect(pen2, 0, CAP_H - STEM, w, STEM)
    pen2 = None
    pen3 = g.glyphPen(replace=False)
    add_rect(pen3, 0, CAP_H / 2 - STEM / 2 * 0.85, w * 0.85, STEM * 0.85)
    pen3 = None


def build_G(g):
    """G: open bowl like C + horizontal bar at middle-right."""
    w = BOWL_W_UC
    cx = w / 2
    cy = CAP_H / 2
    add_open_bowl(g, cx, cy, w / 2, CAP_H / 2 + OVERSHOOT, STEM,
                  gap_half_angle=math.radians(35))
    # Crossbar (small horizontal nub inside the opening, on the right)
    pen = g.glyphPen(replace=False)
    bar_w = w * 0.32
    bar_y = cy - STEM * 0.42
    add_rect(pen, w * 0.55, bar_y, bar_w, STEM * 0.85)
    pen = None
    # Vertical stub from bar going up to inner top edge of opening
    pen2 = g.glyphPen(replace=False)
    stub_x = w - STEM
    add_rect(pen2, stub_x, bar_y, STEM, CAP_H * 0.18)
    pen2 = None


def build_H(g):
    w = BOWL_W_UC * 0.92
    pen = g.glyphPen(replace=False)
    add_pill(pen, 0, 0, STEM, CAP_H)
    pen = None
    pen2 = g.glyphPen(replace=False)
    add_pill(pen2, w - STEM, 0, STEM, CAP_H)
    pen2 = None
    pen3 = g.glyphPen(replace=False)
    add_rect(pen3, 0, CAP_H / 2 - STEM / 2, w, STEM)
    pen3 = None


def build_I(g):
    pen = g.glyphPen(replace=False)
    add_pill(pen, 0, 0, STEM, CAP_H)
    pen = None


def build_J(g):
    """J: half-ring hook (opening up) + tall right stem."""
    w = BOWL_W_UC * 0.62
    rx = w / 2
    ry = w / 2  # circular hook
    # Half-ring: opens upward (gap_rotation = π/2, gap fills entire upper half)
    add_open_bowl(g, w / 2, ry, rx, ry, STEM,
                  gap_half_angle=math.radians(90),
                  gap_rotation=math.radians(90))
    # Tall right stem from above hook center up to cap-height
    pen = g.glyphPen(replace=False)
    add_pill(pen, w - STEM, ry, STEM, CAP_H - ry)
    pen = None


def build_K(g):
    w = BOWL_W_UC * 0.85
    pen = g.glyphPen(replace=False)
    add_pill(pen, 0, 0, STEM, CAP_H)
    pen = None
    # Junction patch
    pen_j = g.glyphPen(replace=False)
    add_rect(pen_j, 0, CAP_H / 2 - STEM * 0.7, STEM * 1.4, STEM * 1.4)
    pen_j = None
    pen2 = g.glyphPen(replace=False)
    _stroke(pen2, STEM, CAP_H / 2, w, CAP_H, cap="flat", extend=STEM * 0.6)
    pen2 = None
    pen3 = g.glyphPen(replace=False)
    _stroke(pen3, STEM, CAP_H / 2, w, 0, cap="flat", extend=STEM * 0.6)
    pen3 = None


def build_L(g):
    w = BOWL_W_UC * 0.72
    pen = g.glyphPen(replace=False)
    add_pill(pen, 0, 0, STEM, CAP_H)
    pen = None
    pen2 = g.glyphPen(replace=False)
    add_rect(pen2, 0, 0, w, STEM)
    pen2 = None


def build_M(g):
    w = BOWL_W_UC * 1.18
    pen = g.glyphPen(replace=False)
    add_pill(pen, 0, 0, STEM, CAP_H)
    pen = None
    pen2 = g.glyphPen(replace=False)
    add_pill(pen2, w - STEM, 0, STEM, CAP_H)
    pen2 = None
    pen3 = g.glyphPen(replace=False)
    _stroke(pen3, STEM / 2, CAP_H, w / 2, CAP_H * 0.30, cap="flat", extend=STEM * 0.4)
    pen3 = None
    pen4 = g.glyphPen(replace=False)
    _stroke(pen4, w - STEM / 2, CAP_H, w / 2, CAP_H * 0.30, cap="flat", extend=STEM * 0.4)
    pen4 = None


def build_N(g):
    w = BOWL_W_UC * 0.95
    pen = g.glyphPen(replace=False)
    add_pill(pen, 0, 0, STEM, CAP_H)
    pen = None
    pen2 = g.glyphPen(replace=False)
    add_pill(pen2, w - STEM, 0, STEM, CAP_H)
    pen2 = None
    pen3 = g.glyphPen(replace=False)
    _stroke(pen3, STEM / 2, CAP_H, w - STEM / 2, 0, cap="flat", extend=STEM * 0.4)
    pen3 = None


def build_P(g):
    w = BOWL_W_UC * 0.85
    pen = g.glyphPen(replace=False)
    add_pill(pen, 0, 0, STEM, CAP_H)
    pen = None
    add_bowl(g, 0, CAP_H * 0.45, w, CAP_H * 0.55)


def build_Q(g):
    w = BOWL_W_UC
    add_bowl(g, 0, -OVERSHOOT, w, CAP_H + 2 * OVERSHOOT)
    # Tail: extend INTO the bowl on the upper end and well past the bottom-right
    pen = g.glyphPen(replace=False)
    _stroke(pen, w * 0.45, CAP_H * 0.30, w * 1.05, -CAP_H * 0.08,
            cap="flat", extend=STEM * 0.4)
    pen = None


def build_R(g):
    w = BOWL_W_UC * 0.85
    pen = g.glyphPen(replace=False)
    add_pill(pen, 0, 0, STEM, CAP_H)
    pen = None
    add_bowl(g, 0, CAP_H * 0.45, w * 0.95, CAP_H * 0.55)
    # Leg: from inside-bowl junction down to bottom-right, extending into both
    pen2 = g.glyphPen(replace=False)
    _stroke(pen2, STEM, CAP_H * 0.45, w, 0, cap="flat", extend=STEM * 0.4)
    pen2 = None


def build_T(g):
    w = BOWL_W_UC * 0.95
    pen = g.glyphPen(replace=False)
    add_pill(pen, w / 2 - STEM / 2, 0, STEM, CAP_H - STEM)
    pen = None
    pen2 = g.glyphPen(replace=False)
    add_rect(pen2, 0, CAP_H - STEM, w, STEM)
    pen2 = None


def build_U(g):
    w = BOWL_W_UC * 0.95
    add_arch_bottom(g, 0, 0, w, CAP_H)


def build_V(g):
    w = BOWL_W_UC
    pen = g.glyphPen(replace=False)
    _stroke(pen, 0, CAP_H, w / 2, 0, cap="flat", extend=STEM * 0.4)
    pen = None
    pen2 = g.glyphPen(replace=False)
    _stroke(pen2, w, CAP_H, w / 2, 0, cap="flat", extend=STEM * 0.4)
    pen2 = None


def build_W(g):
    w = BOWL_W_UC * 1.55
    pen = g.glyphPen(replace=False)
    _stroke(pen, 0, CAP_H, w * 0.25, 0, cap="flat", extend=STEM * 0.4)
    pen = None
    pen2 = g.glyphPen(replace=False)
    _stroke(pen2, w * 0.5, CAP_H, w * 0.25, 0, cap="flat", extend=STEM * 0.4)
    pen2 = None
    pen3 = g.glyphPen(replace=False)
    _stroke(pen3, w * 0.5, CAP_H, w * 0.75, 0, cap="flat", extend=STEM * 0.4)
    pen3 = None
    pen4 = g.glyphPen(replace=False)
    _stroke(pen4, w, CAP_H, w * 0.75, 0, cap="flat", extend=STEM * 0.4)
    pen4 = None


def build_X(g):
    w = BOWL_W_UC * 0.95
    pen = g.glyphPen(replace=False)
    _stroke(pen, 0, 0, w, CAP_H, cap="flat", extend=STEM * 0.4)
    pen = None
    pen2 = g.glyphPen(replace=False)
    _stroke(pen2, 0, CAP_H, w, 0, cap="flat", extend=STEM * 0.4)
    pen2 = None


def build_Y(g):
    w = BOWL_W_UC
    pen = g.glyphPen(replace=False)
    _stroke(pen, 0, CAP_H, w / 2, CAP_H * 0.45, cap="flat", extend=STEM * 0.4)
    pen = None
    pen2 = g.glyphPen(replace=False)
    _stroke(pen2, w, CAP_H, w / 2, CAP_H * 0.45, cap="flat", extend=STEM * 0.4)
    pen2 = None
    pen3 = g.glyphPen(replace=False)
    add_pill(pen3, w / 2 - STEM / 2, 0, STEM, CAP_H * 0.5)
    pen3 = None


def build_Z(g):
    w = BOWL_W_UC * 0.92
    pen = g.glyphPen(replace=False)
    add_rect(pen, 0, CAP_H - STEM, w, STEM)
    pen = None
    pen2 = g.glyphPen(replace=False)
    add_rect(pen2, 0, 0, w, STEM)
    pen2 = None
    pen3 = g.glyphPen(replace=False)
    _stroke(pen3, w, CAP_H - STEM, 0, STEM, cap="flat", extend=STEM * 0.4)
    pen3 = None


# ============================================================================
# DIGIT BUILDERS
# ============================================================================
def build_0(g):
    add_bowl(g, 0, -OVERSHOOT, BOWL_W_UC * 0.85, CAP_H + 2 * OVERSHOOT)


def build_1(g):
    w = STEM * 2.8
    pen = g.glyphPen(replace=False)
    add_pill(pen, w / 2 - STEM / 2, 0, STEM, CAP_H)
    pen = None
    pen2 = g.glyphPen(replace=False)
    _stroke(pen2, w / 2 + STEM / 2, CAP_H * 0.80, 0, CAP_H * 0.60,
            cap="flat", extend=STEM * 0.4)
    pen2 = None
    pen3 = g.glyphPen(replace=False)
    add_rect(pen3, 0, 0, w, STEM)
    pen3 = None


def build_2(g):
    """2: top open-bowl (opens lower-right) + diagonal + bottom bar."""
    w = BOWL_W_UC * 0.80
    cy_top = CAP_H * 0.72
    rx = w / 2
    ry = CAP_H * 0.28
    add_open_bowl(g, w / 2, cy_top, rx, ry, STEM,
                  gap_half_angle=math.radians(35),
                  gap_rotation=math.radians(-50))
    # Diagonal from inside the bowl opening down to baseline
    pen = g.glyphPen(replace=False)
    _stroke(pen, w * 0.78, CAP_H * 0.40, STEM, STEM,
            cap="flat", extend=STEM * 0.4)
    pen = None
    pen2 = g.glyphPen(replace=False)
    add_rect(pen2, 0, 0, w, STEM)
    pen2 = None


def build_3(g):
    """3: two stacked open bowls, both opening to the left."""
    w = BOWL_W_UC * 0.78
    rx = w / 2
    # Top half: opens left, but offset so its bottom merges with the top half
    cy1 = CAP_H * 0.73
    ry1 = CAP_H * 0.27 + OVERSHOOT
    add_open_bowl(g, w / 2, cy1, rx, ry1, STEM,
                  gap_half_angle=math.radians(55),
                  gap_rotation=math.radians(180))
    # Bottom half
    cy2 = CAP_H * 0.27
    ry2 = CAP_H * 0.27 + OVERSHOOT
    add_open_bowl(g, w / 2, cy2, rx, ry2, STEM,
                  gap_half_angle=math.radians(55),
                  gap_rotation=math.radians(180))
    # Connector bar in the middle right (where they meet)
    pen = g.glyphPen(replace=False)
    add_rect(pen, w * 0.30, CAP_H * 0.50 - STEM / 2, w * 0.30, STEM)
    pen = None


def build_4(g):
    w = BOWL_W_UC * 0.85
    pen = g.glyphPen(replace=False)
    add_pill(pen, w - STEM * 1.4, 0, STEM, CAP_H)
    pen = None
    pen2 = g.glyphPen(replace=False)
    _stroke(pen2, w - STEM * 1.4, CAP_H, 0, CAP_H * 0.32)
    pen2 = None
    pen3 = g.glyphPen(replace=False)
    add_rect(pen3, 0, CAP_H * 0.32, w, STEM)
    pen3 = None


def build_5(g):
    w = BOWL_W_UC * 0.78
    # Top horizontal bar
    pen = g.glyphPen(replace=False)
    add_rect(pen, 0, CAP_H - STEM, w, STEM)
    pen = None
    # Left vertical stem (from top bar down to where bottom bowl starts)
    pen2 = g.glyphPen(replace=False)
    add_rect(pen2, 0, CAP_H * 0.45, STEM, CAP_H * 0.55)
    pen2 = None
    # Bottom: open-bowl opening upper-left (so the upper-left meets the stem)
    cy = CAP_H * 0.27
    ry = CAP_H * 0.27 + OVERSHOOT
    add_open_bowl(g, w / 2, cy, w / 2, ry, STEM,
                  gap_half_angle=math.radians(60),
                  gap_rotation=math.radians(135))


def build_6(g):
    """6: bottom bowl + top arc curving up-and-over from upper-left."""
    w = BOWL_W_UC * 0.82
    # Bottom bowl, slightly larger to overlap the top
    add_bowl(g, 0, -OVERSHOOT, w, CAP_H * 0.60 + OVERSHOOT)
    # Top: open-bowl that opens DOWN-RIGHT (so curl extends from upper-left of
    # bottom bowl up and over). gap_rotation = -45° gives opening at lower-right.
    cy_top = CAP_H * 0.70
    rx = w / 2
    ry = CAP_H * 0.30
    add_open_bowl(g, w / 2, cy_top, rx, ry, STEM,
                  gap_half_angle=math.radians(50),
                  gap_rotation=math.radians(-45))


def build_7(g):
    w = BOWL_W_UC * 0.82
    pen = g.glyphPen(replace=False)
    add_rect(pen, 0, CAP_H - STEM, w, STEM)
    pen = None
    pen2 = g.glyphPen(replace=False)
    _stroke(pen2, w, CAP_H, w * 0.30, 0, cap="flat", extend=STEM * 0.4)
    pen2 = None


def build_8(g):
    w = BOWL_W_UC * 0.80
    # Two bowls overlapping by ~STEM at the waist for a clean merge
    add_bowl(g, 0, CAP_H * 0.50 - STEM * 0.3, w, CAP_H * 0.50 + STEM * 0.3 + OVERSHOOT)
    add_bowl(g, 0, -OVERSHOOT, w, CAP_H * 0.50 + STEM * 0.3 + OVERSHOOT)


def build_9(g):
    """9: top bowl + bottom arc curving down-and-around from lower-right (mirror of 6)."""
    w = BOWL_W_UC * 0.82
    add_bowl(g, 0, CAP_H * 0.40, w, CAP_H * 0.60 + OVERSHOOT)
    # Bottom arc: opens UPPER-LEFT (gap_rotation = π - π/4 = 3π/4 ≈ 135°)
    cy_bot = CAP_H * 0.30
    rx = w / 2
    ry = CAP_H * 0.30
    add_open_bowl(g, w / 2, cy_bot, rx, ry, STEM,
                  gap_half_angle=math.radians(50),
                  gap_rotation=math.radians(135))


# ============================================================================
# PUNCTUATION
# ============================================================================
def build_period(g):
    pen = g.glyphPen(replace=False)
    add_circle(pen, STEM / 2, STEM / 2, STEM / 2)
    pen = None


def build_comma(g):
    pen = g.glyphPen(replace=False)
    add_circle(pen, STEM / 2, STEM / 2, STEM / 2)
    pen = None
    pen2 = g.glyphPen(replace=False)
    _stroke(pen2, STEM / 2, 0, STEM * 0.2, -STEM, w=STEM * 0.7)
    pen2 = None


def build_colon(g):
    pen = g.glyphPen(replace=False)
    add_circle(pen, STEM / 2, STEM / 2, STEM / 2)
    pen = None
    pen2 = g.glyphPen(replace=False)
    add_circle(pen2, STEM / 2, X_H - STEM / 2, STEM / 2)
    pen2 = None


def build_semicolon(g):
    pen = g.glyphPen(replace=False)
    add_circle(pen, STEM / 2, X_H - STEM / 2, STEM / 2)
    pen = None
    pen2 = g.glyphPen(replace=False)
    add_circle(pen2, STEM / 2, STEM / 2, STEM / 2)
    pen2 = None
    pen3 = g.glyphPen(replace=False)
    _stroke(pen3, STEM / 2, 0, STEM * 0.2, -STEM, w=STEM * 0.7)
    pen3 = None


def build_exclam(g):
    pen = g.glyphPen(replace=False)
    add_pill(pen, 0, X_H * 0.4, STEM, CAP_H - X_H * 0.4)
    pen = None
    pen2 = g.glyphPen(replace=False)
    add_circle(pen2, STEM / 2, STEM / 2, STEM / 2)
    pen2 = None


def build_question(g):
    """? — top open-bowl + small stem to a dot."""
    w = BOWL_W_UC * 0.55
    cx = w / 2
    cy = CAP_H * 0.72
    rx = w / 2
    ry = CAP_H * 0.28 + OVERSHOOT
    add_open_bowl(g, cx, cy, rx, ry, STEM,
                  gap_half_angle=math.radians(50),
                  gap_rotation=math.radians(-90))
    pen = g.glyphPen(replace=False)
    add_pill(pen, cx - STEM / 2, X_H * 0.35, STEM, CAP_H * 0.42 - X_H * 0.35)
    pen = None
    pen2 = g.glyphPen(replace=False)
    add_circle(pen2, cx, STEM / 2, STEM / 2)
    pen2 = None


def build_apostrophe(g):
    pen = g.glyphPen(replace=False)
    add_pill(pen, 0, CAP_H - STEM * 1.5, STEM, STEM * 1.5)
    pen = None


def build_quotedbl(g):
    pen = g.glyphPen(replace=False)
    add_pill(pen, 0, CAP_H - STEM * 1.5, STEM, STEM * 1.5)
    pen = None
    pen2 = g.glyphPen(replace=False)
    add_pill(pen2, STEM * 1.6, CAP_H - STEM * 1.5, STEM, STEM * 1.5)
    pen2 = None


def build_hyphen(g):
    w = BOWL_W_LC * 0.55
    pen = g.glyphPen(replace=False)
    add_pill(pen, 0, X_H * 0.45, w, STEM * 0.85)
    pen = None


def build_underscore(g):
    w = BOWL_W_LC
    pen = g.glyphPen(replace=False)
    add_rect(pen, 0, -STEM, w, STEM * 0.7)
    pen = None


def build_paren_l(g):
    """( — single closed contour parametric."""
    w = STEM * 2.5
    h = CAP_H + STEM
    y0 = -STEM / 2
    cy = y0 + h / 2
    rx_outer = w
    ry_outer = h / 2
    rx_inner = rx_outer - STEM
    ry_inner = ry_outer - STEM / 2
    # Half-ellipse opening to the right
    pen = g.glyphPen(replace=False)
    # Outer arc: from top (angle π/2) CCW to bottom (angle -π/2)... goes through left.
    # In our convention (CCW = positive angle): from π/2 to 3π/2 (going through π)
    _arc_cubic(pen, w, cy, rx_outer, ry_outer, math.pi / 2, 3 * math.pi / 2,
               move_first=True)
    # Inner arc back: from 3π/2 to π/2 (going through π)
    _arc_cubic(pen, w, cy, rx_inner, ry_inner, 3 * math.pi / 2, math.pi / 2,
               move_first=False)
    pen.closePath()
    pen = None


def build_paren_r(g):
    w = STEM * 2.5
    h = CAP_H + STEM
    y0 = -STEM / 2
    cy = y0 + h / 2
    rx_outer = w
    ry_outer = h / 2
    rx_inner = rx_outer - STEM
    ry_inner = ry_outer - STEM / 2
    pen = g.glyphPen(replace=False)
    # Mirror of paren_l: opening to left
    # Outer from -π/2 CCW to π/2 (through 0)
    _arc_cubic(pen, 0, cy, rx_outer, ry_outer, -math.pi / 2, math.pi / 2,
               move_first=True)
    _arc_cubic(pen, 0, cy, rx_inner, ry_inner, math.pi / 2, -math.pi / 2,
               move_first=False)
    pen.closePath()
    pen = None


def build_bracket_l(g):
    w = STEM * 2.0
    h = CAP_H + STEM
    y0 = -STEM / 2
    pen = g.glyphPen(replace=False)
    add_rect(pen, 0, y0, STEM, h)
    pen = None
    pen2 = g.glyphPen(replace=False)
    add_rect(pen2, 0, y0, w, STEM)
    pen2 = None
    pen3 = g.glyphPen(replace=False)
    add_rect(pen3, 0, y0 + h - STEM, w, STEM)
    pen3 = None


def build_bracket_r(g):
    w = STEM * 2.0
    h = CAP_H + STEM
    y0 = -STEM / 2
    pen = g.glyphPen(replace=False)
    add_rect(pen, w - STEM, y0, STEM, h)
    pen = None
    pen2 = g.glyphPen(replace=False)
    add_rect(pen2, 0, y0, w, STEM)
    pen2 = None
    pen3 = g.glyphPen(replace=False)
    add_rect(pen3, 0, y0 + h - STEM, w, STEM)
    pen3 = None


def build_brace_l(g):
    build_paren_l(g)


def build_brace_r(g):
    build_paren_r(g)


def build_slash(g):
    w = BOWL_W_LC * 0.55
    pen = g.glyphPen(replace=False)
    _stroke(pen, 0, -STEM, w, CAP_H + STEM)
    pen = None


def build_backslash(g):
    w = BOWL_W_LC * 0.55
    pen = g.glyphPen(replace=False)
    _stroke(pen, 0, CAP_H + STEM, w, -STEM)
    pen = None


def build_plus(g):
    w = BOWL_W_LC * 0.65
    pen = g.glyphPen(replace=False)
    add_rect(pen, 0, CAP_H * 0.40, w, STEM * 0.85)
    pen = None
    pen2 = g.glyphPen(replace=False)
    add_rect(pen2, w / 2 - STEM * 0.42, CAP_H * 0.40 - w * 0.30, STEM * 0.85, w * 0.85)
    pen2 = None


def build_equal(g):
    w = BOWL_W_LC * 0.65
    pen = g.glyphPen(replace=False)
    add_rect(pen, 0, CAP_H * 0.50, w, STEM * 0.85)
    pen = None
    pen2 = g.glyphPen(replace=False)
    add_rect(pen2, 0, CAP_H * 0.30, w, STEM * 0.85)
    pen2 = None


def build_asterisk(g):
    w = BOWL_W_LC * 0.55
    cx = w / 2
    cy = CAP_H * 0.75
    arm = w * 0.40
    pen = g.glyphPen(replace=False)
    _stroke(pen, cx - arm, cy, cx + arm, cy)
    pen = None
    pen2 = g.glyphPen(replace=False)
    _stroke(pen2, cx - arm * 0.5, cy + arm * 0.86, cx + arm * 0.5, cy - arm * 0.86)
    pen2 = None
    pen3 = g.glyphPen(replace=False)
    _stroke(pen3, cx + arm * 0.5, cy + arm * 0.86, cx - arm * 0.5, cy - arm * 0.86)
    pen3 = None


def build_at(g):
    """@ — outer ring with opening at lower-right + inner round 'a' bowl."""
    w = BOWL_W_UC * 1.10
    h = CAP_H
    cx = w / 2
    cy = h / 2
    # Outer ring: open at lower-right, thinner stem so it doesn't dominate
    add_open_bowl(g, cx, cy, w / 2, h / 2, STEM * 0.85,
                  gap_half_angle=math.radians(20),
                  gap_rotation=math.radians(-45))
    # Inner small 'a' bowl
    iw = w * 0.42
    ih = h * 0.42
    add_bowl(g, cx - iw / 2, cy - ih / 2, iw, ih, stem=STEM * 0.6)
    # Tail of inner 'a' (small vertical pill on the right of inner bowl)
    pen = g.glyphPen(replace=False)
    add_pill(pen, cx + iw / 2 - STEM * 0.6, cy - ih / 2,
             STEM * 0.6, ih * 0.5)
    pen = None


def build_hash(g):
    w = BOWL_W_UC * 0.95
    h = CAP_H
    pen = g.glyphPen(replace=False)
    add_rect(pen, 0, h * 0.30, w, STEM * 0.7)
    pen = None
    pen2 = g.glyphPen(replace=False)
    add_rect(pen2, 0, h * 0.55, w, STEM * 0.7)
    pen2 = None
    pen3 = g.glyphPen(replace=False)
    _stroke(pen3, w * 0.30, 0, w * 0.20, h, w=STEM * 0.7)
    pen3 = None
    pen4 = g.glyphPen(replace=False)
    _stroke(pen4, w * 0.70, 0, w * 0.60, h, w=STEM * 0.7)
    pen4 = None


def build_amp(g):
    """& — simplified geometric."""
    w = BOWL_W_UC
    h = CAP_H
    add_bowl(g, w * 0.10, h * 0.55, w * 0.50, h * 0.45)
    add_bowl(g, 0, 0, w * 0.75, h * 0.55)
    pen = g.glyphPen(replace=False)
    _stroke(pen, w * 0.40, h * 0.30, w, 0)
    pen = None


def build_dollar(g):
    """$ — S-shape (built from two open bowls) + vertical bar."""
    w = BOWL_W_UC * 0.75
    h = CAP_H
    rx = w / 2
    ry = h / 4
    # Top half-S
    add_open_bowl(g, w / 2, h * 0.72, rx, ry + OVERSHOOT, STEM,
                  gap_half_angle=math.radians(60),
                  gap_rotation=math.radians(-30))
    # Bottom half-S
    add_open_bowl(g, w / 2, h * 0.28, rx, ry + OVERSHOOT, STEM,
                  gap_half_angle=math.radians(60),
                  gap_rotation=math.radians(150))
    # Vertical bar through middle
    pen = g.glyphPen(replace=False)
    add_pill(pen, w / 2 - STEM * 0.35, -STEM * 0.5, STEM * 0.7, h + STEM)
    pen = None


def build_percent(g):
    w = BOWL_W_UC * 1.1
    h = CAP_H
    add_bowl(g, 0, h * 0.55, w * 0.40, h * 0.45)
    add_bowl(g, w * 0.60, 0, w * 0.40, h * 0.45)
    pen = g.glyphPen(replace=False)
    _stroke(pen, w * 0.85, h, w * 0.15, 0)
    pen = None


def build_less(g):
    w = BOWL_W_UC * 0.65
    h = CAP_H * 0.7
    y0 = (CAP_H - h) / 2
    pen = g.glyphPen(replace=False)
    _stroke(pen, w, y0 + h, 0, y0 + h / 2)
    pen = None
    pen2 = g.glyphPen(replace=False)
    _stroke(pen2, w, y0, 0, y0 + h / 2)
    pen2 = None


def build_greater(g):
    w = BOWL_W_UC * 0.65
    h = CAP_H * 0.7
    y0 = (CAP_H - h) / 2
    pen = g.glyphPen(replace=False)
    _stroke(pen, 0, y0 + h, w, y0 + h / 2)
    pen = None
    pen2 = g.glyphPen(replace=False)
    _stroke(pen2, 0, y0, w, y0 + h / 2)
    pen2 = None


# ============================================================================
# FINALIZE GLYPH (no removeOverlap — it eats holes; we craft contours cleanly)
# ============================================================================
def finalize_glyph(glyph, side_bearing=SIDE_BEAR):
    # Order matters: removeOverlap first (uses winding to merge fills + preserve
    # holes), then correctDirection (set TT-convention winding for output).
    glyph.removeOverlap()
    glyph.simplify(0.25, ("smoothcurves", "choosehv"))
    glyph.correctDirection()
    glyph.round()
    xmin, ymin, xmax, ymax = glyph.boundingBox()
    if xmin != side_bearing:
        glyph.transform(psMat.translate(side_bearing - xmin, 0))
    xmin, ymin, xmax, ymax = glyph.boundingBox()
    glyph.width = max(0, int(round(xmax + side_bearing)))


# ============================================================================
# MAIN
# ============================================================================
def main():
    os.makedirs(OUT_DIR, exist_ok=True)
    font = fontforge.font()
    font.familyname = "Cumulus Sans"
    font.fontname   = "CumulusSans-Regular"
    font.fullname   = "Cumulus Sans Regular"
    font.weight     = "Regular"
    font.copyright  = "Cumulus Sans — extrapolated from 5 letters traced from the Cumulus logo. Synthesized glyphs are interpretive."
    font.version    = "0.3"
    font.em         = EM
    font.ascent     = OS2_ASC
    font.descent    = OS2_DSC
    font.os2_typoascent_add = False;  font.os2_typoascent  = OS2_ASC
    font.os2_typodescent_add = False; font.os2_typodescent = -OS2_DSC
    font.os2_typolinegap = 0
    font.os2_winascent_add = False;   font.os2_winascent   = OS2_ASC
    font.os2_windescent_add = False;  font.os2_windescent  = OS2_DSC
    font.hhea_ascent_add = False;     font.hhea_ascent     = OS2_ASC
    font.hhea_descent_add = False;    font.hhea_descent    = -OS2_DSC
    font.hhea_linegap = 0
    font.os2_xheight   = X_H
    font.os2_capheight = CAP_H

    print("Importing traced originals…")
    import_traced_glyph(font, "C", 0x43, "C.svg", CAP_H)
    import_traced_glyph(font, "u", 0x75, "u.svg", X_H)
    import_traced_glyph(font, "m", 0x6D, "m.svg", X_H)
    import_traced_glyph(font, "l", 0x6C, "l.svg", ASC)
    import_traced_glyph(font, "s", 0x73, "s.svg", X_H)

    # Derived from traced
    print("Deriving c (scaled C) and S (scaled s)…")
    clone_traced(font, "c", 0x63, "C.svg", X_H)
    clone_traced(font, "S", 0x53, "s.svg", CAP_H)

    print("Lowercase…")
    lc = {
        0x61: build_a, 0x62: build_b, 0x64: build_d, 0x65: build_e,
        0x66: build_f, 0x67: build_g, 0x68: build_h, 0x69: build_i,
        0x6A: build_j, 0x6B: build_k, 0x6E: build_n, 0x6F: build_o,
        0x70: build_p, 0x71: build_q, 0x72: build_r, 0x74: build_t,
        0x76: build_v, 0x77: build_w, 0x78: build_x, 0x79: build_y,
        0x7A: build_z,
    }
    for cp, builder in lc.items():
        builder(font.createChar(cp, chr(cp)))

    print("Uppercase…")
    uc = {
        0x41: build_A, 0x42: build_B, 0x44: build_D, 0x45: build_E,
        0x46: build_F, 0x47: build_G, 0x48: build_H, 0x49: build_I,
        0x4A: build_J, 0x4B: build_K, 0x4C: build_L, 0x4D: build_M,
        0x4E: build_N, 0x4F: build_O_cap, 0x50: build_P, 0x51: build_Q,
        0x52: build_R, 0x54: build_T, 0x55: build_U, 0x56: build_V,
        0x57: build_W, 0x58: build_X, 0x59: build_Y, 0x5A: build_Z,
    }
    for cp, builder in uc.items():
        builder(font.createChar(cp, chr(cp)))

    print("Digits…")
    digits = {
        0x30: ("zero", build_0), 0x31: ("one", build_1), 0x32: ("two", build_2),
        0x33: ("three", build_3), 0x34: ("four", build_4), 0x35: ("five", build_5),
        0x36: ("six", build_6), 0x37: ("seven", build_7), 0x38: ("eight", build_8),
        0x39: ("nine", build_9),
    }
    for cp, (name, builder) in digits.items():
        builder(font.createChar(cp, name))

    print("Punctuation…")
    punct = {
        0x2E: ("period", build_period), 0x2C: ("comma", build_comma),
        0x3A: ("colon", build_colon), 0x3B: ("semicolon", build_semicolon),
        0x21: ("exclam", build_exclam), 0x3F: ("question", build_question),
        0x27: ("quotesingle", build_apostrophe), 0x22: ("quotedbl", build_quotedbl),
        0x2D: ("hyphen", build_hyphen), 0x5F: ("underscore", build_underscore),
        0x28: ("parenleft", build_paren_l), 0x29: ("parenright", build_paren_r),
        0x5B: ("bracketleft", build_bracket_l), 0x5D: ("bracketright", build_bracket_r),
        0x7B: ("braceleft", build_brace_l), 0x7D: ("braceright", build_brace_r),
        0x2F: ("slash", build_slash), 0x5C: ("backslash", build_backslash),
        0x2B: ("plus", build_plus), 0x3D: ("equal", build_equal),
        0x2A: ("asterisk", build_asterisk), 0x40: ("at", build_at),
        0x23: ("numbersign", build_hash), 0x26: ("ampersand", build_amp),
        0x24: ("dollar", build_dollar), 0x25: ("percent", build_percent),
        0x3C: ("less", build_less), 0x3E: ("greater", build_greater),
    }
    for cp, (name, builder) in punct.items():
        builder(font.createChar(cp, name))

    space = font.createChar(0x20, "space")
    space.width = 280

    print("Side-bearings & cleanup…")
    narrow = {"l", "i", "j", "t", "f", "I", "one", "exclam"}
    wide   = {"M", "W", "m", "w", "at", "percent"}
    for g in font.glyphs():
        if g.glyphname == "space":
            continue
        sb = NARROW_SB if g.glyphname in narrow else (WIDE_SB if g.glyphname in wide else SIDE_BEAR)
        finalize_glyph(g, side_bearing=sb)

    notdef = font.createChar(-1, ".notdef")
    notdef.width = 500
    pen = notdef.glyphPen()
    pen.moveTo((50, 0)); pen.lineTo((50, CAP_H))
    pen.lineTo((450, CAP_H)); pen.lineTo((450, 0))
    pen.closePath()
    pen = None

    out_ttf = os.path.join(OUT_DIR, "CumulusSans-Regular.ttf")
    out_otf = os.path.join(OUT_DIR, "CumulusSans-Regular.otf")
    print(f"Generating {out_ttf}")
    font.generate(out_ttf)
    print(f"Generating {out_otf}")
    font.generate(out_otf)
    print("Done.")


if __name__ == "__main__":
    main()
