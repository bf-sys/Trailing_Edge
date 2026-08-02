import Phaser from 'phaser';
import { getPlayerShip } from '../systems/ExplorationController';
import { setCircleFromWorldRadius } from './arcadeBodyHelpers';
import { LevelObjectiveTracker } from './LevelObjectiveTracker';

export interface ProbeObjectConfig {
  x: number;
  y: number;
  textureKey: string;
  radius: number;
}

// The probe you're recovering this level (GDD §11.12). Arcade-overlap
// pickup, one-time. No AbilityComponent/ProgressionManager exist yet
// (later Phase 1 steps), so there's no progression hook to fire on pickup
// yet beyond the tracker flag and a visual "collected" state.
//
// GDD §9 open question: on levels bigger than the viewport, this can be
// off-screen with no way to tell which direction it's in — needs a minimap
// or an off-screen directional indicator, not decided yet.
export class ProbeObject {
  private readonly zone: Phaser.Physics.Arcade.Image;
  private collected = false;

  constructor(scene: Phaser.Scene, config: ProbeObjectConfig, tracker: LevelObjectiveTracker) {
    this.zone = scene.physics.add.image(config.x, config.y, config.textureKey);
    this.zone.setDisplaySize(config.radius * 2, config.radius * 2);

    const body = this.zone.body as Phaser.Physics.Arcade.Body;
    setCircleFromWorldRadius(body, this.zone, config.radius);

    const ship = getPlayerShip();
    if (ship) {
      scene.physics.add.overlap(this.zone, ship.image, () => this.onPlayerArrival(tracker));
    }
  }

  private onPlayerArrival(tracker: LevelObjectiveTracker): void {
    if (this.collected) return;
    this.collected = true;

    tracker.onProbeFound();
    this.zone.setVisible(false);
    (this.zone.body as Phaser.Physics.Arcade.Body).enable = false;
  }
}
