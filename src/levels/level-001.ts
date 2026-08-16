import type { HazardPlacement, LevelConfig } from './levelTypes';

const DEBRIS_TEXTURES = ['debris_large', 'debris_large_alt2', 'debris_large_alt3'];

// Interpolates a straight chain of Debris Field placements between two
// points, spaced closer than 2x its 60px radius (hazardConfig.ts) so
// adjacent circles overlap and leave no ship-width gap -- a genuine wall,
// not a line of separately-dodgeable rocks (GDD §9's Debris Field re-scope
// -- blocksMovement, zero resource cost). Cycles the three sourced debris
// textures and varies rotation per index so a long chain doesn't read as
// one sprite copy-pasted end to end.
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

// Real LEVEL_ORDER[0] (2026-08-12). Design pass 2026-08-15 (v2, same day):
// original 2400x1350 footprint kept as-is -- the 4800x2700 doubled version
// explored earlier the same day is intentionally not this level; that
// larger, heavier-hazard shape is earmarked for a level 2+ once scan is
// unlocked, not level-001's first pass. What carries over from that
// exploration: heavily-chained Debris Field walls as the sole hazard
// (Nebula Field dropped 2026-08-15 -- debris-only for this pass; still no
// puzzle-taxonomy content), and non-uniform objective spacing -- only
// *consecutive* steps in LevelObjectiveTracker's Probe -> Relay Beacon ->
// Exit Wormhole sequence (§11.11) are pushed apart; Probe and Exit aren't
// consecutive, so they're deliberately left close together (~350px) while
// Relay Beacon sits far from both (~1800-2000px) -- a real routing "there
// and back" shape instead of evenly spacing all three apart for its own
// sake. Every debris wall keeps 250px+ clearance from every objective/
// resupply point (checked by construction, not yet by an actual playtest)
// so nothing is walled off on a level where the player has zero abilities
// yet. level-000 stays the fixed reference for hazard/puzzle-element
// testing; this file is still meant to be edited freely as design iterates.
export const LEVEL_001: LevelConfig = {
  width: 2400,
  height: 1350,
  entryWormholeLocation: { x: 300, y: 300 },
  exitWormholeLocation: { x: 2050, y: 600 },
  probeLocation: { x: 2100, y: 250 },
  relayBeaconLocation: { x: 300, y: 1100 },

  resupplyPoints: [{ x: 1550, y: 1050, textureKey: 'asteroid_large', radius: 40 }],

  hazards: [
    // Debris Field walls -- the sole hazard for this pass (Nebula Field
    // dropped 2026-08-15). Three chained barriers carving the map into
    // routing decisions (Meso/Exploration pillar). None span a full map
    // dimension, so each leaves clear space at both ends to route around.
    ...debrisWall(1000, 150, 1000, 700), // upper-center divider
    ...debrisWall(1200, 750, 1750, 750), // mid-right divider
    ...debrisWall(550, 850, 1300, 1200), // lower-left diagonal, guards Relay Beacon's approach
  ],

  puzzleElements: [],
};
