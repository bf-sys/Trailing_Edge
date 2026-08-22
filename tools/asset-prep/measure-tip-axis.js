// One-off measurement helper: find the true tip-to-tip axis of an elongated
// sprite (e.g. meteoroid rock nose <-> ember trail tip) by taking the two
// most extreme opaque pixels along the shape's PCA principal axis, rather
// than a color-classified centroid-to-centroid vector (measure-facing-angle.js)
// which can miss a sharp point if the shape's mass is unevenly distributed.
//
// Usage: node measure-tip-axis.js <input.png>

const Jimp = require('jimp');

async function measure(inputPath) {
  const img = await Jimp.read(inputPath);
  const { width, height } = img.bitmap;

  const pts = [];
  let sumX = 0, sumY = 0;
  img.scan(0, 0, width, height, function (x, y, idx) {
    const a = this.bitmap.data[idx + 3];
    if (a < 128) return;
    pts.push([x, y]);
    sumX += x; sumY += y;
  });
  const cx = sumX / pts.length, cy = sumY / pts.length;

  let sxx = 0, syy = 0, sxy = 0;
  for (const [x, y] of pts) {
    const dx = x - cx, dy = y - cy;
    sxx += dx * dx; syy += dy * dy; sxy += dx * dy;
  }
  const theta = 0.5 * Math.atan2(2 * sxy, sxx - syy);
  const ux = Math.cos(theta), uy = Math.sin(theta);

  let minProj = Infinity, maxProj = -Infinity, minPt = null, maxPt = null;
  for (const [x, y] of pts) {
    const proj = (x - cx) * ux + (y - cy) * uy;
    if (proj < minProj) { minProj = proj; minPt = [x, y]; }
    if (proj > maxProj) { maxProj = proj; maxPt = [x, y]; }
  }

  function classify(x, y) {
    const idx = img.getPixelIndex(x, y);
    const r = img.bitmap.data[idx + 0], g = img.bitmap.data[idx + 1], b = img.bitmap.data[idx + 2];
    return (r - b) > 70 && r > 140 ? 'ember' : 'rock';
  }

  const minClass = classify(...minPt);
  const maxClass = classify(...maxPt);
  console.log(`image: ${width}x${height}, opaque px: ${pts.length}`);
  console.log(`extreme A: (${minPt[0]}, ${minPt[1]}) [${minClass}]`);
  console.log(`extreme B: (${maxPt[0]}, ${maxPt[1]}) [${maxClass}]`);

  // Orient the vector so it points from the ember (trail) extreme toward
  // the rock extreme -- same convention measure-facing-angle.js uses.
  let from = minPt, to = maxPt;
  if (minClass !== 'ember' && maxClass === 'ember') { from = maxPt; to = minPt; }
  const dx = to[0] - from[0], dy = to[1] - from[1];
  const angleDeg = Math.atan2(dy, dx) * 180 / Math.PI;
  console.log(`tip-to-tip (ember-extreme -> rock-extreme) angle: ${angleDeg.toFixed(1)} deg (image coords, y-down)`);
}

const inputPath = process.argv[2];
if (!inputPath) {
  console.error('Usage: node measure-tip-axis.js <input.png>');
  process.exit(1);
}
measure(inputPath).catch((err) => { console.error(err); process.exit(1); });
