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
// straight. Two shapes, picked automatically by instance count: count >= 8
// gets a two-term sine "sweep" (the four long serpentine maze walls below);
// count 4-7 gets a single-term "bow" (this file's four short vault-wall
// segments, see below); count < 4 stays straight. Both pin their endpoints
// exactly via a sin(pi*t) envelope, so (x1,y1)/(x2,y2) never move --
// clearance/gap-boundary comments elsewhere in this file are measured from
// those endpoints. See level-design-guide.md §5 for the full derivation;
// this file reuses its standard constants unmodified.
const SWEEP_AMPLITUDE = 28;
const SWEEP_PERIOD_INSTANCES = 12;
const TEXTURE_AMPLITUDE = 4;
const TEXTURE_PERIOD_INSTANCES = 4;
const MIN_UNDULATE_COUNT = 8;
const BOW_AMPLITUDE = 30;
const MIN_BOW_COUNT = 4;

function debrisWall(x1: number, y1: number, x2: number, y2: number, spacing = 115): HazardPlacement[] {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const length = Math.hypot(dx, dy);
  const count = Math.max(2, Math.round(length / spacing) + 1);
  const mode = count >= MIN_UNDULATE_COUNT ? 'sweep' : count >= MIN_BOW_COUNT ? 'bow' : 'straight';
  const perpX = -dy / length;
  const perpY = dx / length;
  const placements: HazardPlacement[] = [];
  for (let i = 0; i < count; i++) {
    const t = i / (count - 1);
    let x = x1 + dx * t;
    let y = y1 + dy * t;
    if (mode === 'sweep') {
      const envelope = Math.sin(Math.PI * t); // 0 at both ends, 1 at the midpoint
      const sweep = SWEEP_AMPLITUDE * Math.sin((i / SWEEP_PERIOD_INSTANCES) * Math.PI * 2);
      const texture = TEXTURE_AMPLITUDE * Math.sin((i / TEXTURE_PERIOD_INSTANCES) * Math.PI * 2);
      const offset = envelope * (sweep + texture);
      x += perpX * offset;
      y += perpY * offset;
    } else if (mode === 'bow') {
      const offset = Math.sin(Math.PI * t) * BOW_AMPLITUDE;
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

// THE INNER VAULT -- a fully-enclosed Debris Field box (four short walls,
// not a debrisRing()) embedded inside the maze's first lane, sealing the
// Probe. See the file-level comment below for why this is a box and not a
// ring, and why its walls pass spacing=60 instead of the project's usual
// 100. PROBE_X/Y is the box's (and the Probe's) center; BOX_HALF_WIDTH/
// HEIGHT is the Probe's clearance to each wall, playing the same role
// POCKET_WALL_CLEARANCE/PROBE_WALL_CLEARANCE play in level-003/007's corner
// pockets -- except here it applies on all four sides at once, since this
// pocket has no map edge to lean on.
const PROBE_X = 2150;
const PROBE_Y = 1550;
const BOX_HALF_WIDTH = 180;
const BOX_HALF_HEIGHT = 180;
const BOX_X1 = PROBE_X - BOX_HALF_WIDTH; // 1970
const BOX_X2 = PROBE_X + BOX_HALF_WIDTH; // 2330
const BOX_Y1 = PROBE_Y - BOX_HALF_HEIGHT; // 1370
const BOX_Y2 = PROBE_Y + BOX_HALF_HEIGHT; // 1730

// Tenth real level. Generated via the level GER loop (content-agent ->
// level-evaluator-agent -> level-refiner-agent, per level-design-guide.md
// §1) -- this file is the GENERATE-STAGE OUTPUT ONLY: not yet evaluated,
// not yet registered in src/levels/index.ts's LEVELS map or
// src/config/levelOrder.ts's LEVEL_ORDER. Sits after level-009 (the current
// last LEVEL_ORDER entry as of this writing), squarely in §8's
// post-full-unlock experimentation zone -- the player already has
// scan/teleport/rocketBoost (and tractorBeam, unlocked-by-default) by the
// time they'd reach this level, so none of §4/§7's ability-gating
// constraints apply. A sibling agent is concurrently authoring level-009 in
// the same batch, also asked to push moving-hazard density -- this
// candidate deliberately does NOT lean on that axis (see the moving-hazard
// note below) so the two don't converge, per §8's "variety, not
// convergence" principle.
//
// CREATIVE AXIS: A DEBRIS FIELD MAZE WITH AN EMBEDDED SEALED VAULT. Every
// sealed-section level so far has kept the device separate from routing
// complexity: level-006 built a six-wall serpentine maze with NO sealed
// section at all (explicitly, by its own file comment); level-007 sealed
// three pockets, all at open map corners, entirely outside any maze
// structure. Neither combines the two. This candidate does: a four-wall
// serpentine maze (shorter than level-006's six) carries the Probe<->Beacon
// leg as usual, but the Probe itself is NOT in the open west region the way
// every prior level's Probe has been -- it's sealed inside a small Debris
// Field box embedded directly in the maze's first lane, reachable only by
// teleporting in from within that lane. The player must already be
// partway through the maze (having crossed the first wall's gap) before
// the vault is even within teleport range -- the seal isn't a separate
// side-quest bolted onto the maze, it's load-bearing on the maze's own
// geometry. This is exactly the kind of combination §8 calls out by name
// ("a maze that also has a sealed pocket branching off it") that no real
// level has attempted yet.
//
// WHY A BOX, NOT debrisRing(): level-003 and level-007 both originally used
// a sealed debrisRing() and both REPLACED it with a straight-walled pocket
// (2026-08-25, see either file's header comment) because a 150px-radius
// ring left only a ~34px-radius disk clear of energyNodeConfig's placement
// keep-out (debris radius + node radius + hazardKeepOutBuffer = 116px),
// leaving energy-node pickups nowhere to ever land inside. That fix
// depended on the pocket also touching two of the map's own world-bound
// edges (a free "wall" for two of its four sides) -- not available here,
// since this vault sits in the map's interior, not a corner. A fully
// enclosed four-wall box is the natural adaptation: same straight-wall
// interior-room benefit, no reliance on world bounds. See the dev-time
// energy-node-interior sanity check at the bottom of this file for the
// actual verified interior figures (128x128px net of every keep-out --
// comfortably above the 100px "clearly usable" floor level-007 established).
//
// THE VAULT'S GEOMETRY (verified by generating the actual debrisWall()
// output and measuring it, not just deriving it on paper -- see
// level-design-guide.md §5's explicit instruction to do this for any new
// amplitude/spacing combination): BOX_HALF_WIDTH/HEIGHT = 180px on every
// side (a 360x360 square, PROBE_X/Y at its center). Teleport approach
// distance (BOX_HALF_WIDTH/HEIGHT + 60 debris radius + ~28 ship half-size)
// = 268px on paper -- comfortably under abilityConfig.teleport's fixed
// 350px maxRange. CORRECTED (level-refiner-agent, round 1, per the
// level-evaluator-agent's live-measured finding): the on-paper 268px/82px-
// slack figure never accounted for the south/west walls' 'bow' undulation
// (BOW_AMPLITUDE=30) bulging outward toward exactly the most direct
// south-approach vector -- live click-to-move-then-block testing measured
// the real worst-case approach at ~298px, i.e. **~52px of slack**, not
// 82px. Still a genuine, comfortable margin (not hair's-breadth), just a
// smaller one than this comment originally claimed -- the north/east walls'
// bow bulges inward instead, so those two sides retain more slack than
// this worst-case figure, not less (more slack than level-003/007's corner
// pockets had, 112px, but in a different, tighter-radius shape -- see the
// dev sanity check below, which covers this generically on paper only; it
// does not model bow undulation, so treat its 268px as an upper bound, not
// the true worst case). Once inside, normal movement can't get back out
// either -- same deliberate wait-out-the-cooldown consequence level-003/007
// already established, not a softlock.
//
// EACH OF THE BOX'S FOUR WALLS IS SHORT (360px, 7 debrisWall() instances)
// -- short enough that at the project's usual 100px undulating spacing, the
// bow-mode margin under the 120px no-gap threshold (2x Debris Field's 60px
// radius) measured out to a genuinely thin 7.97px (maxNeighborDist 112.03px
// at count=7... no, at this exact length/100px spacing the count is only 5,
// which is worse still). Rather than leave these four walls straight
// (which the automatic mode selection would do below MIN_BOW_COUNT, losing
// the "don't look like a ruler" treatment this file otherwise leans on
// everywhere else), each vault wall instead passes spacing=60 explicitly --
// verified (by generating the actual points, not estimating) to produce
// count=7 per wall (still comfortably in the bow tier, matching level-001's
// own verified-safe count=7/BOW_AMPLITUDE=30/spacing=100 case almost
// exactly in shape) with a worst-case neighbor distance of 61.85px -- a
// 58.15px margin under the 120px threshold, the safest margin anywhere in
// this file (safer even than the four long maze walls' own ~19px sweep-mode
// margin at the project's standard 100px spacing). This is a deliberate,
// verified per-wall deviation from the project's usual 100px default, not
// an oversight -- the shorter absolute wall length here makes a tighter
// spacing both necessary (for a real margin at all) and cheap (more
// instances on a 360px wall is barely more debris than fewer instances on
// the same span). The vault's four corners still meet exactly (0.00px gap
// at each of the four joins, confirmed by the same generate-and-measure
// pass) because every wall call shares literal endpoint coordinates
// (BOX_X1/X2/Y1/Y2) and the bow envelope pins t=0/t=1 to those endpoints
// exactly, same guarantee level-003/007's pocket-wall joins rely on.
//
// Sizing: 7290x4101, i.e. level-003/004's 5400x3038 footprint scaled by
// 7290/5400 = 4101/3038 (rounded from the exact 4101.3) = 1.35x -- both
// target dimensions share that one factor, so it's a uniform scale-up
// (level-design-guide.md §2), holding the established 16:9-ish aspect ratio
// and growing beyond every level built so far (largest prior: level-007's
// 7020x3949), per this guide's explicit floor ("holding steady or
// growing... is fine, don't go smaller").
//
// THE MAZE (four vertical walls, shorter than level-006's six, carrying the
// vault above): walls at x = 1600, 2800, 4000, 5200 (1200px lanes -- wider
// than level-006's 600px, giving the vault room to sit inside lane 1
// without crowding either flanking wall). Gaps alternate bottom/top/
// bottom/top, same serpentine principle as level-006: wallM0 (x=1600) is
// solid y:20-2900, gap y:2900-4081 (bottom, ~1181px); wallM1 (x=2800) is
// solid y:1100-4081, gap y:20-1100 (top, ~1080px); wallM2 (x=4000) mirrors
// wallM0; wallM3 (x=5200) mirrors wallM1. No wall spans a full map
// dimension (each touches exactly one edge, per §5's hard rule), and every
// gap is vastly wider than the ~120px two-debris-radius minimum, so the
// maze stays solvable by normal movement alone (the vault requires
// teleport; the maze itself never does).
//
// REACHABILITY TRACE (west region -> east region, the long Probe<->Beacon
// hop): west region (x<1600, open, Entry + Resupply) -> wallM0's bottom gap
// (x=1600, y:2900-4081) -> lane1 (1600-2800; the vault sits at its
// northern portion, PROBE_X/Y=(2150,1550), with a 220px passage on its west
// side and a 350px passage on its east side around it -- both comfortably
// more than the ship's ~56px width, confirmed by generating the vault's
// actual bounding box, not eyeballed) -> wallM1's top gap (x=2800,
// y:20-1100) -> lane2 (2800-4000, open) -> wallM2's bottom gap (x=4000,
// y:2900-4081) -> lane3 (4000-5200, open) -> wallM3's top gap (x=5200,
// y:20-1100) -> east region (x>5200, open, Beacon at 7100,4000). Return
// trip (Beacon -> Exit) retraces the same maze in reverse, same
// "cross-it-twice" compounding level-006/008 both already established for
// their own axes.
//
// Objectives (§3 -- only *consecutive* Probe<->Beacon and Beacon<->Exit
// need to be pushed far apart; non-consecutive Probe<->Exit is left close):
// diagonal = sqrt(7290^2+4101^2) ~= 8364.3px. Probe(2150,1550) <->
// Beacon(7100,4000): ~5523.1px (~66.0% of diagonal, inside the 65-76%
// precedent band). Beacon <-> Exit(1100,1700): ~6425.7px (~76.8%, right at
// the band's top edge -- matches level-005's own 77% landing). Probe <->
// Exit (non-consecutive): ~1060.7px (~12.7%, inside the 12-13% band).
// Entry sits at (400,3950), a genuine SW corner clear of every hazard
// (nearest is wallM0, 1200px away). All figures computed from the exact
// coordinates below, not estimated.
//
// Nebula Field (§6, four instances, placed with intent): an early-route
// toll on Entry's way toward the maze (N1), a bypass toll right at wallM0's
// gap threshold -- the maze's western entrance (N2), a bypass toll at
// wallM3's gap threshold -- the maze's eastern exit, right before the
// Beacon approach (N3), and a bridging toll on the close Probe<->Exit hop,
// sitting in lane1 on the path back from the vault toward Exit (N4). N2 and
// N4 are deliberately allowed to sit against/slightly inside a Debris Field
// wall's edge per §6 ("fine, even good... reads as a compound obstacle").
// Every instance keeps 250px+ net clearance from every objective/resupply
// point (verified by distance below, not eyeballed) -- the two exceptions
// are N2/N4's intentional overlap with wallM0 itself, which isn't an
// objective and isn't subject to that floor.
//
// Moving hazards (§7): 4 Ion Storm + 3 Meteoroid -- the current expanded
// baseline (level-005 pushed further to 5+4 as its own density axis;
// level-006/007/008 were retroactively bumped from the original 2-1 to
// this 4-3 figure, "moving hazards feel more present"). Matched here
// exactly, not exceeded -- this candidate's axis is the maze+vault
// structure, not moving-hazard density (that's the sibling level-009
// candidate's job), so holding at the current baseline instead of pushing
// past it keeps the two candidates reading as genuinely different
// experiments rather than both drifting toward "harder in every dimension
// at once."
//
// REPOSITIONED (level-refiner-agent, round 1, per the level-evaluator-
// agent's flagged finding): the original placement -- one per open lane/
// region -- only checked each hazard's *initial point* against the 250px
// floor, not its full first-leg path. `hazardConfig.ts` fixes
// `headingRadians` per hazard TYPE (Ion Storm always due west, Meteoroid
// always due east), so every instance holds a constant y for its entire
// first leg; against this maze's four parallel full-height walls (gaps in
// disjoint y-bands), no y-value threaded through one wall's lane also
// clears the next wall's lane -- 5 of the original 7 placements (3 Ion
// Storm, 2 Meteoroid) physically embedded themselves in a maze wall
// up to -165px during live-verified full-trajectory simulation. The only
// placements that were already clean were the two already positioned
// entirely on the far side of every wall in their fixed direction of
// travel (Ion Storm west of wallM0, Meteoroid east of wallM3) -- so all
// four Ion Storm instances now sit in the open west region (x<1600, west
// of wallM0, heading further west/away from the maze) and all three
// Meteoroid instances now sit in the open east region (x>5200, east of
// wallM3, heading further east/away from the maze). This is a real,
// documented change to this candidate's moving-hazard distribution (all
// four Ion Storm now share one region instead of one per lane), not a
// side-effect-free bugfix -- the maze's own geometry (disjoint-band gaps
// across four parallel walls) makes this the only genuinely safe
// distribution for a fixed-single-axis-heading mover, per the evaluator's
// diagnosis. Re-verified via a fresh full-first-leg trajectory simulation
// after the move (20ms steps, trochoid carrier+orbit for Ion Storm,
// straight line for Meteoroid): zero overlaps against every wall/vault/
// objective/resupply point across all seven instances' complete first
// legs, not just their initial points. Ion Storm's movementPattern is
// 'trochoid' as of 2026-08-25 (a looping sweep, orbit-aware radius
// 110+220=330, not a straight line) -- factored into the re-verification
// above.
//
// Resupply: one AsteroidField at (1250,3600), in the open west region
// alongside Entry -- a natural stop before entering the maze. 250px+ clear
// of every wall/objective (nearest: wallM0's endpoint, ~746px).
//
// No puzzle-taxonomy element placed (consistent with every real level so
// far -- Phase 2b content, still unstarted).
// Named so the dev-only sanity checks below can re-inspect the same
// generated arrays the hazards list spreads. Maze walls count@spacing100:
// 30, 31, 30, 31 -- all sweep (>=8). Vault walls count@spacing60: 7 each --
// all bow (4-7).
const wallM0 = debrisWall(1600, 20, 1600, 2900, 100); // maze wall 0 -- bottom gap (y:2900-4081)
const wallM1 = debrisWall(2800, 1100, 2800, 4081, 100); // maze wall 1 -- top gap (y:20-1100); vault sits in this lane
const wallM2 = debrisWall(4000, 20, 4000, 2900, 100); // maze wall 2 -- bottom gap (y:2900-4081)
const wallM3 = debrisWall(5200, 1100, 5200, 4081, 100); // maze wall 3 -- top gap (y:20-1100)

// The vault's four walls -- spacing=60, not the project's usual 100 (see
// the file-level comment above for the verified safety margin this buys).
const vaultWest = debrisWall(BOX_X1, BOX_Y1, BOX_X1, BOX_Y2, 60);
const vaultEast = debrisWall(BOX_X2, BOX_Y1, BOX_X2, BOX_Y2, 60);
const vaultNorth = debrisWall(BOX_X1, BOX_Y1, BOX_X2, BOX_Y1, 60);
const vaultSouth = debrisWall(BOX_X1, BOX_Y2, BOX_X2, BOX_Y2, 60);

export const LEVEL_010: LevelConfig = {
  width: 7290,
  height: 4101,
  entryWormholeLocation: { x: 400, y: 3950 },
  exitWormholeLocation: { x: 1100, y: 1700 },
  probeLocation: { x: PROBE_X, y: PROBE_Y },
  relayBeaconLocation: { x: 7100, y: 4000 },

  resupplyPoints: [{ x: 1250, y: 3600, textureKey: 'asteroid_large', radius: 40 }],

  hazards: [
    // Nebula Field -- four instances, placed with intent (see file comment
    // above for each one's role/clearance). Cycles the three sourced
    // Nebula Field textures so four instances on one map don't read as one
    // sprite copy-pasted four times.
    { type: 'nebulaField', x: 700, y: 3700, textureKey: NEBULA_TEXTURES[0] }, // early-route toll, Entry -> maze
    { type: 'nebulaField', x: 1550, y: 3100, textureKey: NEBULA_TEXTURES[1] }, // bypass toll at wallM0's gap threshold (maze's west entrance)
    { type: 'nebulaField', x: 5200, y: 700, textureKey: NEBULA_TEXTURES[2] }, // bypass toll at wallM3's gap threshold (maze's east exit, before Beacon)
    { type: 'nebulaField', x: 1750, y: 2100, textureKey: NEBULA_TEXTURES[0] }, // bridging toll, lane1 on the path back toward Exit

    // Ion Storm / Meteoroid -- managed by MovingHazardManager. Initial
    // positions only, held at the current expanded baseline (4-3, see file
    // comment above). REPOSITIONED round 1 (see file comment above for the
    // full rationale): all 4 Ion Storm now sit west of wallM0 (heading due
    // west, per hazardConfig.ts -- moving further away from the maze for
    // their entire first leg), all 3 Meteoroid now sit east of wallM3
    // (heading due east -- same reasoning). Every instance re-verified
    // clean across its complete first-leg trajectory, not just its initial
    // point.
    { type: 'ionStorm', x: 750, y: 300 }, // west region, north -- was (3400,2200), overlapped wallM0/wallM1
    { type: 'ionStorm', x: 1000, y: 2200 }, // west region, mid -- was (4600,1900), overlapped wallM0/wallM1/wallM2
    { type: 'ionStorm', x: 650, y: 2750 }, // west region, south -- was (6200,2200), overlapped all four maze walls
    { type: 'ionStorm', x: 900, y: 1000 }, // west region -- unchanged, already clean
    { type: 'meteoroid', x: 5700, y: 1600 }, // east region, north -- was (2200,3400), overlapped wallM1/wallM3
    { type: 'meteoroid', x: 5900, y: 2400 }, // east region, mid -- was (3400,900), overlapped wallM2
    { type: 'meteoroid', x: 6500, y: 900 }, // east region -- unchanged, already clean

    // The maze -- four parallel vertical walls with alternating single
    // gaps (see file-level comment above for the full reachability trace).
    ...wallM0,
    ...wallM1,
    ...wallM2,
    ...wallM3,

    // THE INNER VAULT -- this candidate's axis (see file-level comment
    // above for the full geometry, the box-vs-ring rationale, and the
    // per-wall spacing=60 safety derivation). Seals the Probe inside lane1.
    ...vaultWest,
    ...vaultEast,
    ...vaultNorth,
    ...vaultSouth,
  ],

  puzzleElements: [],
};

// Sanity check, not gameplay logic: fails fast (at import time, in dev) if
// a future edit to debrisWall's undulation constants (sweep or bow) or
// either spacing value ever lets two neighboring instances drift past the
// 120px (2x Debris Field's 60px radius, hazardConfig.ts) no-gap threshold,
// instead of silently shipping a wall (or the vault) with a ship-width hole
// in it. Re-inspects the actual generated arrays rather than re-deriving
// the math.
if (import.meta.env.DEV) {
  const NO_GAP_THRESHOLD = 2 * 60;
  [wallM0, wallM1, wallM2, wallM3, vaultWest, vaultEast, vaultNorth, vaultSouth].forEach((wall, wallIndex) => {
    for (let i = 0; i < wall.length - 1; i++) {
      const dist = Math.hypot(wall[i + 1].x - wall[i].x, wall[i + 1].y - wall[i].y);
      if (dist > NO_GAP_THRESHOLD) {
        console.warn(
          `[level-010] Wall ${wallIndex} has a ${dist.toFixed(1)}px gap between instances ${i} and ${i + 1} -- exceeds the ${NO_GAP_THRESHOLD}px no-gap threshold, may open a ship-width hole.`,
        );
      }
    }
  });

  // Each vault wall is checked separately above (each internally gap-free),
  // but that doesn't confirm the four walls seal *each other* off at their
  // shared corners -- check all four joins explicitly, same as
  // level-003/007's pocket-wall joins.
  const joins: Array<[string, HazardPlacement, HazardPlacement]> = [
    ['NW', vaultWest[0], vaultNorth[0]],
    ['SW', vaultWest[vaultWest.length - 1], vaultSouth[0]],
    ['NE', vaultEast[0], vaultNorth[vaultNorth.length - 1]],
    ['SE', vaultEast[vaultEast.length - 1], vaultSouth[vaultSouth.length - 1]],
  ];
  joins.forEach(([label, a, b]) => {
    const joinDist = Math.hypot(b.x - a.x, b.y - a.y);
    if (joinDist > NO_GAP_THRESHOLD) {
      console.warn(
        `[level-010] Vault's ${label} corner doesn't seal (${joinDist.toFixed(1)}px gap) -- exceeds the ${NO_GAP_THRESHOLD}px no-gap threshold, may open a ship-width hole.`,
      );
    }
  });
}

// Sanity check, not gameplay logic: fails fast (at import time, in dev) if
// a future edit to BOX_HALF_WIDTH/HEIGHT or abilityConfig.teleport.maxRange
// ever breaks the range math the file comment above walks through, instead
// of silently shipping an unreachable Probe. Covers the worst-case axis
// (the larger of the two half-dimensions, though both are equal here).
const vaultApproachDistance = Math.max(BOX_HALF_WIDTH, BOX_HALF_HEIGHT) + 60 + 28;
if (import.meta.env.DEV && vaultApproachDistance >= abilityConfig.teleport.maxRange!) {
  console.warn(
    `[level-010] Vault approach distance (${vaultApproachDistance}px) is not comfortably under teleport's maxRange (${abilityConfig.teleport.maxRange}px) -- the Probe may be unreachable.`,
  );
}

// Sanity check, not gameplay logic: warns at import time (dev only) if the
// vault's interior -- clear of every wall's energy-node keep-out (debris
// radius + node radius + hazardKeepOutBuffer) -- shrinks too small for a
// pickup to ever land inside, re-creating the problem level-003/007's old
// sealed debrisRing()s had (see the file-level comment above).
const nodeWallKeepOut =
  hazardConfig.debrisField.shape.kind === 'circle'
    ? hazardConfig.debrisField.shape.radius + energyNodeConfig.radius + energyNodeConfig.hazardKeepOutBuffer
    : 0;
const MIN_POCKET_INTERIOR = 100; // px, arbitrary "clearly usable" floor -- not tied to any other config value
const vaultInteriorWidth = BOX_X2 - BOX_X1 - 2 * nodeWallKeepOut;
const vaultInteriorHeight = BOX_Y2 - BOX_Y1 - 2 * nodeWallKeepOut;
if (import.meta.env.DEV && (vaultInteriorWidth < MIN_POCKET_INTERIOR || vaultInteriorHeight < MIN_POCKET_INTERIOR)) {
  console.warn(
    `[level-010] Vault interior (${vaultInteriorWidth.toFixed(0)}x${vaultInteriorHeight.toFixed(0)}px) is too small for energy nodes to reliably respawn inside it.`,
  );
}
