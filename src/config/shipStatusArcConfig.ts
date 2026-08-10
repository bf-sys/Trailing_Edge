import { registerTuning } from './devTuning';

// World-space, ship-relative resource readout (2026-08-10 style experiment)
// — an alternative/companion to HudOverlay's screen-pinned bars. Structure
// is a single curved arc above the ship (a dome), energy is a straight bar
// below it — arcRadius/energyBarOffsetY are both sized to clear shipConfig's
// displayWidth/Height (46x56) so neither overlaps the sprite.
export const shipStatusArcConfig = {
  arcRadius: 42, // px from ship center, structure arc (was 34; pushed out to the old outer-arc position for more clearance from the ship)
  arcThickness: 5,
  structureColor: 0xff8a4c,

  energyBarWidth: 56,
  energyBarHeight: 6,
  energyBarOffsetY: 34, // px below ship center
  energyBarTrackColor: 0x1a1a22,
  energyBarTrackAlpha: 0.7,
  energyColor: 0x4fc3f7,

  depth: 15, // above PlayerShip's depth of 10 (see PlayerShip.ts)
};

registerTuning('shipStatusArc', shipStatusArcConfig);
