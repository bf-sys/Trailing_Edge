import { registerTuning } from './devTuning';

// Instant hit-feedback flash (see ShipDamageFlash.ts) -- the "damage
// splat/feedback" item docs/reference/phaser-vfx-notes.md's mapping table
// names. A red-filled duplicate of the ship, revealed through an expanding
// circular mask centered on an approximate impact point (the hazard's own
// position at the moment of the hit -- not a precise pixel, per owner
// direction) rather than a flat full-ship tint, so the ship's own art stays
// visible everywhere the reveal hasn't reached yet. Distinct from the
// persistent low-structure state (ship_damage_overlay flipbook) that same
// doc also names -- that's a separate, still-unbuilt follow-up.
export const shipDamageFlashConfig = {
  color: 0xff3030,
  peakAlpha: 0.85,
  growMs: 90, // time for the reveal to spread from the impact point across the whole ship
  holdMs: 120, // time held at full reveal before fading starts -- re-armed by every new hit, so sustained contact (a continuous hazard) reads as a held flash rather than flickering
  fadeMs: 160, // time to fade from peakAlpha back to fully hidden once hits stop
  depth: 11, // above PlayerShip (10), below ShipStatusArcs (15) -- matches resupplyVfxConfig.beamDepth's precedent
};

registerTuning('shipDamageFlash', shipDamageFlashConfig);
