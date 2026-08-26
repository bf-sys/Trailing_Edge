import { registerTuning } from './devTuning';

// Hard-fail death burst (owner request, 2026-08-26) -- a quick arcade-style
// explosion masking the ship's disappearance, with the level restart
// delayed until it finishes (see ShipExplosionVfx.ts and GameScene's
// wireHardFailRestart()). Particle burst + light camera shake, no debris
// scatter -- considered and explicitly declined (owner: the burst alone
// "looks great"), so this is the settled design, not a placeholder.
export const shipExplosionVfxConfig = {
  textureSize: 20,
  color: 0xff5a1f, // fiery orange
  hotColor: 0xffffff,
  particleCount: 36,
  speed: { min: 60, max: 220 },
  lifespanMs: 500,
  scaleStart: 1.1,
  scaleEnd: 0,
  alphaStart: 1,
  alphaEnd: 0,
  depth: 12, // above ShipDamageFlash (11), below ShipStatusArcs (15)
  shakeDurationMs: 220,
  shakeIntensity: 0.012, // Phaser camera-shake intensity, fraction of viewport size
  // Total time GameScene waits before restarting -- kept slightly above
  // lifespanMs so no particle visibly vanishes mid-flight when the scene
  // tears down.
  totalDurationMs: 650,
};

registerTuning('shipExplosionVfx', shipExplosionVfxConfig);
