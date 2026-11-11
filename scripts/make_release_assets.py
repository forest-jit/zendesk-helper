#!/usr/bin/env python3
"""Draw our original ticket icon and optional store tile. Requires Pillow, not network access."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / 'assets' / 'icons'
RELEASE = ROOT / 'docs' / 'release'


def icon(size):
    # Work at 4x so small toolbar icons retain clean edges.
    scale = 4
    image = Image.new('RGBA', (size * scale, size * scale))
    draw = ImageDraw.Draw(image)
    def box(values): return tuple(round(v * size * scale / 128) for v in values)
    draw.rounded_rectangle(box((16, 16, 112, 112)), radius=size * scale * 0.18, fill='#173e51')
    draw.rounded_rectangle(box((33, 37, 95, 91)), radius=size * scale * 0.05, fill='#d8edf4')
    for x in (33, 95):
        draw.ellipse(box((x-6, 58, x+6, 70)), fill='#173e51')
    draw.line(box((47, 55, 81, 55)), fill='#173e51', width=max(1, round(size * scale / 32)))
    draw.line(box((47, 72, 70, 72)), fill='#2c7da0', width=max(1, round(size * scale / 32)))
    return image.resize((size, size), Image.Resampling.LANCZOS)


def main():
    ASSETS.mkdir(parents=True, exist_ok=True)
    for size in (16, 32, 48, 128):
        icon(size).save(ASSETS / f'icon-{size}.png')
    # This is original promotional artwork, not a fabricated product screenshot.
    tile = Image.new('RGB', (440, 280), '#101c25')
    draw = ImageDraw.Draw(tile)
    badge = icon(96)
    tile.paste(badge, (24, 22), badge)
    regular = '/System/Library/Fonts/Supplemental/Arial.ttf'
    bold = '/System/Library/Fonts/Supplemental/Arial Bold.ttf'
    draw.text((30, 128), 'Jones IT Zendesk Helper', font=ImageFont.truetype(bold, 30), fill='#ffffff')
    draw.text((30, 177), 'Ticket tools and improvements.', font=ImageFont.truetype(regular, 19), fill='#d8edf4')
    draw.text((30, 221), 'For Jones IT Zendesk', font=ImageFont.truetype(regular, 16), fill='#a9c9d7')
    tile.save(RELEASE / 'small-promo-440x280.png')
    print('Created 16/32/48/128px original icons and optional 440x280 promo tile.')

if __name__ == '__main__':
    main()
