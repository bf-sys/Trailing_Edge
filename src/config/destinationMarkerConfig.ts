import { registerTuning } from './devTuning';

// Quick, purely-decorative ping shown at the ship's committed click-to-move
// destination (ExplorationController's EXPLORATION_EVENTS.DestinationSet,
// fired on pointerup) -- an expanding-ring tween, per
// docs/reference/phaser-vfx-notes.md's "scanner ping" pattern. No gameplay
// effect, display-only.
export const destinationMarkerConfig = {
  color: 0x8fd3ff, // matches TitleScene's Start-text blue
  strokeWidth: 4,
  durationMs: 350,
  startScale: 0.4,
  endScale: 1.2,
  startAlpha: 0.85,
  depth: 5, // above world content, below the ship (depth 10)
};

registerTuning('destinationMarker', destinationMarkerConfig);
