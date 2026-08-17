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
export const LEVEL_004: LevelConfig = {
  width: 4800,
  height: 2700,
  entryWormholeLocation: { x: 500, y: 450 },
  exitWormholeLocation: { x: 4100, y: 1150 },
  probeLocation: { x: 4200, y: 500 },
  relayBeaconLocation: { x: 450, y: 2300 },

  resupplyPoints: [{ x: 2900, y: 1950, textureKey: 'asteroid_large', radius: 40 }],

  hazards: [
    // Nebula Field -- four instances, placed with intent rather than
    // scattered: two toll the open bypass routes around Debris Field walls
    // (A's south gap, D's south gap), one sits on Entry's early route out,
    // one bridges the close Probe<->Exit hop.
    { type: 'nebulaField', x: 1800, y: 1600 }, // Wall A's south bypass
    { type: 'nebulaField', x: 3550, y: 1550 }, // Wall D's south bypass
    { type: 'nebulaField', x: 1200, y: 800 }, // early on Entry's route toward the map center
    { type: 'nebulaField', x: 4000, y: 800 }, // bridges the close Probe<->Exit hop

    // Debris Field walls -- four chained barriers. None span a full map
    // dimension, so each leaves clear space at both ends to route around.
    ...debrisWall(1800, 300, 1800, 1400), // upper-center divider
    ...debrisWall(2200, 1550, 3400, 1550), // mid-lower divider
    ...debrisWall(900, 1700, 2000, 2450), // lower-left diagonal, guards Relay Beacon's approach
    ...debrisWall(3500, 350, 3500, 1300), // upper-right divider, guards the Probe/Exit corridor
  ],

  puzzleElements: [],
};
