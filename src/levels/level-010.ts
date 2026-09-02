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
//
// RESCALED 2026-09-02 (see the file-header resize comment below):
// BOX_HALF_WIDTH/HEIGHT (180) were deliberately left UNSCALED -- they're a
// fixed ship/debris-radius-derived clearance buffer, not a quantity that
// should shrink with the map (same treatment level-007's
// POCKET_WALL_CLEARANCE got during its own 2026-09-02 resize). PROBE_X/Y
// are the *scaled* Probe location; BOX_X1/X2/Y1/Y2 are re-derived from that
// scaled center plus the still-180px clearance, not by scaling the old
// 1970/2330/1370/1730 values directly (which would have shrunk the vault's
// own approach-clearance math along with the map).
const PROBE_X = 1770; // was 2150 pre-resize
const PROBE_Y = 1276; // was 1550 pre-resize
const BOX_HALF_WIDTH = 180;
const BOX_HALF_HEIGHT = 180;
const BOX_X1 = PROBE_X - BOX_HALF_WIDTH; // 1590 (was 1970)
const BOX_X2 = PROBE_X + BOX_HALF_WIDTH; // 1950 (was 2330)
const BOX_Y1 = PROBE_Y - BOX_HALF_HEIGHT; // 1096 (was 1370)
const BOX_Y2 = PROBE_Y + BOX_HALF_HEIGHT; // 1456 (was 1730)

