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
// RESIZED 2026-09-02 (project-owner request, not evaluator-driven): shrunk
// from 6480x3646 down to exactly 6000x3375, matching level-005's new
// project-wide max footprint. Per level-design-guide.md §11, this is NOT
// the uniform single-factor scale §2/§10 use for same-shape resizes --
// 6480x3646 isn't exactly 16:9 the way 6000x3375 is, so two independent
// per-axis factors were used: scaleX = 6000/6480 = 0.925926,
// scaleY = 3375/3646 = 0.925672. Safe to apply independently here
// specifically because every wall/spur in this file is axis-aligned
// (perfectly vertical or horizontal) -- non-uniform per-axis scaling
// introduces zero shear for axis-aligned geometry (it would for a
// diagonal wall or a debrisRing()). Every plain point placement (objectives,
// resupply, Nebula/Ion Storm/Meteoroid instances) was scaled directly;
// every debrisWall() call was re-run from newly-scaled *endpoints* rather
// than scaling the pre-generated instance arrays (§11's explicit warning),
// with spacing/undulation constants (100 on the six maze walls,
// SWEEP_AMPLITUDE/TEXTURE_AMPLITUDE/etc.) deliberately left at their
// existing absolute-pixel values per §11's stated default, since they're
// tied to Debris Field's fixed 60px collision radius, not to level size.
// One exception, not left at default: the two spurs (below) shrank from
// 300px to ~278px long, which at the unchanged 115px default spacing
// resolves to only 3 instances (worst-case neighbor gap 139px -- *over*
// the 120px no-gap threshold, an actual new hole). Fixed by passing an
// explicit spacing=100 on both spur debrisWall() calls (matching the six
// maze walls' own spacing), restoring 4 instances at a safe 92.7px
// worst-case neighbor gap -- a deliberate, scoped per-wall spacing
// override per §11's second option, not a blanket change. The six main
// maze walls needed no such override: shorter length (2480px vs 2680px)
// dropped their instance count 28->26 but kept a comfortable margin
// (worst-case neighbor distance 100.81px, ~19.19px/16% under the 120px
// threshold -- re-verified by regenerating the actual arrays post-resize,
// not assumed; matches the original 100.87px/19.13px almost exactly).
// The dev-time sanity check below re-confirms this on every import.
// Objective-spacing percentages (Probe<->Beacon 72.9%, Beacon<->Exit
// 68.7%, Probe<->Exit 12.8%) came out unchanged to one decimal place,
// since scaleX and scaleY are close enough (0.9259 vs 0.9257) that
// diagonal-relative distances barely move -- only the raw px figures
// below were updated. See also this file's `hazards` array for the
// updated coordinates and MovingHazardManager's Architecture-contract
// entry in CLAUDE.md for why Ion Storm/Meteoroid trajectory re-simulation
// after this resize found no *new* clearance problem (see the "Moving
// hazards" comment below for what it did find, pre-existing either way).
//
// THE MAZE (the axis this candidate leans into): six parallel vertical
// Debris Field walls at x = 2037, 2593, 3148, 3704, 4259, 4815 (~555px
// lanes; was x = 2200, 2800, 3400, 4000, 4600, 5200 at 600px lanes before
// the 2026-09-02 resize above), each spanning almost the full map height
// but touching only ONE actual map edge (y~19 or y~3356) and stopping well
// short of the other, leaving a single ~857px gap per wall (was ~926px
// pre-resize). Gaps alternate bottom/top/bottom/top/bottom/top across the
// six walls, so crossing the maze from the Probe/Entry cluster (west) to
// the Relay Beacon (east) requires a genuine serpentine: south through
// wall 0's gap, north through wall 1's gap, south through wall 2's, north
// through wall 3's, south through wall 4's, north through wall 5's. This
// is a deliberate departure from §5's "every wall leaves open space at
// both ends" baseline -- each wall here only leaves ONE end open -- but it
// does NOT violate §5's actual hard rule ("never span a full map
// dimension"): no single wall touches both edges, each keeps a real,
// ship-plenty gap (~857px, vastly more than the ~120px two-debris-radius
// minimum) at its open end, and the six walls together keep the level
// fully solvable by normal movement (traced by hand below). §8 explicitly
// sanctions exactly this kind of multi-wall maze for any level past
// level-004, calling out "more complicated Debris Field layouts -- mazes,
// multiple interlocking walls" by name as the target for this authoring
// phase, so this is leaning into that, not bending §5.
//
// Two short interlocking spur walls add extra routing texture inside two
// of the gaps themselves (a minor dead-end nook to route around, not a
// hard block) rather than leaving every gap a plain rectangular opening:
// - Spur A: (2037,2962)-(2315,2962), inside wall 0's bottom gap (was
//   (2200,3200)-(2500,3200) pre-resize).
// - Spur B: (3704,463)-(3981,463), inside wall 3's top gap (was
//   (4000,500)-(4300,500) pre-resize).
// Both are short (~278px) relative to their gap's ~857px height, so
// there's always clear space above and below each spur -- confirmed
// reachable by construction (see the full west-to-east trace below), not
// just assumed.
//
// Reachability trace (west region -> east region, the long consecutive
// Probe<->Beacon hop -- see §3, this is exactly the pair that's supposed
// to be pushed far apart, so it's the natural place to spend the maze):
// west region (x<2037, open) -> wall0 bottom gap (x=2037, y:2499-3356,
// routing around spur A) -> lane1 (2037-2593, open) -> wall1 top gap
// (x=2593, y:19-876) -> lane2 (2593-3148, open) -> wall2 bottom gap
// (x=3148, y:2499-3356) -> lane3 (3148-3704, open) -> wall3 top gap
// (x=3704, y:19-876, routing around spur B) -> lane4 (3704-4259, open) ->
// wall4 bottom gap (x=4259, y:2499-3356) -> lane5 (4259-4815, open) ->
// wall5 top gap (x=4815, y:19-876) -> east region (x>4815, open, Beacon
// at 5278,2684). Every lane between consecutive walls is otherwise
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
// (Probe<->Beacon ~5016px, 72.9% of the map's ~6884px diagonal;
// Beacon<->Exit ~4728px, 68.7%; both within the 65-76% precedent band),
// non-consecutive Probe<->Exit left close (~879px, 12.8%, within the
// 12-13% band) to keep the "there and back" shape. Entry sits in its own
// corner of the west cluster, clear of every hazard. (Pre-2026-09-02-resize
// figures were ~5417px/~5105px/~950px against a ~7435px diagonal --
// percentages are unchanged to one decimal place, see the resize comment
// above for why.)
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
//
// Static (spawn-point) clearance, independently re-verified post-resize
// against the actual generated debris instances (2026-09-02, replacing
// this paragraph's earlier, less precise "300-700px from nearest wall"
// estimate): Entry ~1699px, Exit ~1260px, Probe ~1279px net from wall 0;
// Resupply ~656px net from wall 0; Beacon ~397px net from wall 5 -- all
// comfortably over the 250px floor. The four lane-placed movers (ion2
// (2870,2407)/ion3 (4537,926)/met1 (2315,1481)/met2 (3981,2222) below) sit
// at 87-172px net, under the 250px floor -- expected and already
// documented where each is placed: a ~555px maze lane physically cannot
// clear 250px net on both sides of a wall at once for an 110px/56px-radius
// mover. Separately, ion1 (3426,1666), a *baseline* (non-lane) placement,
// also nets only ~126px clear of wall2 -- this was already true
// pre-resize (~130px net at the old 3700,1800) and predates this resize;
// left as-is since fixing it would mean repositioning a baseline instance,
// out of this resize's scope, not something the scale-down introduced.
//
// Full first-leg trajectory re-simulation (2026-09-02, post-resize,
// method per level-design-guide.md §11/CLAUDE.md's trajectory-audit
// note): re-ran the same trochoid-carrier-plus-orbit sweep used for
// level-009/010 against the new 6000x3375 bounds for all four Ion Storm
// placements. All four already swept into a maze wall (or, for ion0, the
// Probe) during their first leg *before this resize too* (re-confirmed by
// running the identical simulation against the old 6480x3646
// bounds/coordinates) -- this is the same project-wide, already-known,
// already-accepted gap CLAUDE.md's Current-project-state documents (Ion
// Storm's 2026-08-25 switch to 'trochoid' invalidated straight-line-safe
// placements across level-001-008, left unfixed at the user's explicit
// call). The resize does not introduce a new instance of this gap, only
// carries the existing one forward at essentially the same severity (net
// overlap depths shifted by single-digit percentages, consistent with the
// ~7.4%/7.3% axis scale factors, not a qualitatively new problem). Not
// re-fixed here -- doing so would mean relocating baseline Ion Storm
// placements, a hazard-placement redesign outside a pure resize's scope,
// and inconsistent with the project's own decision to leave the broader
// gap unaddressed for now. Meteoroid switched 'linear' -> 'homing'
// (2026-09-02, same day, see hazardConfig.ts) after this file was last
// authored -- its heading is no longer fixed for a full first leg, so the
// old "simulate the whole leg to the map edge" method no longer strictly
// applies; only the short deterministic pre-retarget segment (up to
// retargetIntervalSeconds/homingCloseRetargetIntervalSeconds, ~0.5-1s
// straight east at 280px/s) was checked instead, confirming met1/met2's
// already-known lane-clearance shortfall above (not a new finding) and
// met0 clean.
// Named so the dev-only sanity check below can re-inspect the same six
// generated arrays the hazards list spreads, instead of recomputing them
// from a second, easily-drifting copy of the same coordinates.
// Endpoints re-derived 2026-09-02 from the pre-resize values (x=2200/2800/
// 3400/4000/4600/5200, y=20/946/2700/3626) via scaleX=6000/6480,
// scaleY=3375/3646 -- see the file-header resize comment for the full
// rationale. Spacing (100) and the undulation constants left untouched.
const mazeWall0 = debrisWall(2037, 19, 2037, 2499, 100); // wall 0 -- bottom gap (y:2499-3356)
const mazeWall1 = debrisWall(2593, 876, 2593, 3356, 100); // wall 1 -- top gap (y:19-876)
const mazeWall2 = debrisWall(3148, 19, 3148, 2499, 100); // wall 2 -- bottom gap (y:2499-3356)
const mazeWall3 = debrisWall(3704, 876, 3704, 3356, 100); // wall 3 -- top gap (y:19-876)
const mazeWall4 = debrisWall(4259, 19, 4259, 2499, 100); // wall 4 -- bottom gap (y:2499-3356)
const mazeWall5 = debrisWall(4815, 876, 4815, 3356, 100); // wall 5 -- top gap (y:19-876)

