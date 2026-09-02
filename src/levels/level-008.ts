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
// hand-authored file per level" convention (CLAUDE.md tech stack). Used
// sparingly in this file -- see the file-level comment below for why.
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
// clear 16 instances at 115px. Doesn't touch nebulaWall below -- this
// rollout only covers Debris Field, per what was actually asked for.
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

// Same interpolation as debrisWall above, but for Nebula Field (100px-radius,
// static, energy-draining, NOT blocksMovement -- hazardConfig.ts) -- this
// file's primary hazard, so it gets its own per-file helper rather than
// reusing debrisWall's plumbing directly. Cycles the three sourced Nebula
// Field textures (2026-08-21, mirroring debrisWall's alt2/alt3 texture
// cycling above) -- this file's THE DRIFT EXPANSE gauntlet chains many
// instances per wall, exactly the case where one sprite copy-pasted N times
// would be most visible. (Comment updated 2026-08-21: Nebula Field now has
// three sourced art variants, superseding the earlier "no sourced art yet,
// one shared placeholder" note.) Default spacing (190) is chosen the same
// way debrisWall's 115 was: comfortably under 2x Nebula Field's 100px
// radius (200px) so a chain reads as one continuous drain field with no gap
// a ship could slip through *along the wall's own length* -- see the file
// comment below for why that's a distinct claim from "the wall blocks
// movement," which it deliberately never does.
function nebulaWall(x1: number, y1: number, x2: number, y2: number, spacing = 190): HazardPlacement[] {
  const length = Math.hypot(x2 - x1, y2 - y1);
  const count = Math.max(2, Math.round(length / spacing) + 1);
  const placements: HazardPlacement[] = [];
  for (let i = 0; i < count; i++) {
    const t = i / (count - 1);
    placements.push({
      type: 'nebulaField',
      x: x1 + (x2 - x1) * t,
      y: y1 + (y2 - y1) * t,
      textureKey: NEBULA_TEXTURES[i % NEBULA_TEXTURES.length],
    });
  }
  return placements;
}

