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
  // How many nodes are live on a level at once scales with level area
  // (2026-08-25) rather than being one fixed number -- a flat count tuned
  // against a small map reads as sparse on a much bigger one (spacing
  // between pickups grows with the map, since area grows with the square
  // of a level's linear dimensions under this project's "uniform scale-up"
  // sizing convention, level-design-guide.md §2). Still a global tunable,
  // not per-level authored data (placement itself stays fully procedural,
  // so this needs zero per-level content work either way) -- see
  // computeEnergyNodePoolSize below for the formula. baselinePoolSize/
  // Width/Height anchor the scale to the test level's 2400x1350 footprint
  // (also level-001's, identically sized) -- the actual size this feature
  // was tuned and playtested against on 2026-08-24 (CLAUDE.md's Current
  // project state), rather than re-deriving a density from scratch.
  baselinePoolSize: 5,
  baselineWidth: 2400,
  baselineHeight: 1350,
  minPoolSize: 5, // floor -- never fewer nodes than this, even on a level smaller than baseline
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

  // Cap on how many *live* nodes may sit within respawnJitterRadius of the
  // current objective at once (2026-08-25, addresses pool size now scaling
  // with level area) -- once that many are already stationed there, further
  // respawns fall back to pickScatterPosition()'s plain uniform placement
  // instead of piling on. Without this, every respawn from every node in
  // the pool biases toward the same single point, so a large pool (a big
  // level) could gradually accumulate a comically dense pickup cluster at
  // one objective the longer a player lingers near it. Deliberately equal
  // to baselinePoolSize: at the baseline level size the whole pool already
  // fits under this cap, so behavior there is unchanged from before this
  // cap existed -- only pools scaled up past baseline are actually
  // throttled. A live count (checked fresh every respawn), not a lifetime
  // counter, so it self-corrects as nodes move away and naturally
  // re-applies at each new objective rather than needing a reset when the
  // objective changes.
  maxNodesNearObjective: 5,
};

registerTuning('energyNode', energyNodeConfig);

// Scales baselinePoolSize by how much bigger (or smaller) a level's area is
// than the baseline footprint, so density (average spacing between live
// pickups) stays roughly constant across level sizes instead of thinning
// out as maps grow -- see energyNodeConfig.baselinePoolSize above for why.
// Read fresh by EnergyNodeManager's constructor (once per level load), so a
// console edit to any of the four fields it depends on needs a level
// restart to take effect, same caveat as the old flat poolSize had.
export function computeEnergyNodePoolSize(levelWidth: number, levelHeight: number): number {
  const { baselinePoolSize, baselineWidth, baselineHeight, minPoolSize } = energyNodeConfig;
  const areaRatio = (levelWidth * levelHeight) / (baselineWidth * baselineHeight);
  return Math.max(minPoolSize, Math.round(baselinePoolSize * areaRatio));
}
