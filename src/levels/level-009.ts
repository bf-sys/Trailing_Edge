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
// in. Every wall in this file lands in 'sweep' (all have length >= 1000px at
// the required spacing=100 -- see per-wall counts below), so 'bow' is dead
// code here in practice, kept only because §5 asks for the general-purpose
// version, not a level-specific trim of it.
//
// spacing=100 (not the 115px default) is required on any wall that will
// undulate -- see §5's safety-margin derivation (verified empirically down
// to count=7 at spacing=100, margin ~18-19px under the 120px no-gap
// threshold; re-verified for this file's own walls in the dev-time sanity
// check at the bottom).
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
// level-design-guide.md §1) -- this is the Generate-stage output only: not
// yet evaluated, and deliberately NOT registered in src/levels/index.ts's
// LEVELS map or src/config/levelOrder.ts's LEVEL_ORDER (that happens in the
// Refine stage once this candidate passes Evaluate). Sits after level-008 in
// the intended slot order, squarely in §8's post-full-unlock experimentation
// zone -- the player already has scan/teleport/rocketBoost (and
// tractorBeam, unlocked-by-default) by the time they'd reach this level, so
// none of §4/§7's ability-gating constraints apply.
//
// CREATIVE AXIS: THE MOVING-HAZARD GAUNTLET, WITH REAL VARIETY, NOT JUST
// COUNT. level-005 already proved "push moving-hazard density" as an axis
// (5 Ion Storm + 4 Meteoroid = 9 total, "more instances than any level built
// so far" per §8). Repeating that same shape with a slightly bigger number
// would read as a re-run of level-005, not a genuinely different experiment
// -- so this candidate pushes the SAME general direction (moving hazards as
// the level's main character) but changes what "more" means: 7 Ion Storm +
// 5 Meteoroid (12 total, the highest count of either hazard and the highest
// combined total in the project so far) PLUS the project's first-ever real
// placement of Solar Flare (2 instances) -- a hazard with no placement
// precedent in any level until now (level-design-guide.md §12, GDD §9's "no
// placement precedent yet" note). Solar Flare's pulsed timing (2.5s
// interval, hazardConfig.ts) adds a third, qualitatively different threat
// rhythm alongside Ion Storm's looping trochoid sweep and Meteoroid's
// straight-charging impact hits -- a player crossing this level's central
// corridor has to read three distinct movement/timing signatures at once,
// not just dodge more copies of the same two. Debris Field and Nebula Field
// are both kept deliberately modest/conventional (three short, ordinary,
// both-ends-open walls; four intent-placed Nebula tolls) -- neither a maze
// (level-006's axis) nor multiple sealed pockets (level-007's axis) nor
// Nebula density (level-008's axis) -- so this candidate reads as genuinely
// distinct from all four of its predecessors rather than "harder in every
// dimension at once" (§8's "variety, not convergence" principle).
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
// SIZING: 7290x4101, i.e. level-003/004's 5400x3038 footprint scaled by
// 7290/5400 = 4101/3037.6 (rounded to 4101 from the exact 4100.8) = 1.35x --
// both target dimensions share that one factor, so it's a uniform scale-up
// (level-design-guide.md §2), holding the established 16:9-ish aspect ratio
// and growing beyond level-007's 7020x3949 (the largest level built so far),
// per this guide's explicit floor ("holding steady or growing... is fine,
// don't go smaller"). The larger footprint also gives the 12 moving hazards
// more room to roam before wrapping, same reasoning level-005 used for its
// own size bump.
//
// OBJECTIVES (§3 -- only *consecutive* Probe<->Beacon and Beacon<->Exit need
// to be pushed far apart; non-consecutive Probe<->Exit is deliberately left
// close): diagonal = sqrt(7290^2 + 4101^2) ~= 8364.3px. Probe(900,800) <->
// Beacon(6600,3500): ~6307.1px (~75.4% of diagonal, at the top of the
// 65-76% precedent band, matching level-005's 77% and level-008's 76.3%).
// Beacon <-> Exit(1850,1200): ~5277.5px (~63.1%, a touch under the band --
// same situation level-007 (~61.9%) and level-008 (~63.0%) hit for the same
// geometric reason: Exit has to sit close to Probe *and* Probe is already
// pushed into the far corner from Beacon, leaving Exit no room to also
// extend away from Beacon; §3 states the band is "not a hard target").
// Probe <-> Exit (non-consecutive): ~1030.8px (~12.3%, inside the 12-13%
// band). Entry sits at (400,3800), a genuine SW corner, clear of every
// hazard placed below (nearest wall is >2900px away -- see per-wall
// clearance notes). Resupply sits at (3600,1950), central/accessible, kept
// well clear of all three walls (nearest, Wall B, is 390px net clear -- see
// below).
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
// spacing=100 (counts 15, 15, 12 -- all clear MIN_UNDULATE_COUNT=8; see the
// dev-time sanity check at the bottom for the actual measured worst-case
// neighbor gap, ~99.9-101.6px, comfortably under the 120px no-gap
// threshold). Every wall segment keeps 250px+ net clearance from every
// objective/resupply point (computed as raw center-to-nearest-point distance
// minus the debris radius (60) and, for Resupply, its own 40px radius --
// verified via a standalone script, not eyeballed):
// - Wall A: (2600,300)-(2600,1700), vertical, upper-center-west, between the
//   Entry/Probe/Exit cluster and the map's center. Closest net clearance:
//   Exit ~690px, Probe ~1640px, Resupply ~971px.
// - Wall B: (3200,2400)-(4600,2400), horizontal, center, between Resupply
//   and the SE region. Closest net clearance: Resupply ~390px, Beacon
//   ~2222.5px.
// - Wall C: (5200,2800)-(6100,3400), diagonal, guards the SE corner
//   approach to Beacon. Closest net clearance: Beacon ~449.9px.
// No reachability tracing is needed for any of the three (unlike
// level-006/007's Debris-heavy candidates) -- none spans a full dimension
// and there's no maze/seal anywhere else in this file, so normal movement
// can always route around all three trivially.
//
// NEBULA FIELD (§6, four instances, placed with intent, not scattered):
// - Early-route toll (750,3100) -- on the Entry->Probe leg, ~682.6px clear
//   of Entry.
// - Bypass toll (2600,2050) -- at Wall A's open south end (the wall stops at
//   y=1700); deliberately allowed to sit close to/overlap the wall's edge
//   per §6 ("fine, even good... reads as a compound obstacle" -- this is the
//   one placement in this file that's intentionally under the general
//   250px floor, and only against the one wall it's tolling).
// - Bridging toll (1375,1000) -- on the close Probe<->Exit hop, ~415.4px
//   net clear of both Probe and Exit.
// - Approach toll (6300,3100) -- right before the Beacon approach, near
//   Wall C's open end; same deliberate §6 overlap exception against Wall C
//   specifically (~400px clear of Beacon itself).
//
// MOVING HAZARDS -- THE AXIS (§7/§8): 7 Ion Storm + 5 Meteoroid (12 total,
// the highest combined count in the project so far -- level-005's 9 was the
// prior high) plus 2 Solar Flare (the project's first real placement of
// this hazard type). Scattered across open pockets on both sides of the
// three modest dividers so no region of the map is free of a moving threat
// for long -- their authored x/y only governs each hazard's first leg
// before MovingHazardManager's wrap-on-exit + objective-biased respawn
// takes over (§7).
//
// REFINE-STAGE COORDINATE PASS (2026-08-25, level-eval-log-2026-08-25.md's
// level-009 entry, round 1): the Generate-stage version of this section only
// checked each hazard's *initial point* against the 250px floor, not its
// full first-leg path -- both Ion Storm/Meteoroid hold a constant
// perpendicular coordinate for their whole first leg (heading is fixed
// per-type in hazardConfig.ts: Ion Storm always due west, Meteoroid always
// due east), so an initial-point-only check misses a wall/objective sitting
// further along that same fixed line. 5 of 7 Ion Storm and 2 of 5 Meteoroid
// placements below were re-simulated (20ms and 2ms timestep, full
// trochoid-carrier+orbit / straight-line physics, matching
// MovingHazardManager/HazardZoneElement exactly) and repositioned so the
// *entire* first leg clears every wall/objective/resupply point by 250px+,
// not just spawn. The repositioning search also surfaced a structural fact
// worth stating plainly: for any Ion Storm placed east of Wall A with an
// interior (non-edge-hugging) y, the corridor bounded by Wall A above and
// Wall B/Resupply below is almost entirely unsafe at every y in between
// (both walls' 250px+cautious-orbit margins overlap across most of the
// map's height) -- every fixed instance below that needed to cross that
// corridor landed south of Wall B instead of staying "north" as originally
// labeled, which is why several roles read differently from the original
// Generate-stage comment. Ion Storm's cautious effective radius (110 shape
// + 220 orbit = 330px, used for a static go/no-go placement check) is
// superseded here by the full simulation, which resolves the orbit's actual
// swept position at every timestep directly rather than inflating a radius
// as a shortcut -- both approaches target the same 250px floor, the
// simulation is just exact instead of conservative.
// - Ion Storm x7 (re-simulated worst-case net clearance vs. the nearest
//   feature in parens): (1200,2600) west-central, unchanged, 903px clear of
//   Entry; (3400,3070) south-central, moved from (3400,950) -- the original
//   north placement swept directly through Wall A at t~1.9s (-162px
//   overlap), 490px clear of Wall B now; (2700,2920) south-central, moved
//   from (5000,1200) -- east of Wall B, no y in the Wall A/Wall B corridor
//   ever cleared both walls at once from that x, so this instance moved
//   west of Wall A/Wall B's shared danger zone instead, 552px clear of Wall
//   B; (2000,2580) south-west, moved from (2000,3600) -- the original swept
//   directly over the Entry Wormhole at t~6.5s (-102px overlap), 895px
//   clear of Entry now; (4200,3155) south-central, nudged from (4200,3300)
//   -- the original was only 227px clear of Entry (23px under the floor),
//   365px clear of Entry now; (1900,125) far north, moved from (6300,1800)
//   -- every y between Wall A and the map's south edge sweeps through Wall
//   B, Wall C, or Resupply from that x, so this instance moved to a genuine
//   north pocket west of Wall A instead, 441px clear of Probe; (900,1700)
//   west, between Probe and Wall A, unchanged, 791px clear of Probe.
// - Meteoroid x5 (same clearance convention): (1700,3900) south, moved from
//   (1700,3200) -- the original swept directly through Wall C at t~14.9s
//   (-94.8px overlap), 344px clear of Beacon now; (3900,1600) north-center,
//   unchanged, 365px clear of Resupply; (5700,2400) center-east, unchanged,
//   507px clear of Wall C; (2900,4050) south, moved from (2900,3600) -- the
//   original passed within 44px net of the Relay Beacon, 494px clear of
//   Beacon now; (6800,1500) far north-east, unchanged, 1839px clear of Wall
//   C. Meteoroid#0 and #3 both landing in the map's southern band (rather
//   than spread north/south) is a direct consequence of the same
//   east-heading-crosses-everything constraint -- x=1700 and x=2900 both
//   need to clear Wall A, Wall B, and Wall C in sequence heading east, and
//   the open southern strip below Wall C's diagonal is the only lane that
//   does for both starting x's; their y's are set 150px apart (3900 vs
//   4050) so they don't read as a single parallel "conga line."
// - Solar Flare x2 (first-ever placement, addressing level-design-guide.md
//   §12's "Solar Flare has no placement precedent" open item): (3900,2900)
//   and (5400,1900), both sitting along the central Probe<->Beacon corridor
//   this level's moving hazards already patrol -- a player timing a pass
//   through the Ion Storm/Meteoroid traffic here also has to read Solar
//   Flare's independent 2.5s pulse cycle (hazardConfig.ts), a third,
//   qualitatively different threat rhythm layered on the same ground rather
//   than off in its own corner.
//
// RESUPPLY: one AsteroidField at (3600,1950), central/accessible, kept
// 250px+ clear of every wall (nearest is Wall B at ~390px net, see above) --
// deliberately placed so a player can top off structure before committing to
// either half of the central gauntlet corridor.
//
// No puzzle-taxonomy element placed (consistent with every real level so
// far -- Phase 2b content, still unstarted).
//
// Named so the dev-only sanity check below can re-inspect the same
// generated arrays the hazards list spreads. count@spacing100: 15, 15, 12 --
// all three clear MIN_UNDULATE_COUNT=8.
const wallA = debrisWall(2600, 300, 2600, 1700, 100); // Wall A -- upper-center-west divider
const wallB = debrisWall(3200, 2400, 4600, 2400, 100); // Wall B -- center divider, guards Resupply/SE approach
const wallC = debrisWall(5200, 2800, 6100, 3400, 100); // Wall C -- SE diagonal, guards the Beacon approach

