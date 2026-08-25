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
// one sprite copy-pasted end to end. Same helper as every other level
// file's -- duplicated rather than shared, matching this project's "one
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
// clear 16 instances at 115px. Doesn't touch debrisRing below -- a sealed
// circle isn't a "wall" in this sense, and undulating its radius is a
// separate, unvalidated design question this rollout didn't extend to.
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

// Probe/Relay Beacon pocket geometry (corner pockets, replacing the
// original sealed debrisRing() pockets 2026-08-25 -- see the file-level
// comment below). Each is two Debris Field walls, plus two of the map's
// own world bounds (GameScene.ts sets collideWorldBounds on the ship, so a
// level edge is already a solid barrier), enclosing the nearest corner to
// that objective. Shared clearance constant so the range math (how far
// each objective sits from its pocket's walls) only needs deriving once --
// same role level-003's PROBE_WALL_CLEARANCE plays.
const POCKET_WALL_CLEARANCE = 150;

// Probe pocket -- top-left corner, nearest to the Probe's (1000, 700).
// Wall positions are derived directly from the Probe's location plus
// POCKET_WALL_CLEARANCE, so moving the Probe and re-deriving these two
// values keeps the clearance invariant automatically.
const PROBE_POCKET_WALL_X = 1000 + POCKET_WALL_CLEARANCE; // 1150 -- vertical wall's x
const PROBE_POCKET_WALL_Y = 700 + POCKET_WALL_CLEARANCE; // 850 -- horizontal wall's y

// Relay Beacon pocket -- bottom-right corner, nearest to the Beacon's
// (6300, 3400).
const BEACON_POCKET_WALL_X = 6300 - POCKET_WALL_CLEARANCE; // 6150 -- vertical wall's x
const BEACON_POCKET_WALL_Y = 3400 - POCKET_WALL_CLEARANCE; // 3250 -- horizontal wall's y

