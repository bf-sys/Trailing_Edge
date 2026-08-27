import Phaser from 'phaser';
import { WindowFrame } from '../objects/WindowFrame';
import { windowFrameConfig } from '../config/windowFrameConfig';
import { howToPlayConfig } from '../config/howToPlayConfig';
import { howToPlayPages } from '../config/howToPlayContent';

export const HOW_TO_PLAY_SCENE_KEY = 'HowToPlayScene';

export interface HowToPlaySceneData {
  // Scene to resume once this popup closes. TitleScene and PauseScene both
  // pause themselves before launching this Scene (same convention
  // GameScene uses for PauseScene itself), so this Scene only needs to
  // know who to hand control back to -- it never needs to know which of
  // the two callers it was.
  returnSceneKey: string;
}

// Stacked overlay (scene.launch), same convention as PauseScene/
// AbilityUnlockScene -- whichever Scene launched this one stays alive
// underneath, paused. Reachable from both TitleScene and PauseScene (GDD
// has no prior "how to play" reference doc; added 2026-08-27 at user
// request). Paginated via howToPlayContent.ts's plain array so a future
// Abilities/Hazards page is a content addition, not a Scene change.
export class HowToPlayScene extends Phaser.Scene {
  private sceneData!: HowToPlaySceneData;
  private pageIndex = 0;
  private windowFrame?: WindowFrame;
  private pageContent?: Phaser.GameObjects.Container;
  private pageIndicatorText?: Phaser.GameObjects.Text;
  private prevButton?: Phaser.GameObjects.Text;
  private nextButton?: Phaser.GameObjects.Text;

  constructor() {
    super(HOW_TO_PLAY_SCENE_KEY);
  }

  init(data: HowToPlaySceneData): void {
    this.sceneData = data;
    this.pageIndex = 0;
  }

  create(): void {
    const { width, height } = this.scale;
    const { windowWidth, windowHeight, navY, closeY, navButtonOffsetPx } = howToPlayConfig;

    this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.75);

    this.windowFrame = new WindowFrame(this, {
      x: width / 2 - windowWidth / 2,
      y: height / 2 - windowHeight / 2,
      width: windowWidth,
      height: windowHeight,
      title: 'HOW TO PLAY',
    });

    const centerX = windowWidth / 2;

    this.prevButton = this.add
      .text(centerX - navButtonOffsetPx, navY, '< Prev', { fontSize: '16px', color: '#8fd3ff' })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    this.prevButton.on('pointerdown', () => this.goToPage(this.pageIndex - 1));
    this.windowFrame.add(this.prevButton);

    this.pageIndicatorText = this.add
      .text(centerX, navY, '', { fontSize: '14px', color: '#7a8a99' })
      .setOrigin(0.5);
    this.windowFrame.add(this.pageIndicatorText);

    this.nextButton = this.add
      .text(centerX + navButtonOffsetPx, navY, 'Next >', { fontSize: '16px', color: '#8fd3ff' })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    this.nextButton.on('pointerdown', () => this.goToPage(this.pageIndex + 1));
    this.windowFrame.add(this.nextButton);

    const closeButton = this.add
      .text(centerX, closeY, 'Close', { fontSize: '18px', color: '#8fd3ff' })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    closeButton.on('pointerdown', () => this.closeAndReturn());
    this.windowFrame.add(closeButton);

    this.renderPage();

    this.input.keyboard?.on('keydown-ESC', () => this.closeAndReturn());
    this.input.keyboard?.on('keydown-LEFT', () => this.goToPage(this.pageIndex - 1));
    this.input.keyboard?.on('keydown-RIGHT', () => this.goToPage(this.pageIndex + 1));
  }

  private goToPage(index: number): void {
    if (index < 0 || index >= howToPlayPages.length || index === this.pageIndex) return;
    this.pageIndex = index;
    this.renderPage();
  }

  private renderPage(): void {
    const { windowWidth, titleY, bodyY, bodyWordWrapPadding, imagesY, imageMaxSizePx, imageSlotWidthPx, imageLabelOffsetPx } =
      howToPlayConfig;
    const { borderThicknessPx } = windowFrameConfig;
    const centerX = windowWidth / 2;
    const page = howToPlayPages[this.pageIndex];

    // Re-created (not just emptied) every page turn, and always re-parented
    // into windowFrame -- a fresh container starts outside any Container's
    // display list, so skipping this add() would render page 2+'s content
    // in raw screen space instead of the window's local coordinates
    // (confirmed via playtest: title/body/images landed top-left of the
    // whole canvas, not inside the popup, before this fix).
    this.pageContent?.destroy();
    this.pageContent = this.add.container(0, 0);
    this.windowFrame!.add(this.pageContent);

    this.pageContent.add(
      this.add.text(centerX, titleY, page.title, { fontSize: '22px', color: '#ffffff' }).setOrigin(0.5)
    );
    this.pageContent.add(
      this.add
        .text(centerX, bodyY, page.body, {
          fontSize: '14px',
          color: '#cccccc',
          wordWrap: { width: windowWidth - borderThicknessPx * 2 - bodyWordWrapPadding },
          align: 'center',
        })
        .setOrigin(0.5, 0)
    );

    const startX = centerX - ((page.images.length - 1) * imageSlotWidthPx) / 2;
    page.images.forEach((image, i) => {
      const x = startX + i * imageSlotWidthPx;
      const texture = this.textures.get(image.textureKey).getSourceImage();
      const targetSizePx = image.displaySizePx ?? imageMaxSizePx;
      const scale = Math.min(targetSizePx / texture.width, targetSizePx / texture.height);
      const icon = this.add.image(x, imagesY, image.textureKey).setScale(scale);
      const label = this.add
        .text(x, imagesY + texture.height * scale * 0.5 + imageLabelOffsetPx, image.label, {
          fontSize: '13px',
          color: '#8fd3ff',
        })
        .setOrigin(0.5, 0);
      this.pageContent!.add(icon);
      this.pageContent!.add(label);

      if (page.showSequenceArrows && i < page.images.length - 1) {
        const arrow = this.add
          .text(x + imageSlotWidthPx / 2, imagesY, '->', { fontSize: '20px', color: '#7a8a99' })
          .setOrigin(0.5);
        this.pageContent!.add(arrow);
      }
    });

    this.pageIndicatorText?.setText(`Page ${this.pageIndex + 1} of ${howToPlayPages.length}`);
    this.prevButton?.setAlpha(this.pageIndex === 0 ? howToPlayConfig.navDisabledAlpha : 1);
    this.nextButton?.setAlpha(this.pageIndex === howToPlayPages.length - 1 ? howToPlayConfig.navDisabledAlpha : 1);
  }

  private closeAndReturn(): void {
    this.scene.stop();
    this.scene.resume(this.sceneData.returnSceneKey);
  }
}
