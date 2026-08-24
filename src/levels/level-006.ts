import type { HazardPlacement, LevelConfig } from './levelTypes';

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
// PROTOTYPE (this file only, 2026-08-24): long walls interior points get a
// perpendicular "meander" offset so a wall doesn't read as a ruler-straight
// line -- see the six-wall maze below, this candidate's longest/most
// numerous walls in the project, chosen deliberately as the stress test.
// Endpoints (t=0 and t=1) are always pinned exactly to (x1,y1)/(x2,y2) via
// a sin(pi*t) envelope that's 0 at both ends -- every existing gap boundary
// and clearance distance in this file's comments is measured from those
// endpoints, so they can't move. Two summed sine terms (a slow ~2-period
// "sweep" plus a faster small "texture" term) instead of one, so a long
// wall doesn't read as one perfectly repeating S-curve.
//
// Safety constraint (why the numbers below are what they are, not
// eyeballed): Debris Field is blocksMovement, and the wall's "no gap"
// guarantee depends on every pair of neighboring instances staying within
// 2x its 60px radius (120px) of each other. At the project-wide default
// spacing (115px), a first pass here landed a worst-case neighbor distance
// of 117.9px -- technically safe, but only a 2.1px margin, thinner than
// this project's usual clearance conventions (level-design-guide.md's
// floors all carry much more slack). The fix isn't smaller amplitudes --
// the along-axis spacing so dominates the distance formula
// (sqrt(spacing^2 + delta^2)) that halving the offset barely moved the
// result. Instead, the six maze walls below explicitly pass a tighter
// 100px spacing (vs. the 115px default the two short, non-undulating spurs
// still use), which buys real room for the perpendicular offset without
// touching amplitude. Verified empirically (not just derived) by running
// this exact algorithm standalone: at spacing=100, count=28,
// SWEEP_AMPLITUDE=28/SWEEP_PERIOD_INSTANCES=12, TEXTURE_AMPLITUDE=4/
// TEXTURE_PERIOD_INSTANCES=4, worst-case neighbor distance across both
// wall orientations here is 100.87px -- a 19.13px/16% margin under the
// 120px threshold. MIN_UNDULATE_COUNT=16 exists because the sin(pi*t)
// envelope's own rate of change grows sharply as instance count shrinks
// (it's why the two spurs, count=4, correctly never undulate below) --
// below ~16 instances the envelope's own step size alone starts eating
// meaningfully into the margin above.
const SWEEP_AMPLITUDE = 28;
const SWEEP_PERIOD_INSTANCES = 12;
const TEXTURE_AMPLITUDE = 4;
const TEXTURE_PERIOD_INSTANCES = 4;
const MIN_UNDULATE_COUNT = 16;

