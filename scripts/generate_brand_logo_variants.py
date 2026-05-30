"""Generate public brand logo variants from supplied raster source images."""

from __future__ import annotations

import os
from pathlib import Path
from typing import Iterable

import numpy as np
from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
OUT_DIR = ROOT / "public" / "brand" / "generated"

CUMULUS_SOURCE = Path(
  os.environ.get("CUMULUS_LOGO_SOURCE", ROOT / "brand-sources" / "cumulus-mark.png")
)
TADO_SOURCE = Path(
  os.environ.get("TADO_LOGO_SOURCE", ROOT / "brand-sources" / "tado-mark.png")
)

INK = np.array([26, 26, 26], dtype=np.float32)
PAPER = np.array([245, 245, 245], dtype=np.float32)
TERRACOTTA = np.array([164, 71, 24], dtype=np.float32)

CUMULUS_CROPS = {
  "full": (503, 239, 2030, 703),
  "cloud": (503, 239, 1237, 703),
  "word": (1218, 340, 2030, 608),
}

TADO_CROP = (342, 300, 1518, 1122)


def ensure_sources_exist(paths: Iterable[Path]) -> None:
  missing = [str(path) for path in paths if not path.exists()]
  if missing:
    raise FileNotFoundError("Missing source image(s): " + ", ".join(missing))


def write_png(image: Image.Image, path: Path) -> None:
  path.parent.mkdir(parents=True, exist_ok=True)
  image.save(path, optimize=True)


def estimate_logo_alpha(rgb: np.ndarray, foreground: np.ndarray) -> np.ndarray:
  denominator = np.maximum(foreground - INK, 1)
  alpha = ((rgb.astype(np.float32) - INK) / denominator).max(axis=2)
  alpha = np.clip(alpha, 0, 1)
  alpha[alpha < 0.035] = 0
  return alpha


def make_cumulus_variant(source: Image.Image, crop: tuple[int, int, int, int], foreground: np.ndarray) -> Image.Image:
  cropped = source.crop(crop).convert("RGBA")
  rgba = np.array(cropped)
  rgb = rgba[:, :, :3].astype(np.float32)

  normal_alpha = estimate_logo_alpha(rgb, PAPER)
  accent_alpha = estimate_logo_alpha(rgb, TERRACOTTA)
  accent_mask = (
    (rgb[:, :, 0] > 80)
    & (rgb[:, :, 0] > rgb[:, :, 1] * 1.45)
    & (rgb[:, :, 1] > 35)
    & (rgb[:, :, 1] < 115)
    & (rgb[:, :, 2] < 80)
  )
  alpha = np.where(accent_mask, accent_alpha, normal_alpha)
  alpha = np.clip(alpha * (rgba[:, :, 3].astype(np.float32) / 255), 0, 1)

  output = np.zeros_like(rgba)
  output[:, :, :3] = foreground.astype(np.uint8)
  output[accent_mask, :3] = TERRACOTTA.astype(np.uint8)
  output[:, :, 3] = np.round(alpha * 255).astype(np.uint8)

  return Image.fromarray(output, "RGBA")


def composite_on_background(logo: Image.Image, background: np.ndarray) -> Image.Image:
  canvas = Image.new("RGBA", logo.size, tuple(background.astype(np.uint8)) + (255,))
  canvas.alpha_composite(logo)
  return canvas


def make_tado_mark(source: Image.Image) -> Image.Image:
  cropped = source.crop(TADO_CROP).convert("RGBA")
  rgba = np.array(cropped)
  rgb = rgba[:, :, :3].astype(np.float32)
  diff = np.abs(rgb - INK).max(axis=2)
  alpha = np.clip((diff - 10) / 35, 0, 1)
  alpha[alpha < 0.035] = 0

  output = rgba.copy()
  output[:, :, 3] = np.round(alpha * 255).astype(np.uint8)
  return Image.fromarray(output, "RGBA")


def generate() -> None:
  ensure_sources_exist([CUMULUS_SOURCE, TADO_SOURCE])
  OUT_DIR.mkdir(parents=True, exist_ok=True)

  cumulus_source = Image.open(CUMULUS_SOURCE)
  themes = {
    "dark": {
      "foreground": PAPER,
      "background": INK,
    },
    "light": {
      "foreground": INK,
      "background": PAPER,
    },
  }

  for part, crop in CUMULUS_CROPS.items():
    for theme_name, theme in themes.items():
      logo = make_cumulus_variant(cumulus_source, crop, theme["foreground"])
      write_png(logo, OUT_DIR / f"cumulus-{part}-{theme_name}-transparent.png")
      write_png(
        composite_on_background(logo, theme["background"]),
        OUT_DIR / f"cumulus-{part}-{theme_name}-background.png",
      )

  tado_source = Image.open(TADO_SOURCE)
  tado_mark = make_tado_mark(tado_source)
  write_png(tado_mark, OUT_DIR / "tado-mark-dark-transparent.png")
  write_png(composite_on_background(tado_mark, INK), OUT_DIR / "tado-mark-dark-background.png")

  print(f"Generated logo variants in {OUT_DIR}")


if __name__ == "__main__":
  generate()
