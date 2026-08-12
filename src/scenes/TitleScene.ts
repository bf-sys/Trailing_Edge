import Phaser from 'phaser';
import { LEVEL_ORDER, TEST_LEVEL_ID } from '../config/levelOrder';
import { hasSaveData, loadProgress } from '../objects/SaveManager';

export const TITLE_SCENE_KEY = 'TitleScene';

// GDD §11.8: Start always begins at levelOrder[0] with default resources;
// Continue is only shown/enabled if SaveManager.hasSaveData() is true, and
// resumes at the saved levelId (never a mid-level position — SaveManager's
// storage shape has no such state, since CheckpointManager is deferred).
export class TitleScene extends Phaser.Scene {
  constructor() {
    super(TITLE_SCENE_KEY);
  }

  create(): void {
    const { width, height } = this.scale;

    this.add
      .text(width / 2, height / 2 - 40, 'Trailing Edge', { fontSize: '32px', color: '#ffffff' })
      .setOrigin(0.5);

    const startText = this.add
      .text(width / 2, height / 2 + 20, 'Start', { fontSize: '20px', color: '#8fd3ff' })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    startText.on('pointerdown', () => {
      this.scene.start('GameScene', { levelId: LEVEL_ORDER[0] });
    });

    if (hasSaveData()) {
      const continueText = this.add
        .text(width / 2, height / 2 + 56, 'Continue', { fontSize: '20px', color: '#8fd3ff' })
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true });

      continueText.on('pointerdown', () => {
        const save = loadProgress();
        this.scene.start('GameScene', { levelId: save?.levelId ?? LEVEL_ORDER[0] });
      });
    }

    // Not part of LEVEL_ORDER progression -- no save read/write on either
    // side of this trip (GameScene.handleLevelComplete() special-cases
    // TEST_LEVEL_ID to return here directly). Exists for human playtesting
    // and for running test passes against a level carrying every hazard and
    // every puzzle element at once, per config/levelOrder.ts.
    const testLevelText = this.add
      .text(width / 2, height / 2 + 100, 'Test Level', { fontSize: '16px', color: '#7a8a99' })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    testLevelText.on('pointerdown', () => {
      this.scene.start('GameScene', { levelId: TEST_LEVEL_ID });
    });
  }
}
