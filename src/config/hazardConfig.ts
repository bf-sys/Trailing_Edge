import { registerTuning } from './devTuning';
import type { HazardActivation, HazardMovementPattern, HazardShape } from '../objects/HazardZoneElement';

// Per-hazard-type tunables (GDD §11.3's "one class, five content configs"
// collapse) -- shape/movement/activation/resourceCost for each of the five
// named hazards (Debris Field, Solar Flare, Ion Storm, Nebula Field,
// Meteoroid). Extracted from GameScene.create()'s inline literals per
// CLAUDE.md's tunable-parameters convention, which names "hazard ...
// costs" explicitly as belonging in a per-subsystem config module, never
// inline in a class's/Scene's logic -- the same convention every other
// subsystem (shipConfig, survivalConfig, abilityConfig, puzzleConfig, ...)
// already follows.
//
// Deliberately excludes x/y placement: per-level object *position* is
// authored level content (GDD §11.7), not a global tunable default, and
// stays in GameScene.ts's level-000 test-scene placements (Phase 2b will
// move it into real per-level config files). Only the hazard-type-level
// defaults below -- the part that's the same regardless of which level
// places an instance -- belongs in this module.
export interface HazardTypeConfig {
  textureKey: string;
  // Player-facing name shown by scan's hazard-ID overlay (2026-08-14 ability
  // rework, docs/ability-rework-brainstorm-2026-08-14.md) -- the fix for
  // Ion Storm/Nebula Field being visually hard to tell apart at a glance.
  displayName: string;
  shape: HazardShape;
  movementPattern: HazardMovementPattern;
  speed: number;
  headingRadians?: number;
  // Corrects a 'linear' hazard's sprite rotation so it visually faces its
  // direction of travel, the same spriteFacingOffsetRadians pattern
  // shipConfig.ts already uses (rotation = heading + offset). Native art
  // orientation varies per sprite, so this is per-hazard-type, not derived.
  // Unset means "don't rotate the sprite from its authored/default
  // orientation" -- correct for movementPattern: 'static' hazards, and for
  // Ion Storm, whose swirl art doesn't read as facing any particular way.
  spriteFacingOffsetRadians?: number;
  // Continuous cosmetic spin (added 2026-08-21, Ion Storm), independent of
  // spriteFacingOffsetRadians/heading -- see HazardZoneConfig's comment.
  spinRadiansPerSecond?: number;
  activation: HazardActivation;
  pulseIntervalSeconds?: number;
  hitCooldownSeconds?: number;
  resourceCost: { energy: number; structure: number };
  blocksMovement?: boolean;
  cancelTargetOnContact?: boolean;
  knockbackSpeed?: number;
  // Solar Flare has no sourced art yet (docs/STATUS.md) -- GameScene
  // generates a flat placeholder circle texture at this color/alpha under
  // `textureKey`. Debris Field, Ion Storm, Nebula Field, and Meteoroid all
  // omit this field since they have final sourced art loaded by BootScene
  // (Ion Storm/Nebula Field/Meteoroid added 2026-08-20 via the art
  // Generate-Evaluate-Refine loop, docs/STATUS.md's 2026-08-19/20 entries).
  placeholderTexture?: { color: number; alpha: number };
}

export type HazardType = 'debrisField' | 'solarFlare' | 'ionStorm' | 'nebulaField' | 'meteoroid';

