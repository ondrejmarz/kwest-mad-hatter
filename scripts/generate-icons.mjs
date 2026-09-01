// Rasterizes the app icons for the PWA manifest + the iOS home-screen tile from the brand glyph
// in `public/favicon.svg`. The glyph (a purple "quest" arrow) is centred on a white tile with a
// little padding; the maskable variant leaves a larger safe zone so Android's shape masks never
// clip it. Re-run with `node scripts/generate-icons.mjs` if the glyph or sizes change.
import { mkdirSync } from 'node:fs';

import sharp from 'sharp';

// The main glyph path from public/favicon.svg (viewBox 0 0 48 46), without the decorative glow.
const GLYPH =
  'M25.946 44.938c-.664.845-2.021.375-2.021-.698V33.937a2.26 2.26 0 0 0-2.262-2.262H10.287c-.92 0-1.456-1.04-.92-1.788l7.48-10.471c1.07-1.497 0-3.578-1.842-3.578H1.237c-.92 0-1.456-1.04-.92-1.788L10.013.474c.214-.297.556-.474.92-.474h28.894c.92 0 1.456 1.04.92 1.788l-7.48 10.471c-1.07 1.498 0 3.579 1.842 3.579h11.377c.943 0 1.473 1.088.89 1.83L25.947 44.94z';
const VIEW_W = 48;
const VIEW_H = 46;
const GLYPH_COLOR = '#863bff';
const BG = '#ffffff';

/** A square SVG tile with the glyph centred at `1 - 2*pad` of the tile, on a solid background. */
function tile(size, pad) {
  const avail = size * (1 - 2 * pad);
  const scale = Math.min(avail / VIEW_W, avail / VIEW_H);
  const w = VIEW_W * scale;
  const h = VIEW_H * scale;
  const x = (size - w) / 2;
  const y = (size - h) / 2;
  return Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">` +
      `<rect width="${size}" height="${size}" fill="${BG}"/>` +
      `<g transform="translate(${x} ${y}) scale(${scale})">` +
      `<path fill="${GLYPH_COLOR}" d="${GLYPH}"/></g></svg>`,
  );
}

const targets = [
  { file: 'public/pwa-192x192.png', size: 192, pad: 0.2 },
  { file: 'public/pwa-512x512.png', size: 512, pad: 0.2 },
  { file: 'public/pwa-maskable-512x512.png', size: 512, pad: 0.3 },
  { file: 'public/apple-touch-icon.png', size: 180, pad: 0.16 },
];

mkdirSync('public', { recursive: true });
for (const { file, size, pad } of targets) {
  await sharp(tile(size, pad)).png().toFile(file);
  console.log('wrote', file);
}
