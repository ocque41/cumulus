"""Generate logo asset variants from public/Logo.png.

Creates square PNG variants and a multi-size favicon.ico. Applies light
contrast and sharpness boosts plus an unsharp mask after resizing to keep the
mark crisp, even when downscaled.
"""

from pathlib import Path
from typing import Iterable

from PIL import Image, ImageEnhance, ImageFilter, ImageOps


def generate_assets(sizes: Iterable[int]) -> None:
  public = Path("public")
  source = public / "Logo.png"

  if not source.exists():
    raise FileNotFoundError("Expected source logo at public/Logo.png")

  img = Image.open(source).convert("RGBA")

  # Boost contrast and sharpness prior to scaling for better edge definition.
  rgb = Image.merge("RGB", img.split()[:3])
  rgb = ImageOps.autocontrast(rgb, cutoff=1)
  rgb = ImageEnhance.Sharpness(rgb).enhance(1.5)
  img = Image.merge("RGBA", (*rgb.split(), img.split()[-1]))

  for size in sizes:
    canvas = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    thumb = ImageOps.contain(img, (size, size), method=Image.Resampling.LANCZOS)
    thumb = thumb.filter(ImageFilter.UnsharpMask(radius=1.4, percent=220, threshold=2))
    canvas.paste(thumb, ((size - thumb.width) // 2, (size - thumb.height) // 2), thumb)
    out_path = public / f"Logo-{size}.png"
    canvas.save(out_path)

  # Generate favicon.ico with multiple sizes.
  favicon_base = ImageOps.contain(img, (256, 256), method=Image.Resampling.LANCZOS)
  favicon_base = favicon_base.filter(
    ImageFilter.UnsharpMask(radius=1.0, percent=220, threshold=2)
  )
  favicon_base.save(
    public / "favicon.ico",
    format="ICO",
    sizes=[(16, 16), (32, 32), (48, 48), (64, 64)],
  )


if __name__ == "__main__":
  TARGET_SIZES = [16, 32, 48, 64, 128, 180, 256, 512, 1024, 2048, 4096, 7680]
  generate_assets(TARGET_SIZES)
  print("Generated", len(TARGET_SIZES), "PNG variants and refreshed favicon.ico")
