import Phaser from 'phaser';

export const WIN_SCENE_KEY = 'WinScene';

// Shown when LEVEL_ORDER is exhausted (src/config/levelOrder.ts).
export class WinScene extends Phaser.Scene {
  constructor() {
    super(WIN_SCENE_KEY);
  }

  create(): void {
    const { width, height } = this.scale;

    this.add
      .text(width / 2, height / 2, 'You win', { fontSize: '28px', color: '#ffffff' })
      .setOrigin(0.5);
  }
}
