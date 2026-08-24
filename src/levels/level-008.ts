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
// Sizing: 6750x3798, i.e. level-003/004's 5400x3038 footprint scaled by
// 6750/5400 = 3798/3037.6 (rounded to 3798 from the exact 3797.5) = 1.25x --
// both target dimensions share that one factor, so it's a uniform scale-up
// (level-design-guide.md §2), holding the established 16:9-ish aspect ratio
// and growing beyond level-006's 6480x3646 (the largest level built so
// far), per this guide's explicit floor ("holding steady or growing... is
// fine, don't go smaller").
//
// Objectives (§3 -- only *consecutive* Probe<->Beacon and Beacon<->Exit need
// to be pushed far apart; non-consecutive Probe<->Exit is deliberately left
// close): diagonal = sqrt(6750^2 + 3798^2) ~= 7745px. Probe(750,900) <->
// Beacon(6100,3400): ~5905px (~76.3% of diagonal, at the top of the 65-76%
// precedent band, matching level-005's 77%). Beacon <-> Exit(1650,1400):
// ~4879px (~63.0%, a touch under the band -- same situation level-007 hit
// (~61.9%) for the same geometric reason: Exit has to sit close to Probe
// *and* Probe is already pushed into the far corner from Beacon, leaving
// Exit no room to also extend away from Beacon; §3 states the band is "not
// a hard target"). Probe <-> Exit (non-consecutive): ~1030px (~13.3%,
// inside the 12-13% band). Entry sits at (300,3600), a genuine SW corner,
// clear of every hazard placed below (nearest is Debris Field Wall A,
// ~1063px away).
//
// THE GAUNTLET (this candidate's axis) sits on the Probe<->Beacon leg --
// the natural place to spend it, per §3 and matching level-006's precedent
// of spending its own axis on the same long consecutive hop. Because Exit
// sits geographically close to Probe rather than Beacon, the *return* trip
// (Beacon -> Exit, the OTHER consecutive pair, ~4879px) retraces almost the
// same ground -- so a full Entry->Probe->Beacon->Exit run crosses the
// gauntlet twice, not once, compounding the energy-management pressure the
// axis is going for rather than diluting it.
//
// Six Nebula Field formations, west to east along the Probe<->Beacon axis:
//
// 1. Early-route toll (§6 category), x=500 y:2200-2600, 4 instances -- on
//    the Entry->Probe leg, ~1019px clear of Entry, ~1324px clear of Probe,
//    ~500px clear of Debris Wall A.
// 2. First Veil, x=2050 y:700-1500, 5 instances -- a single-row toll right
//    after Probe, ~1300px clear of Probe, ~400px clear of Exit.
// 3. THE DRIFT EXPANSE (the main gauntlet) -- three parallel vertical walls,
//    500px apart, each ~200px thick in the crossing (x) direction (a
//    single circle's diameter, since every instance in one of these walls
//    shares the same x and only varies in y):
//    - N1: x=2800, y:700-3700 (17 instances) -- gap in coverage at
//      y:100-700 (no instances there).
//    - N2: x=3300, y:100-3700 (20 instances) -- full height, no gap. The
//      one wall present everywhere, including the gap region above.
//    - N3: x=3800, y:700-3700 (17 instances) -- gap at y:100-700, mirroring
//      N1.
//    Because N1 and N3 both have a gap at y:100-700 while N2 doesn't, a
//    player who detours north (through that band) crosses only ONE nebula
//    wall (N2) instead of three -- at the cost of a real detour: straight
//    through the gauntlet is ~5905px total (the Probe<->Beacon distance
//    above); routing via the north gap (e.g. Probe -> (3300,400) ->
//    Beacon) is ~6704px, about 800px/~3s longer at maxSpeed (shipConfig.ts,
//    260px/s) -- during which passive regen (survivalConfig.ts, 8/s) claws
//    back ~24 energy. That's the genuine energy-vs-time decision this axis
//    is meant to force: pay ~3 separate nebula tolls quickly, or pay ~1
//    toll slowly. Each individual wall-crossing costs roughly (15
//    hazardConfig energy/s - 8 regen/s) x (200px / 260px/s) ~= 5.4 net
//    energy while inside it -- modest per-crossing, but it compounds across
//    six formations crossed twice each (there and back) over a full run,
//    which is the intended cumulative pressure, not a single deadly wall.
// 4. Approach Veil, x=5200 and x=5450, y:1800-3700, 11 instances each (22
//    total) -- a two-row toll right before the Beacon approach, mirroring
//    §6's "right before the Beacon approach" category from level-006's
//    Nebula placement, just doubled in row-count here since density is
//    this level's whole point. ~650px clear of Beacon, ~403-632px clear of
//    Debris Field Wall B.
// 5. Bridging toll (§6 category), x:1150-1250 y:1080-1250, 2 instances --
//    on the close Probe<->Exit hop. Refined 2026-08-17 (level-eval-log-
//    2026-08-17.md round 1, [placement] flag #1): the near end was
//    originally (1050,1000), only 189.2px net of Probe's 27px radius
//    (316.2px center-to-center minus Nebula's own 100px radius minus
//    Probe's radius) -- under the 250px floor; this file's original
//    comment claimed ~316-427px clear but had measured raw center-to-
//    center distance, not clearance net of Nebula's own radius. Fix: moved
//    the near end only, ~128px further out along the same Probe->nearEnd
//    heading, to (1150,1080) (~311.6px net of Probe). The far end stays at
//    its original (1250,1250), which already cleared Exit by ~287.2px net
//    and didn't need to move -- a naive uniform shift of both endpoints
//    away from Probe would have pulled the far end closer to Exit instead
//    (verified: it would have dropped Exit's net clearance to ~195px,
//    itself under the floor), so only the one endpoint moves. Side effect:
//    the segment shortens from 3 instances to 2, still a continuous toll
//    (197px between them, under Nebula's 200px no-gap threshold).
//
// (Six formations total across the five numbered items above -- the Drift
// Expanse is three formations in one.)
//
// Debris Field: deliberately minimal/conventional per this candidate's
// axis -- just two short, ordinary walls providing baseline route texture,
// neither anywhere near a full map dimension (1000px and 900px respectively
// against a 6750x3798 map), both open at both ends (§5's default, no maze,
// no sealed ring):
// - Wall A: (1000,1800)-(1000,2800), a minor SW divider between the
//   Entry->Probe corridor and the Resupply/gauntlet-approach area. ~1063px
//   clear of Entry, ~934px clear of Probe, ~763px clear of Exit, ~1498px
//   clear of Resupply, ~604px clear of the bridging toll.
// - Wall B: (5800,700)-(5800,1600), a minor NE divider north of the
//   Approach Veil. ~1825px clear of Beacon, ~632px clear of Approach Veil's
//   nearer row.
// No reachability tracing is needed for either (unlike level-006/007's
// Debris-heavy candidates) -- neither wall spans a full dimension, and
// nothing in this file uses blocksMovement anywhere else, so normal
// movement can always route around both trivially.
//
// Moving hazards (§7): held at the established baseline (2 Ion Storm, 1
// Meteoroid), same reasoning level-006/007 used for their own non-axis
// dimensions -- this candidate's axis is Nebula Field density, not moving-
// hazard density or Debris Field complexity (those are the other two
// candidates' jobs), so pushing every dimension at once would blur the
// comparison the GER loop's Evaluate stage is meant to make. All three
// initial placements keep 250px+ clearance from every wall/formation/
// objective/resupply point (verified by distance in the placement comments
// below).
//
// Resupply: one AsteroidField at (2350,3450), placed west of the Drift
// Expanse (clear of it by ~450px) so a player can top off structure before
// attempting the gauntlet -- structure isn't what Nebula Field drains, but
// having it staged just before the level's real hazard still reads as a
// natural checkpoint. ~2055px clear of Entry, ~1498px clear of Debris Wall
// A, ~1275px clear of Ion Storm's SW placement.
//
// No puzzle-taxonomy element placed (consistent with every real level so
// far -- Phase 2b content, still unstarted).
// Named so the dev-only sanity check below can re-inspect the same
// generated arrays the hazards list spreads. count@spacing100: 11, 10 --
// both clear MIN_UNDULATE_COUNT=8.
const wallA = debrisWall(1000, 1800, 1000, 2800, 100); // Wall A -- minor SW divider
const wallB = debrisWall(5800, 700, 5800, 1600, 100); // Wall B -- minor NE divider, north of the Approach Veil

