import { registerTuning } from './devTuning';

// Structure is the fail resource (repaired by ResupplyPoint contact only);
// energy is a passively-regenerating, ability-gating resource that never
// fails the level on its own (GDD §5).
export const survivalConfig = {
  maxEnergy: 100,
  maxStructure: 100,
  energyRegenPerSecond: 8,
  structureRepairPerSecond: 20, // AsteroidField repair rate while overlapping
};

registerTuning('survival', survivalConfig);
