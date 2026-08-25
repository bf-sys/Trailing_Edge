import type { HazardPlacement, LevelConfig } from './levelTypes';
import { abilityConfig } from '../config/abilityConfig';
import { hazardConfig } from '../config/hazardConfig';
import { energyNodeConfig } from '../config/energyNodeConfig';

const DEBRIS_TEXTURES = ['debris_large', 'debris_large_alt2', 'debris_large_alt3'];
const NEBULA_TEXTURES = ['hazard_nebula_field', 'hazard_nebula_field_alt2', 'hazard_nebula_field_alt3'];

// Interpolates a straight chain of Debris Field placements between two
// points, spaced closer than 2x its 60px radius (hazardConfig.ts) so
// adjacent circles overlap and leave no ship-width gap -- a genuine wall,
// not a line of separately-dodgeable rocks (GDD §9's Debris Field re-scope
// -- blocksMovement, zero resource cost). Cycles the three sourced debris
// textures and varies rotation per index so a long chain doesn't read as
// one sprite copy-pasted end to end. Same helper as level-001/002.ts's --
// duplicated rather than shared, matching this project's "one
// hand-authored file per level" convention (CLAUDE.md tech stack).
//
// Undulation (rolled out from level-006's prototype, 2026-08-24): long-
// enough walls get a perpendicular "meander" offset instead of sitting dead
// straight -- see level-006.ts's debrisWall for the full derivation
// (envelope pinning, two-sine-term rationale, safety-margin math). Same
// SWEEP_AMPLITUDE/TEXTURE_AMPLITUDE/periods and 100px undulating spacing as
// level-006, empirically re-verified safe (margin ~18-19px under the 120px
// no-gap threshold) across this project's full observed wall-length range,
// count 7 through level-006's own 24-28. Unlike level-006's
// MIN_UNDULATE_COUNT=16 (calibrated where the 115px default spacing still
// applied to short walls), the floor here is 8 -- every wall gets the
// tighter 100px spacing once it qualifies, not just ones long enough to
// clear 16 instances at 115px.
const SWEEP_AMPLITUDE = 28;
const SWEEP_PERIOD_INSTANCES = 12;
const TEXTURE_AMPLITUDE = 4;
const TEXTURE_PERIOD_INSTANCES = 4;
const MIN_UNDULATE_COUNT = 8;

function debrisWall(x1: number, y1: number, x2: number, y2: number, spacing = 115): HazardPlacement[] {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const length = Math.hypot(dx, dy);
  const count = Math.max(2, Math.round(length / spacing) + 1);
  const undulate = count >= MIN_UNDULATE_COUNT;
  const perpX = -dy / length;
  const perpY = dx / length;
  const placements: HazardPlacement[] = [];
  for (let i = 0; i < count; i++) {
    const t = i / (count - 1);
    let x = x1 + dx * t;
    let y = y1 + dy * t;
    if (undulate) {
      const envelope = Math.sin(Math.PI * t);
      const sweep = SWEEP_AMPLITUDE * Math.sin((i / SWEEP_PERIOD_INSTANCES) * Math.PI * 2);
      const texture = TEXTURE_AMPLITUDE * Math.sin((i / TEXTURE_PERIOD_INSTANCES) * Math.PI * 2);
      const offset = envelope * (sweep + texture);
      x += perpX * offset;
      y += perpY * offset;
    }
    placements.push({
      type: 'debrisField',
      x,
      y,
      textureKey: DEBRIS_TEXTURES[i % DEBRIS_TEXTURES.length],
      rotationRadians: (i * 0.83) % (Math.PI * 2),
    });
  }
  return placements;
}

// Probe pocket geometry (replaces the sealed ring, 2026-08-25 -- see the
// file-level comment below). Two Debris Field walls, plus the map's own
// top/right world bounds (GameScene.ts sets collideWorldBounds on the ship,
// so a level edge is already a solid barrier), enclose a corner pocket.
const PROBE_POCKET_WALL_X = 4750; // vertical wall's x -- seals the pocket off from the rest of the map
const PROBE_POCKET_WALL_Y = 850; // horizontal wall's y -- seals the pocket off from the rest of the map
const PROBE_WALL_CLEARANCE = 150; // Probe's distance from each wall -- same approach-range role PROBE_RING_RADIUS used to play

