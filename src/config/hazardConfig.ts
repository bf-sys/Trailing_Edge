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
  shape: HazardShape;
  movementPattern: HazardMovementPattern;
  speed: number;
  headingRadians?: number;
  activation: HazardActivation;
  pulseIntervalSeconds?: number;
  resourceCost: { energy: number; structure: number };
  blocksMovement?: boolean;
  // Solar Flare/Ion Storm/Nebula Field/Meteoroid have no sourced art yet
  // (docs/STATUS.md) -- GameScene generates a flat placeholder circle
  // texture at this color/alpha under `textureKey`. Debris Field omits this
  // field since it already has final sourced art loaded by BootScene.
  placeholderTexture?: { color: number; alpha: number };
}

export type HazardType = 'debrisField' | 'solarFlare' | 'ionStorm' | 'nebulaField' | 'meteoroid';

export const hazardConfig: Record<HazardType, HazardTypeConfig> = {
  // Re-scoped 2026-08-07 (GDD §9/§11.3): movement-blocking obstacle, zero
  // resource drain -- naturally-occurring rock/ice debris, not a drain zone.
  debrisField: {
    textureKey: 'debris_large',
    shape: { kind: 'circle', radius: 60 },
    movementPattern: 'static',
    speed: 0,
    activation: 'continuous',
    resourceCost: { energy: 0, structure: 0 },
    blocksMovement: true,
  },

  solarFlare: {
    textureKey: 'hazard_solar_flare',
    shape: { kind: 'circle', radius: 70 },
    movementPattern: 'static',
    speed: 0,
    activation: 'pulsed',
    pulseIntervalSeconds: 2.5,
    resourceCost: { energy: 12, structure: 0 },
    placeholderTexture: { color: 0xff6644, alpha: 0.55 },
  },

  // Same visual family as Nebula Field (GDD §9) -- motion is the only
  // behavioral difference: a slow linear drift vs. fully static.
  ionStorm: {
    textureKey: 'hazard_ion_storm',
    shape: { kind: 'circle', radius: 90 },
    movementPattern: 'linear',
    speed: 15,
    headingRadians: Math.PI,
    activation: 'continuous',
    resourceCost: { energy: 6, structure: 0 },
    placeholderTexture: { color: 0x6a6aff, alpha: 0.4 },
  },

  nebulaField: {
    textureKey: 'hazard_nebula_field',
    shape: { kind: 'circle', radius: 100 },
    movementPattern: 'static',
    speed: 0,
    activation: 'continuous',
    resourceCost: { energy: 6, structure: 0 },
    placeholderTexture: { color: 0x9966cc, alpha: 0.4 },
  },

  // The sole structure-draining open-world hazard (GDD §9, since Debris
  // Field's 2026-08-07 re-scope) -- carries the real fail-stakes side of
  // the structure-vs-energy asymmetry.
  meteoroid: {
    textureKey: 'hazard_meteoroid',
    shape: { kind: 'circle', radius: 26 },
    movementPattern: 'linear',
    speed: 60,
    headingRadians: 0,
    activation: 'continuous',
    resourceCost: { energy: 0, structure: 25 },
    placeholderTexture: { color: 0x998877, alpha: 1 },
  },
};

registerTuning('hazard', hazardConfig);
