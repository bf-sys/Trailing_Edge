import type { HazardPlacement, LevelConfig } from './levelTypes';

const DEBRIS_TEXTURES = ['debris_large', 'debris_large_alt2', 'debris_large_alt3'];
const NEBULA_TEXTURES = ['hazard_nebula_field', 'hazard_nebula_field_alt2', 'hazard_nebula_field_alt3'];

// Interpolates a straight chain of Debris Field placements between two
// points, spaced closer than 2x its 60px radius (hazardConfig.ts) so
// adjacent circles overlap and leave no ship-width gap -- a genuine wall,
// not a line of separately-dodgeable rocks (GDD §9's Debris Field re-scope
// -- blocksMovement, zero resource cost). Cycles the three sourced debris
// textures and varies rotation per index so a long chain doesn't read as
// one sprite copy-pasted end to end. Same helper as level-001..004.ts's --
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

// Fifth real level. Generated via the level GER loop (content-agent ->
// level-evaluator-agent -> level-refiner-agent, per level-design-guide.md
// §1), passed Evaluate on round 1 with zero [placement] fixes needed, and
// registered into src/levels/index.ts's LEVELS map + src/config/levelOrder.ts's
// LEVEL_ORDER alongside its sibling candidate (level-006) in one batched
// Refine-stage pass, 2026-08-17. Full evaluation report:
// docs/history/level-eval-log-2026-08-17.md. Sits after level-004, squarely in the
// level-design-guide.md §8 post-full-unlock experimentation zone -- the
// player already has scan/teleport/rocketBoost (and tractorBeam,
// unlocked-by-default) by the time they'd reach this level, so none of
// §4/§7's ability-gating constraints apply.
//
// Creative axis for this candidate (one of two generated together,
// deliberately divergent from its sibling): HEAVY MOVING-HAZARD EMPHASIS.
// §8 names "more instances of moving hazards than any level built so far"
// as an explicit invitation -- level-003/004 each used 2 Ion Storm + 1
// Meteoroid (3 total, a "prove MovingHazardManager works" count, not a
// ceiling). This level triples that: 5 Ion Storm + 4 Meteoroid (9 total),
// specifically to see how MovingHazardManager's wrap-on-exit +
// objective-biased respawn (movingHazardConfig.ts) holds up with real
// density on screen at once, not just a couple of instances. Debris Field
// walls and Nebula Field placement stay deliberately modest/conventional
// (three chained barriers, four intent-placed Nebula instances) rather
// than also pushing a maze/multi-sealed-section angle -- that's this
// candidate's sibling's axis, not this one's, and piling every kind of
// escalation into one level would blur the comparison the GER loop's
// Evaluate stage is meant to make.
//
// Sizing: 6000x3038x(6000/5400)... concretely 6000x3375, i.e.
// level-003/004's 5400x3038 footprint scaled by 6000/5400 = 3375/3038 =
// 1.1111x -- both target dimensions share that one factor, so it's a
// uniform scale-up (level-design-guide.md §2), keeping the 16:9 aspect
// ratio every level so far has used, and growing (never shrinking) from
// the largest level built so far per this guide's explicit floor. The
// larger footprint also gives the 9 moving hazards more room to roam
// before wrapping, which is part of the point of this axis.
//
// Objective spacing (§3 -- only *consecutive* Probe<->Beacon and
// Beacon<->Exit need to be pushed far apart; the non-consecutive
// Probe<->Exit pair is deliberately left close): diagonal = sqrt(6000^2 +
// 3375^2) ~= 6884px. Probe<->Beacon ~5325px (~77% of diagonal),
// Beacon<->Exit ~4684px (~68%), Probe<->Exit (non-consecutive) ~966px
// (~14%) -- all in line with the guide's rough precedent (65-76%
// consecutive, 12-13% non-consecutive; Probe<->Beacon lands a hair above
// that band, not a hard target per §3).
//
// Debris Field: three chained barriers (Wall A/B/C below), none spanning a
// full map dimension, each verified 250px+ clear of every
// objective/resupply point by hand (see per-hazard math in comments
// below); no sealed ring this level (that device stays available per §8,
// just not exercised by this candidate -- again, the sibling's territory).
// Nebula Field: four instances placed with intent -- a bypass toll at Wall
// A's open south end, a bypass toll at Wall B's open east end, an
// early-route toll near Entry, and a bridging toll on the close
// Probe<->Exit hop.
//
// Ion Storm / Meteoroid: 9 initial placements total (5 + 4), each verified
// 250px+ clear of every wall/objective/resupply point at authoring time
// (the guide's §7 rule) -- their authored x/y only governs the first leg
// before MovingHazardManager takes over wrap/respawn. No puzzle-taxonomy
// element placed (consistent with every real level so far -- Phase 2b
// content, still unstarted).
export const LEVEL_005: LevelConfig = {
  width: 6000,
  height: 3375,
  entryWormholeLocation: { x: 550, y: 550 },
  exitWormholeLocation: { x: 5100, y: 1500 },
  probeLocation: { x: 5450, y: 600 },
  relayBeaconLocation: { x: 600, y: 2800 },

  resupplyPoints: [{ x: 3000, y: 1700, textureKey: 'asteroid_large', radius: 40 }],

  hazards: [
    // Nebula Field -- four instances, placed with intent rather than
    // scattered. Cycles the three sourced Nebula Field textures
    // (2026-08-21, mirroring Debris Field's alt2/alt3 precedent) so four
    // instances on one map don't read as one sprite copy-pasted four times.
    { type: 'nebulaField', x: 2000, y: 1750, textureKey: NEBULA_TEXTURES[0] }, // Wall A's south (open) bypass
    { type: 'nebulaField', x: 4200, y: 2500, textureKey: NEBULA_TEXTURES[1] }, // Wall B's east (open) bypass
    { type: 'nebulaField', x: 1100, y: 900, textureKey: NEBULA_TEXTURES[2] }, // early on Entry's route toward the map center
    { type: 'nebulaField', x: 5250, y: 1050, textureKey: NEBULA_TEXTURES[0] }, // bridges the close Probe<->Exit hop

    // Ion Storm x5 -- this level's axis. Roughly 2.5x the busiest prior
    // level's Ion Storm count, spread across open pockets of the map so no
    // single area is safe from a drifting one for long. Each entry notes
    // its nearest-hazard/objective clearance margin at authoring time.
    { type: 'ionStorm', x: 1500, y: 2000 }, // west-central open pocket, 707px+ clear of Wall A
    { type: 'ionStorm', x: 3300, y: 900 }, // north-central, 1300px+ clear of Wall A
    { type: 'ionStorm', x: 4700, y: 3250 }, // southeast, 437px+ clear of Wall C
    { type: 'ionStorm', x: 2200, y: 3000 }, // south-central, 640px+ clear of Wall B
    { type: 'ionStorm', x: 5700, y: 900 }, // northeast, 390px+ clear of the Probe

    // Meteoroid x4 -- this level's axis, structure-side. Level-003/004 each
    // used exactly 1; this level uses 4, the sole structure-draining hazard
    // now appearing in real density.
    { type: 'meteoroid', x: 900, y: 1500 }, // west-central, 1100px+ clear of Wall A
    { type: 'meteoroid', x: 3300, y: 2150 }, // center gap between Wall A/B, 350px+ clear of Wall B
    { type: 'meteoroid', x: 5100, y: 2550 }, // southeast, 368px+ clear of Wall C
    { type: 'meteoroid', x: 1700, y: 700 }, // northwest, 300px+ clear of Wall A

    // Debris Field walls -- three chained barriers, kept deliberately
    // modest/conventional (this level's axis is moving-hazard density, not
    // a maze -- see file comment above). None span a full map dimension,
    // all verified 250px+ clear of every objective/resupply point.
    ...debrisWall(2000, 300, 2000, 1500), // upper-center-left divider (Wall A)
    ...debrisWall(2600, 2500, 4000, 2500), // lower-center divider, guards the resupply/Beacon corridor (Wall B)
    ...debrisWall(4300, 2500, 5300, 3100), // southeast diagonal, guards the far corner (Wall C)
  ],

  puzzleElements: [],
};
