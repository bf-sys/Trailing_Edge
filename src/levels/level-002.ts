import type { HazardPlacement, LevelConfig } from './levelTypes';

const DEBRIS_TEXTURES = ['debris_large', 'debris_large_alt2', 'debris_large_alt3'];

// Interpolates a straight chain of Debris Field placements between two
// points, spaced closer than 2x its 60px radius (hazardConfig.ts) so
// adjacent circles overlap and leave no ship-width gap -- a genuine wall,
// not a line of separately-dodgeable rocks (GDD §9's Debris Field re-scope
// -- blocksMovement, zero resource cost). Cycles the three sourced debris
// textures and varies rotation per index so a long chain doesn't read as
// one sprite copy-pasted end to end. Same helper as level-001.ts's --
// duplicated rather than shared, matching this project's "one
// hand-authored file per level" convention (CLAUDE.md tech stack).
function debrisWall(x1: number, y1: number, x2: number, y2: number, spacing = 115): HazardPlacement[] {
  const length = Math.hypot(x2 - x1, y2 - y1);
  const count = Math.max(2, Math.round(length / spacing) + 1);
  const placements: HazardPlacement[] = [];
  for (let i = 0; i < count; i++) {
    const t = i / (count - 1);
    placements.push({
      type: 'debrisField',
      x: x1 + (x2 - x1) * t,
      y: y1 + (y2 - y1) * t,
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
    // one bridges the short Probe<->Exit hop.
    { type: 'nebulaField', x: 2100, y: 775 }, // Wall A's north (wide) bypass
    { type: 'nebulaField', x: 900, y: 975 }, // Wall D's north bypass, guards the Probe/Exit corridor
    { type: 'nebulaField', x: 2700, y: 1325 }, // early on Entry's route toward the map center
    { type: 'nebulaField', x: 700, y: 1375 }, // bridges the close Probe<->Exit hop

    // Debris Field walls -- four chained barriers. None span a full map
    // dimension, so each leaves clear space at both ends to route around.
    ...debrisWall(2100, 1800, 2100, 975), // lower-center-right divider
    ...debrisWall(1800, 900, 975, 900), // upper-mid-left divider
    ...debrisWall(2775, 750, 1650, 225), // upper-right diagonal, guards Relay Beacon's approach
    ...debrisWall(900, 1725, 900, 1125), // lower-left divider, guards the Probe/Exit corridor
  ],

  puzzleElements: [],
};
