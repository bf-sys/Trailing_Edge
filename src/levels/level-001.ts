import type { LevelConfig } from './levelTypes';

// Real LEVEL_ORDER[0] (2026-08-12). Same core-loop layout and full hazard
// roster as level-000, but no puzzle-taxonomy content -- Phase 1's contract
// never required one to complete a level (GDD §3), and this file is meant
// to be a design-iteration base for what a "level 1" should actually look
// like, not a permanent shape. Edit placements here freely; level-000 stays
// the fixed reference for hazard/puzzle-element testing.
export const LEVEL_001: LevelConfig = {
  width: 2400,
  height: 1350,
  entryWormholeLocation: { x: 1200, y: 675 },
  exitWormholeLocation: { x: 500, y: 1000 },
  probeLocation: { x: 2200, y: 200 },
  relayBeaconLocation: { x: 200, y: 1150 },

  resupplyPoints: [{ x: 650, y: 300, textureKey: 'asteroid_large', radius: 40 }],

  hazards: [
    { type: 'debrisField', x: 1750, y: 950 },
    { type: 'solarFlare', x: 1000, y: 1000 },
    { type: 'ionStorm', x: 1400, y: 400 },
    { type: 'nebulaField', x: 2000, y: 700 },
    { type: 'meteoroid', x: 300, y: 900 },
  ],

  puzzleElements: [],
};
