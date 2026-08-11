import Phaser from 'phaser';
import { LEVEL_ORDER } from '../config/levelOrder';
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
  }
}
