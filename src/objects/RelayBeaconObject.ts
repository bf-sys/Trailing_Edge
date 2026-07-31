import Phaser from 'phaser';
import { getPlayerShip } from '../systems/ExplorationController';
import { LevelObjectiveTracker, LEVEL_OBJECTIVE_EVENTS } from './LevelObjectiveTracker';

export interface RelayBeaconConfig {
  x: number;
  y: number;
  idleTextureKey: string;
  reachedOverlayTextureKey: string;
  radius: number;
}

// The mandatory waypoint reached after the probe, before return — not a
// puzzle, plain navigation (GDD §11.13). Distinct from the Signal Array
// puzzle element (§6/§9/§11.3's naming split). LevelObjectiveTracker itself
// no-ops onBeaconReached() if the probe hasn't been found yet, so this class
// doesn't need to duplicate that check.
//
// GDD §9 open question: on levels bigger than the viewport, this can be
// off-screen with no way to tell which direction it's in — needs a minimap
// or an off-screen directional indicator, not decided yet.
export class RelayBeaconObject {
  private readonly zone: Phaser.Physics.Arcade.Image;
  private readonly reachedOverlay: Phaser.GameObjects.Image;

  constructor(scene: Phaser.Scene, config: RelayBeaconConfig, tracker: LevelObjectiveTracker) {
    this.zone = scene.physics.add.image(config.x, config.y, config.idleTextureKey);
    this.zone.setDisplaySize(config.radius * 2, config.radius * 2);

    const body = this.zone.body as Phaser.Physics.Arcade.Body;
    body.setCircle(config.radius);

    this.reachedOverlay = scene.add.image(config.x, config.y, config.reachedOverlayTextureKey);
    this.reachedOverlay.setDisplaySize(config.radius * 2, config.radius * 2);
    this.reachedOverlay.setVisible(false);

    tracker.once(LEVEL_OBJECTIVE_EVENTS.BeaconReached, () => this.reachedOverlay.setVisible(true));

    const ship = getPlayerShip();
    if (ship) {
      scene.physics.add.overlap(this.zone, ship.image, () => tracker.onBeaconReached());
    }
  }
}