// Third real level (2026-08-17), 1.5x level-002's footprint (3600x2025 ->
// 5400x3038). Same rules as level-001/002: only *consecutive* steps in
// LevelObjectiveTracker's Probe -> Relay Beacon -> Exit Wormhole sequence
// (§11.11) are pushed far apart (Probe<->Beacon ~4630px, Beacon<->Exit
// ~4260px; Probe<->Exit, not consecutive, left close at ~805px), Debris
// Field walls stay the primary hazard (four chained barriers, texture/
// rotation variety), and Nebula Field returns placed with intent (bypass
// tolls near wall gaps, and an early-route toll).
//
// New this level: the Probe sits inside a walled-off corner pocket instead
// of open ground -- unreachable by normal movement at all, only by
// `teleport`. This is deliberately the first level to *require* teleport
// for a mandatory objective, not just offer it as a bypass -- safe to do
// because LEVEL_ORDER's progression already guarantees teleport is
// unlocked before a player reaches level-003 (granted on level-002's
// completion, abilityUnlockOrder in abilityConfig.ts). Range math, worked
// from teleportConfig's fixed 350px maxRange (abilityConfig.teleport.
// maxRange): the Probe sits PROBE_WALL_CLEARANCE (150px) from each of the
// pocket's two walls; a ship's body (shipConfig: 46x56 display size) stops
// against a wall's outer edge at roughly 150 (clearance) + 60 (debris
// radius) + ~28 (ship half-size) = 238px from the Probe -- comfortably
// inside the 350px range, leaving 100px+ of slack, from either wall. That
// same 350px range is also why this is guaranteed visible on-screen the
// moment it's reachable: the 1280x720 viewport's half-width alone (640px)
// is almost double the teleport range, so anything within blink range is
// already on camera. Once inside, normal movement can't get back out
// either -- the player waits out teleport's 8s cooldown (abilityConfig.
// teleport.cooldownSeconds) to blink back out after grabbing the Probe.
// Deliberate, not a softlock: the wait is short and no hazard drains
// anything inside the pocket.
//
// Replaced the old sealed debrisRing with this corner pocket 2026-08-25
// (user request): with survivalConfig.energyRegenPerSecond dropped 8 -> 2
// and EnergyNodeElement pickups added 2026-08-24 (see CLAUDE.md), a
// *tightly* sealed area became actively unfun -- a player teleporting in
// had nowhere for a pickup to land, only passive regen (now much slower)
// to lean on while waiting out teleport's cooldown to blink back out. The
// ring's interior was the problem: energyNodeConfig's placement keep-out
// from a blocksMovement hazard is hazardConfig.debrisField.shape.radius
// (60) + energyNodeConfig.radius (16) + energyNodeConfig.hazardKeepOutBuffer
// (40) = 116px, so a 150px-radius ring left only a 150 - 116 = 34px-radius
// disk (68px across) for a pickup to ever land in -- vanishingly unlikely
// across energyNodeConfig.placementAttempts (20) tries. A corner pocket
// solves this with room to spare: two straight walls (PROBE_POCKET_WALL_X/
// Y below) plus the map's own top/right edges (a level boundary is already
// a solid collider -- GameScene.ts's setCollideWorldBounds -- so it works
// as a "wall" for free) enclose an interior roughly 330 x 530px clear of
// every keep-out (both wall buffers *and* energyNodeConfig.edgeMargin (200)
// off the two map edges the pocket also relies on) -- see the dev sanity
// check below for the exact figures. No change to energyNodeConfig's
// buffers was needed (those are global, shared by every level) -- a pocket
// this size gives pickups a real chance to land inside without touching
// them. The Probe itself is still visible from outside the pocket, same as
// it was outside the old ring -- nothing in this codebase occludes sprites
// behind a hazard, so a solid collider blocks movement without blocking
// sight.
//
// Every hazard (pocket walls included) keeps 250px+ clearance from every
// other objective/resupply point by construction (not yet confirmed by an
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
// Named so the dev-only sanity check below can re-inspect the same
// generated arrays the hazards list spreads. count@spacing100: 13, 15, 15,
// 12 -- all four clear MIN_UNDULATE_COUNT=8.
const upperCenterWall = debrisWall(2000, 300, 2000, 1500, 100); // upper-center divider
const midLowerWall = debrisWall(2400, 1700, 3800, 1700, 100); // mid-lower divider
const lowerLeftDiagonalWall = debrisWall(1000, 1900, 2200, 2700, 100); // lower-left diagonal, guards Relay Beacon's approach
const upperRightWall = debrisWall(3900, 400, 3900, 1500, 100); // upper-right divider, guards the Exit/resupply corridor

