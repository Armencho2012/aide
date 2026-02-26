#!/usr/bin/env python3
"""Extract transparent logo PNGs from a grid image.

Expected use:
  1) Save the provided grid image as `public/trusted-logos/source-grid.png`
  2) Run: `python3 scripts/extract_trusted_logos.py`
  3) Generated files: `public/trusted-logos/logo-01.png` ... `logo-16.png`
"""

from __future__ import annotations

import argparse
from pathlib import Path
from typing import Tuple

from PIL import Image


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Extract transparent logos from a grid image")
    parser.add_argument(
        "--input",
        default="public/trusted-logos/source-grid.png",
        help="Path to source grid image",
    )
    parser.add_argument(
        "--output",
        default="public/trusted-logos",
        help="Output directory",
    )
    parser.add_argument("--rows", type=int, default=4, help="Grid rows")
    parser.add_argument("--cols", type=int, default=4, help="Grid columns")
    parser.add_argument(
        "--tolerance",
        type=int,
        default=28,
        help="Background color tolerance per channel (higher removes more)",
    )
    parser.add_argument(
        "--padding",
        type=int,
        default=8,
        help="Transparent padding around each trimmed logo",
    )
    return parser.parse_args()


def sample_background_color(image: Image.Image) -> Tuple[int, int, int]:
    """Estimate background color from a 3px border sample."""
    rgb = image.convert("RGB")
    width, height = rgb.size
    px = rgb.load()

    samples = []
    border = 3

    for x in range(width):
        for y in range(border):
            samples.append(px[x, y])
            samples.append(px[x, height - 1 - y])

    for y in range(height):
        for x in range(border):
            samples.append(px[x, y])
            samples.append(px[width - 1 - x, y])

    samples.sort(key=lambda c: c[0] + c[1] + c[2])
    mid = samples[len(samples) // 2]
    return mid


def remove_background(cell: Image.Image, tolerance: int) -> Image.Image:
    rgba = cell.convert("RGBA")
    bg_r, bg_g, bg_b = sample_background_color(cell)

    data = []
    for r, g, b, a in rgba.getdata():
        near_bg = (
            abs(r - bg_r) <= tolerance
            and abs(g - bg_g) <= tolerance
            and abs(b - bg_b) <= tolerance
        )
        very_light = r >= 225 and g >= 225 and b >= 225

        if near_bg or very_light:
            data.append((r, g, b, 0))
        else:
            data.append((r, g, b, a))

    rgba.putdata(data)
    return rgba


def trim_transparent(image: Image.Image, padding: int) -> Image.Image:
    alpha = image.split()[-1]
    bbox = alpha.getbbox()
    if bbox is None:
        return image

    left, top, right, bottom = bbox
    left = max(0, left - padding)
    top = max(0, top - padding)
    right = min(image.width, right + padding)
    bottom = min(image.height, bottom + padding)

    return image.crop((left, top, right, bottom))


def main() -> None:
    args = parse_args()
    input_path = Path(args.input)
    output_dir = Path(args.output)

    if not input_path.exists():
        raise FileNotFoundError(
            f"Source file not found: {input_path}. Save your uploaded grid image there and rerun."
        )

    output_dir.mkdir(parents=True, exist_ok=True)

    image = Image.open(input_path).convert("RGBA")
    width, height = image.size

    cell_w = width / args.cols
    cell_h = height / args.rows

    index = 1
    for row in range(args.rows):
        for col in range(args.cols):
            left = int(round(col * cell_w))
            top = int(round(row * cell_h))
            right = int(round((col + 1) * cell_w))
            bottom = int(round((row + 1) * cell_h))

            cell = image.crop((left, top, right, bottom))
            no_bg = remove_background(cell, tolerance=args.tolerance)
            trimmed = trim_transparent(no_bg, padding=args.padding)

            output = output_dir / f"logo-{index:02}.png"
            trimmed.save(output)
            print(f"Saved {output}")
            index += 1


if __name__ == "__main__":
    main()
