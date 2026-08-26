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

  // Stall-detection safety net (2026-08-26, alongside HazardZoneElement's
  // own per-frame velocity redrive fix -- see that file's update() comment
  // for the confirmed bug this covers). A 'linear'/'trochoid' hazard is
  // never supposed to sit still; if one moves less than
  // stallDisplacementThresholdPx in a single frame for
  // stallTimeoutSeconds straight, MovingHazardManager treats it the same as
  // drifting out of bounds and force-repositions it. Expected to almost
  // never fire post-fix -- this is defense-in-depth against any other
  // not-yet-discovered way a hazard's motion could get wedged, not the
  // primary fix. stallTimeoutSeconds is short on purpose: unlike the ship,
  // these hazards have no legitimate reason to ever be stationary, so
  // there's no normal-play case this could false-positive against.
  stallDisplacementThresholdPx: number;
  stallTimeoutSeconds: number;
}

export const movingHazardConfig: MovingHazardConfig = {
  objectiveJitterRadius: 350,
  routeBiasMin: 0.5,
  routeBiasMax: 1,
  stallDisplacementThresholdPx: 2,
  stallTimeoutSeconds: 0.75,
};

registerTuning('movingHazard', movingHazardConfig);
