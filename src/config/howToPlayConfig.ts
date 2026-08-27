import { registerTuning } from './devTuning';

// Layout for HowToPlayScene's WindowFrame-based popup. Sized larger than
// AbilityUnlockScene's 560x340 (windowFrameConfig doesn't fix a size --
// each popup Scene picks its own) to fit a body paragraph plus a row of
// reused in-game icons plus page navigation on one page.
export const howToPlayConfig = {
  windowWidth: 760,
  windowHeight: 480,

  titleY: 96,
  bodyY: 140,
  bodyWordWrapPadding: 32, // subtracted from windowWidth - 2*borderThicknessPx, matches AbilityUnlockScene's convention
  imagesY: 290,
  navY: 395,
  closeY: 430,

  // Icons are reused in-game textures at native gameplay sizes (a
  // wormhole/probe/asteroid, etc.), not UI art authored for this popup --
  // each is scaled down to fit this box, aspect preserved, rather than
  // displayed at gameplay scale.
  imageMaxSizePx: 72,
  imageSlotWidthPx: 160, // horizontal spacing between icon centers in a page's image row
  imageLabelOffsetPx: 12, // gap between an icon's bottom edge and its label

  navButtonOffsetPx: 160, // Prev/Next distance from the page indicator, matching imageSlotWidthPx's rhythm
  navDisabledAlpha: 0.3,
};

registerTuning('howToPlay', howToPlayConfig);
