// Chroma-key removal + auto-trim for art generated against a solid bright
// #00FF00 background (the convention art-generator-agent.md/art-director-agent.md
// prompt for). Keys out the green background to alpha transparency, despills
// green fringe from the surviving edge pixels, then autocrops to the opaque
// content's bounding box (plus a small pad) so the exported PNG matches this
// project's asset/gameplay-size-decoupling convention (CLAUDE.md) — display
// size is authored config, never derived from the sprite's native pixel size.
//
// Usage: node chroma-key.js <input.jpg> <output.png> [padPixels=4]

const Jimp = require('jimp');

const KEY = { r: 0, g: 255, b: 0 };

// "Excess green" chroma-key classification: how far green sits above the
// stronger of red/blue. Pure background scores ~255; opaque, non-green
// subject pixels score at or below 0.
function excessGreen(r, g, b) {
  return g - Math.max(r, b);
}

async function chromaKey(inputPath, outputPath, padPixels = 4) {
  const img = await Jimp.read(inputPath);
  const { width, height } = img.bitmap;

  // Two-band threshold: anything at/above HIGH is pure background (alpha 0);
  // anything at/below LOW is treated as fully opaque subject; the band
  // between gets a linear alpha ramp so edges anti-alias instead of
  // hard-cutting. Tuned against this project's actual generated output
  // (solid green fill, JPEG edge noise in the ~10-40 unit range per
  // art-evaluator-agent.md's own pixel-sampling findings).
  const HIGH = 90;
  const LOW = 20;

  img.scan(0, 0, width, height, function (x, y, idx) {
    const r = this.bitmap.data[idx + 0];
    const g = this.bitmap.data[idx + 1];
    const b = this.bitmap.data[idx + 2];
    const eg = excessGreen(r, g, b);

    let alpha;
    if (eg >= HIGH) alpha = 0;
    else if (eg <= LOW) alpha = 255;
    else alpha = Math.round(255 * (1 - (eg - LOW) / (HIGH - LOW)));

    // Despill: cap green at max(r,b) so any surviving semi-transparent edge
    // pixel doesn't carry a green tint once composited over the game's dark
    // background. Harmless on pixels that were never green-key-like.
    const despilledG = Math.min(g, Math.max(r, b));

    this.bitmap.data[idx + 0] = r;
    this.bitmap.data[idx + 1] = despilledG;
    this.bitmap.data[idx + 2] = b;
    this.bitmap.data[idx + 3] = alpha;
  });

  // jimp's built-in autocrop() compares border pixels to the corner color
  // with a near-zero default tolerance, meant for solid-color opaque
  // borders — it doesn't reliably trim an alpha-keyed background, because
  // ordinary JPEG noise in the now-transparent (but not perfectly uniform)
  // background RGB values reads as "different enough" to block the trim.
  // Compute the opaque bounding box directly from the alpha channel instead.
  const ALPHA_OPAQUE_THRESHOLD = 8; // treat near-zero alpha as background
  let minX = width, minY = height, maxX = -1, maxY = -1;
  img.scan(0, 0, width, height, function (x, y, idx) {
    if (this.bitmap.data[idx + 3] > ALPHA_OPAQUE_THRESHOLD) {
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
  });

  if (maxX < 0) {
    throw new Error(`${inputPath}: no non-background pixels found — key thresholds may be wrong for this image`);
  }

  const cropW = maxX - minX + 1;
  const cropH = maxY - minY + 1;
  const cropped = img.clone().crop(minX, minY, cropW, cropH);

  // Re-pad a few transparent pixels on each side so downstream rotation/
  // compositing (per the Nebula/Ion Storm cloud-art guidance's eventual
  // per-instance rotation) doesn't clip the silhouette at the canvas edge.
  const out = new Jimp(cropW + padPixels * 2, cropH + padPixels * 2, 0x00000000);
  out.composite(cropped, padPixels, padPixels);
  await out.writeAsync(outputPath);
  return { width: out.bitmap.width, height: out.bitmap.height };
}

if (require.main === module) {
  const [, , inputPath, outputPath, padArg] = process.argv;
  if (!inputPath || !outputPath) {
    console.error('Usage: node chroma-key.js <input.jpg> <output.png> [padPixels=4]');
    process.exit(1);
  }
  chromaKey(inputPath, outputPath, padArg !== undefined ? parseInt(padArg, 10) : 4)
    .then((dims) => console.log(`Wrote ${outputPath} (${dims.width}x${dims.height})`))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}

module.exports = { chromaKey };
