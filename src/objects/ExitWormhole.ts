import Phaser from 'phaser';
import { getPlayerShip } from '../systems/ExplorationController';
import { wormholeConfig } from '../config/wormholeConfig';
import { LevelObjectiveTracker, LEVEL_OBJECTIVE_EVENTS } from './LevelObjectiveTracker';

export interface ExitWormholeConfig {
  x: number;
  y: number;
  textureKey: string;
  radius: number;
}

// The level's required return destination (GDD §11.14, split from the old
// HomeMarker) — a distinct location from EntryWormhole. Starts tinted
// "inactive" (closed) and opens once the Relay Beacon is reached.
// onPlayerArrival() still checks LevelObjectiveTracker.canReturn() before
// firing level completion, preserving the contract's documented invariant
// at the call site even though, by construction, `active` already implies
// canReturn() is true.
export class ExitWormhole {
  private readonly zone: Phaser.Physics.Arcade.Image;
  private active = false;
  private completed = false;

  constructor(
    scene: Phaser.Scene,
    config: ExitWormholeConfig,
    tracker: LevelObjectiveTracker,
    onLevelComplete: () => void,
  ) {
    this.zone = scene.physics.add.image(config.x, config.y, config.textureKey);
    this.zone.setDisplaySize(config.radius * 2, config.radius * 2);
    this.zone.setTint(wormholeConfig.inactiveTint);

    const body = this.zone.body as Phaser.Physics.Arcade.Body;
    body.setCircle(config.radius);

    tracker.once(LEVEL_OBJECTIVE_EVENTS.BeaconReached, () => {
      this.active = true;
      this.zone.setTint(wormholeConfig.activeTint);
    });

    const ship = getPlayerShip();
    if (ship) {
      scene.physics.add.overlap(this.zone, ship.image, () => {
        if (!this.active || this.completed || !tracker.canReturn()) return;
        this.completed = true;
        onLevelComplete();
      });
    }
  }
}
