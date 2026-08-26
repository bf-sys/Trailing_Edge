import { registerTuning } from './devTuning';

// One-shot blink-moment VFX played on teleport confirm (see
// TeleportBlinkVfx.ts) -- fills the "dedicated activation VFX" gap named in
// docs/trailing_edge_art_asset_list.md §1.5 for teleport specifically (scan
// and rocketBoost were already resolved, see CLAUDE.md's Current project
// state). Distinct from TeleportRangeRing, which only covers the aim-time
// state before confirm -- this covers the instant of the blink itself.
export const teleportBlinkVfxConfig = {
  color: 0xd88fff, // matches teleportRangeRingConfig.ringColor / hudConfig.abilityIconColors.teleport
  ringStrokeWidth: 3,
  ringStartAlpha: 0.9,
  ringMaxRadius: 60, // a small local flash, not scan's map-scale radius
  durationMs: 180, // fast -- a blink, not a travel effect
  arrivalStartScaleFactor: 0.15, // how small the real ship starts at on arrival before growing back to its normal scale
  depth: 16, // same layer as TeleportRangeRing/HazardScanOverlay/ScanActivationVfx
};

registerTuning('teleportBlinkVfx', teleportBlinkVfxConfig);
