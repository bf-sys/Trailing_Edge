import Phaser from 'phaser';
import { loadMasterVolume, saveMasterVolume } from './SaveManager';

const TRACK_WIDTH = 140;
const TRACK_HEIGHT = 4;
const HANDLE_RADIUS = 8;
const TRACK_COLOR = 0x2a3540;
const FILL_COLOR = 0x8fd3ff;

// Screen-pinned master-volume control, reusable across TitleScene/PauseScene
// (docs/TODO.md's "Volume control" item). Mutates scene.sound.volume
// directly rather than any per-sound value in audioConfig.ts -- Phaser's
// SoundManager is one instance shared game-wide (same fact AudioManager's
// own comments document), so this multiplies every sound's own volume
// regardless of which Scene the slider lives in. Persisted via SaveManager
// so it survives a reload; BootScene applies the saved value on boot,
// before TitleScene's startMusicOnce() plays anything.
//
// Plain scene-child GameObjects at absolute coordinates, not a Container --
// keeps drag-event coordinates in plain world space and matches every other
// Scene in this codebase (none use Container-based UI; WindowFrame is the
// one exception and isn't reused here). The draggable handle owns its own
// 'drag' listener (cleaned up automatically when the GameObject is
// destroyed on Scene shutdown) rather than the slider tracking global
// scene.input pointermove/pointerup -- avoids leaking listeners across
// TitleScene.create() re-running on every return visit.
export class VolumeSlider {
  private readonly scene: Phaser.Scene;
  private readonly originX: number;
  private readonly originY: number;
  private readonly fill: Phaser.GameObjects.Graphics;
  private readonly handle: Phaser.GameObjects.Arc;
  private readonly valueText: Phaser.GameObjects.Text;
  private volume: number;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    this.scene = scene;
    this.originX = x;
    this.originY = y;
    this.volume = loadMasterVolume() ?? scene.sound.volume;

    scene.add.text(x, y - 16, 'Volume', { fontSize: '13px', color: '#7a8a99' }).setOrigin(0, 0.5);

    scene.add
      .graphics()
      .fillStyle(TRACK_COLOR, 1)
      .fillRoundedRect(x, y - TRACK_HEIGHT / 2, TRACK_WIDTH, TRACK_HEIGHT, 2);

    this.fill = scene.add.graphics();

    this.valueText = scene.add
      .text(x + TRACK_WIDTH + 14, y, '', { fontSize: '12px', color: '#8fd3ff' })
      .setOrigin(0, 0.5);

    // Click-to-jump anywhere on the track. Added before the handle so the
    // handle (added after, on top of the display list) wins hit-test
    // priority when the two overlap -- dragging the handle directly always
    // takes precedence over a track click at the same point.
    const trackZone = scene.add
      .zone(x + TRACK_WIDTH / 2, y, TRACK_WIDTH + HANDLE_RADIUS * 2, HANDLE_RADIUS * 4)
      .setInteractive({ useHandCursor: true });
    trackZone.on('pointerdown', (pointer: Phaser.Input.Pointer) => this.applyFromWorldX(pointer.x));

    this.handle = scene.add.circle(x, y, HANDLE_RADIUS, FILL_COLOR).setInteractive({ draggable: true, useHandCursor: true });
    scene.input.setDraggable(this.handle);
    this.handle.on('drag', (_pointer: Phaser.Input.Pointer, dragX: number) => this.applyFromWorldX(dragX));

    this.redraw();
  }

  private applyFromWorldX(worldX: number): void {
    const ratio = (worldX - this.originX) / TRACK_WIDTH;
    this.volume = Phaser.Math.Clamp(ratio, 0, 1);
    this.scene.sound.volume = this.volume;
    saveMasterVolume(this.volume);
    this.redraw();
  }

  private redraw(): void {
    const filledWidth = this.volume * TRACK_WIDTH;
    this.handle.setPosition(this.originX + filledWidth, this.originY);
    this.fill.clear().fillStyle(FILL_COLOR, 1).fillRoundedRect(this.originX, this.originY - TRACK_HEIGHT / 2, filledWidth, TRACK_HEIGHT, 2);
    this.valueText.setText(`${Math.round(this.volume * 100)}%`);
  }
}
