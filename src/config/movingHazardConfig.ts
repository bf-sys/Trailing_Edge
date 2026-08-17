import { registerTuning } from './devTuning';

// Tunables for MovingHazardManager (GDD §9/§11.3 -- Ion Storm/Meteoroid,
// the two 'linear' movementPattern hazards). See that class for the
// wrap-on-exit + objective-biased respawn design.
export interface MovingHazardConfig {
  // Radius (px) of the random offset applied to the current objective
  // target when picking the point a respawned hazard's straight-line path
  // is aimed through. 0 would mean every respawn beelines exactly at the
  // objective (reads as cheap/unfair, trivially predictable); too large
  // washes out the bias entirely and degenerates into a uniformly random
  // heading. This value is a felt/playtesting call, not derived from
  // anything else -- expect to retune once real levels use it.
  objectiveJitterRadius: number;
}

export const movingHazardConfig: MovingHazardConfig = {
  objectiveJitterRadius: 350,
};

registerTuning('movingHazard', movingHazardConfig);
