import Phaser from 'phaser';
import { TITLE_SCENE_KEY } from './TitleScene';
import { playSfx } from '../objects/AudioManager';

export const WIN_SCENE_KEY = 'WinScene';

// Shown when LEVEL_ORDER is exhausted (src/config/levelOrder.ts). Terminal
// screen -- GameScene is already gone by the time this shows (scene.start()
// replaced it), so returning to TitleScene is a plain scene.start(), no
// "stop GameScene first" step like PauseScene's own return-to-title needs.
export class WinScene extends Phaser.Scene {
  constructor() {
    super(WIN_SCENE_KEY);
  }

  create(): void {
    const { width, height } = this.scale;

    this.add
      .text(width / 2, height / 2 - 20, 'You win', { fontSize: '28px', color: '#ffffff' })
      .setOrigin(0.5);

    const titleText = this.add
      .text(width / 2, height / 2 + 30, 'Return to Title', { fontSize: '20px', color: '#8fd3ff' })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    titleText.on('pointerdown', () => {
      playSfx(this, 'uiClick');
      this.scene.start(TITLE_SCENE_KEY);
    });
  }
}
