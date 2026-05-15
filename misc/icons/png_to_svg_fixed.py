#!/usr/bin/env python3
"""
Convert PNG icons to SVG pixel-art, only including white/bright pixels.
Dark grey and black pixels are omitted (treated as transparent).
"""

from PIL import Image
import os
import sys


def png_to_svg(png_path, svg_path, brightness_threshold=200, alpha_threshold=50):
    """
    Convert a PNG to SVG, only including pixels that are both:
    1. Non-transparent (alpha > alpha_threshold)
    2. Bright (average RGB brightness > brightness_threshold)

    Args:
        png_path: Path to input PNG file
        svg_path: Path to output SVG file
        brightness_threshold: Minimum brightness (0-255) to include a pixel
        alpha_threshold: Minimum alpha (0-255) to consider a pixel non-transparent
    """
    img = Image.open(png_path)
    alpha = img.getchannel('A')
    rgb = img.convert('RGB')

    width, height = img.size

    # Build SVG with rect elements for each qualifying pixel
    rects = []
    for y in range(height):
        for x in range(width):
            a = alpha.getpixel((x, y))
            if a <= alpha_threshold:
                continue

            r, g, b = rgb.getpixel((x, y))
            brightness = (r + g + b) / 3

            if brightness > brightness_threshold:
                rects.append(f'<rect x="{x}" y="{y}" width="1" height="1" fill="white"/>')

    svg = f'''<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="{height}" viewBox="0 0 {width} {height}">
{''.join(rects)}
</svg>'''

    with open(svg_path, 'w') as f:
        f.write(svg)

    return len(rects)


def batch_convert(input_dir, output_dir=None, brightness_threshold=200):
    """
    Convert all PNG files in a directory to SVG.

    Args:
        input_dir: Directory containing PNG files
        output_dir: Directory for SVG output (defaults to input_dir)
        brightness_threshold: Minimum brightness to include a pixel
    """
    if output_dir is None:
        output_dir = input_dir

    os.makedirs(output_dir, exist_ok=True)

    png_files = [f for f in os.listdir(input_dir) if f.lower().endswith('.png') and not f.startswith('test_')]

    for png_file in sorted(png_files):
        png_path = os.path.join(input_dir, png_file)
        svg_file = os.path.join(output_dir, png_file.replace('.png', '.svg'))

        count = png_to_svg(png_path, svg_file, brightness_threshold)
        print(f'Converted {png_file}: {count} white/bright pixels')


if __name__ == '__main__':
    # Default: convert all PNGs in current directory
    input_dir = os.path.dirname(os.path.abspath(__file__))
    threshold = 150

    # Parse command line args if provided
    if len(sys.argv) > 1:
        input_dir = sys.argv[1]
    if len(sys.argv) > 2:
        threshold = int(sys.argv[2])

    print(f'Converting PNGs in: {input_dir}')
    print(f'Using brightness threshold: {threshold}')
    batch_convert(input_dir, brightness_threshold=threshold)
    print('Done!')