// Seventh real level. Generated via the level GER loop (content-agent ->
// level-evaluator-agent -> level-refiner-agent, per level-design-guide.md
// §1). Round 1 of Evaluate flagged one [placement] issue -- Ion Storm 2's
// initial clearance from Wall B sat essentially exactly at the 250px floor
// -- fixed by nudging its x from 5200 to 5300 (see that placement's inline
// comment below). Round 2 independently re-verified the fix live and found
// no new issues (VERDICT: pass, round 2 of at most 3). Registered into
// src/levels/index.ts's LEVELS map + src/config/levelOrder.ts's
// LEVEL_ORDER, 2026-08-17. Full evaluation report:
// docs/history/level-eval-log-2026-08-17.md. Sits after level-006, squarely
// in §8's post-full-unlock experimentation zone -- the player already has
// scan/teleport/rocketBoost (and tractorBeam, unlocked-by-default) by the
// time they'd reach this level, so none of §4/§7's ability-gating
// constraints apply.
//
// Creative axis for this candidate: MULTIPLE SEALED SECTIONS. level-003
// used debrisRing() exactly once, deliberately restricted (per §5's "not a
// pattern to repeat" framing at the time) to reinforcing teleport right
// after it was granted. §8 explicitly lifts that restriction for any level
// past the unlock sequence: "a section gated behind any one of them is fair
// game as a recurring device." This candidate took that literally and
// originally sealed THREE separate pockets with debrisRing() instead of
// one -- the Probe, the Relay Beacon, and the AsteroidField resupply point
// itself. Neither level-005 (moving-hazard density) nor level-006 (a
// single elaborate maze, explicitly built to NOT use debrisRing() at all --
// see that file's comment) touches this axis, so the three candidates read
// as genuinely different experiments rather than variations on one theme.
//
// Follow-up, 2026-08-25 (two changes, both driven by the same root cause --
// see level-003's header comment for the fuller writeup):
// 1. Probe and Relay Beacon moved from a sealed debrisRing() to a walled
//    corner pocket (two straight Debris Field walls plus two of the map's
//    own world bounds, same device level-003 introduced for its Probe).
//    A tight 150px-radius ring left only a ~34px-radius disk clear of
//    energyNodeConfig's placement keep-out -- once energy-node pickups
//    (2026-08-24) made passive regen alone too slow to lean on, a player
//    teleporting into a ring that tight had nowhere for a pickup to ever
//    land. A corner pocket keeps the same teleport-only access with far
//    more interior room (see PROBE_POCKET_WALL_X/Y and
//    BEACON_POCKET_WALL_X/Y below, and the dev sanity checks at the bottom
//    of this file for the exact interior figures).
// 2. The Resupply pocket is removed outright, not converted -- unlike the
//    Probe/Beacon, AsteroidField itself became a solid blocksMovement
//    collider in the same 2026-08-24 pass (CLAUDE.md's ResupplyPoint
//    rework), so sealing it inside a tight ring left no space for the ship
//    to actually get near enough to repair: two solid obstacles (the ring
//    and the asteroid) sharing one small pocket, with no clearance between
//    them for a ship body to fit through. Converting it to a corner pocket
//    the way Probe/Beacon were wouldn't fix that -- the problem is the
//    asteroid's own footprint crowding the interior, not the pocket's
//    shape -- and (3800, 2000) sits in the map's interior anyway, with no
//    nearby corner to relocate it against. Simplest fix: drop the seal
//    entirely: AsteroidField repair (already a deliberate routing decision
//    since that same rework -- the asteroid blocks a drive-through, but
//    the ship can still fly up to it) reverts to what level-003's own
//    AsteroidField placement already does elsewhere in this project,
//    unsealed and reachable by normal movement.
//
// Sizing: 7020x3949, i.e. level-003/004's 5400x3038 footprint scaled by
// 7020/5400 = 3949/3038 = 1.3x -- both target dimensions share that one
// factor, so it's a uniform scale-up (level-design-guide.md §2), holding
// the established 16:9-ish aspect ratio and growing beyond level-006's
// 6480x3646 (the largest level built so far), per this guide's explicit
// floor ("holding steady or growing... is fine, don't go smaller").
//
// THE SEALED POCKETS (this candidate's axis; originally three, now two --
// see the 2026-08-25 follow-up above):
// - Probe pocket, top-left corner, nearest to the Probe itself at
//   (1000, 700).
// - Relay Beacon pocket, bottom-right corner, nearest to the Beacon at
//   (6300, 3400) -- the first level to seal a *mandatory* waypoint other
//   than the Probe.
// - Resupply, at the AsteroidField (3800, 2000), is deliberately unsealed
//   (see above) -- no seal, no pocket, plain open-ground placement.
// Both remaining pockets share POCKET_WALL_CLEARANCE (150px, each
// objective's distance from its own pocket's two walls), so the range math
// only needs deriving once: a ship's body (shipConfig: 46x56 display size)
// stops against a pocket wall's outer edge at roughly
// POCKET_WALL_CLEARANCE (150) + 60 (debris radius) + ~28 (ship half-size)
// = 238px from the objective -- comfortably inside teleport's fixed 350px
// maxRange (abilityConfig.teleport.maxRange), leaving 112px of slack
// regardless of approach angle, identical to level-003's verified math.
// Once inside either, normal movement can't get back out either -- the
// player waits out teleport's 8s cooldown to blink back out. Deliberate
// every time, not a softlock: the wait is short and no hazard drains
// anything inside a pocket. The Exit Wormhole is deliberately left UNSEALED
// (open ground, reachable by normal movement) -- sealing every core-loop
// object would make the level about waiting out cooldowns rather than
// routing, and Exit's own gameplay gate (LevelObjectiveTracker.canReturn(),
// tinted inactive until the Beacon is reached) already gives it a
// meaningful closed state without a physical wall on top.
//
// Objectives (§3 -- only *consecutive* Probe<->Beacon and Beacon<->Exit
// need to be pushed far apart; non-consecutive Probe<->Exit is
// deliberately left close): diagonal = sqrt(7020^2 + 3949^2) ~= 8054.5px.
// Probe(1000,700) <-> Beacon(6300,3400): ~5948px (~73.9% of diagonal, in
// the 65-76% precedent band). Beacon <-> Exit(1850,1150): ~4987px (~61.9%,
// a bit under the band -- geometrically unavoidable here since Exit has to
// sit close to Probe *and* Probe is already pushed into the far corner
// from Beacon to maximize Probe<->Beacon, leaving Exit no room to also
// extend away from Beacon; still comfortably more than half the map's
// diagonal, and §3 states the band is "not a hard target," precedent
// level-005 already landed slightly outside it on the high side). Probe
// <-> Exit (non-consecutive): ~962px (~11.9%, essentially matching the
// 12-13% band). Entry sits at (500, 3550), a reasonable starting corner
// clear of every hazard -- see per-placement clearance notes below.
//
// Debris Field: three conventional, non-sealed walls (A/B/C below) provide
// the level's baseline routing texture, deliberately kept modest (same
// "don't also push a maze" restraint level-005 used to keep its own axis
// legible) so the two pockets stay the clear focal device rather than
// competing with a maze for attention. None spans a full map dimension;
// each is open at both ends per §5's baseline (this level doesn't reuse
// level-006's single-gap maze pattern). Every wall segment keeps 250px+
// clearance from every objective/resupply point/pocket wall (verified by
// distance below, not just eyeballed) -- note a pocket's *own* enclosed
// objective is naturally < 250px from its own pocket walls by design
// (that's the point of a sealed pocket); the clearance rule is checked
// against every *other* wall/pocket instead. Distances below are
// edge-to-edge (raw center distance minus both radii involved), recomputed
// 2026-08-25 for the two bullets that used to reference a ring.
// - Wall A: (2400,2200)-(2400,3400), vertical, between the Entry/SW region
//   and the map's center. Closest point to the (now-unsealed) Resupply
//   asteroid is ~1314px; to Entry ~1906px (raw); to Meteoroid's initial
//   spot ~361px (raw).
// - Wall B: (4800,1200)-(4800,2600), vertical, between the Resupply point
//   and the Beacon pocket. Closest point to the Resupply asteroid is
//   ~900px; to the Beacon pocket's nearest wall is ~1378px.
// - Wall C: (1200,2000)-(2200,2000), horizontal, a short early divider on
//   the Entry-to-Probe route. Closest point to the Probe pocket's nearest
//   wall is ~1031px; to Exit ~850px (raw).
//
// Nebula Field (§6, four instances, placed with intent): a bypass toll at
// Wall A's open south end (also doubling as the last obstacle before
// Entry, 1900px+ clear of it), an early-route toll on Entry's way toward
// the Probe pocket and Wall C, a bridging toll on the close Probe<->Exit
// hop (sitting near the Probe pocket's nearest wall, ~221px clear of it
// edge-to-edge, and ~381px raw-center clear of Exit), and a toll on the
// route from the Resupply/Wall B area toward the Beacon pocket. Two are
// allowed to sit close to a Debris Field wall's open end per §6 ("fine,
// even good... reads as a compound obstacle").
//
// Moving hazards (§7): held at the established baseline (2 Ion Storm, 1
// Meteoroid), same reasoning level-006 used for its own non-axis
// dimensions -- this candidate's axis is sealed-section density, not
// moving-hazard density (that's a different candidate's job), so pushing
// both at once would blur the comparison the GER loop's Evaluate stage is
// meant to make. All three initial placements keep 250px+ clearance from
// every wall/pocket/objective/resupply point (verified by distance in the
// placement comments below).
//
// No puzzle-taxonomy element placed (consistent with every real level so
// far -- Phase 2b content, still unstarted).
// Named so the dev-only sanity check below can re-inspect the same
// generated arrays the hazards list spreads. count@spacing100: 13, 15, 11
// -- all three clear MIN_UNDULATE_COUNT=8.
const wallA = debrisWall(2400, 2200, 2400, 3400, 100); // Wall A -- Entry/SW region divider
const wallB = debrisWall(4800, 1200, 4800, 2600, 100); // Wall B -- Resupply/Beacon region divider
const wallC = debrisWall(1200, 2000, 2200, 2000, 100); // Wall C -- short early Entry-to-Probe divider

