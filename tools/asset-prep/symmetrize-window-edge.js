// One-off post-process fix for window_edge.jpg: the AI-generation GER loop
// (see docs/history/art-eval-log-2026-08-21.md) could not converge on a
// vertically non-directional strip after 3 rounds -- attempts to fix a
// top-vs-bottom lighting bias via prompt feedback plateaued, then regressed.
// User-directed decision: fix deterministically instead of spending more
// generation rounds. Finds the strip's vertical bounds (rows that aren't
// chroma-key green), then mirrors the top half of the strip band onto the
// bottom half so the result is exactly vertically symmetric by construction
// -- guarantees zero directional bias, which is the actual requirement
// (this piece gets rotated 90 degrees to also serve as the frame's vertical
// edges, so any brightness asymmetry would show).
const Jimp = require('jimp');
const path = require('path');

const INPUT = path.resolve(__dirname, '../art-reviewer/assets/window_edge.jpg');
const OUTPUT = path.resolve(__dirname, '../art-reviewer/assets/window_edge_symmetrized.jpg');

const GREEN = { r: 0, g: 255, b: 0 };
const GREEN_TOLERANCE = 60; // per-channel

function isGreenish(r, g, b) {
  return (
    Math.abs(r - GREEN.r) < GREEN_TOLERANCE &&
    Math.abs(g - GREEN.g) < GREEN_TOLERANCE &&
    Math.abs(b - GREEN.b) < GREEN_TOLERANCE
  );
}

async function main() {
  const image = await Jimp.read(INPUT);
  const w = image.bitmap.width;
  const h = image.bitmap.height;

  // Sample a handful of columns spread across the width per row to decide
  // whether a row is "mostly green" (background) or "mostly strip" (content).
  const sampleCols = [];
  for (let i = 0; i < 10; i++) sampleCols.push(Math.floor((w - 1) * (i / 9)));

  let minY = null;
  let maxY = null;
  for (let y = 0; y < h; y++) {
    let greenCount = 0;
    for (const x of sampleCols) {
      const { r, g, b } = Jimp.intToRGBA(image.getPixelColor(x, y));
      if (isGreenish(r, g, b)) greenCount++;
    }
    const mostlyGreen = greenCount >= sampleCols.length * 0.8;
    if (!mostlyGreen) {
      if (minY === null) minY = y;
      maxY = y;
    }
  }

  if (minY === null) {
    throw new Error('Could not find any non-green strip content -- aborting.');
  }

  const stripHeight = maxY - minY + 1;
  console.log(`Image ${w}x${h}. Strip band detected: rows ${minY}-${maxY} (height ${stripHeight}).`);

  const out = image.clone();
  for (let i = 0; i < stripHeight; i++) {
    const srcOffset = Math.min(i, stripHeight - 1 - i);
    const srcY = minY + srcOffset;
    const dstY = minY + i;
    if (dstY === srcY) continue;
    for (let x = 0; x < w; x++) {
      const color = image.getPixelColor(x, srcY);
      out.setPixelColor(color, x, dstY);
    }
  }

  await out.writeAsync(OUTPUT);
  console.log(`Wrote symmetrized strip to ${OUTPUT}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
