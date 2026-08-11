import Phaser from 'phaser';
import { PUZZLE_ELEMENT_EVENTS, type PuzzleElementBase } from './PuzzleElementBase';

export const PUZZLE_SITE_EVENTS = {
  SiteSolved: 'onSiteSolved',
} as const;

// Groups puzzle elements under one completion condition (GDD §11.3):
// "onSiteSolved() marks solved state for HUD/telegraphing purposes." A
// single-element site (the common case for Phase 2a's test-level instances)
// is just a PuzzleSite wrapping one element -- still worth constructing,
// since HudOverlay's puzzle-site indicator (Step 4) queries PuzzleSite
// rather than individual elements, so it doesn't care how many elements a
// given site groups.
export class PuzzleSite extends Phaser.Events.EventEmitter {
  private siteSolved = false;

  constructor(private readonly elements: PuzzleElementBase[]) {
    super();
    this.elements.forEach((element) => element.on(PUZZLE_ELEMENT_EVENTS.Solved, () => this.checkSolved()));
  }

  get solved(): boolean {
    return this.siteSolved;
  }

  private checkSolved(): void {
    if (this.siteSolved) return;
    if (!this.elements.every((element) => element.solved)) return;
    this.siteSolved = true;
    this.emit(PUZZLE_SITE_EVENTS.SiteSolved);
  }
}