// Probe pocket -- vertical wall down from the top edge, horizontal wall in
// from the left edge, meeting at (PROBE_POCKET_WALL_X, PROBE_POCKET_WALL_Y).
// The horizontal wall's start is offset one spacing unit (100px) past that
// join instead of exactly on it, same reasoning as level-003's pocket: the
// two walls overlap-seal the corner (well under the 120px no-gap
// threshold) without stacking a duplicate debris instance on the exact
// same point.
const probePocketWallDown = debrisWall(PROBE_POCKET_WALL_X, 0, PROBE_POCKET_WALL_X, PROBE_POCKET_WALL_Y, 100);
const probePocketWallLeft = debrisWall(PROBE_POCKET_WALL_X - 100, PROBE_POCKET_WALL_Y, 0, PROBE_POCKET_WALL_Y, 100);

// Relay Beacon pocket -- vertical wall up from the bottom edge, horizontal
// wall in from the right edge, meeting at (BEACON_POCKET_WALL_X,
// BEACON_POCKET_WALL_Y). Same corner-join offset trick as the Probe pocket
// above, mirrored: the horizontal wall's start is offset past the join.
const beaconPocketWallUp = debrisWall(BEACON_POCKET_WALL_X, BEACON_POCKET_WALL_Y, BEACON_POCKET_WALL_X, 3949, 100);
const beaconPocketWallRight = debrisWall(BEACON_POCKET_WALL_X + 100, BEACON_POCKET_WALL_Y, 7020, BEACON_POCKET_WALL_Y, 100);

