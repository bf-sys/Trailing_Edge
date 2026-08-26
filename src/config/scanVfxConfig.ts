import { registerTuning } from './devTuning';

// One-shot outward-expanding ring played on scan activation (see
// ScanActivationVfx.ts) -- fills the "dedicated activation VFX" gap named
// in docs/trailing_edge_art_asset_list.md §1.5, per
// docs/reference/phaser-vfx-notes.md's tween-based "expanding-ring scanner
// ping" recommendation (the same pattern DestinationMarker already uses for
// click-to-move, adapted here to actually mark a scan activation, which
// nothing did before this). Distinct from HazardScanOverlay, which shows
// the *result* of an active scan (hazard outlines/labels) for the full
// abilityConfig.scan.durationSeconds window -- this is only the instant of
// activation, a quick pulse well under that window.
export const scanVfxConfig = {
  color: 0x8fe8ff, // cyan-leaning -- distinct from destinationMarkerConfig's blue and scanConfig's neutral gray
  strokeWidth: 3,
  startAlpha: 0.9,
  durationMs: 700,
  depth: 16, // matches scanConfig.depth -- same layer as the hazard outlines it precedes
};

registerTuning('scanVfx', scanVfxConfig);
