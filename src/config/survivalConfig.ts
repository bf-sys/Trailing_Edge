import { registerTuning } from './devTuning';

// Structure is the fail resource (repaired by ResupplyPoint contact only);
// energy is a passively-regenerating, ability-gating resource that never
// fails the level on its own (GDD §5).
//
// energyRegenPerSecond dropped 8 -> 2 (2026-08-24, energy-node brainstorm):
// deliberately weakened passive regen so EnergyNodeElement pickups
// (energyNodeConfig.ts) matter as a routing decision instead of being pure
// upside on top of an already-adequate trickle. hazardConfig.ts's
// energy-drain hazards were calibrated to outdrain the old 8/s baseline —
// they outdrain this lower one even more clearly, so no hazard-side change
// was needed alongside this drop.
export const survivalConfig = {
  maxEnergy: 100,
  maxStructure: 100,
  energyRegenPerSecond: 2,
  structureRepairPerSecond: 20, // AsteroidField repair rate while overlapping
};

registerTuning('survival', survivalConfig);
