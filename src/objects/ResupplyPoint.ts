import Phaser from 'phaser';
import { getPlayerShip } from '../systems/ExplorationController';
import { survivalConfig } from '../config/survivalConfig';

export interface ResupplyPointConfig {
  x: number;
  y: number;
  textureKey: string;
  radius: number;
}

// The asteroids you visit to repair structure (AsteroidField). No longer
// covers energy — energy regenerates passively (GDD §5/§11.1); the Star
// variant is retired as a resupply object (see EntryWormhole/ExitWormhole,
// §11.14).
export class ResupplyPoint {
  private readonly zone: Phaser.Physics.Arcade.Image;
  private overlapping = false;

  constructor(scene: Phaser.Scene, config: ResupplyPointConfig) {
    this.zone = scene.physics.add.image(config.x, config.y, config.textureKey);
    this.zone.setDisplaySize(config.radius * 2, config.radius * 2);

    const body = this.zone.body as Phaser.Physics.Arcade.Body;
    body.setCircle(config.radius);

    const ship = getPlayerShip();
    if (ship) {
      // Arcade overlap callback, not a manual per-frame distance check
      // (GDD §11.6's explicit hard rule).
      scene.physics.add.overlap(this.zone, ship.image, () => {
        this.overlapping = true;
      });
    }
  }

  update(_time: number, delta: number): void {
    if (this.overlapping) {
      const ship = getPlayerShip();
      ship?.survival.repairStructure(survivalConfig.structureRepairPerSecond * (delta / 1000));
    }
    this.overlapping = false; // re-armed by next frame's overlap callback
  }
}
