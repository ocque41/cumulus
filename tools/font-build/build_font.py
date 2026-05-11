#!/usr/bin/env fontforge
# Run with: /Applications/FontForge.app/Contents/Resources/opt/local/bin/fontforge -script build_font.py
#
# Assembles the 5 unique letters traced from the Cumulus logo (C, u, m, l, s)
# into a partial TTF font. Coordinates each glyph onto a shared baseline,
# scales uniformly so cap-height = 700 in a 1000-unit em.

import fontforge
import psMat
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
SVG_DIR = os.path.join(HERE, "svg")
OUT_DIR = os.path.join(HERE, "out")

# --- Metrics (em = 1000) ---
EM = 1000
CAP_HEIGHT = 700        # target cap-height in font units

# Measured letter heights in *source pixels*, used only to compute relative
# proportions. We don't apply SCALE to the SVG directly because the SVG import
# normalizes to ~1000 units regardless of source pixel size — so we measure the
# imported bbox per-glyph and rescale to a target font-unit height instead.
SRC = {
    "C": 145,
    "u": 105,
    "m": 104,
    "l": 147,
    "s": 106,
}

# Target heights in font units, derived so all glyphs share the same per-px
# scale: target_h = src_px * (CAP_HEIGHT / src_C_px).
PX_TO_UNITS = CAP_HEIGHT / SRC["C"]   # 4.8276
TARGET_H = {k: round(v * PX_TO_UNITS) for k, v in SRC.items()}
# C=700, u=507, m=502, l=710, s=512

X_HEIGHT = TARGET_H["u"]               # 507 (representative)
ASCENDER_VISUAL = TARGET_H["l"]        # 710
DESCENDER = -200
OS2_ASCENT = 800
OS2_DESCENT = 200
LINE_GAP = 0
SIDE_BEARING = 65       # ~13 source-px per side; matches measured letter spacing

LETTERS = [
    # name, codepoint, svg, target_height (font units)
    ("C", 0x43, "C.svg", TARGET_H["C"]),
    ("u", 0x75, "u.svg", TARGET_H["u"]),
    ("m", 0x6D, "m.svg", TARGET_H["m"]),
    ("l", 0x6C, "l.svg", TARGET_H["l"]),
    ("s", 0x73, "s.svg", TARGET_H["s"]),
]


def build_glyph(font, name, codepoint, svg_name, target_height):
    glyph = font.createChar(codepoint, name)
    svg_path = os.path.join(SVG_DIR, svg_name)
    glyph.importOutlines(svg_path)

    # Move bbox bottom-left to origin
    xmin, ymin, xmax, ymax = glyph.boundingBox()
    glyph.transform(psMat.translate(-xmin, -ymin))

    # Now scale uniformly so the glyph height matches target_height
    xmin, ymin, xmax, ymax = glyph.boundingBox()
    measured_h = ymax - ymin
    if measured_h <= 0:
        raise RuntimeError(f"{name}: zero-height bbox after import")
    s = target_height / measured_h
    glyph.transform(psMat.scale(s, s))

    # Apply left side bearing
    glyph.transform(psMat.translate(SIDE_BEARING, 0))

    xmin, ymin, xmax, ymax = glyph.boundingBox()
    glyph.width = int(round(xmax + SIDE_BEARING))

    print(f"  {name}: bbox=({xmin:.0f},{ymin:.0f})-({xmax:.0f},{ymax:.0f}), "
          f"width={glyph.width}, height_target={target_height}")


def main():
    os.makedirs(OUT_DIR, exist_ok=True)

    font = fontforge.font()
    font.familyname = "Cumulus Wordmark"
    font.fontname = "CumulusWordmark-Regular"
    font.fullname = "Cumulus Wordmark Regular"
    font.weight = "Regular"
    font.copyright = "Traced from the Cumulus logo. Partial font: contains only C, u, m, l, s."
    font.version = "0.1"
    font.em = EM
    font.ascent = OS2_ASCENT
    font.descent = OS2_DESCENT

    # OS/2 metrics
    font.os2_typoascent_add = False
    font.os2_typoascent = OS2_ASCENT
    font.os2_typodescent_add = False
    font.os2_typodescent = -OS2_DESCENT
    font.os2_typolinegap = LINE_GAP
    font.os2_winascent_add = False
    font.os2_winascent = OS2_ASCENT
    font.os2_windescent_add = False
    font.os2_windescent = OS2_DESCENT
    font.hhea_ascent_add = False
    font.hhea_ascent = OS2_ASCENT
    font.hhea_descent_add = False
    font.hhea_descent = -OS2_DESCENT
    font.hhea_linegap = LINE_GAP

    # OS/2 vertical metrics for x-height and cap-height
    font.os2_xheight = X_HEIGHT
    font.os2_capheight = CAP_HEIGHT

    print("Building glyphs...")
    for name, cp, svg, target_h in LETTERS:
        build_glyph(font, name, cp, svg, target_h)

    # Add a space glyph (no contours, just an advance)
    space = font.createChar(0x20, "space")
    space.width = 250

    # .notdef: a simple rectangle box
    notdef = font.createChar(-1, ".notdef")
    notdef.width = 500
    pen = notdef.glyphPen()
    pen.moveTo((50, 0))
    pen.lineTo((50, CAP_HEIGHT))
    pen.lineTo((450, CAP_HEIGHT))
    pen.lineTo((450, 0))
    pen.closePath()
    pen = None

    out_ttf = os.path.join(OUT_DIR, "CumulusWordmark-Regular.ttf")
    out_otf = os.path.join(OUT_DIR, "CumulusWordmark-Regular.otf")

    print(f"Generating {out_ttf}")
    font.generate(out_ttf)
    print(f"Generating {out_otf}")
    font.generate(out_otf)

    print("Done.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
