import Phaser from 'phaser';
import { LEVEL_ORDER, TEST_LEVEL_ID } from '../config/levelOrder';
import { hasSaveData, loadProgress } from '../objects/SaveManager';
import { getProgressionManager } from '../systems/ProgressionManager';

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

    // Logo art replaces the text title (2026-08-26) -- chroma-keyed from
    // art-staging/trailing_edge_logo_chromakey_1787772147364.jpg via
    // tools/asset-prep/chroma-key.js into assets/ui/logo.png. Display size is
    // authored here, not derived from the source's native 818x352 (CLAUDE.md's
    // asset/gameplay-size-decoupling rule).
    this.add.image(width / 2, height / 2 - 100, 'logo').setOrigin(0.5).setDisplaySize(440, 189);

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

    // Dev-only level select (import.meta.env.DEV, same gate as
    // devTuning.ts's window.tuning) -- lets a real LEVEL_ORDER entry be
    // playtested directly instead of playing through everything before it.
    // Never present in a release build. Jumping in force-grants exactly the
    // abilities a normal playthrough would already have by that point
    // (grantNextAbility() called once per level before the target, same
    // abilityUnlockOrder a real completion advances one at a time) so a
    // level authored assuming e.g. teleport is already unlocked (level-003+,
    // see levelOrder.ts's comments) isn't gated on an ability the player
    // never earned. Unlike Test Level, this goes through the normal
    // LEVEL_ORDER completion path (save write, next-ability grant,
    // AbilityUnlockScene) rather than TEST_LEVEL_ID's no-save sandbox
    // handling -- completing a jumped-to level will overwrite any existing
    // save, which is fine for dev testing but worth knowing before using it
    // over a save you care about.
    if (import.meta.env.DEV) {
      this.add
        .text(width / 2, height / 2 + 136, 'Dev: Jump to Level', { fontSize: '13px', color: '#5a6a77' })
        .setOrigin(0.5);

      const startX = width / 2 - ((LEVEL_ORDER.length - 1) * 60) / 2;
      LEVEL_ORDER.forEach((levelId, index) => {
        const levelText = this.add
          .text(startX + index * 60, height / 2 + 164, levelId.replace('level-', ''), {
            fontSize: '14px',
            color: '#5a6a77',
          })
          .setOrigin(0.5)
          .setInteractive({ useHandCursor: true });

        levelText.on('pointerdown', () => {
          for (let i = 0; i < index; i++) getProgressionManager().grantNextAbility();
          this.scene.start('GameScene', { levelId });
        });
      });
    }
  }
}