// Probe's walled-off corner pocket (see the file-level comment above) --
// a vertical wall down from the top edge, and a horizontal wall in from
// the right edge, meeting at (PROBE_POCKET_WALL_X, PROBE_POCKET_WALL_Y).
// The horizontal wall's start is offset one spacing unit (100px) past that
// join instead of exactly on it, so the two walls overlap-seal the corner
// (well under the 120px no-gap threshold) without stacking a duplicate
// debris instance on the exact same point.
const probePocketWallDown = debrisWall(PROBE_POCKET_WALL_X, 0, PROBE_POCKET_WALL_X, PROBE_POCKET_WALL_Y, 100);
const probePocketWallRight = debrisWall(PROBE_POCKET_WALL_X + 100, PROBE_POCKET_WALL_Y, 5400, PROBE_POCKET_WALL_Y, 100);

export const LEVEL_003: LevelConfig = {
  width: 5400,
  height: 3038,
  entryWormholeLocation: { x: 500, y: 500 },
  exitWormholeLocation: { x: 4600, y: 1350 },
  probeLocation: { x: PROBE_POCKET_WALL_X + PROBE_WALL_CLEARANCE, y: PROBE_POCKET_WALL_Y - PROBE_WALL_CLEARANCE },
  relayBeaconLocation: { x: 500, y: 2500 },

  resupplyPoints: [{ x: 3200, y: 2200, textureKey: 'asteroid_large', radius: 40 }],

  hazards: [
    // Nebula Field -- four instances, placed with intent rather than
    // scattered: three toll open bypass routes around Debris Field walls
    // (A's south gap, D's south gap, D's north gap), one sits on Entry's
    // early route out. Cycles the three sourced Nebula Field textures
    // (2026-08-21, mirroring Debris Field's alt2/alt3 precedent) so four
    // instances on one map don't read as one sprite copy-pasted four times.
    { type: 'nebulaField', x: 2000, y: 1750, textureKey: NEBULA_TEXTURES[0] }, // Wall A's south bypass
    { type: 'nebulaField', x: 3900, y: 1750, textureKey: NEBULA_TEXTURES[1] }, // Wall D's south bypass
    { type: 'nebulaField', x: 1200, y: 900, textureKey: NEBULA_TEXTURES[2] }, // early on Entry's route toward the map center
    { type: 'nebulaField', x: 4125, y: 250, textureKey: NEBULA_TEXTURES[0] }, // Wall D's north bypass, moved 2026-08-24 from (4550, 950)

    // Ion Storm / Meteoroid -- managed by MovingHazardManager (see the
    // file-level comment above). Initial positions only, clear of every
    // wall/pocket/objective/resupply point.
    { type: 'ionStorm', x: 3200, y: 900 },
    { type: 'ionStorm', x: 1600, y: 1100 },
    { type: 'meteoroid', x: 900, y: 2200 },
    // Second Meteoroid, added 2026-08-25 (user request) -- opposite corner
    // from the first (bottom-right vs. bottom-left), clear of every wall/
    // pocket/objective/resupply point by 250px+ (nearest: Wall B's east end
    // at ~860px).
    { type: 'meteoroid', x: 4300, y: 2400 },

    // Debris Field walls -- four chained barriers, same as level-001/002.
    // None span a full map dimension, so each leaves clear space at both
    // ends to route around.
    ...upperCenterWall,
    ...midLowerWall,
    ...lowerLeftDiagonalWall,
    ...upperRightWall,

    // The Probe's walled-off corner pocket (see the file-level comment
    // above for the range math) -- teleport-only, the level's one required
    // use of it.
    ...probePocketWallDown,
    ...probePocketWallRight,
  ],

  puzzleElements: [],
};

