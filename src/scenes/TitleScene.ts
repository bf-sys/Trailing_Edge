import Phaser from 'phaser';

export const TITLE_SCENE_KEY = 'TitleScene';

// Stub level id for scaffolding only. Real levelOrder/SaveManager wiring
// (Start vs. Continue, first-incomplete-level resume) lands with
// LevelObjectiveTracker + SaveManager, not here.
const PLACEHOLDER_LEVEL_ID = 'level-000';

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
      this.scene.start('GameScene', { levelId: PLACEHOLDER_LEVEL_ID });
    });
  }
}
