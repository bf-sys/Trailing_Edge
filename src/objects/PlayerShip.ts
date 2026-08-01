import Phaser from 'phaser';
import { shipConfig } from '../config/shipConfig';
import { ShipSurvivalComponent } from './ShipSurvivalComponent';

// The composition root GDD §11.1 means by "the player Ship object" —
// movement (ExplorationController) and survival (ShipSurvivalComponent) are
// two independent systems composed onto one entity.
export class PlayerShip {
  readonly image: Phaser.Physics.Arcade.Image;
  readonly survival: ShipSurvivalComponent;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    this.image = scene.physics.add.image(x, y, 'ship_base').setScale(0.5);
    this.image.setDamping(false);
    this.image.setMaxVelocity(shipConfig.maxSpeed);
    // World objects (hazards, resupply, objectives) are created after the
    // ship in GameScene.create(); without an explicit depth, later-created
    // sprites at the same position (e.g. EntryWormhole, spawned right where
    // the ship starts) would render on top and hide it.
    this.image.setDepth(10);
    this.survival = new ShipSurvivalComponent();
  }
}
