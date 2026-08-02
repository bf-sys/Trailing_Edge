#!/usr/bin/env node
// Chroma-key removal + auto-trim for new art dropped in art-staging/ before
// it moves into assets/. Built for the "Isolated single sprite... solid
// bright chroma-key green (#00FF00) background" convention the Art Director
// Agent generates against (see .claude/agents/art-director-agent.md).
//
// Usage: node chroma-key-trim.js <input> <output> [padding]
//   input   - source image (jpg/png), solid green background
//   output  - destination PNG (with alpha)
//   padding - px of transparent padding kept around the trimmed content
//             (default 6)
//
// Soft falloff + spill suppression rather than a hard color cutoff: these
// source images are JPGs, and JPEG's lossy/chroma-subsampled compression
// blurs the green/subject edge, so a hard cutoff leaves a visible green
// fringe. Chroma keying is judged on "green dominance" (g - max(r, b)):
// fully green pixels go fully transparent, pixels in a falloff band get
// partial alpha with their green channel pulled toward the r/b average
// (removing the green tint from semi-transparent edge pixels), and
// clearly-non-green pixels are left untouched.

const Jimp = require('jimp');

const GREEN_START = 12; // green dominance where falloff begins
const GREEN_FULL = 65; // green dominance where alpha reaches 0
const ALPHA_TRIM_THRESHOLD = 10; // ignore near-fully-transparent pixels when computing the crop box

async function main() {
  const [, , inputPath, outputPath, paddingArg] = process.argv;
  if (!inputPath || !outputPath) {
    console.error('Usage: node chroma-key-trim.js <input> <output> [padding]');
    process.exit(1);
  }
  const padding = paddingArg !== undefined ? parseInt(paddingArg, 10) : 6;

  const image = await Jimp.read(inputPath);
  const { width, height } = image.bitmap;

  let minX = width;
  let minY = height;
  let maxX = -1;
  let maxY = -1;

  image.scan(0, 0, width, height, function chromaKey(x, y, idx) {
    const r = this.bitmap.data[idx + 0];
    const g = this.bitmap.data[idx + 1];
    const b = this.bitmap.data[idx + 2];

    const greenDominance = g - Math.max(r, b);

    if (greenDominance > GREEN_START) {
      const strength = Math.min(1, (greenDominance - GREEN_START) / (GREEN_FULL - GREEN_START));
      const avgRB = (r + b) / 2;
      this.bitmap.data[idx + 1] = g - (g - avgRB) * strength;
      this.bitmap.data[idx + 3] = Math.round(255 * (1 - strength));
    }

    if (this.bitmap.data[idx + 3] > ALPHA_TRIM_THRESHOLD) {
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
  });

  if (maxX < 0) {
    console.error('No non-transparent content found -- refusing to write an empty image.');
    process.exit(1);
  }

  const cropX = Math.max(0, minX - padding);
  const cropY = Math.max(0, minY - padding);
  const cropW = Math.min(width, maxX + padding + 1) - cropX;
  const cropH = Math.min(height, maxY + padding + 1) - cropY;

  image.crop(cropX, cropY, cropW, cropH);
  await image.writeAsync(outputPath);

  console.log(`${inputPath} -> ${outputPath} (${cropW}x${cropH}, from ${width}x${height})`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
