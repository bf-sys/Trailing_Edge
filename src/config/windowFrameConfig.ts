import { registerTuning } from './devTuning';

// WindowFrame (src/objects/WindowFrame.ts) assembles an in-game window from
// 4 source pieces generated via the art GER loop 2026-08-21 (see
// docs/history/art-eval-log-2026-08-21.md): a corner (reused via 90-degree
// rotation for all 4 corners), an edge strip (tiled, and also rotated 90
// degrees for the vertical edges), a title bar plate (tiled), and an
// interior fill texture (tiled in both directions). Deliberately NOT using
// Phaser's built-in NineSlice GameObject -- it only stretches its edge/fill
// regions (confirmed against the installed Phaser 3.90 source), which would
// smear the periodic rivet/panel-line detail baked into these assets.
//
// Border/title-bar/fill sizes below are the *target on-screen* pixel sizes
// -- each source texture gets its own uniform scale factor computed at
// construction time (target size / that texture's own native pixel size),
// not a single shared scale, since the 4 pieces were generated independently
// and don't share a native resolution. This is what keeps the border ring a
// consistent visual thickness all the way around despite that.
export const windowFrameConfig = {
  cornerTextureKey: 'window_corner',
  edgeTextureKey: 'window_edge',
  titlebarTextureKey: 'window_titlebar',
  fillTextureKey: 'window_fill',

  borderThicknessPx: 28, // on-screen thickness of the corner/edge border ring
  titleBarHeightPx: 40, // on-screen height of the title bar plate row
  fillTileSizePx: 96, // on-screen size of one fill-texture tile (square)

  titleTextStyle: {
    fontFamily: 'monospace',
    fontSize: '16px',
    color: '#c9d6e3',
  },

  depth: 3000, // above HudOverlay's DEPTH (2000)
};

registerTuning('windowFrame', windowFrameConfig);
