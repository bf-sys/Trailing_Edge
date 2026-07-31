import Phaser from 'phaser';
import { getPlayerShip } from '../systems/ExplorationController';
import { LevelObjectiveTracker } from './LevelObjectiveTracker';

export interface HomeMarkerConfig {
  x: number;
  y: number;
  textureKey: string;
  radius: number;
}

// Launch position and required return destination (GDD §11.14). Currently
// reuses the Star asset as a placeholder (eventually a distinct object,
// e.g. a wormhole). onLevelComplete is a deliberately minimal completion
// path — real levelOrder resolution + SaveManager.saveProgress() are
// Phase 2a scope (§11.8/§11.9), not built yet; for this single test level,
// completion just transitions straight to WinScene.
//
// GDD §9 open question: on levels bigger than the viewport, this (including
// the ship's launch position) can be off-screen with no way to tell which
// direction it's in — needs a minimap or an off-screen directional
// indicator, not decided yet.
export class HomeMarker {
  private readonly zone: Phaser.Physics.Arcade.Image;
  private completed = false;

  constructor(
    scene: Phaser.Scene,
    config: HomeMarkerConfig,
    tracker: LevelObjectiveTracker,
    onLevelComplete: () => void,
  ) {
    this.zone = scene.physics.add.image(config.x, config.y, config.textureKey);
    this.zone.setDisplaySize(config.radius * 2, config.radius * 2);

    const body = this.zone.body as Phaser.Physics.Arcade.Body;
    body.setCircle(config.radius);

    const ship = getPlayerShip();
    if (ship) {
      scene.physics.add.overlap(this.zone, ship.image, () => {
        if (this.completed || !tracker.canReturn()) return; // arriving early is a no-op
        this.completed = true;
        onLevelComplete();
      });
    }
  }
}
