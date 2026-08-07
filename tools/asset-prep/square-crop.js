#!/usr/bin/env node
// Center-crop an already alpha-keyed PNG down to a square, for hazard/
// object art that will be placed via HazardZoneElement's `circle` shape
// (setDisplaySize() stretches to a square footprint, so a non-square
// source either distorts or needs this crop first). Run AFTER
// chroma-key-trim.js, not on the raw green-screen source -- this only
// trims the longer axis down to the shorter one, centered; it doesn't
// touch alpha/color.
//
// Usage: node square-crop.js <input> <output>

const Jimp = require('jimp');

async function main() {
  const [, , inputPath, outputPath] = process.argv;
  if (!inputPath || !outputPath) {
    console.error('Usage: node square-crop.js <input> <output>');
    process.exit(1);
  }

  const image = await Jimp.read(inputPath);
  const { width, height } = image.bitmap;
  const side = Math.min(width, height);
  const x = Math.round((width - side) / 2);
  const y = Math.round((height - side) / 2);

  image.crop(x, y, side, side);
  await image.writeAsync(outputPath);

  console.log(`${inputPath} -> ${outputPath} (${side}x${side}, from ${width}x${height})`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
