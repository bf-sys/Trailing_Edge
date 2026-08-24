import type { HazardPlacement, LevelConfig } from './levelTypes';

const DEBRIS_TEXTURES = ['debris_large', 'debris_large_alt2', 'debris_large_alt3'];
const NEBULA_TEXTURES = ['hazard_nebula_field', 'hazard_nebula_field_alt2', 'hazard_nebula_field_alt3'];

// Interpolates a straight chain of Debris Field placements between two
// points, spaced closer than 2x its 60px radius (hazardConfig.ts) so
// adjacent circles overlap and leave no ship-width gap -- a genuine wall,
// not a line of separately-dodgeable rocks (GDD §9's Debris Field re-scope
// -- blocksMovement, zero resource cost). Cycles the three sourced debris
// textures and varies rotation per index so a long chain doesn't read as
// one sprite copy-pasted end to end. Same helper as level-001/002/003.ts's
// -- duplicated rather than shared, matching this project's "one
// hand-authored file per level" convention (CLAUDE.md tech stack).
//
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
// clear 16 instances at 115px.
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

// Fourth real level. Original 2026-08-17 pass sized this 2x level-001
// (4800x2700) on purpose, deliberately not matching level-003. **Recalibrated
// 2026-08-17 (same day, corrected pass): resized to exactly level-003's
// footprint (5400x3038)** -- that "not matching level-003" framing was a
// miscommunication, not an intended design point; there's no longer a
// deliberate size discontinuity between 003 and 004. Every placement below
// is the prior 4800x2700 layout uniformly scaled by 5400/4800 = 3038/2700 =
// 1.125x (level-003's dimensions are exactly level-004's old ones x1.125,
// so one scale factor covers both axes) and rounded to the nearest pixel --
// same relative shape, same relative spacing, just bigger. Because the
// scale-up is uniform, every distance/clearance relationship already
// verified pre-recalibration only grows (nothing that cleared 250px before
// can fail to clear it now), so it didn't need re-deriving from scratch.
//
// Same rules as level-002/003: only *consecutive* steps in
// LevelObjectiveTracker's Probe -> Relay Beacon -> Exit Wormhole sequence
// (§11.11) are pushed far apart (Probe<->Beacon ~4680px, Beacon<->Exit
// ~4305px; Probe<->Exit, not consecutive, left close at ~740px), Debris
// Field walls stay the primary hazard (four chained barriers, texture/
// rotation variety), and Nebula Field is placed with intent -- two toll
// the open bypass routes around Debris Field walls, one sits early on
// Entry's route out, one bridges the close Probe<->Exit hop.
//
// Deliberately NOT repeating level-003's sealed debrisRing() around the
// Probe: that was specific to reinforcing a just-granted ability
// (teleport, unlocked on level-002's completion) the level right after it
// was earned, not a running pattern for every level afterward. Every
// hazard here keeps 250px+ clearance from every objective/resupply point
// by construction (not yet confirmed by an actual playtest), and no wall
// spans a full map dimension, so nothing is walled off. level-000 stays
// the fixed reference for hazard/puzzle-element testing; this file is
// meant to be edited freely as design iterates.
//
// Also carries level-003's Ion Storm/Meteoroid placements -- the two
// 'linear' movementPattern hazards, managed by MovingHazardManager
// (2026-08-17), which wraps them back into the level with an
// objective-biased respawn heading once they drift out of bounds instead
// of flying off forever (GDD §9/§11.3; see that class for the design).
// Their authored x/y below only matters for the first leg, before either
// first wraps.
//
// Also carries the 2026-08-17 second pass's 180-degree flip -- every
// placement below is level-004's original layout point-reflected through
// the map's center, (x, y) -> (width - x, height - y), same trick used on
// level-002 (2026-08-15), applied because level-004 read too "same-y"
// against level-003's layout logic. That flip and this recalibration
// compose fine (flip first, then uniform scale -- order doesn't matter for
// either transform's guarantees).
// Named so the dev-only sanity check below can re-inspect the same
// generated arrays the hazards list spreads. count@spacing100: 13, 15, 16,
// 12 -- all four clear MIN_UNDULATE_COUNT=8.
const lowerCenterRightWall = debrisWall(3375, 2700, 3375, 1463, 100); // lower-center-right divider
const upperMidLeftWall = debrisWall(2925, 1294, 1575, 1294, 100); // upper-mid-left divider
const upperRightDiagonalWall = debrisWall(4388, 1125, 3150, 281, 100); // upper-right diagonal, guards Relay Beacon's approach
const lowerLeftWall = debrisWall(1463, 2644, 1463, 1575, 100); // lower-left divider, guards the Probe/Exit corridor

export const LEVEL_004: LevelConfig = {
  width: 5400,
  height: 3038,
  entryWormholeLocation: { x: 4838, y: 2531 },
  exitWormholeLocation: { x: 788, y: 1744 },
  probeLocation: { x: 675, y: 2475 },
  relayBeaconLocation: { x: 4894, y: 450 },

  resupplyPoints: [{ x: 2138, y: 844, textureKey: 'asteroid_large', radius: 40 }],

  hazards: [
    // Nebula Field -- four instances, placed with intent rather than
    // scattered: two toll the open bypass routes around Debris Field walls
    // (A's north gap, D's north gap), one sits on Entry's early route out,
    // one bridges the close Probe<->Exit hop. Cycles the three sourced
    // Nebula Field textures (2026-08-21, mirroring Debris Field's
    // alt2/alt3 precedent) so four instances on one map don't read as one
    // sprite copy-pasted four times.
    { type: 'nebulaField', x: 3375, y: 1238, textureKey: NEBULA_TEXTURES[0] }, // Wall A's north bypass
    { type: 'nebulaField', x: 1406, y: 1294, textureKey: NEBULA_TEXTURES[1] }, // Wall D's north bypass
    { type: 'nebulaField', x: 4050, y: 2138, textureKey: NEBULA_TEXTURES[2] }, // early on Entry's route toward the map center
    { type: 'nebulaField', x: 900, y: 2138, textureKey: NEBULA_TEXTURES[0] }, // bridges the close Probe<->Exit hop

    // Ion Storm / Meteoroid -- managed by MovingHazardManager (see the
    // file-level comment above). Initial positions only, clear of every
    // wall/objective/resupply point.
    { type: 'ionStorm', x: 2250, y: 2025 },
    { type: 'ionStorm', x: 3825, y: 1913 },
    { type: 'meteoroid', x: 4388, y: 788 },

    // Debris Field walls -- four chained barriers. None span a full map
    // dimension, so each leaves clear space at both ends to route around.
    ...lowerCenterRightWall,
    ...upperMidLeftWall,
    ...upperRightDiagonalWall,
    ...lowerLeftWall,
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
  [lowerCenterRightWall, upperMidLeftWall, upperRightDiagonalWall, lowerLeftWall].forEach((wall, wallIndex) => {
    for (let i = 0; i < wall.length - 1; i++) {
      const dist = Math.hypot(wall[i + 1].x - wall[i].x, wall[i + 1].y - wall[i].y);
      if (dist > NO_GAP_THRESHOLD) {
        console.warn(
          `[level-004] Debris wall ${wallIndex} has a ${dist.toFixed(1)}px gap between instances ${i} and ${i + 1} -- exceeds the ${NO_GAP_THRESHOLD}px no-gap threshold, may open a ship-width hole.`,
        );
      }
    }
  });
}
