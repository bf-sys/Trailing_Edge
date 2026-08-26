import Phaser from 'phaser';
import { levelIntroConfig } from '../config/levelIntroConfig';

// Display-only, screen-pinned (same convention as HudOverlay) -- a one-shot
// "Level N" banner in the top third of the screen. Not folded into
// HudOverlay itself since it carries no persistent per-frame state, just a
// single show() call per level; GameScene owns when that call happens.
export class LevelIntroBanner {
  private readonly text: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene) {
    this.text = scene.add
      .text(scene.scale.width / 2, levelIntroConfig.y, '', {
        fontSize: levelIntroConfig.fontSize,
        color: levelIntroConfig.color,
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(levelIntroConfig.depth)
      .setAlpha(0);
  }

  // Fully visible for holdSeconds, then fades out over fadeSeconds. Calling
  // this again (not currently done anywhere) would restart the hold/fade
  // from full visibility, since setAlpha(1) below cancels the effect of any
  // prior fade tween still in flight.
  show(label: string): void {
    this.text.scene.tweens.killTweensOf(this.text);
    this.text.setText(label).setAlpha(1);
    this.text.scene.tweens.add({
      targets: this.text,
      alpha: 0,
      delay: levelIntroConfig.holdSeconds * 1000,
      duration: levelIntroConfig.fadeSeconds * 1000,
    });
  }
}