export const LEVEL_007: LevelConfig = {
  width: 7020,
  height: 3949,
  entryWormholeLocation: { x: 500, y: 3550 },
  exitWormholeLocation: { x: 1850, y: 1150 },
  probeLocation: { x: 1000, y: 700 },
  relayBeaconLocation: { x: 6300, y: 3400 },

  resupplyPoints: [{ x: 3800, y: 2000, textureKey: 'asteroid_large', radius: 40 }],

  hazards: [
    // Nebula Field -- four instances, placed with intent rather than
    // scattered (see file comment above for each one's role/clearance).
    // Cycles the three sourced Nebula Field textures (2026-08-21,
    // mirroring Debris Field's alt2/alt3 precedent) so four instances on
    // one map don't read as one sprite copy-pasted four times.
    { type: 'nebulaField', x: 2400, y: 3550, textureKey: NEBULA_TEXTURES[0] }, // bypass toll at Wall A's open south end, ~1900px clear of Entry
    { type: 'nebulaField', x: 900, y: 3200, textureKey: NEBULA_TEXTURES[1] }, // early-route toll on Entry's way toward the Probe pocket
    { type: 'nebulaField', x: 1500, y: 1000, textureKey: NEBULA_TEXTURES[2] }, // bridges the close Probe<->Exit hop
    { type: 'nebulaField', x: 5600, y: 3100, textureKey: NEBULA_TEXTURES[0] }, // tolls the route from Resupply/Wall B toward the Beacon pocket

    // Ion Storm / Meteoroid -- managed by MovingHazardManager. Initial
    // positions only, held at the established 2-1 baseline (this
    // candidate's axis is sealed sections, not moving-hazard density),
    // clear of every wall/pocket/objective/resupply point.
    { type: 'ionStorm', x: 3200, y: 900 },
    { type: 'ionStorm', x: 5300, y: 1800 }, // Refine round 1: nudged +100px from x=5200 -- that
    // position sat exactly at the 250px clearance floor from Wall B
    // (400px horizontal gap - 90 ionStorm radius - 60 debris radius =
    // 250.0px exactly), and its Math.PI heading drifts it -x, i.e.
    // straight at Wall B from spawn. x=5300 gives 350px clearance,
    // in line with every other measured pairing in this file (see
    // docs/history/level-eval-log-2026-08-17.md for the flag).
    { type: 'meteoroid', x: 2700, y: 3600 },
    // Two more of each, added 2026-08-25 (user request) -- spread across
    // the open interior's four quadrants (NW/NE/SW/SE relative to Wall A/B),
    // each 250px+ clear of every wall/pocket/objective/resupply point.
    { type: 'ionStorm', x: 2000, y: 1500 }, // NW, ~381px clear of Exit, ~806px of Wall A
    { type: 'ionStorm', x: 1800, y: 3000 }, // SW, ~600px clear of Wall A
    { type: 'meteoroid', x: 5600, y: 900 }, // NE, ~854px clear of Wall B
    { type: 'meteoroid', x: 4200, y: 3600 }, // SE, ~1166px clear of Wall B, ~1500px from the first Meteoroid

    // Debris Field -- three conventional, non-sealed walls providing
    // baseline routing texture (see file comment above for per-wall
    // clearance notes). Deliberately modest so the two sealed pockets
    // below stay this level's clear focal device.
    ...wallA,
    ...wallB,
    ...wallC,

    // THE SEALED POCKETS -- this candidate's axis (see file-level comment
    // above for the shared range math and the 2026-08-25 follow-up
    // explaining why these are corner pockets now, why Resupply's is gone,
    // and why Exit is deliberately left unsealed).
    ...probePocketWallDown,
    ...probePocketWallLeft,
    ...beaconPocketWallUp,
    ...beaconPocketWallRight,
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
  [wallA, wallB, wallC, probePocketWallDown, probePocketWallLeft, beaconPocketWallUp, beaconPocketWallRight].forEach(
    (wall, wallIndex) => {
      for (let i = 0; i < wall.length - 1; i++) {
        const dist = Math.hypot(wall[i + 1].x - wall[i].x, wall[i + 1].y - wall[i].y);
        if (dist > NO_GAP_THRESHOLD) {
          console.warn(
            `[level-007] Debris wall ${wallIndex} has a ${dist.toFixed(1)}px gap between instances ${i} and ${i + 1} -- exceeds the ${NO_GAP_THRESHOLD}px no-gap threshold, may open a ship-width hole.`,
          );
        }
      }
    },
  );

  // Each pocket's two walls are checked separately above (each internally
  // gap-free), but that doesn't confirm they seal *each other* off at the
  // corner they share -- check both joins explicitly, same as level-003.
  const joins: Array<[string, HazardPlacement, HazardPlacement]> = [
    ['Probe', probePocketWallDown[probePocketWallDown.length - 1], probePocketWallLeft[0]],
    ['Beacon', beaconPocketWallUp[0], beaconPocketWallRight[0]],
  ];
  joins.forEach(([label, a, b]) => {
    const joinDist = Math.hypot(b.x - a.x, b.y - a.y);
    if (joinDist > NO_GAP_THRESHOLD) {
      console.warn(
        `[level-007] ${label} pocket's two walls don't seal at their corner (${joinDist.toFixed(1)}px gap) -- exceeds the ${NO_GAP_THRESHOLD}px no-gap threshold, may open a ship-width hole.`,
      );
    }
  });
}

// Sanity check, not gameplay logic: fails fast (at import time, in dev) if
// a future edit to POCKET_WALL_CLEARANCE or abilityConfig.teleport.maxRange
// ever breaks the range math the file comment above walks through, instead
// of silently shipping an unreachable Probe/Beacon. Covers both pockets at
// once since they share the same clearance.
const pocketApproachDistance = POCKET_WALL_CLEARANCE + 60 + 28;
if (import.meta.env.DEV && pocketApproachDistance >= abilityConfig.teleport.maxRange!) {
  console.warn(
    `[level-007] Pocket approach distance (${pocketApproachDistance}px) is not comfortably under teleport's maxRange (${abilityConfig.teleport.maxRange}px) -- the Probe/Beacon pockets may be unreachable.`,
  );
}

// Sanity check, not gameplay logic: warns at import time (dev only) if
// either pocket's interior -- clear of both its walls' energy-node keep-out
// (debris radius + node radius + hazardKeepOutBuffer) and
// energyNodeConfig.edgeMargin off the two map edges each pocket relies on --
// shrinks too small for a pickup to ever land inside, re-creating the old
// sealed-ring problem these pockets replaced (see the file-level comment
// above).
const nodeWallKeepOut =
  hazardConfig.debrisField.shape.kind === 'circle'
    ? hazardConfig.debrisField.shape.radius + energyNodeConfig.radius + energyNodeConfig.hazardKeepOutBuffer
    : 0;
const MIN_POCKET_INTERIOR = 100; // px, arbitrary "clearly usable" floor -- not tied to any other config value

const probeInteriorWidth = PROBE_POCKET_WALL_X - nodeWallKeepOut - energyNodeConfig.edgeMargin;
const probeInteriorHeight = PROBE_POCKET_WALL_Y - nodeWallKeepOut - energyNodeConfig.edgeMargin;
const beaconInteriorWidth = 7020 - energyNodeConfig.edgeMargin - (BEACON_POCKET_WALL_X + nodeWallKeepOut);
const beaconInteriorHeight = 3949 - energyNodeConfig.edgeMargin - (BEACON_POCKET_WALL_Y + nodeWallKeepOut);

const pocketInteriors: Array<[string, number, number]> = [
  ['Probe', probeInteriorWidth, probeInteriorHeight],
  ['Beacon', beaconInteriorWidth, beaconInteriorHeight],
];
if (import.meta.env.DEV) {
  pocketInteriors.forEach(([label, w, h]) => {
    if (w < MIN_POCKET_INTERIOR || h < MIN_POCKET_INTERIOR) {
      console.warn(
        `[level-007] ${label} pocket interior (${w.toFixed(0)}x${h.toFixed(0)}px) is too small for energy nodes to reliably respawn inside it.`,
      );
    }
  });
}