// Sanity check, not gameplay logic: fails fast (at import time, in dev) if
// a future edit to debrisWall's undulation constants ever lets two
// neighboring instances drift past the 120px (2x Debris Field's 60px
// radius, hazardConfig.ts) no-gap threshold, instead of silently shipping
// a wall with a ship-width hole in it. Mirrors level-006's dev-check.
if (import.meta.env.DEV) {
  const NO_GAP_THRESHOLD = 2 * 60;
  [upperCenterWall, midLowerWall, lowerLeftDiagonalWall, upperRightWall, probePocketWallDown, probePocketWallRight].forEach(
    (wall, wallIndex) => {
      for (let i = 0; i < wall.length - 1; i++) {
        const dist = Math.hypot(wall[i + 1].x - wall[i].x, wall[i + 1].y - wall[i].y);
        if (dist > NO_GAP_THRESHOLD) {
          console.warn(
            `[level-003] Debris wall ${wallIndex} has a ${dist.toFixed(1)}px gap between instances ${i} and ${i + 1} -- exceeds the ${NO_GAP_THRESHOLD}px no-gap threshold, may open a ship-width hole.`,
          );
        }
      }
    },
  );

  // The pocket's two walls are checked separately above (each internally
  // gap-free), but that doesn't confirm they seal *each other* off at the
  // corner they share -- check the join explicitly: last instance of the
  // vertical wall to first instance of the horizontal one.
  const joinDist = Math.hypot(
    probePocketWallRight[0].x - probePocketWallDown[probePocketWallDown.length - 1].x,
    probePocketWallRight[0].y - probePocketWallDown[probePocketWallDown.length - 1].y,
  );
  if (joinDist > NO_GAP_THRESHOLD) {
    console.warn(
      `[level-003] Probe pocket's two walls don't seal at their corner (${joinDist.toFixed(1)}px gap) -- exceeds the ${NO_GAP_THRESHOLD}px no-gap threshold, may open a ship-width hole.`,
    );
  }
}

// Sanity check, not gameplay logic: fails fast (at import time, in dev) if
// a future edit to PROBE_WALL_CLEARANCE or abilityConfig.teleport.maxRange
// ever breaks the range math the file comment above walks through, instead
// of silently shipping an unreachable Probe.
const pocketApproachDistance = PROBE_WALL_CLEARANCE + 60 + 28;
if (import.meta.env.DEV && pocketApproachDistance >= abilityConfig.teleport.maxRange!) {
  console.warn(
    `[level-003] Probe pocket approach distance (${pocketApproachDistance}px) is not comfortably under teleport's maxRange (${abilityConfig.teleport.maxRange}px) -- the Probe may be unreachable.`,
  );
}

// Sanity check, not gameplay logic: warns at import time (dev only) if the
// pocket's interior -- clear of both walls' energy-node keep-out
// (debris radius + node radius + hazardKeepOutBuffer) and
// energyNodeConfig.edgeMargin off the two map edges the pocket also relies
// on -- shrinks too small for a pickup to ever land inside, re-creating the
// old sealed-ring problem this pocket replaced (see the file-level comment
// above).
const nodeWallKeepOut = hazardConfig.debrisField.shape.kind === 'circle' ? hazardConfig.debrisField.shape.radius : 0;
const nodeKeepOutFromWall = nodeWallKeepOut + energyNodeConfig.radius + energyNodeConfig.hazardKeepOutBuffer;
const pocketInteriorWidth = 5400 - energyNodeConfig.edgeMargin - (PROBE_POCKET_WALL_X + nodeKeepOutFromWall);
const pocketInteriorHeight = PROBE_POCKET_WALL_Y - nodeKeepOutFromWall - energyNodeConfig.edgeMargin;
const MIN_POCKET_INTERIOR = 100; // px, arbitrary "clearly usable" floor -- not tied to any other config value
if (import.meta.env.DEV && (pocketInteriorWidth < MIN_POCKET_INTERIOR || pocketInteriorHeight < MIN_POCKET_INTERIOR)) {
  console.warn(
    `[level-003] Probe pocket interior (${pocketInteriorWidth.toFixed(0)}x${pocketInteriorHeight.toFixed(0)}px) is too small for energy nodes to reliably respawn inside it.`,
  );
}
