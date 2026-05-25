/**
 * Logo cleanup pipeline — removes baked-in white background from the
 * uploaded SPACEART raster asset and produces production-grade
 * transparent PNGs optimised for both light and dark UI rendering.
 *
 * Outputs:
 *   spaceart-logo.png      – original colours, transparent bg (for light surfaces)
 *   spaceart-logo-dark.png – achromatic elements inverted to white,
 *                            orange accent preserved (for dark surfaces)
 *
 * Background-removal algorithm:
 *   For every pixel composited on white we recover the original
 *   foreground alpha using  α = 1 − min(R,G,B) / 255  then
 *   un-premultiply to restore the true foreground colour.
 *   Edge anti-aliasing is preserved by keeping intermediate alpha
 *   values and only snapping very-near-zero / very-near-one values.
 */

import sharp from "sharp";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

const SRC      = resolve(ROOT, "public/Brands/ChatGPT Image May 22, 2026, 03_46_09 AM.png");
const OUT_ORIG = resolve(ROOT, "public/Brands/spaceart-logo.png");
const OUT_DARK = resolve(ROOT, "public/Brands/spaceart-logo-dark.png");

const ALPHA_FLOOR = 0.03;
const ALPHA_CEIL  = 0.92;
const SATURATION_THRESHOLD = 50; // pixel is "chromatic" if max−min > this

function removeWhiteBg(data, channels, pixels) {
  const out = Buffer.alloc(data.length);

  for (let i = 0; i < pixels; i++) {
    const off = i * channels;
    const R = data[off];
    const G = data[off + 1];
    const B = data[off + 2];

    const minC = Math.min(R, G, B);
    let alpha = 1 - minC / 255;

    if (alpha < ALPHA_FLOOR) alpha = 0;
    else if (alpha > ALPHA_CEIL) alpha = 1;

    if (alpha === 0) {
      out[off] = 0;
      out[off + 1] = 0;
      out[off + 2] = 0;
      out[off + 3] = 0;
      continue;
    }

    const fR = Math.round(Math.min(255, Math.max(0, (R - (1 - alpha) * 255) / alpha)));
    const fG = Math.round(Math.min(255, Math.max(0, (G - (1 - alpha) * 255) / alpha)));
    const fB = Math.round(Math.min(255, Math.max(0, (B - (1 - alpha) * 255) / alpha)));

    out[off]     = fR;
    out[off + 1] = fG;
    out[off + 2] = fB;
    out[off + 3] = Math.round(alpha * 255);
  }

  return out;
}

function createDarkVariant(cleanData, channels, pixels) {
  const out = Buffer.alloc(cleanData.length);

  for (let i = 0; i < pixels; i++) {
    const off = i * channels;
    const R = cleanData[off];
    const G = cleanData[off + 1];
    const B = cleanData[off + 2];
    const A = cleanData[off + 3];

    if (A === 0) {
      out[off] = 0;
      out[off + 1] = 0;
      out[off + 2] = 0;
      out[off + 3] = 0;
      continue;
    }

    const sat = Math.max(R, G, B) - Math.min(R, G, B);

    if (sat > SATURATION_THRESHOLD) {
      // Chromatic pixel (orange accent) — keep original colour
      out[off]     = R;
      out[off + 1] = G;
      out[off + 2] = B;
      out[off + 3] = A;
    } else {
      // Achromatic pixel (black/grey) — invert to white/light
      out[off]     = 255 - R;
      out[off + 1] = 255 - G;
      out[off + 2] = 255 - B;
      out[off + 3] = A;
    }
  }

  return out;
}

async function savePng(buf, width, height, outPath) {
  await sharp(buf, { raw: { width, height, channels: 4 } })
    .trim()
    .extend({
      top: 8, bottom: 8,
      left: 12, right: 12,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png({
      compressionLevel: 9,
      adaptiveFiltering: true,
      palette: false,
    })
    .toFile(outPath);

  const stats = await sharp(outPath).metadata();
  console.log(`  → ${outPath}`);
  console.log(`    ${stats.width}×${stats.height}  RGBA=${stats.hasAlpha}  ${(await sharp(outPath).toBuffer()).length} bytes`);
}

async function main() {
  const image = sharp(SRC).ensureAlpha();
  const { width, height } = await image.metadata();
  const { data, info } = await image.raw().toBuffer({ resolveWithObject: true });
  const pixels = width * height;

  console.log(`Source: ${width}×${height} (${data.length} raw bytes)\n`);

  // Step 1: Remove white background
  const clean = removeWhiteBg(data, info.channels, pixels);
  console.log("Original-colour transparent:");
  await savePng(clean, width, height, OUT_ORIG);

  // Step 2: Create dark-mode variant (white mark/text + orange accent)
  const dark = createDarkVariant(clean, info.channels, pixels);
  console.log("\nDark-mode variant (white + orange):");
  await savePng(dark, width, height, OUT_DARK);

  console.log("\n✓ Both production assets generated");
}

main().catch((err) => {
  console.error("Logo cleanup failed:", err);
  process.exit(1);
});
