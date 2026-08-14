import { registerTuning } from './devTuning';

// Teleport's range-ring visual (2026-08-14 ability rework) -- see
// TeleportRangeRing. Radius itself isn't here -- it's
// abilityConfig.teleport.maxRange, the same fixed range gate the ability
// logic uses, so the ring always reflects the real range rather than a
// display-only copy that could drift out of sync.
export const teleportRangeRingConfig = {
  ringThickness: 2,
  ringColor: 0xd88fff, // matches hudConfig.abilityIconColors.teleport
  ringAlpha: 0.6,
  reticleRadius: 10,
  reticleThickness: 2,
  reticleColor: 0xffffff,
  depth: 16, // same layer as HazardScanOverlay -- above ShipStatusArcs (15), below HudOverlay's screen-pinned DEPTH (2000)
};

registerTuning('teleportRangeRing', teleportRangeRingConfig);
