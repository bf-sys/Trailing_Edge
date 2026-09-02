import type { HazardPlacement, LevelConfig } from './levelTypes';

const DEBRIS_TEXTURES = ['debris_large', 'debris_large_alt2', 'debris_large_alt3'];
const NEBULA_TEXTURES = ['hazard_nebula_field', 'hazard_nebula_field_alt2', 'hazard_nebula_field_alt3'];

// Interpolates a chain of Debris Field placements between two points, spaced
// closer than 2x its 60px radius (hazardConfig.ts) so adjacent circles
// overlap and leave no ship-width gap -- a genuine wall, not a line of
// separately-dodgeable rocks (GDD §9's Debris Field re-scope --
// blocksMovement, zero resource cost). Cycles the three sourced debris
// textures and varies rotation per index so a long chain doesn't read as one
// sprite copy-pasted end to end. Same helper as every other level file's --
// duplicated rather than shared, matching this project's "one hand-authored
// file per level" convention (CLAUDE.md tech stack).
//
// Two shapes, picked automatically by instance count (level-design-guide.md
// §5's canonical version, copied fresh per that section's explicit
// instruction to duplicate rather than import): count >= MIN_UNDULATE_COUNT
// (8) gets a two-term sine "sweep" (a slow ~2-period meander plus a faster
// small-amplitude "texture" term) so a long wall doesn't read as one
// perfectly repeating S-curve; MIN_BOW_COUNT (4) to 7 gets a single-term
// "bow" instead -- just the envelope times one flat amplitude, a smooth
// one-directional "C" bulge with no oscillation, since too few points never
// complete a full sine period and would read as a jerky zigzag; below
// MIN_BOW_COUNT the wall stays perfectly straight (too few interior points
// for any offset to read as intentional). Both shapes pin the endpoints
// exactly via the sin(pi*t) envelope (0 at t=0 and t=1), so every
// clearance/gap distance quoted in this file's comments below (measured from
// (x1,y1)/(x2,y2)) stays valid regardless of which mode a given wall lands
// in. Every wall in this file lands in 'sweep' (all have length >= 890px at
// the required spacing=100 post-resize -- see per-wall counts below), so
// 'bow' is dead code here in practice, kept only because §5 asks for the
// general-purpose version, not a level-specific trim of it.
//
// spacing=100 (not the 115px default) is required on any wall that will
// undulate -- see §5's safety-margin derivation (verified empirically down
// to count=7 at spacing=100, margin ~18-19px under the 120px no-gap
// threshold; re-verified for this file's own walls in the dev-time sanity
// check at the bottom, both pre- and post-2026-09-02-resize).
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

