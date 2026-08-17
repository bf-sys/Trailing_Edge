import type { HazardPlacement, LevelConfig } from './levelTypes';
import { abilityConfig } from '../config/abilityConfig';

const DEBRIS_TEXTURES = ['debris_large', 'debris_large_alt2', 'debris_large_alt3'];

// Interpolates a straight chain of Debris Field placements between two
// points, spaced closer than 2x its 60px radius (hazardConfig.ts) so
// adjacent circles overlap and leave no ship-width gap -- a genuine wall,
// not a line of separately-dodgeable rocks (GDD §9's Debris Field re-scope
// -- blocksMovement, zero resource cost). Cycles the three sourced debris
// textures and varies rotation per index so a long chain doesn't read as
// one sprite copy-pasted end to end. Same helper as level-001/002.ts's --
// duplicated rather than shared, matching this project's "one
// hand-authored file per level" convention (CLAUDE.md tech stack).
function debrisWall(x1: number, y1: number, x2: number, y2: number, spacing = 115): HazardPlacement[] {
  const length = Math.hypot(x2 - x1, y2 - y1);
  const count = Math.max(2, Math.round(length / spacing) + 1);
  const placements: HazardPlacement[] = [];
  for (let i = 0; i < count; i++) {
    const t = i / (count - 1);
    placements.push({
      type: 'debrisField',
      x: x1 + (x2 - x1) * t,
      y: y1 + (y2 - y1) * t,
      textureKey: DEBRIS_TEXTURES[i % DEBRIS_TEXTURES.length],
      rotationRadians: (i * 0.83) % (Math.PI * 2),
    });
  }
  return placements;
}

// Places `count` Debris Field instances evenly around a closed circle of
// the given radius, centered on (cx, cy) -- a *sealed* barrier (every gap
// between neighbors overlaps, same 2x-radius margin as debrisWall above),
// not a line with open ends. New for level-003: encloses the Probe so it's
// unreachable by normal click-to-move at all, only by `teleport`'s plain
// setPosition() (the one ability that passes through blocksMovement
// colliders, GDD §7/§11.4a). See the ring's placement comment below for the
// range math that keeps it reachable.
function debrisRing(cx: number, cy: number, radius: number, count: number): HazardPlacement[] {
  const placements: HazardPlacement[] = [];
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2;
    placements.push({
      type: 'debrisField',
      x: cx + Math.cos(angle) * radius,
      y: cy + Math.sin(angle) * radius,
      textureKey: DEBRIS_TEXTURES[i % DEBRIS_TEXTURES.length],
      rotationRadians: (i * 0.83) % (Math.PI * 2),
    });
  }
  return placements;
}

const PROBE_RING_RADIUS = 150; // distance from Probe to each ring debris instance's center
const PROBE_RING_COUNT = 9; // chord between neighbors ~103px at this radius/count -- well under the 120px (2x60 debris radius) overlap threshold, so the ring has no gap anywhere

