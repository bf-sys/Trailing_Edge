import { registerTuning } from './devTuning';

// Shared active/inactive tint language for state-based waypoint objects:
// EntryWormhole/ExitWormhole (GDD §11.14) and RelayBeaconObject (GDD
// §11.13, collapsed to single-texture-plus-tint 2026-08-01, matching this
// same convention instead of its old separate idle/reached-overlay files).
// Renamed from wormholeConfig now that a non-wormhole object shares it.
//
// activeTint is 0xffffff (a no-op multiplicative tint, i.e. the sprite's
// true colors) rather than a colored tint -- 2026-08-01 fix. Phaser's
// setTint() multiplies each channel, so a colored tint like the original
// 0x88ffcc (full green channel, reduced red/blue) reads fine on a
// near-monochrome placeholder icon but recolors a detailed, naturally-
// colored sprite (like the AI-generated Relay Beacon art) with an "oddly
// greenish" cast across its greys/silvers. "Active" now means "shown in
// its real colors"; only inactiveTint actually recolors (darkens/desaturates).
export const waypointTintConfig = {
  activeTint: 0xffffff, // open/energized/reached -- true colors, no tint
  inactiveTint: 0x445566, // closed/dormant/not-yet-reached
  entryCloseDelayMs: 400, // delay before EntryWormhole visually closes
};

registerTuning('waypointTint', waypointTintConfig);