export const hazardConfig: Record<HazardType, HazardTypeConfig> = {
  // Re-scoped 2026-08-07 (GDD §9/§11.3): movement-blocking obstacle, zero
  // resource drain -- naturally-occurring rock/ice debris, not a drain zone.
  debrisField: {
    textureKey: 'debris_large',
    displayName: 'DEBRIS FIELD',
    shape: { kind: 'circle', radius: 60 },
    movementPattern: 'static',
    speed: 0,
    activation: 'continuous',
    resourceCost: { energy: 0, structure: 0 },
    blocksMovement: true,
  },

  // 2026-08-11: energy costs below bumped so all three energy-draining
  // hazards clearly outdrain survivalConfig.energyRegenPerSecond (8/s) --
  // at the old values (solarFlare avg 4.8/s, ionStorm/nebulaField 6/s),
  // passive regen ran ahead of drain every frame (regenEnergy() runs before
  // hazard update() in GameScene.update()), so the energy bar visibly held
  // near max instead of draining. No regen-side change made -- regen is
  // already the smallest lever in the system, and "weaker regen inside a
  // hazard" is equivalent to a bigger hazard-side number anyway.
  solarFlare: {
    textureKey: 'hazard_solar_flare',
    displayName: 'SOLAR FLARE',
    shape: { kind: 'circle', radius: 70 },
    movementPattern: 'static',
    speed: 0,
    activation: 'pulsed',
    pulseIntervalSeconds: 2.5,
    resourceCost: { energy: 28, structure: 0 }, // 11.2/s avg, delivered as a visible ~28% chunk per pulse
    placeholderTexture: { color: 0xff6644, alpha: 0.55 },
  },

  // Same visual family as Nebula Field (GDD §9) -- motion is the only
  // behavioral difference: a slow linear drift vs. fully static. Size/speed
  // bumped 2026-08-21 (same "make it a little bigger and faster" pass as
  // Meteoroid) -- no collision change, still pure fly-through/drain, no
  // blocksMovement. Kept well under Meteoroid's 140 px/s so it still reads
  // as a *drift*, not a threat requiring reflexes -- the GDD's "slow-moving
  // hazard area" framing for Ion Storm vs. Nebula Field's fully static one
  // is unchanged, just more visibly in motion than the old barely-there 15.
  ionStorm: {
    textureKey: 'hazard_ion_storm',
    displayName: 'ION STORM',
    shape: { kind: 'circle', radius: 110 },
    movementPattern: 'linear',
    speed: 30,
    headingRadians: Math.PI,
    // Swirling-cloud spin (2026-08-21, tuned same day: 8s -> 16s -> 24s) --
    // clockwise, one full rotation every 24s. Purely cosmetic (doesn't
    // touch the circular collision body, which is rotation-invariant);
    // independent of headingRadians, so it spins in place regardless of
    // drift direction.
    spinRadiansPerSecond: (Math.PI * 2) / 24,
    activation: 'continuous',
    resourceCost: { energy: 15, structure: 0 }, // net -7/s against regen
  },

  // Three sourced art variants as of 2026-08-21 (hazard_nebula_field,
  // hazard_nebula_field_alt2, hazard_nebula_field_alt3 -- the latter two
  // from the multi-variant GER pass docs/reference/art-production-guidelines.md
  // called for, mirroring debrisField's alt2/alt3 precedent above), cycled
  // per-placement via HazardPlacement.textureKey in level files that chain
  // multiple Nebula Field instances -- this textureKey is just the default
  // for a placement that doesn't override it.
  nebulaField: {
    textureKey: 'hazard_nebula_field',
    displayName: 'NEBULA FIELD',
    shape: { kind: 'circle', radius: 100 },
    movementPattern: 'static',
    speed: 0,
    activation: 'continuous',
    resourceCost: { energy: 15, structure: 0 }, // matches ionStorm -- same family, same rate
  },

  // The sole structure-draining open-world hazard (GDD §9, since Debris
  // Field's 2026-08-07 re-scope) -- carries the real fail-stakes side of
  // the structure-vs-energy asymmetry. Collision rework (2026-08-21): now a
  // blocksMovement solid collider (ship physically bounces off instead of
  // flying through it) that also deals a one-time impact hit rather than a
  // per-second drain -- hitCooldownSeconds stops repeat hits while Arcade's
  // collision separation is still shoving the ship clear.
  meteoroid: {
    textureKey: 'hazard_meteoroid',
    displayName: 'METEOROID',
    shape: { kind: 'circle', radius: 40 },
    movementPattern: 'linear',
    speed: 140,
    headingRadians: 0,
    // hazard_meteoroid.png's rock+ember-trail art faces down-and-left at
    // zero rotation, not due east -- measured from the sprite's own pixel
    // data (ember-trail centroid to rock centroid) at ~150 deg (image
    // coords), same "measure the art, name the offset" approach
    // shipConfig.ts's comment describes. Recalibrated 2026-08-22 when the
    // sprite was regenerated to fix a misaligned ember trail (the previous
    // art's trail ran at a shallower angle than the rock body's own long
    // axis; this version's trail runs collinear with it, but the
    // regeneration also happened to flip the rock/trail layout roughly
    // 180 degrees on the canvas, hence the sign flip from the old +30 deg
    // value, not a mistake).
    spriteFacingOffsetRadians: -(5 * Math.PI) / 6,
    activation: 'impact',
    hitCooldownSeconds: 1,
    resourceCost: { energy: 0, structure: 25 },
    blocksMovement: true,
    // Experimental (2026-08-21) -- see HazardZoneConfig's comment. Playtest
    // feedback: hitting Meteoroid head-on felt "stuck" rather than bounced
    // off, because click-to-move kept re-steering into it every frame.
    cancelTargetOnContact: true,
    // Follow-up (2026-08-21): cancelTargetOnContact alone stops the ship
    // dead against the hazard rather than bouncing it off (Arcade
    // separation has zero restitution, confirmed via the earlier A/B) --
    // hard to clear by normal acceleration (700 px/s^2) while still
    // touching the collider. shipConfig.maxSpeed (260) is the effective
    // ceiling here -- setVelocity() gets silently clamped to it by the
    // ship body's own setMaxVelocity() cap, so anything higher is wasted --
    // set to that ceiling directly after playtesting asked for more
    // distance than 220 gave. Covers ~37.6px before deceleration
    // (900 px/s^2) brings it to rest (v^2/2a), clearing the hazard's 40px
    // radius plus the ship's ~23-28px half-extent with real margin.
    // Direction was also changed the same playtesting pass: perpendicular
    // to the hazard's line of travel rather than radially outward from its
    // center (see applyKnockback()'s comment in HazardZoneElement.ts) --
    // a straight-on hit's radial direction is just "back the way the ship
    // came," which a still-moving hazard simply catches back up to.
    knockbackSpeed: 260,
  },
};

registerTuning('hazard', hazardConfig);
