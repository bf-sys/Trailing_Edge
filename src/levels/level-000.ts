import type { LevelConfig } from './levelTypes';

// The Phase 1/2a test level (2026-08-12: reassigned from LEVEL_ORDER[0] to
// a standalone test level -- see config/levelOrder.ts's TEST_LEVEL_ID and
// TitleScene's "Test Level" entry point). Compact and carries one instance
// of every hazard and every puzzle-taxonomy element, which is exactly what
// makes it good for testing and bad as a real "first level" -- keep this
// file's content exhaustive rather than trimming it to feel more like a
// real level.
export const LEVEL_000: LevelConfig = {
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

  puzzleElements: [
    { type: 'scanInteract', x: 1200, y: 300 },
    {
      type: 'sequenceSpot',
      points: [
        { x: 900, y: 600 },
        { x: 1000, y: 500 },
        { x: 1100, y: 600 },
      ],
    },
    {
      type: 'trailDraw',
      beaconPoints: [
        { x: 1500, y: 1150 },
        { x: 1650, y: 1250 },
        { x: 1750, y: 1150 },
      ],
    },
    {
      type: 'movingSpotDuration',
      path: [
        { x: 300, y: 500 },
        { x: 700, y: 700 },
      ],
    },
    { type: 'pushPullObject', x: 1900, y: 500, targetX: 2100, targetY: 650 },
  ],
};
