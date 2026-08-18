import type { HazardPlacement, LevelConfig } from './levelTypes';
import { abilityConfig } from '../config/abilityConfig';

const DEBRIS_TEXTURES = ['debris_large', 'debris_large_alt2', 'debris_large_alt3'];

// Interpolates a straight chain of Debris Field placements between two
// points, spaced closer than 2x its 60px radius (hazardConfig.ts) so
// adjacent circles overlap and leave no ship-width gap -- a genuine wall,
// not a line of separately-dodgeable rocks (GDD §9's Debris Field re-scope
// -- blocksMovement, zero resource cost). Cycles the three sourced debris
// textures and varies rotation per index so a long chain doesn't read as
// one sprite copy-pasted end to end. Same helper as every other level
// file's -- duplicated rather than shared, matching this project's "one
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
// not a line with open ends. Introduced in level-003 to enclose its Probe,
// reachable only by `teleport` (the one ability whose plain setPosition()
// passes through blocksMovement colliders, GDD §7/§11.4a). This level
// reuses it three times over -- see the file-level comment below.
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

// Shared by all three sealed rings below -- same radius/count level-003
// proved out, reused rather than re-derived per pocket so the range math
// only has to be verified once (see the sanity check at the bottom of this
// file). Chord between neighbors at radius 150 / count 9 is ~103px, well
// under the 120px (2x60 debris radius) overlap threshold, so no ring has a
// gap anywhere.
const SEALED_RING_RADIUS = 150;
const SEALED_RING_COUNT = 9;

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
// game as a recurring device." This candidate takes that literally and
// seals THREE separate pockets with debrisRing() instead of one -- the
// Probe, the Relay Beacon, and (new, not attempted by level-003) the
// AsteroidField resupply point itself, so even mid-level structure repair
// costs a teleport in and a teleport out rather than a free flyby. Neither
// level-005 (moving-hazard density) nor level-006 (a single elaborate
// maze, explicitly built to NOT use debrisRing() at all -- see that file's
// comment) touches this axis, so the three candidates read as genuinely
// different experiments rather than variations on one theme.
//
// Sizing: 7020x3949, i.e. level-003/004's 5400x3038 footprint scaled by
// 7020/5400 = 3949/3038 = 1.3x -- both target dimensions share that one
// factor, so it's a uniform scale-up (level-design-guide.md §2), holding
// the established 16:9-ish aspect ratio and growing beyond level-006's
// 6480x3646 (the largest level built so far), per this guide's explicit
// floor ("holding steady or growing... is fine, don't go smaller").
//
// THE THREE SEALED POCKETS (this candidate's axis):
// - Probe pocket, centered on the Probe itself at (1000, 700).
// - Resupply pocket, centered on the AsteroidField at (3800, 2000) -- new:
//   no prior level has sealed its resupply point. Repairing structure now
//   costs a deliberate teleport in/out rather than a free flyby, adding a
//   genuine macro/survival decision (is it worth the 30-energy round trip
//   right now?) that no earlier level's resupply placement has asked.
// - Relay Beacon pocket, centered on the Beacon at (6300, 3400) -- the
//   first level to seal a *mandatory* waypoint other than the Probe.
// All three use the identical SEALED_RING_RADIUS/SEALED_RING_COUNT above,
// so the range math only needs deriving once: a ship's body (shipConfig:
// 46x56 display size) stops against a ring's outer edge at roughly
// SEALED_RING_RADIUS (150) + 60 (debris radius) + ~28 (ship half-size) =
// 238px from the pocket's center -- comfortably inside teleport's fixed
// 350px maxRange (abilityConfig.teleport.maxRange), leaving 112px of slack
// regardless of approach angle, identical to level-003's verified math.
// Once inside any of the three, normal movement can't get back out either
// -- the player waits out teleport's 8s cooldown to blink back out.
// Deliberate every time, not a softlock: the wait is short and no hazard
// drains anything inside a ring. The Exit Wormhole is deliberately left
// UNSEALED (open ground, reachable by normal movement) -- sealing every
// core-loop object would make the level about waiting out cooldowns rather
// than routing, and Exit's own gameplay gate (LevelObjectiveTracker.canReturn(),
// tinted inactive until the Beacon is reached) already gives it a
// meaningful closed state without a physical ring on top.
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
// legible) so the three rings stay the clear focal device rather than
// competing with a maze for attention. None spans a full map dimension;
// each is open at both ends per §5's baseline (this level doesn't reuse
// level-006's single-gap maze pattern). Every wall segment and every ring
// keeps 250px+ clearance from every objective/resupply point (verified by
// distance below, not just eyeballed) -- note the rings' *own* enclosed
// objective/resupply point is naturally < 250px from its own ring by
// design (that's the point of a sealed pocket); the clearance rule is
// checked against every *other* wall/ring instead.
// - Wall A: (2400,2200)-(2400,3400), vertical, between the Entry/SW region
//   and the map's center. Closest point to the Resupply ring's outer edge
//   is ~1204px; to Entry ~1906px; to Meteoroid's initial spot ~361px.
// - Wall B: (4800,1200)-(4800,2600), vertical, between the Resupply pocket
//   and the Beacon pocket. Closest point to the Resupply ring's outer edge
//   is ~790px; to the Beacon ring's outer edge is ~1539px.
// - Wall C: (1200,2000)-(2200,2000), horizontal, a short early divider on
//   the Entry-to-Probe route. Closest point to the Probe ring's outer edge
//   is ~1105px; to Exit ~850px.
//
// Nebula Field (§6, four instances, placed with intent): a bypass toll at
// Wall A's open south end (also doubling as the last obstacle before
// Entry, 1900px+ clear of it), an early-route toll on Entry's way toward
// the Probe pocket and Wall C, a bridging toll on the close Probe<->Exit
// hop (sitting between the Probe ring's outer edge and Exit, ~373px/~381px
// clear of each respectively), and a toll on the route from the
// Resupply/Wall B area toward the Beacon pocket. Two are allowed to sit
// close to a Debris Field wall's open end per §6 ("fine, even good...
// reads as a compound obstacle").
//
// Moving hazards (§7): held at the established baseline (2 Ion Storm, 1
// Meteoroid), same reasoning level-006 used for its own non-axis
// dimensions -- this candidate's axis is sealed-section density, not
// moving-hazard density (that's a different candidate's job), so pushing
// both at once would blur the comparison the GER loop's Evaluate stage is
// meant to make. All three initial placements keep 250px+ clearance from
// every wall/ring/objective/resupply point (verified by distance in the
// placement comments below).
//
// No puzzle-taxonomy element placed (consistent with every real level so
// far -- Phase 2b content, still unstarted).
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
    { type: 'nebulaField', x: 2400, y: 3550 }, // bypass toll at Wall A's open south end, ~1900px clear of Entry
    { type: 'nebulaField', x: 900, y: 3200 }, // early-route toll on Entry's way toward the Probe pocket
    { type: 'nebulaField', x: 1500, y: 1000 }, // bridges the close Probe<->Exit hop
    { type: 'nebulaField', x: 5600, y: 3100 }, // tolls the route from Resupply/Wall B toward the Beacon pocket

    // Ion Storm / Meteoroid -- managed by MovingHazardManager. Initial
    // positions only, held at the established 2-1 baseline (this
    // candidate's axis is sealed sections, not moving-hazard density),
    // clear of every wall/ring/objective/resupply point.
    { type: 'ionStorm', x: 3200, y: 900 },
    { type: 'ionStorm', x: 5300, y: 1800 }, // Refine round 1: nudged +100px from x=5200 -- that
    // position sat exactly at the 250px clearance floor from Wall B
    // (400px horizontal gap - 90 ionStorm radius - 60 debris radius =
    // 250.0px exactly), and its Math.PI heading drifts it -x, i.e.
    // straight at Wall B from spawn. x=5300 gives 350px clearance,
    // in line with every other measured pairing in this file (see
    // docs/history/level-eval-log-2026-08-17.md for the flag).
    { type: 'meteoroid', x: 2700, y: 3600 },

    // Debris Field -- three conventional, non-sealed walls providing
    // baseline routing texture (see file comment above for per-wall
    // clearance notes). Deliberately modest so the three sealed rings
    // below stay this level's clear focal device.
    ...debrisWall(2400, 2200, 2400, 3400), // Wall A -- Entry/SW region divider
    ...debrisWall(4800, 1200, 4800, 2600), // Wall B -- Resupply/Beacon region divider
    ...debrisWall(1200, 2000, 2200, 2000), // Wall C -- short early Entry-to-Probe divider

    // THE THREE SEALED POCKETS -- this candidate's axis (see file-level
    // comment above for the shared range math and the reasoning behind
    // sealing each of these three specifically, and for why Exit is
    // deliberately left unsealed).
    ...debrisRing(1000, 700, SEALED_RING_RADIUS, SEALED_RING_COUNT), // Probe pocket
    ...debrisRing(3800, 2000, SEALED_RING_RADIUS, SEALED_RING_COUNT), // Resupply pocket
    ...debrisRing(6300, 3400, SEALED_RING_RADIUS, SEALED_RING_COUNT), // Relay Beacon pocket
  ],

  puzzleElements: [],
};

// Sanity check, not gameplay logic: fails fast (at import time, in dev) if
// a future edit to SEALED_RING_RADIUS or abilityConfig.teleport.maxRange
// ever breaks the range math the file comment above walks through, instead
// of silently shipping an unreachable Probe/Resupply/Beacon. Covers all
// three rings at once since they share the same radius.
const ringApproachDistance = SEALED_RING_RADIUS + 60 + 28;
if (import.meta.env.DEV && ringApproachDistance >= abilityConfig.teleport.maxRange!) {
  console.warn(
    `[level-007] Sealed ring approach distance (${ringApproachDistance}px) is not comfortably under teleport's maxRange (${abilityConfig.teleport.maxRange}px) -- the Probe/Resupply/Beacon pockets may be unreachable.`,
  );
}
