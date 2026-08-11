import Phaser from 'phaser';

export const PUZZLE_ELEMENT_EVENTS = {
  Solved: 'onPuzzleElementSolved',
} as const;

// Shared contract for every puzzle-site element (GDD §6/§11.3): optional/
// additive content, cost-neutral by default -- no ShipSurvivalComponent
// interaction unless a subtype is deliberately paired with a hazard (none
// are in Phase 2a). Subclasses drive their own interaction model (overlap,
// sequence, timer, trail, push/pull) but all funnel through the same
// solved-state contract so PuzzleSite and HudOverlay's puzzle-site
// indicator can treat every element uniformly.
export abstract class PuzzleElementBase extends Phaser.Events.EventEmitter {
  private solvedState = false;

  get solved(): boolean {
    return this.solvedState;
  }

  // No-op by default -- only subtypes with per-frame logic (moving spot,
  // trail, push/pull) override this. Matches GameScene's existing
  // hazards/resupplyPoints array+update() loop convention, so puzzle
  // elements can be looped the same way rather than needing SystemRegistry.
  update(_time: number, _delta: number): void {}

  protected markSolved(): void {
    if (this.solvedState) return;
    this.solvedState = true;
    this.emit(PUZZLE_ELEMENT_EVENTS.Solved);
  }
}
