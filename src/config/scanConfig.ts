import { registerTuning } from './devTuning';

// Scan's hazard-ID overlay (2026-08-14 ability rework,
// docs/ability-rework-brainstorm-2026-08-14.md) -- while scan's duration
// window is active (AbilityComponent.isActive('scan', ...)), hazards within
// scanRadius get an outline colored by resource type plus a text label
// naming them. The two-birds-one-stone fix for GDD §9's Open design
// questions: structure-vs-energy stakes legibility, and Ion Storm/Nebula
// Field being visually hard to tell apart (the label removes the ambiguity
// regardless of how close their outline colors end up looking).
export const scanConfig = {
  scanRadius: 500, // px from ship -- hazards farther than this stay unrevealed
  outlineThickness: 3,
  outlineMargin: 6, // px beyond the hazard's own radius, so the outline doesn't overlap its edge
  // blocksMovement hazards with zero resource cost (Debris Field) aren't
  // structure- or energy-draining, so they don't earn shipStatusArcConfig's
  // orange/blue -- a neutral color instead.
  neutralColor: 0xaaaaaa,
  labelFontSize: 13,
  labelColorCss: '#ffffff',
  labelOffsetY: 10, // px above the outline's top edge
  depth: 16, // above ShipStatusArcs (15), below HudOverlay's screen-pinned DEPTH (2000)
};

registerTuning('scan', scanConfig);