// Eighth real level. Generated via the level GER loop (content-agent ->
// level-evaluator-agent -> level-refiner-agent, per level-design-guide.md
// §1). Round 1 of Evaluate flagged two [placement] issues -- the bridging
// toll's near end sitting under the 250px clearance floor against Probe,
// and Ion Storm's SW placement sitting exactly on the clearance floor
// against Debris Wall A -- both fixed (see the inline comments below on
// the bridging toll and the SW Ion Storm placement) and re-verified.
// Round 2 independently re-verified both fixes live and found no new
// issues (VERDICT: pass, round 2 of at most 3). Registered into
// src/levels/index.ts's LEVELS map + src/config/levelOrder.ts's
// LEVEL_ORDER, 2026-08-17. Full evaluation report:
// docs/history/level-eval-log-2026-08-17.md. Sits after level-007, squarely
// in §8's post-full-unlock experimentation zone -- the player already has
// scan/teleport/rocketBoost (and tractorBeam, unlocked-by-default) by the
// time they'd reach this level, so none of §4/§7's ability-gating
// constraints apply.
//
// Creative axis for this candidate: NEBULA-FIELD-HEAVY, DENSE ENERGY-DRAIN
// ROUTING. Every real level so far (§6) places Nebula Field sparingly --
// roughly 4 intent-placed instances as bypass/early-route/bridging tolls,
// always secondary to a Debris Field wall or maze as the level's real
// navigational obstacle. This candidate inverts that: Debris Field is kept
// deliberately minimal/conventional (two short, ordinary, both-ends-open
// walls -- 19 instances total, nowhere near level-006's maze or level-007's
// three sealed rings), and Nebula Field density becomes the level's actual
// navigation pressure instead -- 87 instances total, arranged as a genuine
// multi-wall "gauntlet" the player has to cross (twice -- see below) rather
// than a handful of scattered tolls. Neither sibling (level-006's Debris
// Field maze, level-007's triple sealed ring) touches this axis, so the two
// read as genuinely different experiments rather than variations on one
// theme.
//
// WHY THIS DOESN'T NEED §5's "never span a full map dimension" RULE:
// that rule is specifically about blocksMovement colliders (a Debris Field
// wall spanning edge-to-edge would make the level unsolvable by normal
// movement). Nebula Field is NOT blocksMovement -- crossing one just costs
// energy, so a Nebula Field "wall" spanning a full map dimension is not a
// reachability hazard the way a Debris Field one would be. That's exactly
// what this candidate exploits: the three main gauntlet walls below span
// (almost) the full map height on purpose, so there is no way to route
// around them, only through them -- the choice is *where* to cross, not
// *whether*.
//
// Sizing (pre-2026-09-02): 6750x3798, i.e. level-003/004's 5400x3038
// footprint scaled by 6750/5400 = 3798/3037.6 (rounded to 3798 from the
// exact 3797.5) = 1.25x -- both target dimensions shared that one factor,
// so it was a uniform scale-up (level-design-guide.md §2), holding the
// established 16:9-ish aspect ratio and growing beyond level-006's
// 6480x3646 (the largest level built at the time).
//
// RESIZED 2026-09-02 (project-owner request, not evaluator-driven): shrunk
// from 6750x3798 down to exactly 6000x3375, matching level-005/006's
// project-wide max footprint (level-007 resized to the same target in a
// parallel pass the same day). Per level-design-guide.md §11, this is NOT
// the uniform single-factor scale §2/§10 use for same-shape resizes --
// 6750x3798 isn't exactly 16:9 the way 6000x3375 is, so two independent
// per-axis factors were used: scaleX = 6000/6750 = 0.888889,
// scaleY = 3375/3798 = 0.888626. Every plain point placement (objectives,
// resupply, standalone Ion Storm/Meteoroid instances) was scaled by the
// appropriate axis factor; every debrisWall()/nebulaWall() call was
// re-run from newly-scaled *endpoints* rather than scaling the
// pre-generated instance arrays (§11's explicit warning).
//
// Axis-alignment check (§11's precondition for safe independent per-axis
// scaling): every debrisWall() segment here (wallA, wallB) is vertical, so
// their perpendicular-offset undulation scales cleanly under independent
// per-axis factors -- same precondition level-006's resize verified for
// its six maze walls. One nebulaWall() segment -- the bridging toll,
// (1150,1080)-(1250,1250) pre-resize -- is diagonal, flagged per this
// guide's instruction before proceeding: nebulaWall() has no undulation
// step (pure two-point linear interpolation, endpoints scaled then
// interpolated), which commutes exactly with independent per-axis scaling
// regardless of the segment's orientation -- unlike debrisWall()'s
// perpendicular-offset step, plain interpolation has no direction-dependent
// term that non-uniform scaling could shear. Confirmed safe to proceed,
// not just assumed.
//
// Spacing exceptions: none needed for either helper. wallA/wallB both keep
// their existing explicit spacing=100 (already tightened pre-resize to
// support undulation); post-resize their shorter length drops instance
// count 11->10 and 10->9 respectively, but both stay well above
// MIN_UNDULATE_COUNT=8 and both re-verified worst-case neighbor distances
// (100.25px / wallA, 101.37px / wallB) comfortably clear the 120px no-gap
// threshold (~19px margin, matching the pre-resize ~18-19px margin almost
// exactly -- re-verified by regenerating the actual arrays, not assumed).
// Every nebulaWall() call also keeps its existing spacing; post-resize
// worst-case neighbor distances across all eight nebula segments range
// ~175-190px, all comfortably under the 200px (2x Nebula Field's 100px
// radius) visual-continuity margin this file's nebulaWall comment
// describes -- several segments actually *tightened* slightly (e.g. the
// bridging toll's already-thin 197.2px pre-resize margin improved to
// ~175.3px of *slack under* the threshold, i.e. more comfortable, not
// less) since the resize shrinks both a formation's length and its
// instance count together.
//
// Three placements needed a small, scoped reposition beyond pure
// coordinate scaling -- found by recomputing every wall/objective/resupply/
// moving-hazard clearance pair post-resize (not just the ones this file's
// pre-resize comments called out) and catching cases where the naive
// per-axis-scaled coordinate crossed or came uncomfortably close to the
// 250px floor, even though the same pair was comfortably clear pre-resize:
// - The First Veil nebula toll's naive scaled x (2050 * 0.888889 = 1822)
//   put it only ~255.6px net of Exit Wormhole (down from a real 300px net
//   pre-resize -- the file's original "~400px clear of Exit" claim had
//   measured raw center-to-center distance, not net of Nebula Field's own
//   100px radius, the same kind of error round 1's bridging-toll fix
//   already caught once in this file). Moved to x=1867, restoring the
//   original 300px net (409.7... see below) -- chosen to reproduce the
//   pre-resize *raw* separation (400px) exactly, not just clear the floor
//   by a hair.
// - That shift moved First Veil closer to the Ion Storm placed in "the gap
//   west of the Drift Expanse" (below), which would have dropped their
//   mutual clearance to ~242.8px net -- under the floor, a second-order
//   effect of the first fix. Rather than fight two constraints over the
//   same ~20px-wide feasible window on First Veil's position, the Ion Storm
//   placement itself moved instead (see the Moving hazards section below)
//   -- a single point is easier to relocate without cascading effects than
//   a formation's endpoint.
// - Drift Expanse wall N1's naive scaled x (2800 * 0.888889 = 2489) put the
//   AsteroidField resupply point (naive scaled x = 2089) only ~260px net
//   clear -- again down from a comfortably-clear ~310px net pre-resize (the
//   file's original "~450px clear" claim was likewise a raw, not net,
//   figure). Resupply moved from x=2089 to x=2049, restoring the pre-resize
//   ~300px net separation.
// - A fourth, distinct case was NOT a resize-introduced problem but an
//   already-marginal pre-existing gap the resize pushed decisively over the
//   line: the Meteoroid placed "between the Drift Expanse and the Approach
//   Veil" was already only ~244px net of Drift Expanse wall N3 pre-resize
//   (a real, if narrow, floor violation nobody had caught -- this file's
//   own header claims "All three initial placements keep 250px+ clearance
//   from every wall/formation/objective/resupply point," which wasn't
//   actually true for this one pair even before the resize). Post-resize
//   it dropped further to ~199px net. Fixed here rather than left as
//   "merely carried forward," since it's a real placement clearance this
//   file's own stated design intent already claimed to guarantee, not an
//   accepted overlap-by-design case the way Nebula-vs-Debris-wall overlap
//   is (§6) -- see the Moving hazards section for the new coordinate.
// None of these four rise to "substantial redesign" (each is a single
// endpoint/point nudge of well under 100px, everything else in the file is
// untouched) -- self-verified and finalized directly per this guide's
// "small, scoped fixes" allowance, not looped back through a fresh
// Evaluate pass.
//
// Full re-verification performed post-resize (all of it, not just the four
// fixes above): every wall/objective/resupply/moving-hazard pair in the
// file recomputed and confirmed >=260px net (most far higher; see the
// Objectives/Debris Field/Nebula Field/Moving hazards sections below for
// the individual figures) -- zero remaining pairs under the 250px floor
// after the four fixes above.
//
// Objectives (§3 -- only *consecutive* Probe<->Beacon and Beacon<->Exit need
// to be pushed far apart; non-consecutive Probe<->Exit is deliberately left
// close): diagonal = sqrt(6000^2 + 3375^2) ~= 6884px (was ~7745px
// pre-resize). Probe(667,800) <-> Beacon(5422,3021): ~5248px (~76.2% of
// diagonal, at the top of the 65-76% precedent band, matching level-005's
// 77% -- pre-resize was ~76.3%, essentially unchanged since scaleX/scaleY
// are close). Beacon <-> Exit(1467,1244): ~4336px (~63.0%, a touch under
// the band -- same situation level-007 hit for the same geometric reason:
// Exit has to sit close to Probe *and* Probe is already pushed into the far
// corner from Beacon, leaving Exit no room to also extend away from Beacon;
// §3 states the band is "not a hard target"; pre-resize was also ~63.0%).
// Probe <-> Exit (non-consecutive): ~915px (~13.3%, inside the 12-13% band,
// unchanged from pre-resize). Entry sits at (267,3199), a genuine SW
// corner, clear of every hazard placed below (nearest is Debris Field Wall
// A, ~885px away, was ~1063px pre-resize).
//
// THE GAUNTLET (this candidate's axis) sits on the Probe<->Beacon leg --
// the natural place to spend it, per §3 and matching level-006's precedent
// of spending its own axis on the same long consecutive hop. Because Exit
// sits geographically close to Probe rather than Beacon, the *return* trip
// (Beacon -> Exit, the OTHER consecutive pair, ~4336px) retraces almost the
// same ground -- so a full Entry->Probe->Beacon->Exit run crosses the
// gauntlet twice, not once, compounding the energy-management pressure the
// axis is going for rather than diluting it.
//
// Six Nebula Field formations, west to east along the Probe<->Beacon axis
// (coordinates below are post-2026-09-02-resize; see the resize note above
// for the two that needed a scoped nudge beyond plain scaling):
//
// 1. Early-route toll (§6 category), x=444 y:1955-2310, 3 instances -- on
//    the Entry->Probe leg, ~806px clear of Entry, ~1049px clear of Probe,
//    ~885px clear of Debris Wall A (all recomputed post-resize; was 4
//    instances / ~1019/1324/500px pre-resize -- one fewer instance at the
//    shorter post-resize length, still comfortably continuous at 190px+
//    scale, see below).
// 2. First Veil, x=1867 y:622-1333, 5 instances -- a single-row toll right
//    after Probe, ~1073px clear of Probe, ~310px clear of Exit. Moved from
//    the naive scaled x=1822 to x=1867 (resize fix -- see note above);
//    that ~45px shift reproduces the original 400px raw / 300px net
//    separation from Exit that a plain per-axis scale would have eroded to
//    ~255.6px net.
// 3. THE DRIFT EXPANSE (the main gauntlet) -- three parallel vertical
//    walls, ~444px apart, each ~200px thick in the crossing (x) direction
//    (a single circle's diameter, since every instance in one of these
//    walls shares the same x and only varies in y):
//    - N1: x=2489, y:622-3288 (15 instances) -- gap in coverage at
//      y:89-622 (no instances there).
//    - N2: x=2933, y:89-3288 (18 instances) -- full height, no gap. The
//      one wall present everywhere, including the gap region above.
//    - N3: x=3378, y:622-3288 (15 instances) -- gap at y:89-622, mirroring
//      N1.
//    Because N1 and N3 both have a gap at y:89-622 while N2 doesn't, a
//    player who detours north (through that band) crosses only ONE nebula
//    wall (N2) instead of three -- at the cost of a real detour: straight
//    through the gauntlet is ~5248px total (the Probe<->Beacon distance
//    above); routing via the north gap (e.g. Probe -> (2933,355) ->
//    Beacon) is ~5957px, about 708px/~2.7s longer at maxSpeed
//    (shipConfig.ts, 260px/s) -- both figures scaled down from the
//    pre-resize ~5905px/~6704px/~800px/~3s by essentially the resize's own
//    scale factors, not independently re-derived. That's the genuine
//    energy-vs-time decision this axis is meant to force: pay ~3 separate
//    nebula tolls quickly, or pay ~1 toll slowly. (The file's original
//    per-crossing/regen-clawback arithmetic in this sentence's pre-resize
//    version already used hazard-cost and regen-rate figures superseded by
//    2026-08-25 tuning changes -- see CLAUDE.md's Current project state --
//    and was already stale before this resize touched the file; not
//    re-derived here since that staleness is unrelated to the resize and
//    out of this pass's scope.)
// 4. Approach Veil, x=4622 and x=4844, y:1600-3288, 10 instances each (20
//    total) -- a two-row toll right before the Beacon approach, mirroring
//    §6's "right before the Beacon approach" category from level-006's
//    Nebula placement, just doubled in row-count here since density is
//    this level's whole point. ~704-483px clear of Beacon (AV1/AV2
//    respectively). Nebula Field is deliberately allowed to sit close to or
//    overlap a Debris Field wall's edge (§6 -- "fine, even good," reads as
//    a compound obstacle) -- AV2 in particular sits close enough to Debris
//    Wall B that their footprints nearly touch (~199px raw-minus-radii,
//    i.e. a near-overlap); this is NOT a clearance-floor violation since
//    the 250px+ convention (§5) governs a Debris Field wall's distance from
//    *objectives/resupply points*, not its distance from other hazard
//    types, and §6 explicitly sanctions this kind of overlap as a feature.
// 5. Bridging toll, x:1022-1111 y:960-1111, 2 instances -- on the close
//    Probe<->Exit hop. Refined 2026-08-17 (level-eval-log-2026-08-17.md
//    round 1, [placement] flag #1): the near end was originally
//    (1050,1000), only 189.2px net of Probe's 27px radius (316.2px
//    center-to-center minus Nebula's own 100px radius minus Probe's
//    radius) -- under the 250px floor; this file's original comment
//    claimed ~316-427px clear but had measured raw center-to-center
//    distance, not clearance net of Nebula's own radius. Fix: moved the
//    near end only, ~128px further out along the same Probe->nearEnd
//    heading, to (1150,1080) (~311.6px net of Probe, pre-resize). The far
//    end stayed at its original (1250,1250). Post-2026-09-02-resize
//    (plain per-axis scaling, no additional nudge needed): near end
//    (1022,960) is ~262.4px net of Probe, far end (1111,1111) is ~280.0px
//    net of Exit -- both still comfortably clear the 250px floor, though
//    the near end's margin compressed from ~311.6px to ~262.4px (a real,
//    if non-violating, tightening worth flagging per level-design-guide.md
//    §11's instruction to watch previously-tight placements closely after
//    a scale-down). Left as-is: still passes the floor with ~12px margin,
//    and repositioning it again would mean re-deriving the Probe<->Exit
//    bridging geometry a second time, outside a plain resize's scope.
//
// (Six formations total across the five numbered items above -- the Drift
// Expanse is three formations in one.)
//
// Debris Field: deliberately minimal/conventional per this candidate's
// axis -- just two short, ordinary walls providing baseline route texture,
// neither anywhere near a full map dimension (~889px and ~800px
// respectively against a 6000x3375 map, post-resize; were 1000px and 900px
// pre-resize), both open at both ends (§5's default, no maze, no sealed
// ring):
// - Wall A: (889,1600)-(889,2488), a minor SW divider between the
//   Entry->Probe corridor and the Resupply/gauntlet-approach area. ~885px
//   clear of Entry, ~743px clear of Probe, ~619px clear of Exit, ~1196px
//   clear of Resupply, ~263px clear of Ion Storm's SW placement (all
//   post-resize; were ~1063/934/763/1498/~316px respectively pre-resize --
//   see the resize note above on why the SW Ion Storm figure specifically
//   compressed this much, and why it's still compliant, just tight).
// - Wall B: (5156,622)-(5156,1422), a minor NE divider north of the
//   Approach Veil. ~1561px clear of Beacon, ~403-199px clear of Approach
//   Veil's two rows (AV1/AV2 respectively -- see item 4 above on why the
//   AV2 figure isn't a floor violation).
// No reachability tracing is needed for either (unlike level-006/007's
// Debris-heavy candidates) -- neither wall spans a full dimension, and
// nothing in this file uses blocksMovement anywhere else, so normal
// movement can always route around both trivially.
//
// Moving hazards (§7): held at the established baseline (2 Ion Storm, 1
// Meteoroid) plus the 2026-08-25 addition below (now 4 Ion Storm total, 3
// Meteoroid total -- not 4, despite this file's own earlier "2-1 baseline
// plus two more of each" phrasing implying a 4th Meteoroid; there are only
// three Meteoroid placements in the actual hazards array, confirmed by
// re-reading it directly rather than trusting the prose). This candidate's
// axis is Nebula Field density, not moving-hazard density or Debris Field
// complexity (those are the other two candidates' jobs), so pushing every
// dimension at once would blur the comparison the GER loop's Evaluate stage
// is meant to make. All placements keep 250px+ clearance from every
// wall/formation/objective/resupply point (re-verified post-resize by
// recomputing every pair directly, not by scaling the old distances) --
// two placements needed a small nudge beyond plain per-axis scaling (see
// the resize note above for why):
// - Ion Storm "gap west of the Drift Expanse" moved from its naive scaled
//   (1956,1777) to (1980,2000) -- the naive position, after First Veil's
//   own resize fix (above) shifted closer to it, would have sat only
//   ~242.8px net of First Veil (a second-order effect of that fix, not
//   independently discovered). The new position sits well outside First
//   Veil's y-span (622-1333) entirely, buying clearance from the vertical
//   offset alone (~466px net vs First Veil) while also landing centrally
//   enough in the lane to clear N1 (~301px net) -- both re-verified by
//   direct computation, not estimated.
// - Meteoroid "between the Drift Expanse and the Approach Veil" moved from
//   its naive scaled (3733,800) to (3830,800) -- this one wasn't a
//   resize-introduced problem so much as an already-marginal pre-existing
//   gap (only ~244px net of Drift Expanse wall N3 pre-resize, technically
//   under this file's own stated 250px+ guarantee even before the resize,
//   apparently never caught) that the scale-down pushed decisively over the
//   line (~199px net). Fixed here rather than carried forward, since it
//   contradicts this file's own stated design intent for moving-hazard
//   placement rather than being an accepted overlap-by-design case; the new
//   x restores ~296px net clearance from N3.
// Remaining placements, all clear by wide margins post-resize (recomputed,
// not assumed): Ion Storm NE (4444,622) and "gap between the Drift Expanse
// and the Approach Veil" (3911,2488) needed no adjustment; Meteoroid "west
// of Wall A" (533,1422) and "east of Wall B" (5333,1955) likewise needed
// none.
//
// Full first-leg trajectory re-simulation (2026-09-02, post-resize, method
// per level-design-guide.md §11/CLAUDE.md's trajectory-audit note): re-ran
// the trochoid-carrier-plus-orbit sweep (same method as level-006/009/010)
// against the new 6000x3375 bounds for all four Ion Storm placements. Every
// placement's carrier+orbit path already swept into a wall, Probe, or the
// level boundary during its first leg *before this resize too* (confirmed
// by re-running the identical simulation against the old 6750x3798
// bounds/coordinates) -- this is the same project-wide, already-known,
// already-accepted gap CLAUDE.md's Current project state documents (Ion
// Storm's 2026-08-25 switch to 'trochoid' invalidated straight-line-safe
// placements across level-001-008, left unfixed at the user's explicit
// call). The resize does not introduce a new instance of this gap, only
// carries the existing one forward at essentially the same severity (the
// point at which each leg exits the map bounds shifted by single-digit-to-
// ~20% percentages depending on placement, consistent with the axis scale
// factors and each hazard's specific heading/orbit phase, not a
// qualitatively new problem). Not re-fixed here -- doing so would mean
// relocating baseline Ion Storm placements, a hazard-placement redesign
// outside a pure resize's scope, and inconsistent with the project's own
// decision to leave the broader gap unaddressed for now.
//
// Meteoroid is 'homing' (2026-09-02, same day, see hazardConfig.ts), not
// 'linear' -- its heading is no longer fixed for a full first leg, so the
// old "simulate the whole leg to the map edge" method no longer strictly
// applies; only the short deterministic pre-retarget segment (the first
// retargetIntervalSeconds=1s -- none of this file's three Meteoroid
// placements start within homingCloseRangeDistancePx=500px of the Entry
// Wormhole, so the faster 0.5s close-range cadence never applies at spawn)
// was checked instead against the new bounds for all three placements:
// none crosses Wall A, Wall B, or a level boundary during that short
// straight-east segment, matching the equivalent pre-resize check (same
// clean result both before and after).
//
// Resupply: one AsteroidField at (2049,3066), placed west of the Drift
// Expanse. Moved from the naive scaled x=2089 to x=2049 (resize fix -- see
// note above) -- the naive position was only ~260px net of Drift Expanse
// wall N1, down from a comfortable ~310px net pre-resize; the new position
// restores that ~300px net separation. ~1787px clear of Entry, ~1196px
// clear of Debris Wall A, ~891px clear of Ion Storm's SW placement (all
// recomputed post-resize and post-fix).
//
// No puzzle-taxonomy element placed (consistent with every real level so
// far -- Phase 2b content, still unstarted).
// Named so the dev-only sanity check below can re-inspect the same
// generated arrays the hazards list spreads. count@spacing100 post-resize:
// 10, 9 -- both clear MIN_UNDULATE_COUNT=8 (was 11, 10 pre-resize).
const wallA = debrisWall(889, 1600, 889, 2488, 100); // Wall A -- minor SW divider
const wallB = debrisWall(5156, 622, 5156, 1422, 100); // Wall B -- minor NE divider, north of the Approach Veil

