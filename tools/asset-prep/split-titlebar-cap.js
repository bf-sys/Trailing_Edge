#!/usr/bin/env node
// Derives a true end-cap for the window title bar from the already-accepted
// window_titlebar.png (the plain, tileable middle segment -- see
// docs/history/art-eval-log-2026-08-21.md) instead of generating a new
// asset. Measured via a pixel-brightness profile: the texture's own
// decorative divider/bevel detail lives in roughly the first/last 56-60px
// of its 1416px native width, flattening into uniform fill past that, and
// the right edge is a near-exact mirror of the left -- so one crop, reused
// via horizontal flip, serves both title-bar ends. Cropping the cap from
// this same source (not a separately generated image) guarantees an exact
// material/scale match with zero risk of the mismatch that sank the
// AI-generated window_titlebar_cap attempts.
//
// Usage: node split-titlebar-cap.js <input> <capOutput> <middleOutput> <capWidth>

const Jimp = require('jimp');

async function main() {
  const [, , inputPath, capOutputPath, middleOutputPath, capWidthArg] = process.argv;
  if (!inputPath || !capOutputPath || !middleOutputPath || !capWidthArg) {
    console.error('Usage: node split-titlebar-cap.js <input> <capOutput> <middleOutput> <capWidth>');
    process.exit(1);
  }
  const capWidth = parseInt(capWidthArg, 10);

  const image = await Jimp.read(inputPath);
  const { width, height } = image.bitmap;
  if (capWidth * 2 >= width) {
    throw new Error(`capWidth ${capWidth} leaves no room for a middle segment in a ${width}px-wide source`);
  }

  const cap = image.clone().crop(0, 0, capWidth, height);
  await cap.writeAsync(capOutputPath);

  const middle = image.clone().crop(capWidth, 0, width - capWidth * 2, height);
  await middle.writeAsync(middleOutputPath);

  console.log(`${inputPath} (${width}x${height}) -> cap ${capOutputPath} (${capWidth}x${height}), middle ${middleOutputPath} (${width - capWidth * 2}x${height})`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
