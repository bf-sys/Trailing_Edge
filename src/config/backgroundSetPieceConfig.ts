import { registerTuning } from './devTuning';

// Decorative-only background dressing (no gameplay effect, no physics body)
// -- a handful of large, slow-parallax "set piece" images (a planet, a
// distant galaxy, ...) scattered across the level to break up the tiled
// starfield's (StarfieldBackground.ts) monotony. See BackgroundSetPieces.ts.
export const backgroundSetPieceConfig = {
  count: 3, // set pieces placed per level
  minSpacing: 400, // px, minimum distance between placed set pieces
  scrollFactor: 0.08, // slower than the far starfield layer (0.15) -- reads as further away
  depth: -110, // behind the far starfield layer (-100)
  minScale: 0.8,
  maxScale: 1.6,
  minAlpha: 0.5,
  maxAlpha: 0.9,
};

registerTuning('backgroundSetPieces', backgroundSetPieceConfig);
