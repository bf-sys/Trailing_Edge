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
  activation: HazardActivation;
  pulseIntervalSeconds?: number;
  resourceCost: { energy: number; structure: number };
  blocksMovement?: boolean;
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
  // behavioral difference: a slow linear drift vs. fully static.
  ionStorm: {
    textureKey: 'hazard_ion_storm',
    displayName: 'ION STORM',
    shape: { kind: 'circle', radius: 90 },
    movementPattern: 'linear',
    speed: 15,
    headingRadians: Math.PI,
    activation: 'continuous',
    resourceCost: { energy: 15, structure: 0 }, // net -7/s against regen
  },

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
  // the structure-vs-energy asymmetry.
  meteoroid: {
    textureKey: 'hazard_meteoroid',
    displayName: 'METEOROID',
    shape: { kind: 'circle', radius: 26 },
    movementPattern: 'linear',
    speed: 60,
    headingRadians: 0,
    // hazard_meteoroid.png's rock+ember-trail art faces up-and-right at
    // zero rotation, not due east -- measured from the sprite's own pixel
    // data (ember-trail centroid to rock centroid) at ~30.3 deg above the
    // horizontal, rounded to the nearest clean angle, same "measure the
    // art, name the offset" approach shipConfig.ts's comment describes.
    spriteFacingOffsetRadians: Math.PI / 6,
    activation: 'continuous',
    resourceCost: { energy: 0, structure: 25 },
  },
};

registerTuning('hazard', hazardConfig);
