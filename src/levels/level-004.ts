import type { HazardPlacement, LevelConfig } from './levelTypes';

const DEBRIS_TEXTURES = ['debris_large', 'debris_large_alt2', 'debris_large_alt3'];

// Interpolates a straight chain of Debris Field placements between two
// points, spaced closer than 2x its 60px radius (hazardConfig.ts) so
// adjacent circles overlap and leave no ship-width gap -- a genuine wall,
// not a line of separately-dodgeable rocks (GDD §9's Debris Field re-scope
// -- blocksMovement, zero resource cost). Cycles the three sourced debris
// textures and varies rotation per index so a long chain doesn't read as
// one sprite copy-pasted end to end. Same helper as level-001/002/003.ts's
// -- duplicated rather than shared, matching this project's "one
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

// Fourth real level (2026-08-17), 2x level-001's footprint (2400x1350 ->
// 4800x2700 -- "twice the size," double each dimension, same definition
// settled on 2026-08-15 for the since-superseded first level-002 draft).
// No level-002/003 continuity intended in this size choice -- it's
// anchored back to level-001, not "1.5x level-003."
//
// Same rules as level-002/003: only *consecutive* steps in
// LevelObjectiveTracker's Probe -> Relay Beacon -> Exit Wormhole sequence
// (§11.11) are pushed far apart (Probe<->Beacon ~4160px, Beacon<->Exit
// ~3830px; Probe<->Exit, not consecutive, left close at ~660px), Debris
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
// 2026-08-17, second pass: level-004 read too "same-y" against level-003
// (same relative layout logic, similarly sized) -- every placement below
// is now that original layout point-reflected through the map's center,
// (x, y) -> (width - x, height - y), the same 180-degree-flip trick used
// on level-002 (2026-08-15) rather than two independent mirror passes.
// Point reflection is distance-preserving, so every relationship already
// verified pre-flip -- the far/close objective spacing, every hazard's
// 250px+ clearance from every objective/resupply point -- carries over
// exactly; only the comments below changed, to describe each hazard's new
// orientation (e.g. what was Wall A's south bypass is now its north
// bypass).
export const LEVEL_004: LevelConfig = {
  width: 4800,
  height: 2700,
  entryWormholeLocation: { x: 4300, y: 2250 },
  exitWormholeLocation: { x: 700, y: 1550 },
  probeLocation: { x: 600, y: 2200 },
  relayBeaconLocation: { x: 4350, y: 400 },

  resupplyPoints: [{ x: 1900, y: 750, textureKey: 'asteroid_large', radius: 40 }],

  hazards: [
    // Nebula Field -- four instances, placed with intent rather than
    // scattered: two toll the open bypass routes around Debris Field walls
    // (A's north gap, D's north gap), one sits on Entry's early route out,
    // one bridges the close Probe<->Exit hop.
    { type: 'nebulaField', x: 3000, y: 1100 }, // Wall A's north bypass
    { type: 'nebulaField', x: 1250, y: 1150 }, // Wall D's north bypass
    { type: 'nebulaField', x: 3600, y: 1900 }, // early on Entry's route toward the map center
    { type: 'nebulaField', x: 800, y: 1900 }, // bridges the close Probe<->Exit hop

    // Ion Storm / Meteoroid -- managed by MovingHazardManager (see the
    // file-level comment above). Initial positions only, clear of every
    // wall/objective/resupply point.
    { type: 'ionStorm', x: 2000, y: 1800 },
    { type: 'ionStorm', x: 3400, y: 1700 },
    { type: 'meteoroid', x: 3900, y: 700 },

    // Debris Field walls -- four chained barriers. None span a full map
    // dimension, so each leaves clear space at both ends to route around.
    ...debrisWall(3000, 2400, 3000, 1300), // lower-center-right divider
    ...debrisWall(2600, 1150, 1400, 1150), // upper-mid-left divider
    ...debrisWall(3900, 1000, 2800, 250), // upper-right diagonal, guards Relay Beacon's approach
    ...debrisWall(1300, 2350, 1300, 1400), // lower-left divider, guards the Probe/Exit corridor
  ],

  puzzleElements: [],
};
