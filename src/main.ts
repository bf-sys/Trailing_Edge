import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
import { TitleScene } from './scenes/TitleScene';
import { GameScene } from './scenes/GameScene';
import { WinScene } from './scenes/WinScene';
import { PauseScene } from './scenes/PauseScene';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game',
  width: 1280,
  height: 720,
  backgroundColor: '#050505',
  physics: {
    default: 'arcade',
    arcade: {
      debug: false,
    },
  },
  scene: [BootScene, TitleScene, GameScene, WinScene, PauseScene],
};

const game = new Phaser.Game(config);

// Dev-only debug handle (same window-exposure convention as
// devTuning.ts's window.tuning) -- lets a headless-browser smoke test (or a
// human) inspect/drive scene state from the console without adding
// production code paths.
if (import.meta.env.DEV) {
  (window as unknown as { game: Phaser.Game }).game = game;
}
