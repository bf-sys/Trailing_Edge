import { registerTuning } from './devTuning';

// Tunables for MovingHazardManager (GDD §9/§11.3 -- Ion Storm/Meteoroid,
// the two 'linear' movementPattern hazards). See that class for the
// wrap-on-exit + objective-biased respawn design.
export interface MovingHazardConfig {
  // Radius (px) of the random offset applied to the aim point (see
  // routeBiasMin/Max below) when picking the point a respawned hazard's
  // straight-line path is aimed through. 0 would mean every respawn
  // beelines exactly at that point (reads as cheap/unfair, trivially
  // predictable); too large washes out the bias entirely and degenerates
  // into a uniformly random heading. This value is a felt/playtesting call,
  // not derived from anything else -- expect to retune once real levels
  // use it.
  objectiveJitterRadius: number;

  // 2026-08-25 (user request -- "presence" pass): the pre-jitter aim point
  // used to be the current objective's exact location every time. On a
  // large level that's a single fixed point the player often isn't
  // anywhere near yet -- most of a run is spent in the corridor leading up
  // to an objective, not standing on it. routeBiasMin/Max instead sample a
  // point somewhere along the live segment from the player's *current*
  // position to the objective (t=0 is the player, t=1 is the objective),
  // re-rolled fresh on every respawn -- so aim points land throughout the
  // corridor the player is actually traveling, not just at its far end.
  // Kept biased toward the objective end (0.5-1.0, not 0-1.0)
  // so it still reads as "heading toward where you're going," not a pure
  // random point between here and there. Falls back to the plain objective
  // target (equivalent to both = 1) if no ship exists yet.
  routeBiasMin: number;
  routeBiasMax: number;
}

export const movingHazardConfig: MovingHazardConfig = {
  objectiveJitterRadius: 350,
  routeBiasMin: 0.5,
  routeBiasMax: 1,
};

registerTuning('movingHazard', movingHazardConfig);
