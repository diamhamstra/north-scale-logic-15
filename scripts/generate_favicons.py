#!/usr/bin/env python3
"""Generate North Scale favicon assets from source PNG."""

from __future__ import annotations

import sys
from pathlib import Path

from PIL import Image

NAVY = (5, 10, 20, 255)
TEXT_SHIFT_Y = -12
OUTPUT_SIZE = 512
SIZES = {
    "favicon-16x16.png": 16,
    "favicon-32x32.png": 32,
    "apple-touch-icon.png": 180,
    "android-chrome-192x192.png": 192,
    "android-chrome-512x512.png": 512,
}


def is_text(r: int, g: int, b: int, a: int) -> bool:
    return r > 175 and g > 175 and b > 150 and a > 80


def is_fringe(r: int, g: int, b: int, a: int) -> bool:
    if a < 8 or is_text(r, g, b, a):
        return False
    spread = max(r, g, b) - min(r, g, b)
    if r > 90 and g > 90 and b > 90 and spread < 40:
        return True
    return r > 210 and g > 210 and b > 210


def is_navy(r: int, g: int, b: int, a: int) -> bool:
    return r < 70 and g < 45 and b < 80 and a > 40


def process_source(src_path: Path) -> Image.Image:
    src = Image.open(src_path).convert("RGBA")
    w, h = src.size
    px = src.load()

    text_layer = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    icon_layer = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    text_px = text_layer.load()
    icon_px = icon_layer.load()

    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if is_text(r, g, b, a):
                text_px[x, y] = (r, g, b, a)
            elif is_fringe(r, g, b, a):
                continue
            elif is_navy(r, g, b, a) or a > 8:
                icon_px[x, y] = NAVY if is_navy(r, g, b, a) else (r, g, b, a)

    shifted_text = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    shifted_text.paste(text_layer, (0, TEXT_SHIFT_Y))

    composed = Image.new("RGBA", (w, h), NAVY)
    composed = Image.alpha_composite(composed, icon_layer)
    composed = Image.alpha_composite(composed, shifted_text)

    if w != OUTPUT_SIZE or h != OUTPUT_SIZE:
        composed = composed.resize((OUTPUT_SIZE, OUTPUT_SIZE), Image.Resampling.LANCZOS)

    return composed


def write_assets(master: Image.Image, out_dir: Path) -> None:
    out_dir.mkdir(parents=True, exist_ok=True)

    ico_sizes = [(16, 16), (32, 32), (48, 48)]
    ico_images = [master.resize(size, Image.Resampling.LANCZOS) for size in ico_sizes]
    ico_images[0].save(
        out_dir / "favicon.ico",
        format="ICO",
        sizes=ico_sizes,
        append_images=ico_images[1:],
    )

    for filename, size in SIZES.items():
        master.resize((size, size), Image.Resampling.LANCZOS).save(out_dir / filename, "PNG")

    master.save(out_dir / "favicon-source.png", "PNG")


def main() -> int:
    if len(sys.argv) < 3:
        print("Usage: generate_favicons.py <source.png> <output-dir> [output-dir...]")
        return 1

    src_path = Path(sys.argv[1]).expanduser().resolve()
    out_dirs = [Path(p).expanduser().resolve() for p in sys.argv[2:]]

    master = process_source(src_path)
    for out_dir in out_dirs:
        write_assets(master, out_dir)
        print(f"Wrote favicon assets to {out_dir}")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