export const LEVEL_009: LevelConfig = {
  width: 7290,
  height: 4101,
  entryWormholeLocation: { x: 400, y: 3800 },
  exitWormholeLocation: { x: 1850, y: 1200 },
  probeLocation: { x: 900, y: 800 },
  relayBeaconLocation: { x: 6600, y: 3500 },

  resupplyPoints: [{ x: 3600, y: 1950, textureKey: 'asteroid_large', radius: 40 }],

  hazards: [
    // Nebula Field -- four instances, placed with intent rather than
    // scattered (see file comment above for each one's role/clearance).
    // Cycles the three sourced Nebula Field textures (2026-08-21, mirroring
    // Debris Field's alt2/alt3 precedent) so four instances on one map
    // don't read as one sprite copy-pasted four times.
    { type: 'nebulaField', x: 750, y: 3100, textureKey: NEBULA_TEXTURES[0] }, // early-route toll on Entry's way toward Probe
    { type: 'nebulaField', x: 2600, y: 2050, textureKey: NEBULA_TEXTURES[1] }, // bypass toll at Wall A's open south end
    { type: 'nebulaField', x: 1375, y: 1000, textureKey: NEBULA_TEXTURES[2] }, // bridges the close Probe<->Exit hop
    { type: 'nebulaField', x: 6300, y: 3100, textureKey: NEBULA_TEXTURES[0] }, // approach toll right before the Beacon, near Wall C's open end

    // Ion Storm x7 / Meteoroid x5 / Solar Flare x2 -- THIS LEVEL'S AXIS (see
    // file comment above for the full rationale, per-placement clearance
    // notes, and the cautious orbit-aware measure used for Ion Storm). Ion
    // Storm/Meteoroid are managed by MovingHazardManager (initial position
    // only, wrap/respawn handled automatically); Solar Flare is static/
    // pulsed and needs no such handling.
    { type: 'ionStorm', x: 1200, y: 2600 }, // west-central open pocket
    // Refine-stage fix (level-eval-log-2026-08-25.md): was (3400,950), swept
    // through Wall A at t~1.9s (-162px overlap) -- moved south of Wall B,
    // full-trajectory-verified 490px clear of Wall B.
    { type: 'ionStorm', x: 3400, y: 3070 },
    // Refine-stage fix: was (5000,1200), swept through Wall A at t~11.1s
    // (-155px overlap); no y between Wall A and Wall B/Resupply clears both
    // from that x, so moved west of Wall A/Wall B entirely -- 552px clear of
    // Wall B.
    { type: 'ionStorm', x: 2700, y: 2920 },
    // Refine-stage fix: was (2000,3600), swept directly over the Entry
    // Wormhole at t~6.5s (-102px overlap) -- moved north, 895px clear of
    // Entry.
    { type: 'ionStorm', x: 2000, y: 2580 },
    // Refine-stage fix: was (4200,3300), only 227px clear of Entry (23px
    // under the 250px floor) -- nudged north, 365px clear of Entry.
    { type: 'ionStorm', x: 4200, y: 3155 },
    // Refine-stage fix: was (6300,1800), swept directly over Resupply at
    // t~11.8s (-124px overlap); every interior y from that x crosses Wall
    // B, Wall C, or Resupply, so moved to a genuine north pocket west of
    // Wall A -- 441px clear of Probe.
    { type: 'ionStorm', x: 1900, y: 125 },
    { type: 'ionStorm', x: 900, y: 1700 }, // west, between Probe and Wall A

    // Refine-stage fix: was (1700,3200), swept directly through Wall C at
    // t~14.9s (-94.8px overlap) -- moved south, 344px clear of Beacon.
    { type: 'meteoroid', x: 1700, y: 3900 },
    { type: 'meteoroid', x: 3900, y: 1600 }, // north-center, ~365px clear of Resupply
    { type: 'meteoroid', x: 5700, y: 2400 }, // center-east, ~494px clear of Wall C
    // Refine-stage fix: was (2900,3600), passed within 44px net of the
    // Relay Beacon -- moved south (150px off Meteoroid#0's new y so the two
    // don't read as a single parallel line), 494px clear of Beacon.
    { type: 'meteoroid', x: 2900, y: 4050 },
    { type: 'meteoroid', x: 6800, y: 1500 }, // far north-east, near Beacon's northern approach

    { type: 'solarFlare', x: 3900, y: 2900 }, // first-ever Solar Flare placement -- central gauntlet corridor
    { type: 'solarFlare', x: 5400, y: 1900 }, // second Solar Flare -- same corridor, closer to the Beacon approach

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
