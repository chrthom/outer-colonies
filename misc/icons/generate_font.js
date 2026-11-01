#!/usr/bin/env node
/**
 * Regenerates the `outer-colonies-icons` webfont (TTF/WOFF/WOFF2) from the
 * source SVG icons in this directory.
 *
 * The glyph order in GLYPHS below defines the Private Use Area codepoint
 * assignment (U+EA01, U+EA02, ... in list order). This order is deliberate:
 * it keeps the codepoints of all previously published glyphs stable, so the
 * mapping documented in `font/mapping.md` must only ever be appended to.
 *
 * webfont 11.x is a CJS build that expects callable `.default` interop from
 * its dependencies. Current dependency versions diverge from that:
 *  - globby >= 12 has no callable default export (sealed exports object)
 *  - svgicons2svgfont is TypeScript-compiled CJS with named exports only
 * Both are fixed by swapping the require-cache entry before webfont loads.
 *
 * Prerequisites (installed in this directory, not committed):
 *   npm install webfont globby@12
 *
 * Usage:
 *   node misc/icons/generate_font.js [iconsDir] [destDir]
 *
 * Both arguments are optional and default to this script's directory and its
 * `font/` subdirectory respectively.
 */

const path = require('path');
const fs = require('fs');

// globby: replace exports with a plain callable delegating to globby.globby
const globby = require('globby');
if (typeof globby !== 'function' && typeof globby.globby === 'function') {
  require.cache[require.resolve('globby')].exports = function patchedGlobby(
    patterns,
    options,
  ) {
    return globby.globby(patterns, options);
  };
}

// svgicons2svgfont: make the stream constructor the module's default export
const svgIcons2SvgFont = require('svgicons2svgfont');
if (typeof svgIcons2SvgFont !== 'function') {
  const Ctor = svgIcons2SvgFont.SVGIcons2SVGFontStream;
  require.cache[require.resolve('svgicons2svgfont')].exports = Object.assign(
    Ctor,
    svgIcons2SvgFont,
    { default: Ctor },
  );
}

const webfont = require('webfont').default || require('webfont');

/** Ordered glyph list; the list position defines the PUA codepoint. */
const GLYPHS = [
  { file: 'armour_1.svg', codepoint: 0xea01 },
  { file: 'control.svg', codepoint: 0xea02 },
  { file: 'damage.svg', codepoint: 0xea03 },
  { file: 'energy.svg', codepoint: 0xea04 },
  { file: 'equipment.svg', codepoint: 0xea05 },
  { file: 'hp.svg', codepoint: 0xea06 },
  { file: 'hull.svg', codepoint: 0xea07 },
  { file: 'infrastructure.svg', codepoint: 0xea08 },
  { file: 'orb.svg', codepoint: 0xea09 },
  { file: 'point_defense_1.svg', codepoint: 0xea0a },
  { file: 'shield_1.svg', codepoint: 0xea0b },
  { file: 'tactic.svg', codepoint: 0xea0c },
  { file: 'speed.svg', codepoint: 0xea0d },
];

/**
 * Generate the icon font.
 * @param {string} iconsDir Directory containing the source SVG icons.
 * @param {string} destDir Directory to write the font files into.
 * @returns {Promise<void>} Resolves when all font files are written.
 */
async function generateFont(iconsDir, destDir) {
  const files = GLYPHS.map((glyph) => path.join(iconsDir, glyph.file));
  const missing = files.filter((file) => !fs.existsSync(file));
  if (missing.length > 0) {
    throw new Error(`Missing source SVG(s): ${missing.join(', ')}`);
  }

  const result = await webfont({
    files,
    fontName: 'outer-colonies-icons',
    fontId: 'outer-colonies-icons',
    formats: ['ttf', 'woff', 'woff2'],
    fontHeight: 1000,
    descent: 100,
    normalize: true,
    centerHorizontally: true,
    sort: false,
  });

  // Verify the assigned codepoints match the documented mapping.
  const assigned = result.glyphsData.map((glyphData) => ({
    name: path.basename(glyphData.metadata.name),
    codepoint: glyphData.metadata.unicode[0].codePointAt(0),
  }));
  GLYPHS.forEach((expected, index) => {
    if (assigned[index].codepoint !== expected.codepoint) {
      throw new Error(
        `Codepoint mismatch for ${expected.file}: expected ` +
          `U+${expected.codepoint.toString(16).toUpperCase()}, got ` +
          `U+${assigned[index].codepoint.toString(16).toUpperCase()}`,
      );
    }
  });

  fs.mkdirSync(destDir, { recursive: true });
  for (const ext of ['ttf', 'woff', 'woff2']) {
    fs.writeFileSync(
      path.join(destDir, `outer-colonies-icons.${ext}`),
      result[ext],
    );
  }
  console.log(
    assigned
      .map(
        (glyph) =>
          `${glyph.name}:U+${glyph.codepoint.toString(16).toUpperCase()}`,
      )
      .join(' '),
  );
  console.log(`Font written to ${destDir}`);
}

const iconsDir = process.argv[2]
  ? path.resolve(process.argv[2])
  : __dirname;
const destDir = process.argv[3] ? path.resolve(process.argv[3]) : path.join(iconsDir, 'font');

generateFont(iconsDir, destDir).catch((error) => {
  console.error(error);
  process.exit(1);
});
