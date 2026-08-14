import { registerTuning } from './devTuning';

// World-space, ship-relative resource readout (2026-08-10 style experiment)
// — an alternative/companion to HudOverlay's screen-pinned bars. Both
// resources render as straight bars below the ship, structure on top of
// energy. **Structure switched from a curved dome arc to a horizontal bar
// 2026-08-14** — the arc read as a shield to playtesters, which misrepresents
// structure as absorbing damage rather than being consumed by it. Structure
// now occupies the position/width the energy bar used to have; energy sits
// directly beneath it, thinner, so the two are still easy to tell apart at a
// glance. Both sized to clear shipConfig's displayWidth/Height (46x56) so
// neither overlaps the sprite.
export const shipStatusArcConfig = {
  structureBarWidth: 56,
  structureBarHeight: 8,
  structureBarOffsetY: 34, // px below ship center
  structureBarTrackColor: 0x1a1a22,
  structureBarTrackAlpha: 0.7,
  structureColor: 0xff8a4c,

  energyBarWidth: 56,
  energyBarHeight: 4, // thinner than structureBarHeight so the two bars stay visually distinct
  energyBarOffsetY: 45, // structureBarOffsetY + structureBarHeight + 3px gap
  energyBarTrackColor: 0x1a1a22,
  energyBarTrackAlpha: 0.7,
  energyColor: 0x4fc3f7,

  depth: 15, // above PlayerShip's depth of 10 (see PlayerShip.ts)
};

registerTuning('shipStatusArc', shipStatusArcConfig);
