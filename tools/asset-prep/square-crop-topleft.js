#!/usr/bin/env node
// Corner-anchored square crop, for UI corner tiles that need to stay a
// fixed, consistent footprint under 90-degree rotation reuse (see
// WindowFrame's corner tile, which rotates one image 90/180/270 degrees to
// form all 4 corners of a 9-slice window). square-crop.js center-crops,
// which would cut a corner-anchored elbow shape off-center; this crops
// from the top-left origin instead, keeping the elbow intact, and is
// intended to be sized tightly around the elbow's own arm thickness (not
// the full asset) so the corner tile doesn't visually overhang into the
// window's interior beyond where the border actually sits -- the long
// straight-arm content beyond the elbow is redundant with what the tiled
// edge piece already provides.
//
// Usage: node square-crop-topleft.js <input> <output> <size>

const Jimp = require('jimp');

async function main() {
  const [, , inputPath, outputPath, sizeArg] = process.argv;
  if (!inputPath || !outputPath || !sizeArg) {
    console.error('Usage: node square-crop-topleft.js <input> <output> <size>');
    process.exit(1);
  }
  const size = parseInt(sizeArg, 10);

  const image = await Jimp.read(inputPath);
  const { width, height } = image.bitmap;
  if (size > width || size > height) {
    throw new Error(`Requested crop size ${size} exceeds source dimensions ${width}x${height}`);
  }

  image.crop(0, 0, size, size);
  await image.writeAsync(outputPath);

  console.log(`${inputPath} -> ${outputPath} (${size}x${size}, from ${width}x${height})`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
