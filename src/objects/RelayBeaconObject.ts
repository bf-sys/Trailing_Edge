import Phaser from 'phaser';
import { getPlayerShip } from '../systems/ExplorationController';
import { waypointTintConfig } from '../config/waypointTintConfig';
import { setCircleFromWorldRadius } from './arcadeBodyHelpers';
import { LevelObjectiveTracker, LEVEL_OBJECTIVE_EVENTS } from './LevelObjectiveTracker';

export interface RelayBeaconConfig {
  x: number;
  y: number;
  textureKey: string;
  radius: number; // physics overlap circle only -- see displayWidth/Height for the visual size
  displayWidth: number;
  displayHeight: number;
}

// The mandatory waypoint you reach after the probe, before you're allowed to
// return. Not a puzzle — plain navigation (GDD §11.13). Single texture +
// tint (2026-08-01 revision, matches EntryWormhole/ExitWormhole's
// convention): starts tinted "inactive," restored to "active" once reached,
// rather than a separate idle/reached-overlay file pair.
// LevelObjectiveTracker itself no-ops onBeaconReached() if the probe hasn't
// been found yet, so this class doesn't need to duplicate that check.
//
// displayWidth/displayHeight are authored separately from the physics
// radius (2026-08-01 fix) so the visual can match relay_beacon.png's actual
// (non-square) aspect ratio -- forcing a square displaySize squished the
// art. The physics overlap stays a simple circle regardless; this is an
// arrival trigger, not a shape-accurate collider.
export class RelayBeaconObject {
  private readonly zone: Phaser.Physics.Arcade.Image;

  constructor(scene: Phaser.Scene, config: RelayBeaconConfig, tracker: LevelObjectiveTracker) {
    this.zone = scene.physics.add.image(config.x, config.y, config.textureKey);
    this.zone.setDisplaySize(config.displayWidth, config.displayHeight);
    this.zone.setTint(waypointTintConfig.inactiveTint);

    const body = this.zone.body as Phaser.Physics.Arcade.Body;
    setCircleFromWorldRadius(body, this.zone, config.radius);

    tracker.once(LEVEL_OBJECTIVE_EVENTS.BeaconReached, () => this.zone.setTint(waypointTintConfig.activeTint));

    const ship = getPlayerShip();
    if (ship) {
      scene.physics.add.overlap(this.zone, ship.image, () => tracker.onBeaconReached());
    }
  }
}