export const LEVEL_006: LevelConfig = {
  width: 6000,
  height: 3375,
  entryWormholeLocation: { x: 278, y: 2962 },
  exitWormholeLocation: { x: 694, y: 1527 },
  probeLocation: { x: 694, y: 648 },
  relayBeaconLocation: { x: 5278, y: 2684 },

  resupplyPoints: [{ x: 1296, y: 2036, textureKey: 'asteroid_large', radius: 40 }],

  hazards: [
    // Nebula Field -- four instances, placed with intent rather than
    // scattered: two toll the maze's west/east thresholds (wall 0's and
    // wall 5's primary gaps), one sits early on Entry's route toward the
    // Probe/maze, one bridges the close Probe<->Exit hop. Cycles the three
    // sourced Nebula Field textures (2026-08-21, mirroring Debris Field's
    // alt2/alt3 precedent) so four instances on one map don't read as one
    // sprite copy-pasted four times.
    { type: 'nebulaField', x: 2037, y: 2684, textureKey: NEBULA_TEXTURES[0] }, // tolls wall 0's bottom gap right at its threshold -- the maze's western entrance; moved 2026-08-24 from (2200, 3350), deeper in the gap; rescaled 2026-09-02 from (2200, 2900)
    { type: 'nebulaField', x: 4815, y: 278, textureKey: NEBULA_TEXTURES[1] }, // tolls wall 5's top gap -- the maze's eastern exit, right before the Beacon approach; rescaled 2026-09-02 from (5200, 300)
    { type: 'nebulaField', x: 833, y: 2407, textureKey: NEBULA_TEXTURES[2] }, // early on Entry's route toward the Probe/maze; rescaled 2026-09-02 from (900, 2600)
    { type: 'nebulaField', x: 694, y: 1088, textureKey: NEBULA_TEXTURES[0] }, // bridges the close Probe<->Exit hop; rescaled 2026-09-02 from (750, 1175)

    // Ion Storm / Meteoroid -- managed by MovingHazardManager. Initial
    // positions only, held at the established 2-1 baseline (see file
    // comment above -- this candidate's axis is the maze, not moving-
    // hazard density), clear of every wall/objective/resupply point.
    // Coordinates rescaled 2026-09-02 (scaleX=0.925926, scaleY=0.925672);
    // see the file-header resize comment for why the post-resize
    // trajectory re-simulation found no *new* clearance issue here.
    { type: 'ionStorm', x: 1574, y: 926 }, // was (1700, 1000)
    { type: 'ionStorm', x: 3426, y: 1666 }, // was (3700, 1800)
    { type: 'meteoroid', x: 5463, y: 1389 }, // was (5900, 1500)
    // Two more of each, added 2026-08-25 (user request) -- one per
    // previously-empty maze lane, each centered 300px from both bounding
    // walls (same symmetric placement the baseline entries above already
    // use, since a 600px lane can't clear a strict 250px net of both a
    // wall's 60px debris radius and Ion Storm's 110px/Meteoroid's 56px
    // radius on both sides at once -- matching established precedent
    // rather than a stricter reading this maze's lane width can't satisfy).
    // Lane width is now ~555px post-2026-09-02-resize (was 600px); still
    // centered between its two bounding walls, same as before.
    { type: 'meteoroid', x: 2315, y: 1481 }, // lane 1 (walls at 2037/2593); was (2500, 1600)
    { type: 'meteoroid', x: 3981, y: 2222 }, // lane 4 (walls at 3704/4259); was (4300, 2400)
    { type: 'ionStorm', x: 2870, y: 2407 }, // lane 2 (walls at 2593/3148); was (3100, 2600)
    { type: 'ionStorm', x: 4537, y: 926 }, // lane 5 (walls at 4259/4815); was (4900, 1000)

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
    // and below within their gap (~278px spur inside a ~857px gap;
    // pre-2026-09-02-resize was a 300px spur inside a 926px gap).
    // Endpoints rescaled from (2200,3200)-(2500,3200) and
    // (4000,500)-(4300,500). Spacing bumped from the 115px default to an
    // explicit 100px (matching the six maze walls) -- at the shorter
    // ~278px post-resize length, 115px spacing resolves to only 3
    // instances (a 139px worst-case neighbor gap, over the 120px no-gap
    // threshold -- an actual new hole the naive default would have left).
    // 100px spacing restores 4 instances at a safe ~92.7px worst-case
    // neighbor gap, re-verified by regenerating the array, not assumed.
    ...debrisWall(2037, 2962, 2315, 2962, 100), // spur A, inside wall 0's bottom gap
    ...debrisWall(3704, 463, 3981, 463, 100), // spur B, inside wall 3's top gap
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
