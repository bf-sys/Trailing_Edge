import Phaser from 'phaser';
import { HOW_TO_PLAY_SCENE_KEY } from './HowToPlayScene';
import { playSfx } from '../objects/AudioManager';

export const PAUSE_SCENE_KEY = 'PauseScene';

// Stacked overlay (scene.launch), not a Scene swap — GameScene stays alive
// underneath, paused, per GDD §11 Scene flow. GDD §11.8 names two required
// exits from this overlay: resume, and "one option: return to TitleScene
// ... a hard cut, not a save point" — whatever's saved is only as current
// as the last level-completion save (SaveManager, §11.9); there's no
// save-on-pause behavior, so returning to title never loses more than a
// hard-fail restart already would. Both are implemented entirely inside
// this Scene — GameScene's ESC handler (its only touchpoint with this
// class) doesn't need to know which exit the player picked.
export class PauseScene extends Phaser.Scene {
  constructor() {
    super(PAUSE_SCENE_KEY);
  }

  create(): void {
    const { width, height } = this.scale;

    playSfx(this, 'uiPauseToggle');
    this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.6);
    this.add
      .text(width / 2, height / 2 - 60, 'Paused', { fontSize: '28px', color: '#ffffff' })
      .setOrigin(0.5);

    // Same text-button convention as TitleScene/AbilityUnlockScene — ESC
    // already resumed pre-existing behavior; this just also exposes it as
    // a clickable option alongside the new "Return to Title" button below,
    // rather than leaving resume keyboard-only while the new option is
    // click-only.
    const resumeText = this.add
      .text(width / 2, height / 2, 'Resume', { fontSize: '20px', color: '#8fd3ff' })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    resumeText.on('pointerdown', () => this.resume());

    const titleText = this.add
      .text(width / 2, height / 2 + 40, 'Return to Title', { fontSize: '20px', color: '#8fd3ff' })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    titleText.on('pointerdown', () => {
      playSfx(this, 'uiClick');
      this.returnToTitle();
    });

    // Same launcher-pauses-itself convention this Scene itself was opened
    // with (GameScene's ESC handler) -- HowToPlayScene resumes PauseScene
    // (not GameScene) on close via sceneData.returnSceneKey.
    const howToPlayText = this.add
      .text(width / 2, height / 2 + 80, 'How to Play', { fontSize: '20px', color: '#8fd3ff' })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    howToPlayText.on('pointerdown', () => {
      playSfx(this, 'uiClick');
      this.scene.launch(HOW_TO_PLAY_SCENE_KEY, { returnSceneKey: PAUSE_SCENE_KEY });
      this.scene.pause();
    });

    this.input.keyboard?.on('keydown-ESC', () => this.resume());
  }

  private resume(): void {
    playSfx(this, 'uiPauseToggle');
    this.scene.stop();
    this.scene.resume('GameScene');
  }

  // GDD §11.8's required "return to TitleScene" option — a hard cut, not a
  // pause: stops GameScene outright (not left paused-but-alive in the
  // background) since there's nothing to resume into once the player has
  // navigated away, and GameScene is parameterized by levelId only with no
  // mid-level resume anyway (§11.8) — a later Start/Continue creates a
  // fresh instance regardless.
  private returnToTitle(): void {
    this.scene.stop('GameScene');
    this.scene.stop();
    this.scene.start('TitleScene');
  }
}
