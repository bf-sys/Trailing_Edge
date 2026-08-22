// One-off measurement helper: estimate a meteoroid-style sprite's facing
// angle (ember-trail centroid -> rock centroid vector, degrees, image
// coords) so hazardConfig.ts's spriteFacingOffsetRadians can be recalibrated
// after the art changes. Not part of the regular asset-prep pipeline.
//
// Usage: node measure-facing-angle.js <input.png>

const Jimp = require('jimp');

async function measure(inputPath) {
  const img = await Jimp.read(inputPath);
  const { width, height } = img.bitmap;

  let emberSumX = 0, emberSumY = 0, emberCount = 0;
  let rockSumX = 0, rockSumY = 0, rockCount = 0;
  let allSumX = 0, allSumY = 0, allCount = 0;

  img.scan(0, 0, width, height, function (x, y, idx) {
    const r = this.bitmap.data[idx + 0];
    const g = this.bitmap.data[idx + 1];
    const b = this.bitmap.data[idx + 2];
    const a = this.bitmap.data[idx + 3];
    if (a < 128) return;

    allSumX += x; allSumY += y; allCount++;

    const warm = (r - b) > 70 && r > 140;
    if (warm) {
      emberSumX += x; emberSumY += y; emberCount++;
    } else {
      rockSumX += x; rockSumY += y; rockCount++;
    }
  });

  const emberCx = emberSumX / emberCount, emberCy = emberSumY / emberCount;
  const rockCx = rockSumX / rockCount, rockCy = rockSumY / rockCount;
  const allCx = allSumX / allCount, allCy = allSumY / allCount;

  const dx = rockCx - emberCx;
  const dy = rockCy - emberCy;
  const angleDeg = Math.atan2(dy, dx) * 180 / Math.PI;

  // PCA principal-axis angle over all opaque pixels, for cross-check.
  let sxx = 0, syy = 0, sxy = 0;
  img.scan(0, 0, width, height, function (x, y, idx) {
    const a = this.bitmap.data[idx + 3];
    if (a < 128) return;
    const dx2 = x - allCx, dy2 = y - allCy;
    sxx += dx2 * dx2; syy += dy2 * dy2; sxy += dx2 * dy2;
  });
  const theta = 0.5 * Math.atan2(2 * sxy, sxx - syy) * 180 / Math.PI;

  console.log(`image: ${width}x${height}, opaque px: ${allCount}`);
  console.log(`ember centroid: (${emberCx.toFixed(1)}, ${emberCy.toFixed(1)}) n=${emberCount}`);
  console.log(`rock centroid:  (${rockCx.toFixed(1)}, ${rockCy.toFixed(1)}) n=${rockCount}`);
  console.log(`ember->rock vector angle: ${angleDeg.toFixed(1)} deg (image coords, y-down)`);
  console.log(`PCA principal-axis angle (mod 180): ${theta.toFixed(1)} deg`);
}

const inputPath = process.argv[2];
if (!inputPath) {
  console.error('Usage: node measure-facing-angle.js <input.png>');
  process.exit(1);
}
measure(inputPath).catch((err) => { console.error(err); process.exit(1); });