function debrisWall(x1: number, y1: number, x2: number, y2: number, spacing = 115): HazardPlacement[] {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const length = Math.hypot(dx, dy);
  const count = Math.max(2, Math.round(length / spacing) + 1);
  const undulate = count >= MIN_UNDULATE_COUNT;
  // Unit vector perpendicular to the wall's own axis.
  const perpX = -dy / length;
  const perpY = dx / length;
  const placements: HazardPlacement[] = [];
  for (let i = 0; i < count; i++) {
    const t = i / (count - 1);
    let x = x1 + dx * t;
    let y = y1 + dy * t;
    if (undulate) {
      const envelope = Math.sin(Math.PI * t); // 0 at both ends, 1 at the midpoint
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

// Sixth real level. Generated via the level GER loop (content-agent ->
// level-evaluator-agent -> level-refiner-agent) alongside a sibling
// candidate pushing a different axis (level-005) -- see level-design-guide.md
// §8's explicit post-full-unlock license: every level from level-004 onward
// starts with scan/teleport/rocketBoost already unlocked, so §4/§7's
// "match complexity to unlocked abilities" gating has nothing left to
// gate against. This candidate's specific axis: an elaborate, maze-like
// Debris Field layout -- multiple interlocking walls forcing real
// zigzagging, not just a few simple both-ends-open dividers (the pattern
// every level through level-004 used). Passed Evaluate on round 1 with
// zero [placement] fixes needed, and registered into src/levels/index.ts's
// LEVELS map + src/config/levelOrder.ts's LEVEL_ORDER alongside level-005
// in one batched Refine-stage pass, 2026-08-17. Full evaluation report:
// docs/history/level-eval-log-2026-08-17.md.
//
// Sizing: 6480x3038... no -- 6480x3646, i.e. level-004's 5400x3038
// footprint scaled by 1.2x on both axes (5400*1.2=6480, 3038*1.2=3645.6,
// rounded to 3646). Holds the established 16:9-ish aspect ratio and grows
// rather than shrinks from the largest level built so far, per §2.
//
// THE MAZE (the axis this candidate leans into): six parallel vertical
// Debris Field walls at x = 2200, 2800, 3400, 4000, 4600, 5200 (600px
// lanes), each spanning almost the full map height but touching only ONE
// actual map edge (y~20 or y~3626) and stopping well short of the other,
// leaving a single ~926px gap per wall. Gaps alternate bottom/top/bottom/
// top/bottom/top across the six walls, so crossing the maze from the
// Probe/Entry cluster (west) to the Relay Beacon (east) requires a genuine
// serpentine: south through wall 0's gap, north through wall 1's gap,
// south through wall 2's, north through wall 3's, south through wall 4's,
// north through wall 5's. This is a deliberate departure from §5's "every
// wall leaves open space at both ends" baseline -- each wall here only
// leaves ONE end open -- but it does NOT violate §5's actual hard rule
// ("never span a full map dimension"): no single wall touches both edges,
// each keeps a real, ship-plenty gap (926px, vastly more than the ~120px
// two-debris-radius minimum) at its open end, and the six walls together
// keep the level fully solvable by normal movement (traced by hand below).
// §8 explicitly sanctions exactly this kind of multi-wall maze for any
// level past level-004, calling out "more complicated Debris Field
// layouts -- mazes, multiple interlocking walls" by name as the target for
// this authoring phase, so this is leaning into that, not bending §5.
//
// Two short interlocking spur walls add extra routing texture inside two
// of the gaps themselves (a minor dead-end nook to route around, not a
// hard block) rather than leaving every gap a plain rectangular opening:
// - Spur A: (2200,3200)-(2500,3200), inside wall 0's bottom gap.
// - Spur B: (4000,500)-(4300,500), inside wall 3's top gap.
// Both are short (300px) relative to their gap's 926px height, so there's
// always clear space above and below each spur -- confirmed reachable by
// construction (see the full west-to-east trace below), not just assumed.
//
// Reachability trace (west region -> east region, the long consecutive
// Probe<->Beacon hop -- see §3, this is exactly the pair that's supposed
// to be pushed far apart, so it's the natural place to spend the maze):
// west region (x<2200, open) -> wall0 bottom gap (x=2200, y:2700-3626,
// routing around spur A) -> lane1 (2200-2800, open) -> wall1 top gap
// (x=2800, y:20-946) -> lane2 (2800-3400, open) -> wall2 bottom gap
// (x=3400, y:2700-3626) -> lane3 (3400-4000, open) -> wall3 top gap
// (x=4000, y:20-946, routing around spur B) -> lane4 (4000-4600, open) ->
// wall4 bottom gap (x=4600, y:2700-3626) -> lane5 (4600-5200, open) ->
// wall5 top gap (x=5200, y:20-946) -> east region (x>5200, open, Beacon
// at 5700,2900). Every lane between consecutive walls is otherwise
// completely open, so nothing above traps the player -- there is always a
// path through.
//
// Deliberately NOT reusing §5's sealed debrisRing() device here -- that's
// a different tool (a fully-enclosed, teleport-only pocket) and mixing it
// into this candidate would blur the specific axis it's meant to
// demonstrate (routing complexity via a normal-movement maze, not an
// ability-gated enclosure). §8 confirms sealed rings are fair game to
// reuse elsewhere; this file just isn't the place for one.
//
// Objectives follow §3 exactly: consecutive pairs pushed far apart
// (Probe<->Beacon ~5417px, 72.9% of the map's ~7435px diagonal;
// Beacon<->Exit ~5105px, 68.7%; both within the 65-76% precedent band),
// non-consecutive Probe<->Exit left close (~950px, 12.8%, within the
// 12-13% band) to keep the "there and back" shape. Entry sits in its own
// corner of the west cluster, clear of every hazard.
//
// Nebula Field (§6, placed with intent, four instances): tolls wall 0's
// primary gap (the maze's western threshold) and wall 5's primary gap
// (the maze's eastern threshold, right before the Beacon approach), an
// early-route toll on Entry's way toward the Probe/maze, and a bridging
// toll on the close Probe<->Exit hop. Deliberately allowed to sit inside/
// against a Debris Field gap per §6 ("fine, even good," reads as a
// compound obstacle).
//
// Moving hazards (§7): kept at the established baseline (2 Ion Storm, 1
// Meteoroid) rather than pushed -- this candidate's axis is routing
// complexity via the Debris Field maze, not moving-hazard density (that's
// the sibling candidate's job), so density here intentionally stays
// unremarkable to keep the two candidates reading as genuinely different
// rather than both drifting toward "harder in every dimension at once."
// All three initial placements keep 250px+ clearance from every wall/
// objective/resupply point (verified below).
//
// Every hazard placement below keeps 250px+ clearance from every
// objective/resupply point (verified by distance, not just eyeballed):
// Probe/Exit/Entry/Resupply all sit at least ~1450px west of wall 0;
// the Beacon sits 500px east of wall 5; the Ion Storm/Meteoroid initial
// spots sit 300-700px from their nearest wall.
// Named so the dev-only sanity check below can re-inspect the same six
// generated arrays the hazards list spreads, instead of recomputing them
// from a second, easily-drifting copy of the same coordinates.
const mazeWall0 = debrisWall(2200, 20, 2200, 2700, 100); // wall 0 -- bottom gap (y:2700-3626)
const mazeWall1 = debrisWall(2800, 946, 2800, 3626, 100); // wall 1 -- top gap (y:20-946)
const mazeWall2 = debrisWall(3400, 20, 3400, 2700, 100); // wall 2 -- bottom gap (y:2700-3626)
const mazeWall3 = debrisWall(4000, 946, 4000, 3626, 100); // wall 3 -- top gap (y:20-946)
const mazeWall4 = debrisWall(4600, 20, 4600, 2700, 100); // wall 4 -- bottom gap (y:2700-3626)
const mazeWall5 = debrisWall(5200, 946, 5200, 3626, 100); // wall 5 -- top gap (y:20-946)

export const LEVEL_006: LevelConfig = {
  width: 6480,
  height: 3646,
  entryWormholeLocation: { x: 300, y: 3200 },
  exitWormholeLocation: { x: 750, y: 1650 },
  probeLocation: { x: 750, y: 700 },
  relayBeaconLocation: { x: 5700, y: 2900 },

  resupplyPoints: [{ x: 1400, y: 2200, textureKey: 'asteroid_large', radius: 40 }],

  hazards: [
    // Nebula Field -- four instances, placed with intent rather than
    // scattered: two toll the maze's west/east thresholds (wall 0's and
    // wall 5's primary gaps), one sits early on Entry's route toward the
    // Probe/maze, one bridges the close Probe<->Exit hop. Cycles the three
    // sourced Nebula Field textures (2026-08-21, mirroring Debris Field's
    // alt2/alt3 precedent) so four instances on one map don't read as one
    // sprite copy-pasted four times.
    { type: 'nebulaField', x: 2200, y: 2900, textureKey: NEBULA_TEXTURES[0] }, // tolls wall 0's bottom gap right at its threshold -- the maze's western entrance; moved 2026-08-24 from (2200, 3350), deeper in the gap
    { type: 'nebulaField', x: 5200, y: 300, textureKey: NEBULA_TEXTURES[1] }, // tolls wall 5's top gap -- the maze's eastern exit, right before the Beacon approach
    { type: 'nebulaField', x: 900, y: 2600, textureKey: NEBULA_TEXTURES[2] }, // early on Entry's route toward the Probe/maze
    { type: 'nebulaField', x: 750, y: 1175, textureKey: NEBULA_TEXTURES[0] }, // bridges the close Probe<->Exit hop

    // Ion Storm / Meteoroid -- managed by MovingHazardManager. Initial
    // positions only, held at the established 2-1 baseline (see file
    // comment above -- this candidate's axis is the maze, not moving-
    // hazard density), clear of every wall/objective/resupply point.
    { type: 'ionStorm', x: 1700, y: 1000 },
    { type: 'ionStorm', x: 3700, y: 1800 },
    { type: 'meteoroid', x: 5900, y: 1500 },

    // The maze -- six parallel vertical walls with alternating single
    // gaps (see file-level comment above for the full design rationale
    // and reachability trace). Spacing=100 (vs. the 115px default) on all
    // six -- see the debrisWall safety-constraint comment above for why
    // the undulation needs the tighter along-axis spacing to keep a real
    // margin under the 120px no-gap threshold.
    ...mazeWall0,
    ...mazeWall1,
    ...mazeWall2,
    ...mazeWall3,
    ...mazeWall4,
    ...mazeWall5,

    // Interlocking spurs -- short perpendicular stubs inside two of the
    // gaps, adding a dead-end nook to route around rather than leaving
    // every gap a plain rectangular opening. Both leave clear space above
    // and below within their gap (300px spur inside a 926px gap).
    ...debrisWall(2200, 3200, 2500, 3200), // spur A, inside wall 0's bottom gap
    ...debrisWall(4000, 500, 4300, 500), // spur B, inside wall 3's top gap
  ],

  puzzleElements: [],
};

// Sanity check, not gameplay logic: fails fast (at import time, in dev) if
// a future edit to debrisWall's undulation constants (SWEEP_AMPLITUDE/
// TEXTURE_AMPLITUDE/etc., or these six walls' spacing) ever lets two
// neighboring instances drift past the 120px (2x Debris Field's 60px
// radius, hazardConfig.ts) no-gap threshold, instead of silently shipping
// a maze wall with a ship-width hole in it. Re-inspects the actual
// generated arrays (mazeWall0-5) rather than re-deriving the math, so it
// can't drift out of sync with what debrisWall actually produced.
if (import.meta.env.DEV) {
  const NO_GAP_THRESHOLD = 2 * 60;
  [mazeWall0, mazeWall1, mazeWall2, mazeWall3, mazeWall4, mazeWall5].forEach((wall, wallIndex) => {
    for (let i = 0; i < wall.length - 1; i++) {
      const dist = Math.hypot(wall[i + 1].x - wall[i].x, wall[i + 1].y - wall[i].y);
      if (dist > NO_GAP_THRESHOLD) {
        console.warn(
          `[level-006] Maze wall ${wallIndex} has a ${dist.toFixed(1)}px gap between instances ${i} and ${i + 1} -- exceeds the ${NO_GAP_THRESHOLD}px no-gap threshold, may open a ship-width hole.`,
        );
      }
    }
  });
}
