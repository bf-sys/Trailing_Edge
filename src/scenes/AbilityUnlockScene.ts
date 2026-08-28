import Phaser from 'phaser';
import type { AbilityType } from '../config/abilityConfig';
import { abilityUnlockContent } from '../config/abilityUnlockContent';
import { WindowFrame } from '../objects/WindowFrame';
import { windowFrameConfig } from '../config/windowFrameConfig';
import { playSfx } from '../objects/AudioManager';

export const ABILITY_UNLOCK_SCENE_KEY = 'AbilityUnlockScene';

export interface AbilityUnlockSceneData {
  abilityType: Exclude<AbilityType, 'tractorBeam'>;
  onClose: () => void;
}

// Stacked overlay (scene.launch), same convention as PauseScene -- GameScene
// stays alive underneath, paused, per GDD §11 Scene flow. Launched from
// GameScene.handleLevelComplete() whenever ProgressionManager.grantNextAbility()
// actually grants something (2026-08-14 ability rework's "Ability-unlock
// info popup" -- never launched for tractorBeam, which isn't in
// abilityUnlockOrder and so never comes through here). No timer, no
// click-anywhere dismiss -- the close button is the only way out, and it
// performs the level transition handleLevelComplete() would otherwise have
// made immediately.
export class AbilityUnlockScene extends Phaser.Scene {
  private sceneData!: AbilityUnlockSceneData;

  constructor() {
    super(ABILITY_UNLOCK_SCENE_KEY);
  }

  init(data: AbilityUnlockSceneData): void {
    this.sceneData = data;
  }

  create(): void {
    const { width, height } = this.scale;
    const content = abilityUnlockContent[this.sceneData.abilityType];

    this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.7);

    const windowWidth = 560;
    const windowHeight = 340;
    const windowFrame = new WindowFrame(this, {
      x: width / 2 - windowWidth / 2,
      y: height / 2 - windowHeight / 2,
      width: windowWidth,
      height: windowHeight,
      title: 'ABILITY UNLOCKED',
    });

    // Content below is added as children of the WindowFrame container, so
    // these coordinates are local to the window (0,0 at its top-left), not
    // screen space -- same convention WindowFrame's own corner/edge/fill
    // tiles use internally.
    const centerX = windowWidth / 2;
    const contentTop = windowFrameConfig.borderThicknessPx + windowFrameConfig.titleBarHeightPx;
    const contentPadding = 32;

    windowFrame.add(
      this.add.text(centerX, contentTop + 26, content.title, { fontSize: '26px', color: '#ffffff' }).setOrigin(0.5)
    );
    windowFrame.add(
      this.add
        .text(centerX, contentTop + 64, content.description, {
          fontSize: '15px',
          color: '#cccccc',
          wordWrap: { width: windowWidth - windowFrameConfig.borderThicknessPx * 2 - contentPadding },
          align: 'center',
        })
        .setOrigin(0.5, 0)
    );

    const closeButton = this.add
      .text(centerX, windowHeight - windowFrameConfig.borderThicknessPx - 30, 'Close', {
        fontSize: '18px',
        color: '#8fd3ff',
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    windowFrame.add(closeButton);

    closeButton.on('pointerdown', () => {
      playSfx(this, 'uiClick');
      this.sceneData.onClose();
      this.scene.stop();
    });
  }
}