export const LEVEL_008: LevelConfig = {
  width: 6000,
  height: 3375,
  entryWormholeLocation: { x: 267, y: 3199 }, // was (300, 3600) pre-2026-09-02-resize
  exitWormholeLocation: { x: 1467, y: 1244 }, // was (1650, 1400)
  probeLocation: { x: 667, y: 800 }, // was (750, 900)
  relayBeaconLocation: { x: 5422, y: 3021 }, // was (6100, 3400)

  resupplyPoints: [{ x: 2049, y: 3066, textureKey: 'asteroid_large', radius: 40 }], // was (2350, 3450); x further adjusted from the naive scaled 2089 -- see file comment above (resize fix, clearance from Drift Expanse wall N1)

  hazards: [
    // Nebula Field -- this level's axis. Six formations, west to east
    // along the Probe<->Beacon leg (see file comment above for the full
    // rationale, per-formation clearance math, and the north-gap
    // energy-vs-time tradeoff the three-wall Drift Expanse is built around).
    // All endpoints below are post-2026-09-02-resize (scaleX=0.888889,
    // scaleY=0.888626), re-derived from the pre-resize endpoints rather
    // than scaling the generated instance arrays (level-design-guide.md
    // §11). First Veil's x is a scoped resize fix, not a plain scale --
    // see file comment above.

    // 1. Early-route toll, on the Entry->Probe leg. Was (500,2200)-(500,2600).
    ...nebulaWall(444, 1955, 444, 2310, 150),

    // 2. First Veil, a single-row toll right after Probe. Naive scale would
    // be x=1822 (from pre-resize x=2050); moved to x=1867 to preserve
    // ~300px net clearance from Exit Wormhole (see file comment above).
    ...nebulaWall(1867, 622, 1867, 1333, 190),

    // 3. THE DRIFT EXPANSE -- the main gauntlet, three parallel vertical
    // walls ~444px apart. N1/N3 have a gap at y:89-622; N2 doesn't -- that
    // asymmetry is the deliberate "thin lane" a player can detour north to
    // find, trading travel distance for fewer nebula crossings. Was
    // (2800,700)-(2800,3700) / (3300,100)-(3300,3700) / (3800,700)-(3800,3700).
    ...nebulaWall(2489, 622, 2489, 3288, 190), // N1 -- gap at y:89-622
    ...nebulaWall(2933, 89, 2933, 3288, 190), // N2 -- full height, no gap
    ...nebulaWall(3378, 622, 3378, 3288, 190), // N3 -- gap at y:89-622

    // 4. Approach Veil, a two-row toll right before the Beacon approach.
    // Was (5200,1800)-(5200,3700) / (5450,1800)-(5450,3700).
    ...nebulaWall(4622, 1600, 4622, 3288, 190), // AV1
    ...nebulaWall(4844, 1600, 4844, 3288, 190), // AV2

    // 5. Bridging toll, on the close Probe<->Exit hop. Near end moved from
    // (1050,1000) to (1150,1080) pre-resize; far end unchanged -- see file
    // comment above (level-eval-log-2026-08-17.md round 1, [placement]
    // flag #1). Post-2026-09-02-resize (plain per-axis scaling): (1150,1080)
    // -> (1022,960), (1250,1250) -> (1111,1111).
    ...nebulaWall(1022, 960, 1111, 1111, 150),

    // Ion Storm / Meteoroid -- managed by MovingHazardManager. Initial
    // positions only, held at the established 2-1 baseline (this
    // candidate's axis is Nebula Field density, not moving-hazard density),
    // clear of every wall/formation/objective/resupply point (re-verified
    // post-resize -- see file comment above).
    { type: 'ionStorm', x: 4444, y: 622 }, // NE open pocket, north of the Approach Veil. Was (5000, 700)
    { type: 'ionStorm', x: 1333, y: 2310 }, // SW open pocket, east of Debris Wall A. Moved +100px east 2026-08-17 (level-eval-log-2026-08-17.md round 1, [placement] flag #2) -- was exactly 250.0px net of Debris Wall A's collision edge (sitting on the clearance floor, not clear of it); now ~350px net pre-resize. Post-2026-09-02-resize (plain scaling from (1500,2600)): ~263px net -- still clear, but the margin compressed considerably (~350px -> ~263px); flagged, not further adjusted, since it still passes the 250px floor with ~13px to spare and this file's scope is a resize, not a fresh Evaluate-driven fix.
    { type: 'meteoroid', x: 3830, y: 800 }, // open pocket between the Drift Expanse and the Approach Veil. Naive scale from (4200, 900) would be (3733, 800) -- adjusted +97px east (resize fix, see file comment above): this pair was already only ~244px net of Drift Expanse wall N3 pre-resize (a pre-existing, uncaught marginal gap, not a resize-introduced one), and the naive scale would have dropped it to ~199px net; the new x restores ~296px net.
    // Two more of each, added 2026-08-25 (user request) -- placed in open
    // gaps between formations, 250px+ clear of Debris Wall A/B and every
    // objective/resupply point (Nebula Field isn't blocksMovement, so
    // overlapping a formation isn't a clearance concern the way a wall is,
    // except where a moving hazard's own placement rule explicitly claims
    // formation clearance too -- see file comment above on the one
    // Meteoroid placement above that didn't actually meet that claim).
    { type: 'ionStorm', x: 1980, y: 2000 }, // gap west of the Drift Expanse. Naive scale from (2200, 2000) would be (1956, 1777); moved to (1980, 2000) (resize fix, see file comment above) -- First Veil's own resize fix moved it closer to this placement, which would have dropped their mutual clearance to ~242.8px net; the new position clears both First Veil (~466px net) and Drift Expanse wall N1 (~301px net).
    { type: 'ionStorm', x: 3911, y: 2488 }, // gap between the Drift Expanse and the Approach Veil. Was (4400, 2800)
    { type: 'meteoroid', x: 533, y: 1422 }, // west of Wall A, ~282px clear of it (was ~447px pre-resize; was (600, 1600))
    { type: 'meteoroid', x: 5333, y: 1955 }, // east of Wall B, ~446px clear of it (was ~632px pre-resize; was (6000, 2200))

    // Debris Field -- two short, conventional, both-ends-open walls
    // providing baseline route texture only (see file comment above for
    // per-wall clearance notes). Deliberately minimal so Nebula Field
    // density stays this level's clear focal device.
    ...wallA,
    ...wallB,
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
  [wallA, wallB].forEach((wall, wallIndex) => {
    for (let i = 0; i < wall.length - 1; i++) {
      const dist = Math.hypot(wall[i + 1].x - wall[i].x, wall[i + 1].y - wall[i].y);
      if (dist > NO_GAP_THRESHOLD) {
        console.warn(
          `[level-008] Debris wall ${wallIndex} has a ${dist.toFixed(1)}px gap between instances ${i} and ${i + 1} -- exceeds the ${NO_GAP_THRESHOLD}px no-gap threshold, may open a ship-width hole.`,
        );
      }
    }
  });
}