export const LEVEL_008: LevelConfig = {
  width: 6750,
  height: 3798,
  entryWormholeLocation: { x: 300, y: 3600 },
  exitWormholeLocation: { x: 1650, y: 1400 },
  probeLocation: { x: 750, y: 900 },
  relayBeaconLocation: { x: 6100, y: 3400 },

  resupplyPoints: [{ x: 2350, y: 3450, textureKey: 'asteroid_large', radius: 40 }],

  hazards: [
    // Nebula Field -- this level's axis. Six formations, west to east
    // along the Probe<->Beacon leg (see file comment above for the full
    // rationale, per-formation clearance math, and the north-gap
    // energy-vs-time tradeoff the three-wall Drift Expanse is built around).

    // 1. Early-route toll, on the Entry->Probe leg.
    ...nebulaWall(500, 2200, 500, 2600, 150),

    // 2. First Veil, a single-row toll right after Probe.
    ...nebulaWall(2050, 700, 2050, 1500, 190),

    // 3. THE DRIFT EXPANSE -- the main gauntlet, three parallel vertical
    // walls 500px apart. N1/N3 have a gap at y:100-700; N2 doesn't -- that
    // asymmetry is the deliberate "thin lane" a player can detour north to
    // find, trading travel distance for fewer nebula crossings.
    ...nebulaWall(2800, 700, 2800, 3700, 190), // N1 -- gap at y:100-700
    ...nebulaWall(3300, 100, 3300, 3700, 190), // N2 -- full height, no gap
    ...nebulaWall(3800, 700, 3800, 3700, 190), // N3 -- gap at y:100-700

    // 4. Approach Veil, a two-row toll right before the Beacon approach.
    ...nebulaWall(5200, 1800, 5200, 3700, 190), // AV1
    ...nebulaWall(5450, 1800, 5450, 3700, 190), // AV2

    // 5. Bridging toll, on the close Probe<->Exit hop. Near end moved from
    // (1050,1000) to (1150,1080); far end unchanged -- see file comment
    // above (level-eval-log-2026-08-17.md round 1, [placement] flag #1).
    ...nebulaWall(1150, 1080, 1250, 1250, 150),

    // Ion Storm / Meteoroid -- managed by MovingHazardManager. Initial
    // positions only, held at the established 2-1 baseline (this
    // candidate's axis is Nebula Field density, not moving-hazard density),
    // clear of every wall/formation/objective/resupply point.
    { type: 'ionStorm', x: 5000, y: 700 }, // NE open pocket, north of the Approach Veil
    { type: 'ionStorm', x: 1500, y: 2600 }, // SW open pocket, east of Debris Wall A. Moved +100px east 2026-08-17 (level-eval-log-2026-08-17.md round 1, [placement] flag #2) -- was exactly 250.0px net of Debris Wall A's collision edge (sitting on the clearance floor, not clear of it); now ~350px net.
    { type: 'meteoroid', x: 4200, y: 900 }, // open pocket between the Drift Expanse and the Approach Veil

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