// Candidate for the level-009 slot. Generated via the level GER loop
// (content-agent -> level-evaluator-agent -> level-refiner-agent, per
// level-design-guide.md §1). Registered into src/levels/index.ts's LEVELS
// map and src/config/levelOrder.ts's LEVEL_ORDER after passing the 2026-08-25
// GER pass (docs/history/level-eval-log-2026-08-25.md). Sits after
// level-008, squarely in §8's post-full-unlock experimentation zone -- the
// player already has scan/teleport/rocketBoost (and tractorBeam,
// unlocked-by-default) by the time they'd reach this level, so none of
// §4/§7's ability-gating constraints apply.
//
// CREATIVE AXIS: THE MOVING-HAZARD GAUNTLET, PUSHED FURTHER THAN LEVEL-005.
// level-005 already proved "push moving-hazard density" as an axis (5 Ion
// Storm + 4 Meteoroid = 9 total, "more instances than any level built so
// far" per §8) -- this candidate pushes the same general direction further:
// 7 Ion Storm + 5 Meteoroid (12 total, the highest count of either hazard
// and the highest combined total in the project so far). Debris Field and
// Nebula Field are both kept deliberately modest/conventional (three short,
// ordinary, both-ends-open walls; four intent-placed Nebula tolls) --
// neither a maze (level-006's axis) nor multiple sealed pockets (level-007's
// axis) nor Nebula density (level-008's axis) -- so this candidate reads as
// genuinely distinct from all four of its predecessors rather than "harder
// in every dimension at once" (§8's "variety, not convergence" principle).
//
// SOLAR FLARE, REMOVED (2026-08-25, user request, same day as the level's
// initial GER pass): the Generate-stage candidate originally also placed 2
// Solar Flare instances -- the project's first real placement of that
// hazard type, addressing level-design-guide.md §12's "no placement
// precedent yet" note. Pulled at the project owner's request: no sourced
// art exists for it yet and its intended role/tuning isn't settled ("not
// sure what to do with it... re-examine it later") -- removing it here
// rather than leaving an unwanted placeholder in committed content.
// level-design-guide.md §12's "Solar Flare has no placement precedent" item
// is therefore still open, not resolved by this file.
//
// A NOTE ON ION STORM'S TROCHOID PATH (2026-08-25 hazardConfig.ts change,
// informational for this file's own placements): Ion Storm no longer drifts
// in a straight line -- its actual drawn position loops around an invisible
// carrier (orbitRadius 220) rather than sitting on it, sweeping a much wider
// band than a single-pixel-wide line would. The Generate stage checked this
// file's Ion Storm placements against a "cautious" effective radius of
// shape.radius + orbitRadius (110 + 220 = 330px) at the *initial point only*
// -- that turned out not to be sufficient once the full first-leg path was
// simulated (see the "REFINE-STAGE COORDINATE PASS" note under MOVING
// HAZARDS below, which superseded 5 of this section's original 7 Ion Storm
// coordinates). Left here for the historical context of why the cautious
// radius exists at all, not as a claim that it was sufficient on its own.
//
// ORIGINAL SIZING (superseded by the 2026-09-02 resize below, kept for
// history): 7290x4101, i.e. level-003/004's 5400x3038 footprint scaled by
// 7290/5400 = 4101/3037.6 (rounded to 4101 from the exact 4100.8) = 1.35x --
// both target dimensions shared that one factor, so it was a uniform
// scale-up (level-design-guide.md §2), holding the established 16:9-ish
// aspect ratio and growing beyond level-007's 7020x3949 (the largest level
// built at the time).
//
// RESIZED 2026-09-02 (project-owner request, matching level-005/006/007/008's
// new project-wide max footprint): shrunk from 7290x4101 down to exactly
// 6000x3375. Per level-design-guide.md §11, this is NOT the single-factor
// uniform scale §2/§10 use for same-shape resizes -- two independent
// per-axis factors were used: scaleX = 6000/7290 = 0.823045,
// scaleY = 3375/4101 = 0.823214. The two factors differ by only ~0.02%, so
// the non-uniform scaling introduces only negligible shear even on Wall C
// (the genuinely diagonal wall below -- unlike every other level in this
// resize batch, which were all axis-aligned): its angle barely moves and its
// stated role ("guards the SE corner approach to Beacon") is unaffected,
// though its clearances were re-verified post-scale rather than assumed
// (see the updated per-wall clearance notes below). Every plain point
// placement (objectives, resupply, all 4 Nebula Field, all 7 Ion Storm, all
// 5 Meteoroid instances) was scaled directly per-axis; every debrisWall()
// call was re-run from freshly-scaled *endpoints*, not by scaling the
// pre-generated instance arrays (§11's explicit warning) -- this applies to
// Wall C too, since debrisWall()'s spacing/undulation math is
// angle-independent, so regenerating from its newly-scaled, slightly
// re-angled endpoints is correct and safe. Spacing (100 on all three walls,
// matching this file's pre-resize convention) and the undulation constants
// were left at their existing absolute-pixel values per §11's stated
// default -- none of this file's three walls needed a spacing override the
// way level-006's short spurs did: all three still land comfortably under
// the 120px no-gap threshold post-resize (worst neighbor gaps
// 97.6/97.6/100.5px across wallA/wallB/wallC, ~20-22px margin, re-verified
// by regenerating the actual arrays, not assumed -- the dev-time sanity
// check below confirms this on every import).
//
// Full moving-hazard trajectory re-simulation (per §11/CLAUDE.md's
// trajectory-audit note, using the *current* per-pattern methods -- both
// changed since this file's original 2026-08-25 refine pass; see
// hazardConfig.ts): Ion Storm's full first-leg trochoid-carrier+orbit path
// was re-simulated (20ms timestep) against the new 6000x3375 bounds for all
// 7 placements -- the same method this file's original refine pass used,
// re-derived for 'trochoid' instead of whatever it checked pre-2026-08-25.
// Meteoroid switched 'linear' -> 'homing' the same day this resize was done
// (2026-09-02, see hazardConfig.ts), so it no longer holds a fixed heading
// for a full leg -- only the short deterministic pre-retarget segment (up to
// retargetIntervalSeconds=1s straight east at 280px/s, which also covers the
// close-range homingCloseRetargetIntervalSeconds=0.5s sub-case as a strict
// subset) was checked for all 5 placements instead of a full-leg simulation.
// Result: naive per-axis scaling alone carried 6 of 7 Ion Storm placements
// and all 5 Meteoroid placements through clean, re-confirmed against the
// *old* 7290x4101 bounds too (to distinguish a resize-introduced problem
// from one that already existed) -- no pre-existing gap found for any of
// them either. One genuinely NEW problem, introduced by the resize itself:
// Ion Storm #4 (naively scaled from its old (4200,3155) to (3457,2596))
// swept to only 218px net of Wall B (at t~3.80s) and 233px net of Entry (at
// t~30.92s) post-resize -- both under the 250px floor, neither was a problem
// at the old size. Root cause isn't a scaling-math error: the trochoid's
// absolute orbit radius/speed don't shrink with the level, so the same swept
// path that safely threaded the gap between Wall B and Entry in the larger
// map no longer does once everything around it moved ~18% closer together
// in absolute terms. Fixed by repositioning (not a small nudge) to
// (2495,2535) -- re-simulated clean at 282px+ net of every wall/objective
// (worst is Entry, at 282px) -- landing in the same "south of Wall B" pocket
// Ion Storm #1 and #2 already occupy. A grid search confirmed this pocket is
// essentially the *only* region satisfying every wall/objective's 250px
// floor for a due-west-heading trochoid starting south of Wall B on this
// map -- the same structural fact the original 2026-08-25 refine pass found
// for the Wall A/Wall B corridor, just now also true of this sub-region
// post-resize. The new position was picked specifically to sit ~303px from
// both Ion Storm #1's and #2's spawn points -- not a stated project rule
// (nothing requires moving-hazard spawn separation), but a deliberate
// judgment call so three instances don't visually stack at level start; see
// the per-placement comment below for the full before/after.
//
// OBJECTIVES (§3 -- only *consecutive* Probe<->Beacon and Beacon<->Exit need
// to be pushed far apart; non-consecutive Probe<->Exit is deliberately left
// close), recomputed post-resize: diagonal = sqrt(6000^2 + 3375^2) ~=
// 6884.1px. Probe(741,658) <-> Beacon(5432,2880): ~5190.6px (~75.4% of
// diagonal, unchanged from the pre-resize 75.4% to one decimal place --
// scaleX and scaleY are close enough that diagonal-relative percentages
// barely move). Beacon <-> Exit(1523,988): ~4342.8px (~63.1%, unchanged).
// Probe <-> Exit (non-consecutive): ~848.8px (~12.3%, unchanged, inside the
// 12-13% band). Entry sits at (329,3127), a genuine SW corner, clear of
// every hazard placed below (nearest wall, Wall A, is ~2443px away).
// Resupply sits at (2963,1605), central/accessible, kept well clear of all
// three walls (nearest, Wall B, is ~289px net clear -- see below).
//
// Because Exit sits geographically close to Probe rather than Beacon, the
// *return* trip (Beacon -> Exit) retraces most of the same ground as the
// outbound Probe -> Beacon leg -- so a full run crosses this level's central
// moving-hazard-heavy corridor twice, not once, the same "crossed twice"
// compounding effect level-008's Drift Expanse gauntlet used for its own
// axis.
//
// DEBRIS FIELD: three short, conventional, both-ends-open walls providing
// baseline route texture only (deliberately modest -- see axis note above).
// None spans a full map dimension. All three land in 'sweep' mode at
// spacing=100 (counts 13, 13, 10 post-resize -- all clear
// MIN_UNDULATE_COUNT=8; see the dev-time sanity check at the bottom for the
// actual measured worst-case neighbor gap, ~97.6-100.5px, comfortably under
// the 120px no-gap threshold). Every wall segment keeps 250px+ net clearance
// from every objective/resupply point (computed as raw center-to-nearest-
// point distance minus the debris radius (60) and, for Resupply, its own
// 40px radius -- verified via a standalone script, not eyeballed):
// - Wall A: (2140,247)-(2140,1399), vertical, upper-center-west divider,
//   between the Entry/Probe/Exit cluster and the map's center (was
//   (2600,300)-(2600,1700) pre-resize). Closest net clearance: Exit ~578px,
//   Probe ~1318px, Resupply ~748px.
// - Wall B: (2634,1975)-(3786,1975), horizontal, center divider, guards
//   Resupply/SE approach (was (3200,2400)-(4600,2400) pre-resize). Closest
//   net clearance: Resupply ~289px, Beacon ~1818px.
// - Wall C: (4280,2304)-(5021,2798), diagonal, SE, guards the Beacon
//   approach (was (5200,2800)-(6100,3400) pre-resize -- see the resize note
//   above for why the near-uniform per-axis scale leaves its angle nearly
//   unchanged). Closest net clearance: Beacon ~359px.
// No reachability tracing is needed for any of the three (unlike
// level-006/007's Debris-heavy candidates) -- none spans a full dimension
// and there's no maze/seal anywhere else in this file, so normal movement
// can always route around all three trivially.
//
// NEBULA FIELD (§6, four instances, placed with intent, not scattered),
// coordinates rescaled 2026-09-02:
// - Early-route toll (617,2551) -- on the Entry->Probe leg, ~544px net clear
//   of Entry (was (750,3100), ~682.6px clear, pre-resize).
// - Bypass toll (2140,1687) -- at Wall A's open south end (the wall now
//   stops at y=1399); deliberately allowed to sit close to/overlap the
//   wall's edge per §6 ("fine, even good... reads as a compound obstacle" --
//   this is the one placement in this file that's intentionally under the
//   general 250px floor, and only against the one wall it's tolling; ~228px
//   net of Wall A post-resize, was (2600,2050)/~228px pre-resize -- both
//   land at essentially the same intentional sub-floor margin).
// - Bridging toll (1132,823) -- on the close Probe<->Exit hop, ~324px net
//   clear of both Probe and Exit (was (1375,1000), ~415.4px, pre-resize --
//   this toll sits exactly at the Probe/Exit midpoint by construction, so
//   its clearance to each scales down with the shorter hop).
// - Approach toll (5185,2551) -- right before the Beacon approach, near Wall
//   C's open end; same deliberate §6 overlap exception against Wall C
//   specifically (~237px net of Wall C, ~311px net of Beacon itself; was
//   (6300,3100), ~236.7px/~400px pre-resize).
//
// MOVING HAZARDS -- THE AXIS (§7/§8): 7 Ion Storm + 5 Meteoroid (12 total,
// the highest combined count in the project so far -- level-005's 9 was the
// prior high). Scattered across open pockets on both sides of the three
// modest dividers so no region of the map is free of a moving threat for
// long -- their authored x/y only governs each hazard's first leg before
// MovingHazardManager's wrap-on-exit + objective-biased respawn takes over
// (§7). Ion Storm's headingRadians (due west) and Meteoroid's (due east,
// though only a seed heading now that Meteoroid is 'homing' -- see
// hazardConfig.ts) are unchanged by the resize; only positions moved.
//
// REFINE-STAGE COORDINATE PASS (2026-08-25, level-eval-log-2026-08-25.md's
// level-009 entry, round 1, PRE-RESIZE HISTORY): the Generate-stage version
// of this section only checked each hazard's *initial point* against the
// 250px floor, not its full first-leg path -- both Ion Storm/Meteoroid held
// a constant perpendicular coordinate for their whole first leg at the time
// (Meteoroid was still 'linear' then), so an initial-point-only check missed
// a wall/objective sitting further along that same fixed line. 5 of 7 Ion
// Storm and 2 of 5 Meteoroid placements were re-simulated and repositioned
// at that time so the *entire* first leg cleared every wall/objective/
// resupply point by 250px+, not just spawn -- see the coordinates and roles
// below, which already reflect that pass. Left here for historical context;
// the 2026-09-02 resize note above documents the *second* round of
// full-trajectory verification this file has been through, against the new
// bounds and the current 'trochoid'/'homing' patterns.
// - Ion Storm x7 (post-resize coordinates; naive per-axis scale unless noted
//   FIXED, in which case see the resize note above for the full
//   before/after): (988,2140) west-central open pocket, unchanged role,
//   ~1077px clear of Entry (was (1200,2600)); (2798,2527) south-central,
//   ~371px clear of Wall B (was (3400,3070)); (2222,2403) south-central,
//   ~424px clear of Wall B (was (2700,2920)); (1646,2123) south-west,
//   between Probe and Wall A, ~707px clear of Wall A (was (2000,2580));
//   (2495,2535) south-central -- FIXED 2026-09-02, was naively-scaled to
//   (3457,2596) which swept to 218px of Wall B / 233px of Entry (both under
//   floor); repositioned to clear 282px+ of everything, ~303px from both Ion
//   Storm #1 and #2's spawns (original pre-resize placement was
//   (4200,3155)); (1564,103) far north, west of Wall A, ~424px clear of Wall
//   A (was (1900,125)); (741,1399) west, between Probe and Wall A, ~631px
//   clear of Probe (was (900,1700)).
// - Meteoroid x5 (post-resize coordinates, all naive per-axis scale --
//   Meteoroid's pre-retarget-segment re-check found no new clearance issue
//   for any of the five, see the resize note above): (1399,3210) south,
//   ~1017px clear of Entry (was (1700,3900)); (3210,1317) north-center,
//   ~283px clear of Resupply (was (3900,1600)); (4691,1975) center-east,
//   ~396px clear of Wall C (was (5700,2400)); (2387,3333) south, ~1264px
//   clear of Wall B (was (2900,4050)); (5597,1234) far north-east, ~1505px
//   clear of Wall C (was (6800,1500)).
// RESUPPLY: one AsteroidField at (2963,1605), central/accessible, kept
// 250px+ clear of every wall (nearest is Wall B at ~289px net, see above) --
// deliberately placed so a player can top off structure before committing to
// either half of the central gauntlet corridor. (Was (3600,1950)
// pre-resize.)
//
// No puzzle-taxonomy element placed (consistent with every real level so
// far -- Phase 2b content, still unstarted).
//
// Named so the dev-only sanity check below can re-inspect the same
// generated arrays the hazards list spreads. count@spacing100 post-resize:
// 13, 13, 10 -- all three clear MIN_UNDULATE_COUNT=8.
const wallA = debrisWall(2140, 247, 2140, 1399, 100); // Wall A -- upper-center-west divider
const wallB = debrisWall(2634, 1975, 3786, 1975, 100); // Wall B -- center divider, guards Resupply/SE approach
const wallC = debrisWall(4280, 2304, 5021, 2798, 100); // Wall C -- SE diagonal, guards the Beacon approach

