# Outer Colonies Icon Font - Character Mapping

This document maps icon names to their corresponding Unicode Private Use Area (PUA) codepoints in the generated icon font.

## Font Files

- `outer-colonies-icons.ttf` - TrueType font
- `outer-colonies-icons.woff` - WOFF format for web
- `outer-colonies-icons.woff2` - WOFF2 format for web
- `outer-colonies-icons.css` - CSS for using the font

## Icon to Character Mapping

The `generate_font.js` script assigns PUA codepoints starting from `U+EA01` in the order of its `GLYPHS` list (see below). New glyphs must only ever be appended to the end of that list so that the codepoints of already published glyphs remain stable.

| Icon Name | Filename | Unicode Codepoint | HTML Entity | CSS Class Suggestion |
|-----------|----------|-------------------|-------------|---------------------|
| armour | armour_1.svg | U+EA01 | `&#xEA01;` | `.oc-icon-armour` |
| control | control.svg | U+EA02 | `&#xEA02;` | `.oc-icon-control` |
| damage | damage.svg | U+EA03 | `&#xEA03;` | `.oc-icon-damage` |
| energy | energy.svg | U+EA04 | `&#xEA04;` | `.oc-icon-energy` |
| equipment | equipment.svg | U+EA05 | `&#xEA05;` | `.oc-icon-equipment` |
| hp | hp.svg | U+EA06 | `&#xEA06;` | `.oc-icon-hp` |
| hull | hull.svg | U+EA07 | `&#xEA07;` | `.oc-icon-hull` |
| infrastructure | infrastructure.svg | U+EA08 | `&#xEA08;` | `.oc-icon-infrastructure` |
| orb | orb.svg | U+EA09 | `&#xEA09;` | `.oc-icon-orb` |
| point_defense | point_defense_1.svg | U+EA0A | `&#xEA0A;` | `.oc-icon-point-defense` |
| shield | shield_1.svg | U+EA0B | `&#xEA0B;` | `.oc-icon-shield` |
| tactic | tactic.svg | U+EA0C | `&#xEA0C;` | `.oc-icon-tactic` |
| speed | speed.svg | U+EA0D | `&#xEA0D;` | `.oc-icon-speed` |

## Usage Examples

### HTML Usage

```html
<!-- Direct character usage -->
<span class="oc-icon">&#xEA06;</span>  <!-- HP icon -->

<!-- With CSS class -->
<span class="oc-icon oc-icon-hp"></span>
```

### CSS Usage

```css
.oc-icon {
  font-family: 'Outer Colonies Icons', sans-serif;
  font-size: 24px;
  color: #ffffff;
}

/* Individual icon colors (optional) */
.oc-icon-hp { color: #ff4444; }
.oc-icon-energy { color: #ffff44; }
.oc-icon-shield { color: #4444ff; }
```

## Source Icons

All source PNG icons are in the parent `misc/icons/` directory:
- Stat icons: `hp.png`, `armour_1.png`, `shield_1.png`, `point_defense_1.png`, `damage.png`, `control.png`, `energy.png`, `speed.png`
- Type icons: `hull.png`, `infrastructure.png`, `equipment.png`, `orb.png`, `tactic.png`

## Regenerating the Font

If you need to regenerate the font after modifying icons:

```bash
# Navigate to misc/icons/
cd misc/icons

# Step 1: Convert PNGs to SVGs (only include white/bright pixels)
python3 png_to_svg_fixed.py . 150

# Step 2: Install the font tooling (one-time, node_modules is not committed)
npm install

# Step 3: Generate all font formats and verify the codepoint mapping
npm run build
```

`generate_font.js` writes `outer-colonies-icons.ttf/.woff/.woff2` into `font/` and fails if the assigned codepoints do not match its `GLYPHS` list. When adding a new icon, append it to that list and to the table above.

Afterwards, copy the generated font files to the website and update the glyph comments in both stylesheets:

```bash
cp font/outer-colonies-icons.{ttf,woff,woff2} ../../website/src/assets/fonts/
```

- `font/outer-colonies-icons.css` (comment mapping in this directory)
- `website/src/style/outer-colonies-icons.css` (same comment mapping, website-relative font URLs)

## Notes

- The icons are rendered at 50x50 pixels in the source SVGs
- `speed.png` is the 25x25 assets server icon (`attribute/speed.png`) upscaled 2x to the common 50x50 source size (pixel art, nearest neighbor)
- Font height is set to 1000 units with 100 units descent for proper scaling
- All icons use white (`#ffffff`) as their fill color
- The font uses the Unicode Private Use Area (U+EA01 to U+EA0D) to avoid conflicts
- SVG generation uses brightness threshold of 150 to filter out black/dark grey background pixels
- See `png_to_svg_fixed.py` for the PNG to SVG conversion logic
- The font also contains an OpenType `liga` feature that maps each icon name (e.g. `speed`) to its glyph
