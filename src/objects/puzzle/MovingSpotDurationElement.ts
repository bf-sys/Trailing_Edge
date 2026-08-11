import Phaser from 'phaser';
import { PuzzleElementBase } from '../PuzzleElementBase';
import { getPlayerShip } from '../../systems/ExplorationController';
import { puzzleConfig } from '../../config/puzzleConfig';

const MOVING_SPOT_TEXTURE_KEY = 'puzzle_moving_spot';

function createMovingSpotTexture(scene: Phaser.Scene, radius: number, color: number): void {
  if (scene.textures.exists(MOVING_SPOT_TEXTURE_KEY)) return;

  const diameter = radius * 2;
  const graphics = scene.make.graphics({}, false);
  graphics.fillStyle(color, 1);
  graphics.fillCircle(radius, radius, radius);
  graphics.generateTexture(MOVING_SPOT_TEXTURE_KEY, diameter, diameter);
  graphics.destroy();
}

export interface MovingSpotDurationConfig {
  path: { x: number; y: number }[]; // at least 2 waypoints, cycled with wraparound
}

// Comet (tracking) (GDD §6/§9/§11.3) -- an execution/timing puzzle element
// (deliberate "minority seasoning" per §6, not the taxonomy's core): stay
// inside a moving spot continuously for a duration to solve; leaving resets
// the held-time accumulator. The spot patrols its authored path via
// scene.tweens.add (GDD's confirmed tween-based approach, not Arcade
// velocity) -- a 2-point path naturally ping-pongs since wraparound
// alternates between the same two waypoints; a longer path patrols as a
// one-way loop.
export class MovingSpotDurationElement extends PuzzleElementBase {
  private readonly marker: Phaser.GameObjects.Image;
  private heldMs = 0;

  constructor(scene: Phaser.Scene, config: MovingSpotDurationConfig) {
    super();

    createMovingSpotTexture(scene, puzzleConfig.movingSpotRadius, puzzleConfig.movingSpotColor);
    const start = config.path[0];
    this.marker = scene.add
      .image(start.x, start.y, MOVING_SPOT_TEXTURE_KEY)
      .setDisplaySize(puzzleConfig.movingSpotRadius * 2, puzzleConfig.movingSpotRadius * 2);

    this.startPatrol(scene, config.path);
  }

  private startPatrol(scene: Phaser.Scene, path: { x: number; y: number }[]): void {
    let index = 0;

    const tweenToNext = () => {
      if (this.solved) return;
      index = (index + 1) % path.length;
      const next = path[index];
      const distance = Phaser.Math.Distance.Between(this.marker.x, this.marker.y, next.x, next.y);
      const duration = (distance / puzzleConfig.movingSpotSpeed) * 1000;

      scene.tweens.add({
        targets: this.marker,
        x: next.x,
        y: next.y,
        duration,
        onComplete: tweenToNext,
      });
    };

    tweenToNext();
  }

  update(_time: number, delta: number): void {
    if (this.solved) return;
    const ship = getPlayerShip();
    if (!ship) return;

    const distance = Phaser.Math.Distance.Between(ship.image.x, ship.image.y, this.marker.x, this.marker.y);
    if (distance <= puzzleConfig.movingSpotRadius) {
      this.heldMs += delta;
      if (this.heldMs >= puzzleConfig.movingSpotHoldDurationMs) this.onHeld();
    } else {
      this.heldMs = 0;
    }
  }

  private onHeld(): void {
    this.markSolved();
    this.marker.setTint(puzzleConfig.movingSpotSolvedColor);
  }
}