// Tenth real level. Generated via the level GER loop (content-agent ->
// level-evaluator-agent -> level-refiner-agent, per level-design-guide.md
// §1) and registered into src/levels/index.ts's LEVELS map and
// src/config/levelOrder.ts's LEVEL_ORDER the same day, alongside level-009
// (in that order: level-009 then level-010). Sits after level-008 in
// LEVEL_ORDER, squarely in §8's post-full-unlock experimentation zone --
// the player already has scan/teleport/rocketBoost (and tractorBeam,
// unlocked-by-default) by the time they'd reach this level, so none of
// §4/§7's ability-gating constraints apply. A sibling agent concurrently
// authored level-009 in the same batch, also asked to push moving-hazard
// density -- this candidate deliberately does NOT lean on that axis (see
// the moving-hazard note below) so the two don't converge, per §8's
// "variety, not convergence" principle.
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
// comfortably above the 100px "clearly usable" floor level-007 established;
// UNCHANGED by the 2026-09-02 resize below, since BOX_HALF_WIDTH/HEIGHT and
// every keep-out term feeding this figure are all fixed pixel values, not
// scaled ones).
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
// already established, not a softlock. **UNCHANGED by the 2026-09-02
// resize** -- BOX_HALF_WIDTH/HEIGHT, BOW_AMPLITUDE, and every other term in
// this math are fixed pixel values, and the box only moved (translated
// with the scaled Probe location), it didn't change shape: the vault's
// four wall point-clouds were confirmed byte-for-byte identical in shape
// (relative to their own corner) pre- and post-resize by regenerating both
// and diffing, so the live-measured ~298px/~52px-slack figure above still
// holds exactly, not just approximately.
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
// **Re-confirmed unchanged post-2026-09-02-resize** -- same count=7/
// 61.85px worst-case/58.15px margin, since the box's shape is untouched.
//
// Sizing: originally 7290x4101, i.e. level-003/004's 5400x3038 footprint
// scaled by 7290/5400 = 4101/3038 (rounded from the exact 4101.3) = 1.35x
// -- both target dimensions shared that one factor, so it was a uniform
// scale-up (level-design-guide.md §2), holding the established 16:9-ish
// aspect ratio and growing beyond every level built so far at the time
// (largest prior: level-007's 7020x3949), per this guide's explicit floor
// ("holding steady or growing... is fine, don't go smaller").
//
// RESIZED 2026-09-02 (project-owner request, not evaluator-driven; third of
// a same-day batch alongside level-006/level-007/level-008, level-009 done
// in parallel): shrunk from 7290x4101 down to exactly 6000x3375, matching
// level-005/006/007/008's new project-wide max footprint. Per
// level-design-guide.md §11, this is NOT the uniform single-factor scale
// §2/§10 use for same-shape resizes -- 7290x4101 isn't exactly 16:9 the way
// 6000x3375 is, so two independent per-axis factors were used:
// scaleX = 6000/7290 = 0.823045, scaleY = 3375/4101 = 0.822970. Safe to
// apply independently here specifically because every wall in this file
// (all four maze walls, all four vault walls) is axis-aligned (perfectly
// vertical or horizontal, confirmed by inspecting every debrisWall() call
// below) -- non-uniform per-axis scaling introduces zero shear for
// axis-aligned geometry (it would for a diagonal wall, like level-009's
// wallC). Every plain point placement (objectives, resupply, Nebula/Ion
// Storm/Meteoroid instances) was scaled directly; every debrisWall() call
// (all eight) was re-run from newly-scaled *endpoints* rather than scaling
// the pre-generated instance arrays (§11's explicit warning), with spacing
// (100 on the four maze walls, 60 on the four vault walls) and the
// undulation constants (SWEEP_AMPLITUDE/TEXTURE_AMPLITUDE/BOW_AMPLITUDE/
// etc. above) deliberately left at their existing absolute-pixel values per
// §11's stated default, since they're tied to Debris Field's fixed 60px
// collision radius, not to level size. No wall needed a spacing override --
// re-verified by regenerating every array and measuring actual worst-case
// neighbor distance, not assumed: the four maze walls land at 100.4/99.8/
// 100.4/99.8px (all comfortably under 120px, ~19-20px margin, essentially
// identical to the pre-resize ~19px margin), and the four vault walls land
// at 61.85px each (unchanged -- see the vault geometry comment above for
// why), with all four vault corner joins still exactly 0.00px. The vault's
// box (BOX_HALF_WIDTH/HEIGHT, 180px) was deliberately left UNSCALED -- see
// this file's earlier vault-constants comment for the full rationale
// (parallel to level-007's POCKET_WALL_CLEARANCE treatment) -- PROBE_X/Y
// are re-derived from the scaled Probe location, then BOX_X1/X2/Y1/Y2 from
// that plus the still-180px clearance.
//
// One real, non-moving-hazard finding from this resize's re-verification,
// distinct from the moving-hazard trajectory audit below: the vault's own
// approach passages (the open space between the vault's west/east walls
// and the maze's flanking wallM0/wallM1, inside lane1) measurably narrowed.
// Direct point-cloud measurement (min pairwise distance between the actual
// generated wall/vault instance arrays, net of both walls' 60px debris
// radii) gives: west passage 366.2px raw / 246.2px net pre-resize -> 246.0px
// raw / 126.0px net post-resize; east passage 463.4px raw / 343.4px net
// pre-resize -> 349.0px raw / 229.0px net post-resize. (These are a more
// precise re-derivation than this file's original "220px west / 350px east"
// prose estimate below, which was close but not exact -- the west figure in
// particular undercounted by ~26px; both pre- and post-resize numbers above
// use the identical measurement method, so the *change* they show is
// apples-to-apples even though the pre-resize baseline itself moved
// slightly from what was originally written.) Both post-resize net figures
// remain well clear of the ship's 46x56px display size (more than double
// the ship's width on the tighter west side, over 4x on the east) -- a
// real, worth-flagging tightening from this resize, but not a break: no
// repositioning was needed or attempted, since "shrink to fit new bounds
// while keeping design intent intact" is this task's explicit scope, and a
// narrower-but-still-comfortably-passable lane is squarely inside that,
// not a structural failure requiring a redesign.
//
// Objective-spacing percentages (Probe<->Beacon 66.0%, Beacon<->Exit 76.8%,
// Probe<->Exit 12.7%) came out unchanged to one decimal place from the
// pre-resize figures below, since scaleX and scaleY are close enough
// (0.823045 vs 0.822970) that diagonal-relative distances barely move --
// only the raw px figures throughout this file's comments were updated.
//
// THE MAZE (four vertical walls, shorter than level-006's six, carrying the
// vault above): walls at x = 1317, 2305, 3292, 4280 (988px lanes -- was
// x = 1600, 2800, 4000, 5200 at 1200px lanes pre-resize; still wider than
// level-006's post-resize ~555px lanes, giving the vault room to sit inside
// lane 1 without crowding either flanking wall). Gaps alternate bottom/top/
// bottom/top, same serpentine principle as level-006: wallM0 (x=1317) is
// solid y:16-2387, gap y:2387-3359 (bottom, ~972px; was y:20-2900 solid,
// gap y:2900-4081, ~1181px); wallM1 (x=2305) is solid y:905-3359, gap
// y:16-905 (top, ~889px; was y:1100-4081 solid, gap y:20-1100, ~1080px);
// wallM2 (x=3292) mirrors wallM0; wallM3 (x=4280) mirrors wallM1. No wall
// spans a full map dimension (each touches exactly one edge, per §5's hard
// rule), and every gap is vastly wider than the ~120px two-debris-radius
// minimum, so the maze stays solvable by normal movement alone (the vault
// requires teleport; the maze itself never does).
//
// REACHABILITY TRACE (west region -> east region, the long Probe<->Beacon
// hop): west region (x<1317, open, Entry + Resupply) -> wallM0's bottom gap
// (x=1317, y:2387-3359) -> lane1 (1317-2305; the vault sits at its
// northern portion, PROBE_X/Y=(1770,1276), with a ~126px net passage on its
// west side and a ~229px net passage on its east side around it -- see the
// resize-note passage-narrowing paragraph above for the precise pre/post
// figures; both remain more than double the ship's ~46px width, confirmed
// by generating the vault's actual bounding geometry, not eyeballed) ->
// wallM1's top gap (x=2305, y:16-905) -> lane2 (2305-3292, open) ->
// wallM2's bottom gap (x=3292, y:2387-3359) -> lane3 (3292-4280, open) ->
// wallM3's top gap (x=4280, y:16-905) -> east region (x>4280, open, Beacon
// at 5844,3292). Return trip (Beacon -> Exit) retraces the same maze in
// reverse, same "cross-it-twice" compounding level-006/008 both already
// established for their own axes.
//
// Objectives (§3 -- only *consecutive* Probe<->Beacon and Beacon<->Exit
// need to be pushed far apart; non-consecutive Probe<->Exit is left close):
// diagonal = sqrt(6000^2+3375^2) ~= 6884.1px. Probe(1770,1276) <->
// Beacon(5844,3292): ~4545.5px (~66.0% of diagonal, inside the 65-76%
// precedent band). Beacon <-> Exit(905,1399): ~5289.3px (~76.8%, right at
// the band's top edge -- matches level-005's own 77% landing, and this
// file's own pre-resize figure). Probe <-> Exit (non-consecutive):
// ~873.7px (~12.7%, inside the 12-13% band). Entry sits at (329,3251), a
// genuine SW corner clear of every hazard (nearest is wallM0, ~1312.5px
// away, re-measured against the actual generated wall points). All figures
// computed from the exact coordinates below, not estimated.
//
// Nebula Field (§6, four instances, placed with intent, coordinates
// rescaled 2026-09-02): an early-route toll on Entry's way toward the maze
// (N1, 576,3045, was 700,3700 -- ~321.6px net of Entry), a bypass toll
// right at wallM0's gap threshold -- the maze's western entrance (N2,
// 1276,2551, was 1550,3100 -- ~480.4px net of Resupply), a bypass toll at
// wallM3's gap threshold -- the maze's eastern exit, right before the
// Beacon approach (N3, 4280,576, was 5200,700 -- ~2605.8px net of Probe),
// and a bridging toll on the close Probe<->Exit hop, sitting in lane1 on
// the path back from the vault toward Exit (N4, 1440,1728, was 1750,2100 --
// ~559.6px net of Probe). N2 and N4 are deliberately allowed to sit
// against/slightly inside a Debris Field wall's edge per §6 ("fine, even
// good... reads as a compound obstacle"). Every instance keeps 250px+ net
// clearance from every objective/resupply point (re-verified by distance
// above, not eyeballed) -- the two exceptions are N2/N4's intentional
// overlap with wallM0 itself, which isn't an objective and isn't subject to
// that floor.
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
// four Ion Storm instances now sit in the open west region (x<1317, west
// of wallM0, heading further west/away from the maze) and all three
// Meteoroid instances now sit in the open east region (x>4280, east of
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
// legs, not just their initial points. Ion Storm's movementPattern was
// 'trochoid' as of 2026-08-25 (a looping sweep, orbit-aware radius
// 110+220=330, not a straight line) -- factored into that re-verification.
//
// RE-VERIFIED POST-2026-09-02-RESIZE (coordinates rescaled per the
// file-header resize comment above): Meteoroid switched 'linear' ->
// 'homing' the same day (hazardConfig.ts, 2026-09-02), so its heading is no
// longer fixed for a full leg -- only the short deterministic pre-retarget
// segment applies (retargetIntervalSeconds=1s at this level's actual
// player-start-to-hazard distances, all >>500px, so the closer-range 0.5s
// interval never applies here; 280px/s * 1s = 280px straight east from each
// start point). Re-ran both hazards' current-pattern simulations against
// the new 6000x3375 bounds and rescaled coordinates: all 4 Ion Storm
// placements' full carrier+orbit first legs (5.9-6.5s until wrapping out of
// bounds) stay at least 326px clear of every maze/vault wall and every
// objective/resupply point; all 3 Meteoroid placements' 280px pre-retarget
// segments stay at least 307px clear of the same. Zero new overlaps
// introduced by the resize -- every wall/objective clearance margin shrank
// by roughly the same ~17-18% the axis scale factors imply (consistent with
// a uniform-ish scale-down, not a qualitatively new problem), and every
// placement that was clean before the resize is still clean after it.
//
// Resupply: one AsteroidField at (1029,2963) (was 1250,3600), in the open
// west region alongside Entry -- a natural stop before entering the maze.
// 250px+ clear of every wall/objective (nearest: wallM0, ~644.0px,
// re-measured against the actual generated wall points).
//
// No puzzle-taxonomy element placed (consistent with every real level so
// far -- Phase 2b content, still unstarted).
// Named so the dev-only sanity checks below can re-inspect the same
// generated arrays the hazards list spreads. Maze walls count@spacing100:
// 25, 26, 25, 26 (was 30, 31, 30, 31 pre-resize) -- all sweep (>=8). Vault
// walls count@spacing60: 7 each (unchanged) -- all bow (4-7).
const wallM0 = debrisWall(1317, 16, 1317, 2387, 100); // maze wall 0 -- bottom gap (y:2387-3359); was (1600,20)-(1600,2900)
const wallM1 = debrisWall(2305, 905, 2305, 3359, 100); // maze wall 1 -- top gap (y:16-905); vault sits in this lane; was (2800,1100)-(2800,4081)
const wallM2 = debrisWall(3292, 16, 3292, 2387, 100); // maze wall 2 -- bottom gap (y:2387-3359); was (4000,20)-(4000,2900)
const wallM3 = debrisWall(4280, 905, 4280, 3359, 100); // maze wall 3 -- top gap (y:16-905); was (5200,1100)-(5200,4081)

