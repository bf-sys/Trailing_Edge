import type { HazardPlacement, LevelConfig } from './levelTypes';

const DEBRIS_TEXTURES = ['debris_large', 'debris_large_alt2', 'debris_large_alt3'];
const NEBULA_TEXTURES = ['hazard_nebula_field', 'hazard_nebula_field_alt2', 'hazard_nebula_field_alt3'];

// Interpolates a straight chain of Debris Field placements between two
// points, spaced closer than 2x its 60px radius (hazardConfig.ts) so
// adjacent circles overlap and leave no ship-width gap -- a genuine wall,
// not a line of separately-dodgeable rocks (GDD §9's Debris Field re-scope
// -- blocksMovement, zero resource cost). Cycles the three sourced debris
// textures and varies rotation per index so a long chain doesn't read as
// one sprite copy-pasted end to end. Same helper as level-001.ts's --
// duplicated rather than shared, matching this project's "one
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
// applied to short walls), the floor here is 8: this file's walls run much
// shorter than level-006's, and every wall gets the tighter 100px spacing
// once it qualifies, not just ones long enough to clear 16 instances at
// 115px.
//
// Below that (count 4-7, e.g. this file's 600px wall), the two-term
// sweep+texture "S" shape doesn't have enough points to read as anything
// but a jerky zigzag -- it needs real length for the sweep's own period to
// unfold. Below MIN_UNDULATE_COUNT these get a single-term "bow" instead
// (added 2026-08-24, per playtest feedback on the S-shape looking off at
// this length): just the envelope times one flat BOW_AMPLITUDE, no
// oscillating term at all, so it's a smooth one-directional "C" bulge
// rather than a wave -- reads cleanly even with only 1-2 interior points,
// and its single-term nature makes it inherently safer per instance of
// amplitude than the two-term sweep (no direction reversal between
// neighbors to open a gap). Verified empirically the same way: at
// BOW_AMPLITUDE=30/spacing=100/count=7, worst-case neighbor distance is
// 101.12px, an 18.88px margin. Below MIN_BOW_COUNT there simply aren't
// enough interior points for a bow to read as anything but noise, so the
// wall stays a straight line.
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
      const envelope = Math.sin(Math.PI * t);
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

// Second real level (2026-08-15), 1.5x level-001's footprint (2400x1350 ->
// 3600x2025). Same two rules level-001's redesign established: only
// *consecutive* steps in LevelObjectiveTracker's Probe -> Relay Beacon ->
// Exit Wormhole sequence (§11.11) are pushed far apart (Probe<->Beacon and
// Beacon<->Exit both 2700px+; Probe<->Exit, not consecutive, deliberately
// left close at ~530px), and Debris Field walls stay the primary hazard,
// chained with per-instance texture/rotation variety (levelTypes.ts's
// HazardPlacement overrides). Nebula Field returns, placed with intent
// rather than as a third hazard type sprinkled in -- two toll the open
// bypass routes around Debris Field walls so the "easy" detour still costs
// energy rather than being free, one sits early on Entry's route out, and
// one bridges the short Probe<->Exit hop so even that close pair isn't
// hazard-free.
//
// 2026-08-15, second pass: every placement below is level-002's original
// layout point-reflected through the map's center (x, y) -> (width - x,
// height - y) -- a 180-degree flip, not two independent mirror passes --
// so the level plays as a genuinely different shape from level-001 (whose
// relative objective/hazard positions this design otherwise echoed) without
// re-deriving placement from scratch. Point reflection is distance-
// preserving, so every relationship already verified in the pre-flip
// version -- the far/close objective spacing above, and every hazard's
// 250px+ clearance from every objective/resupply point -- carries over
// exactly; only the comments below changed, to describe each hazard's new
// orientation (e.g. what was Wall A's south bypass is now its north
// bypass). No wall spans a full map dimension, so nothing is walled off
// with zero abilities unlocked. level-000 stays the fixed reference for
// hazard/puzzle-element testing; this file is meant to be edited freely as
// design iterates.
// Named so the dev-only sanity check below can re-inspect the same
// generated arrays the hazards list spreads. count@spacing100: 9, 9, 13 --
// all three clear MIN_UNDULATE_COUNT=8 and get the full sweep. The fourth
// wall (600px, count=7) falls into the bow-only range instead.
const lowerCenterRightWall = debrisWall(2100, 1800, 2100, 975, 100); // lower-center-right divider
const upperMidLeftWall = debrisWall(1800, 900, 975, 900, 100); // upper-mid-left divider
const upperRightDiagonalWall = debrisWall(2775, 750, 1650, 225, 100); // upper-right diagonal, guards Relay Beacon's approach
const lowerLeftWall = debrisWall(900, 1725, 900, 1125, 100); // lower-left divider, guards the Probe/Exit corridor

export const LEVEL_002: LevelConfig = {
  width: 3600,
  height: 2025,
  entryWormholeLocation: { x: 3150, y: 1575 },
  exitWormholeLocation: { x: 525, y: 1125 },
  probeLocation: { x: 450, y: 1650 },
  relayBeaconLocation: { x: 3150, y: 375 },

  resupplyPoints: [{ x: 1275, y: 450, textureKey: 'asteroid_large', radius: 40 }],

  hazards: [
    // Nebula Field -- four instances, placed with intent rather than
    // scattered: two toll the open bypass routes around Debris Field walls
    // (A's north gap, D's north gap), one sits on Entry's early route out,
    // one bridges the short Probe<->Exit hop. Cycles the three sourced
    // Nebula Field textures (2026-08-21, mirroring Debris Field's
    // alt2/alt3 precedent) so four instances on one map don't read as one
    // sprite copy-pasted four times.
    { type: 'nebulaField', x: 2100, y: 775, textureKey: NEBULA_TEXTURES[0] }, // Wall A's north (wide) bypass
    { type: 'nebulaField', x: 900, y: 975, textureKey: NEBULA_TEXTURES[1] }, // Wall D's north bypass, guards the Probe/Exit corridor
    { type: 'nebulaField', x: 2700, y: 1325, textureKey: NEBULA_TEXTURES[2] }, // early on Entry's route toward the map center
    { type: 'nebulaField', x: 700, y: 1375, textureKey: NEBULA_TEXTURES[0] }, // bridges the close Probe<->Exit hop

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
// a future edit to debrisWall's undulation constants (sweep or bow) ever
// lets two neighboring instances drift past the 120px (2x Debris Field's
// 60px radius, hazardConfig.ts) no-gap threshold, instead of silently
// shipping a wall with a ship-width hole in it. Mirrors level-006's
// dev-check, covering all four walls (three sweep, one bow).
if (import.meta.env.DEV) {
  const NO_GAP_THRESHOLD = 2 * 60;
  [lowerCenterRightWall, upperMidLeftWall, upperRightDiagonalWall, lowerLeftWall].forEach((wall, wallIndex) => {
    for (let i = 0; i < wall.length - 1; i++) {
      const dist = Math.hypot(wall[i + 1].x - wall[i].x, wall[i + 1].y - wall[i].y);
      if (dist > NO_GAP_THRESHOLD) {
        console.warn(
          `[level-002] Debris wall ${wallIndex} has a ${dist.toFixed(1)}px gap between instances ${i} and ${i + 1} -- exceeds the ${NO_GAP_THRESHOLD}px no-gap threshold, may open a ship-width hole.`,
        );
      }
    }
  });
}
