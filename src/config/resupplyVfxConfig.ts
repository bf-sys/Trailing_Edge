import { registerTuning } from './devTuning';
import { shipStatusArcConfig } from './shipStatusArcConfig';

// Repair-laser beam + spark VFX (2026-08-24, alongside AsteroidField/
// ResupplyPoint becoming a solid blocksMovement obstacle -- see
// ResupplyPoint.ts). Color reuses shipStatusArcConfig.structureColor/
// hudConfig.resupplyMarkerColor's existing "this is about structure" hue
// rather than picking a new one, so the language stays consistent
// everywhere it shows up in the HUD.
export const resupplyVfxConfig = {
  color: shipStatusArcConfig.structureColor,
  hotColor: 0xffffff,

  beamWidth: 2,
  beamAlpha: 0.85,
  beamDepth: 11, // above PlayerShip's depth of 10, below ShipStatusArcs's 15

  // How far past the physical collision radius the ship still counts as
  // "in range to repair." Needed now that the asteroid also blocksMovement:
  // Arcade's collision separation keeps the ship's center outside the solid
  // radius, so requiring literal overlap would mean repair could almost
  // never actually trigger (the same shape of problem Meteoroid's
  // knockback/cancelTargetOnContact work addressed for hazard contact).
  // Raised 40 -> 70 (2026-08-27, owner report) -- the margin Arcade's own
  // separation left the ship sitting in read as too tight/fiddly to repair
  // in, compounding the cancelTargetOnContact juddering fixed alongside
  // this in ResupplyPoint.ts.
  rangeBuffer: 70,

  // How far inside the asteroid's own radius a repair session's impact
  // point can land -- kept below 1 so the beam always visibly terminates
  // inside the rock's silhouette rather than right at its edge.
  impactRadiusFactor: 0.65,

  sparkTextureSize: 10,
  sparkLifespanMs: 220,
  sparkSpeed: { min: 30, max: 70 },
  sparkScaleStart: 0.8,
  sparkScaleEnd: 0,
  sparkAlphaStart: 0.9,
  sparkFrequency: 40, // ms between spark emissions while repairing
};

registerTuning('resupplyVfx', resupplyVfxConfig);
