import { registerTuning } from './devTuning';

// Continuous engine-exhaust trail (docs/reference/phaser-vfx-notes.md's
// "particle emitter" pick for thruster VFX) -- purely decorative, no
// gameplay effect. Separate config module from rocketBoost's own VFX (not
// built yet, docs/TODO.md's "rocket boost thruster/trail" item) so the two
// can end up looking visually distinct -- a modest cruise trail vs. a
// punchier burst flare -- without sharing tunables that would fight each
// other. Color is a placeholder (art-production-guidelines.md's "Not yet
// decided" section: no formal thruster-glow hex is defined yet) chosen to
// avoid colliding with hudConfig/shipStatusArcConfig's existing color
// language, where blue already means "energy" and orange already means
// "structure" -- this effect means neither.
export const thrusterVfxConfig = {
  textureSize: 16, // px, generated soft-glow particle texture
  color: 0xffb347, // warm amber core
  hotColor: 0xffffff, // white-hot center of the generated texture
  speed: { min: 40, max: 90 }, // px/s, particle travel speed away from the ship
  lifespanMs: 260,
  scaleStart: 0.9,
  scaleEnd: 0,
  alphaStart: 0.85,
  alphaEnd: 0,
  frequency: 30, // ms between emissions while thrusting
  angleSpreadDegrees: 18, // cone half-width around the dead-astern direction
  // Below this ship speed, treat the ship as idle/stopped and stop emitting.
  // Approximates docs/reference/phaser-vfx-notes.md's "emit while
  // accelerating, stop when idle" -- ExplorationController doesn't expose a
  // true accelerating-vs-decelerating signal, but "idle" is the distinction
  // that actually reads visually, and idle just means near-zero velocity.
  idleSpeedThreshold: 8, // px/s
  rearOffset: 24, // px behind ship center, along the reverse of travel direction
  depth: 9, // just under PlayerShip's depth of 10 -- exhaust renders behind the ship

  // rocketBoost variant (2026-08-24 follow-up) -- same emitter, same color/
  // texture, just a longer-lived and faster-traveling particle so the burst
  // reads as a longer trail rather than a second VFX. Swapped in/out via
  // ShipThrusterTrail's own isBoosting() check on ExplorationController --
  // not a separate emitter.
  boostLifespanMs: 550,
  boostSpeed: { min: 90, max: 160 },
};

registerTuning('thrusterVfx', thrusterVfxConfig);