// The vault's four walls -- spacing=60, not the project's usual 100 (see
// the file-level comment above for the verified safety margin this buys).
const vaultWest = debrisWall(BOX_X1, BOX_Y1, BOX_X1, BOX_Y2, 60);
const vaultEast = debrisWall(BOX_X2, BOX_Y1, BOX_X2, BOX_Y2, 60);
const vaultNorth = debrisWall(BOX_X1, BOX_Y1, BOX_X2, BOX_Y1, 60);
const vaultSouth = debrisWall(BOX_X1, BOX_Y2, BOX_X2, BOX_Y2, 60);

export const LEVEL_010: LevelConfig = {
  width: 6000,
  height: 3375,
  entryWormholeLocation: { x: 329, y: 3251 }, // was (400, 3950)
  exitWormholeLocation: { x: 905, y: 1399 }, // was (1100, 1700)
  probeLocation: { x: PROBE_X, y: PROBE_Y }, // was (2150, 1550)
  relayBeaconLocation: { x: 5844, y: 3292 }, // was (7100, 4000)

  resupplyPoints: [{ x: 1029, y: 2963, textureKey: 'asteroid_large', radius: 40 }], // was (1250, 3600)

  hazards: [
    // Nebula Field -- four instances, placed with intent (see file comment
    // above for each one's role/clearance). Cycles the three sourced
    // Nebula Field textures so four instances on one map don't read as one
    // sprite copy-pasted four times. Coordinates rescaled 2026-09-02
    // (scaleX=0.823045, scaleY=0.822970).
    { type: 'nebulaField', x: 576, y: 3045, textureKey: NEBULA_TEXTURES[0] }, // early-route toll, Entry -> maze; was (700, 3700)
    { type: 'nebulaField', x: 1276, y: 2551, textureKey: NEBULA_TEXTURES[1] }, // bypass toll at wallM0's gap threshold (maze's west entrance); was (1550, 3100)
    { type: 'nebulaField', x: 4280, y: 576, textureKey: NEBULA_TEXTURES[2] }, // bypass toll at wallM3's gap threshold (maze's east exit, before Beacon); was (5200, 700)
    { type: 'nebulaField', x: 1440, y: 1728, textureKey: NEBULA_TEXTURES[0] }, // bridging toll, lane1 on the path back toward Exit; was (1750, 2100)

    // Ion Storm / Meteoroid -- managed by MovingHazardManager. Initial
    // positions only, held at the current expanded baseline (4-3, see file
    // comment above). REPOSITIONED round 1 (see file comment above for the
    // full rationale): all 4 Ion Storm sit west of wallM0 (heading due
    // west, per hazardConfig.ts -- moving further away from the maze for
    // their entire first leg), all 3 Meteoroid sit east of wallM3 (heading
    // due east -- same reasoning). Coordinates rescaled 2026-09-02
    // (scaleX=0.823045, scaleY=0.822970) and re-verified against the
    // current movement patterns (Ion Storm 'trochoid', Meteoroid 'homing')
    // -- see the file-header resize comment's "RE-VERIFIED
    // POST-2026-09-02-RESIZE" paragraph. Zero new overlaps found.
    { type: 'ionStorm', x: 617, y: 247 }, // west region, north; was (750, 300)
    { type: 'ionStorm', x: 823, y: 1811 }, // west region, mid; was (1000, 2200)
    { type: 'ionStorm', x: 535, y: 2263 }, // west region, south; was (650, 2750)
    { type: 'ionStorm', x: 741, y: 823 }, // west region; was (900, 1000)
    { type: 'meteoroid', x: 4691, y: 1317 }, // east region, north; was (5700, 1600)
    { type: 'meteoroid', x: 4856, y: 1975 }, // east region, mid; was (5900, 2400)
    { type: 'meteoroid', x: 5350, y: 741 }, // east region; was (6500, 900)

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
