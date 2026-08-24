import { registerTuning } from './devTuning';

// Moment-to-moment energy pickups (added 2026-08-24) -- SubSpace's
// "greens," scaled down: a fixed pool of pickups scattered around the
// level, each granting a flat energy amount on contact and reappearing
// elsewhere after a short cooldown once collected. Exists to turn energy
// from "wait for passive regen" into a routing decision (Meso/Exploration
// pillar), alongside dropping survivalConfig.energyRegenPerSecond 8 -> 2 so
// the pickups actually matter instead of being pure upside on an already-
// adequate trickle.
export const energyNodeConfig = {
  // How many nodes are live on a level at once -- a global tunable, not
  // per-level authored data, since placement itself is fully procedural
  // (chosen specifically so this feature needs zero per-level content work).
  poolSize: 5,
  rechargeAmount: 10, // flat energy granted per pickup
  respawnCooldownSeconds: 6,
  radius: 16,

  // Rejection-sampling keep-out, checked for both the initial scatter and
  // every respawn: never land inside a blocksMovement hazard's own
  // footprint (unreachable/pointless), and never land within
  // entryKeepOutRadius of the level's Entry Wormhole (a free pickup right
  // at the spawn point every run would trivialize the first few seconds).
  entryKeepOutRadius: 300,
  hazardKeepOutBuffer: 40, // extra clearance beyond a blocksMovement hazard's own radius
  // Never land within this distance (px) of any level boundary -- added
  // 2026-08-24 after playtesting found respawns (which bias toward the
  // current objective, not away from map edges) landing visibly flush
  // against the wall when an objective sits near one.
  edgeMargin: 200,
  placementAttempts: 20, // retry cap before a candidate position is accepted unchecked

  // Respawn position is weighted toward the current objective -- the same
  // aim-a-point-near-the-target-plus-jitter idea as
  // MovingHazardManager.objectiveJitterRadius, except here the jittered
  // point IS the landing position (a scatter radius), not a heading to aim
  // a straight-line path through.
  respawnJitterRadius: 600,
};

registerTuning('energyNode', energyNodeConfig);