// Third real level (2026-08-17), 1.5x level-002's footprint (3600x2025 ->
// 5400x3038). Same rules as level-001/002: only *consecutive* steps in
// LevelObjectiveTracker's Probe -> Relay Beacon -> Exit Wormhole sequence
// (§11.11) are pushed far apart (Probe<->Beacon ~4630px, Beacon<->Exit
// ~4260px; Probe<->Exit, not consecutive, left close at ~805px), Debris
// Field walls stay the primary hazard (four chained barriers, texture/
// rotation variety), and Nebula Field returns placed with intent (bypass
// tolls near wall gaps, an early-route toll, and one bridging the close
// Probe<->Exit approach).
//
// New this level: the Probe sits inside a sealed debrisRing (defined
// above) instead of open ground -- unreachable by normal movement at all,
// only by `teleport`. This is deliberately the first level to *require*
// teleport for a mandatory objective, not just offer it as a bypass --
// safe to do because LEVEL_ORDER's progression already guarantees
// teleport is unlocked before a player reaches level-003 (granted on
// level-002's completion, abilityUnlockOrder in abilityConfig.ts). Range
// math, worked from teleportConfig's fixed 350px maxRange
// (abilityConfig.teleport.maxRange): the ring's debris centers sit
// PROBE_RING_RADIUS (150px) from the Probe; a ship's body (shipConfig:
// 46x56 display size) stops against the ring's outer edge at roughly
// 150 (ring radius) + 60 (debris radius) + ~28 (ship half-size) = 238px
// from the Probe -- comfortably inside the 350px range, leaving 100px+ of
// slack regardless of exact approach angle. That same 350px range is also
// why this is guaranteed visible on-screen the moment it's reachable: the
// 1280x720 viewport's half-width alone (640px) is almost double the
// teleport range, so anything within blink range is already on camera.
// Once inside, normal movement can't get back out either -- the player
// waits out teleport's 8s cooldown (abilityConfig.teleport.cooldownSeconds)
// to blink back out after grabbing the Probe. Deliberate, not a softlock:
// the wait is short and no hazard drains anything inside the ring.
//
// Every hazard (ring included) keeps 250px+ clearance from every other
// objective/resupply point by construction (not yet confirmed by an
// actual playtest), and no regular wall spans a full map dimension, so
// nothing besides the Probe itself is walled off. level-000 stays the
// fixed reference for hazard/puzzle-element testing; this file is meant
// to be edited freely as design iterates.
//
// Also new this level: the first real placements of Ion Storm and
// Meteoroid, the two 'linear' movementPattern hazards -- proving out
// MovingHazardManager (2026-08-17), which wraps them back into the level
// via an objective-biased respawn once they drift out of bounds instead of
// letting them fly off forever (GDD §9/§11.3; see that class for the
// design). Placed on level-003/004 rather than 001/002 since the player
// has more abilities to handle a moving threat by this point (scan,
// teleport, and -- once level-003 is complete -- rocketBoost). Their
// authored x/y below only matters for the first leg, before either first
// wraps; every respawn after that is chosen by MovingHazardManager, not
// this file.
export const LEVEL_003: LevelConfig = {
  width: 5400,
  height: 3038,
  entryWormholeLocation: { x: 500, y: 500 },
  exitWormholeLocation: { x: 4600, y: 1350 },
  probeLocation: { x: 4700, y: 550 },
  relayBeaconLocation: { x: 500, y: 2500 },

  resupplyPoints: [{ x: 3200, y: 2200, textureKey: 'asteroid_large', radius: 40 }],

  hazards: [
    // Nebula Field -- four instances, placed with intent rather than
    // scattered: two toll the open bypass routes around Debris Field walls
    // (A's south gap, D's south gap), one sits on Entry's early route out,
    // one tolls the final approach to the Probe's sealed ring.
    { type: 'nebulaField', x: 2000, y: 1750 }, // Wall A's south bypass
    { type: 'nebulaField', x: 3900, y: 1750 }, // Wall D's south bypass
    { type: 'nebulaField', x: 1200, y: 900 }, // early on Entry's route toward the map center
    { type: 'nebulaField', x: 4550, y: 950 }, // tolls the approach to the Probe's ring, between it and Exit

    // Ion Storm / Meteoroid -- managed by MovingHazardManager (see the
    // file-level comment above). Initial positions only, clear of every
    // wall/ring/objective/resupply point.
    { type: 'ionStorm', x: 3200, y: 900 },
    { type: 'ionStorm', x: 1600, y: 1100 },
    { type: 'meteoroid', x: 900, y: 2200 },

    // Debris Field walls -- four chained barriers, same as level-001/002.
    // None span a full map dimension, so each leaves clear space at both
    // ends to route around.
    ...debrisWall(2000, 300, 2000, 1500), // upper-center divider
    ...debrisWall(2400, 1700, 3800, 1700), // mid-lower divider
    ...debrisWall(1000, 1900, 2200, 2700), // lower-left diagonal, guards Relay Beacon's approach
    ...debrisWall(3900, 400, 3900, 1500), // upper-right divider, guards the Exit/resupply corridor

    // The Probe's sealed ring (see the file-level comment above for the
    // range math) -- teleport-only, the level's one required use of it.
    ...debrisRing(4700, 550, PROBE_RING_RADIUS, PROBE_RING_COUNT),
  ],

  puzzleElements: [],
};

// Sanity check, not gameplay logic: fails fast (at import time, in dev) if
// a future edit to PROBE_RING_RADIUS or abilityConfig.teleport.maxRange
// ever breaks the range math the file comment above walks through, instead
// of silently shipping an unreachable Probe.
const ringApproachDistance = PROBE_RING_RADIUS + 60 + 28;
if (import.meta.env.DEV && ringApproachDistance >= abilityConfig.teleport.maxRange!) {
  console.warn(
    `[level-003] Probe ring approach distance (${ringApproachDistance}px) is not comfortably under teleport's maxRange (${abilityConfig.teleport.maxRange}px) -- the Probe may be unreachable.`,
  );
}