export const LEVEL_009: LevelConfig = {
  width: 6000,
  height: 3375,
  entryWormholeLocation: { x: 329, y: 3127 },
  exitWormholeLocation: { x: 1523, y: 988 },
  probeLocation: { x: 741, y: 658 },
  relayBeaconLocation: { x: 5432, y: 2880 },

  resupplyPoints: [{ x: 2963, y: 1605, textureKey: 'asteroid_large', radius: 40 }],

  hazards: [
    // Nebula Field -- four instances, placed with intent rather than
    // scattered (see file comment above for each one's role/clearance).
    // Cycles the three sourced Nebula Field textures (2026-08-21, mirroring
    // Debris Field's alt2/alt3 precedent) so four instances on one map
    // don't read as one sprite copy-pasted four times.
    { type: 'nebulaField', x: 617, y: 2551, textureKey: NEBULA_TEXTURES[0] }, // early-route toll on Entry's way toward Probe
    { type: 'nebulaField', x: 2140, y: 1687, textureKey: NEBULA_TEXTURES[1] }, // bypass toll at Wall A's open south end
    { type: 'nebulaField', x: 1132, y: 823, textureKey: NEBULA_TEXTURES[2] }, // bridges the close Probe<->Exit hop
    { type: 'nebulaField', x: 5185, y: 2551, textureKey: NEBULA_TEXTURES[0] }, // approach toll right before the Beacon, near Wall C's open end

    // Ion Storm x7 / Meteoroid x5 -- THIS LEVEL'S AXIS (see file comment
    // above for the full rationale, per-placement clearance notes, and the
    // cautious orbit-aware measure used for Ion Storm). Both are managed by
    // MovingHazardManager (initial position only, wrap/respawn handled
    // automatically). Coordinates rescaled 2026-09-02
    // (scaleX=0.823045, scaleY=0.823214) -- see the file-header resize note
    // above for the one placement (Ion Storm #4) that needed repositioning
    // rather than a naive per-axis scale.
    { type: 'ionStorm', x: 988, y: 2140 }, // west-central open pocket
    { type: 'ionStorm', x: 2798, y: 2527 }, // south-central, ~371px clear of Wall B
    { type: 'ionStorm', x: 2222, y: 2403 }, // south-central, ~424px clear of Wall B
    { type: 'ionStorm', x: 1646, y: 2123 }, // south-west, between Probe and Wall A
    // FIXED 2026-09-02 (resize introduced a new clearance violation): naive
    // per-axis scaling of this instance's pre-resize position (4200,3155)
    // landed it at (3457,2596), which swept to only 218px net of Wall B
    // (t~3.80s) and 233px net of Entry (t~30.92s) -- both under the 250px
    // floor, neither a problem at the old 7290x4101 size. Repositioned to
    // (2495,2535): full first-leg re-simulation confirms 282px+ net of
    // every wall/objective (worst is Entry). Landed in the same "south of
    // Wall B" pocket Ion Storm #1/#2 above already occupy -- a grid search
    // found this is essentially the only region on the map that clears
    // every wall/objective for a due-west trochoid starting south of Wall
    // B; picked to sit ~303px from both #1's and #2's spawn points so all
    // three don't visually stack at level start.
    { type: 'ionStorm', x: 2495, y: 2535 },
    { type: 'ionStorm', x: 1564, y: 103 }, // far north, west of Wall A
    { type: 'ionStorm', x: 741, y: 1399 }, // west, between Probe and Wall A

    { type: 'meteoroid', x: 1399, y: 3210 }, // south, ~1017px clear of Entry
    { type: 'meteoroid', x: 3210, y: 1317 }, // north-center, ~283px clear of Resupply
    { type: 'meteoroid', x: 4691, y: 1975 }, // center-east, ~396px clear of Wall C
    { type: 'meteoroid', x: 2387, y: 3333 }, // south, ~1264px clear of Wall B
    { type: 'meteoroid', x: 5597, y: 1234 }, // far north-east, ~1505px clear of Wall C

    // Debris Field -- three short, conventional, both-ends-open walls
    // providing baseline route texture only (see file comment above for
    // per-wall clearance notes). Deliberately modest so the moving-hazard
    // gauntlet stays this level's clear focal device.
    ...wallA,
    ...wallB,
    ...wallC,
  ],

  puzzleElements: [],
};

// Sanity check, not gameplay logic: fails fast (at import time, in dev) if a
// future edit to debrisWall's undulation constants ever lets two
// neighboring instances drift past the 120px (2x Debris Field's 60px
// radius, hazardConfig.ts) no-gap threshold, instead of silently shipping a
// wall with a ship-width hole in it. Mirrors level-005/006/007/008's
// dev-check.
if (import.meta.env.DEV) {
  const NO_GAP_THRESHOLD = 2 * 60;
  [wallA, wallB, wallC].forEach((wall, wallIndex) => {
    for (let i = 0; i < wall.length - 1; i++) {
      const dist = Math.hypot(wall[i + 1].x - wall[i].x, wall[i + 1].y - wall[i].y);
      if (dist > NO_GAP_THRESHOLD) {
        console.warn(
          `[level-009] Debris wall ${wallIndex} has a ${dist.toFixed(1)}px gap between instances ${i} and ${i + 1} -- exceeds the ${NO_GAP_THRESHOLD}px no-gap threshold, may open a ship-width hole.`,
        );
      }
    }
  });
}
