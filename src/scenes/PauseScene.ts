import Phaser from 'phaser';

export const PAUSE_SCENE_KEY = 'PauseScene';

// Stacked overlay (scene.launch), not a Scene swap — GameScene stays alive
// underneath, paused, per GDD §11 Scene flow.
export class PauseScene extends Phaser.Scene {
  constructor() {
    super(PAUSE_SCENE_KEY);
  }

  create(): void {
    const { width, height } = this.scale;

    this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.6);
    this.add
      .text(width / 2, height / 2, 'Paused', { fontSize: '28px', color: '#ffffff' })
      .setOrigin(0.5);

    this.input.keyboard?.on('keydown-ESC', () => {
      this.scene.stop();
      this.scene.resume('GameScene');
    });
  }
}
