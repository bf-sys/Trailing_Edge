import Phaser from 'phaser';
import type { AbilityType } from '../config/abilityConfig';
import { abilityUnlockContent } from '../config/abilityUnlockContent';

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

    this.add.text(width / 2, height / 2 - 70, 'Ability unlocked', { fontSize: '16px', color: '#8fd3ff' }).setOrigin(0.5);
    this.add.text(width / 2, height / 2 - 32, content.title, { fontSize: '28px', color: '#ffffff' }).setOrigin(0.5);
    this.add
      .text(width / 2, height / 2 + 10, content.description, {
        fontSize: '15px',
        color: '#cccccc',
        wordWrap: { width: width * 0.6 },
        align: 'center',
      })
      .setOrigin(0.5, 0);

    const closeButton = this.add
      .text(width / 2, height / 2 + 130, 'Close', { fontSize: '18px', color: '#8fd3ff' })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    closeButton.on('pointerdown', () => {
      this.sceneData.onClose();
      this.scene.stop();
    });
  }
}
