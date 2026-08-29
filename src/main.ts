import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
import { TitleScene } from './scenes/TitleScene';
import { GameScene } from './scenes/GameScene';
import { WinScene } from './scenes/WinScene';
import { PauseScene } from './scenes/PauseScene';
import { AbilityUnlockScene } from './scenes/AbilityUnlockScene';
import { HowToPlayScene } from './scenes/HowToPlayScene';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game',
  width: 1280,
  height: 720,
  backgroundColor: '#050505',
  render: {
    roundPixels: true,
  },
  physics: {
    default: 'arcade',
    arcade: {
      debug: false,
    },
  },
  scene: [BootScene, TitleScene, GameScene, WinScene, PauseScene, AbilityUnlockScene, HowToPlayScene],
};

const game = new Phaser.Game(config);

// Dev-only debug handle (same window-exposure convention as
// devTuning.ts's window.tuning) -- lets a headless-browser smoke test (or a
// human) inspect/drive scene state from the console without adding
// production code paths.
if (import.meta.env.DEV) {
  (window as unknown as { game: Phaser.Game }).game = game;
}

// Reported red-screen bug (2026-08-29) persisted through exiting to the
// title screen and starting a brand-new level -- ruling out any per-Scene
// GameObject as the cause, since scene.start()/stop() destroys those. What
// *doesn't* get recreated on a scene transition is the WebGLRenderingContext
// itself (one Phaser.Game-lifetime instance, not per-Scene), making a GPU
// context loss the leading suspect. Phaser's WebGLRenderer already has its
// own webglcontextlost/restored handling, but that only re-uploads plain
// textures -- it's not guaranteed to correctly reconstruct this game's more
// exotic rendering (GeometryMask-based effects in ShipDamageFlash/
// ScanActivationVfx, several blend-mode-switching particle emitters), which
// would explain "recovers enough to keep running with zero console errors,
// but the pixel output stays wrong." Rather than trying to hand-patch
// Phaser's internal recovery, force a full page reload on loss -- guarantees
// a clean context every time instead of trusting a partial auto-restore.
// Also doubles as a diagnostic: if this bug recurs and the page does NOT
// auto-reload, that rules this theory out.
game.events.once(Phaser.Core.Events.READY, () => {
  game.canvas.addEventListener('webglcontextlost', (event) => {
    event.preventDefault();
    console.error('[webgl] context lost -- reloading to recover');
    window.location.reload();
  });
});
