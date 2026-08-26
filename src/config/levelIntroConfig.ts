import { registerTuning } from './devTuning';

// Level-number intro banner (prototype, 2026-08-26) -- top-third,
// screen-pinned text shown briefly at the start of a level, chosen over a
// blocking interstitial scene specifically so it doesn't have to be
// sequenced against AbilityUnlockScene's own popup (see GameScene's launch
// site for the timing rule: the hold timer starts only once that popup, if
// any, is closed).
export const levelIntroConfig = {
  y: 120, // px from top -- reads as "top third" at the game's viewport height
  fontSize: '40px',
  color: '#ffffff',
  depth: 2100, // above HudOverlay's DEPTH+1 (2001, HudOverlay.ts)
  holdSeconds: 1.5, // fully visible before the fade starts
  fadeSeconds: 0.6,
};

registerTuning('levelIntro', levelIntroConfig);
