import Phaser from 'phaser';
import { PuzzleElementBase } from '../PuzzleElementBase';
import { getPlayerShip } from '../../systems/ExplorationController';
import { puzzleConfig } from '../../config/puzzleConfig';

const SEQUENCE_SPOT_TEXTURE_KEY = 'puzzle_sequence_spot';

// Procedurally generated once -- a filled square, visually distinct from
// ScanInteractElement's ring so the two read as different element types at
// a glance even before real art exists.
function createSequenceSpotTexture(scene: Phaser.Scene, radius: number, color: number): void {
  if (scene.textures.exists(SEQUENCE_SPOT_TEXTURE_KEY)) return;

  const size = radius * 2;
  const graphics = scene.make.graphics({}, false);
  graphics.fillStyle(color, 1);
  graphics.fillRect(0, 0, size, size);
  graphics.generateTexture(SEQUENCE_SPOT_TEXTURE_KEY, size, size);
  graphics.destroy();
}

export interface SequenceSpotConfig {
  points: { x: number; y: number }[];
}

interface Spot {
  x: number;
  y: number;
  inside: boolean;
  marker: Phaser.GameObjects.Image;
}

// Signal Array (GDD §6/§9/§11.3, renamed from "Relay Beacon" -- see
// RelayBeaconObject) -- move to a fixed set of spots in a specific order.
// Uses plain per-frame distance checks against the ship rather than Arcade
// overlap bodies: with N spots and an out-of-order reset rule, tracking
// enter/exit transitions manually in update() is simpler than wiring N
// separate overlap callbacks plus a manual re-arm scheme for each.
export class SequenceSpotElement extends PuzzleElementBase {
  private readonly spots: Spot[];
  private nextIndex = 0;

  constructor(scene: Phaser.Scene, config: SequenceSpotConfig) {
    super();

    createSequenceSpotTexture(scene, puzzleConfig.sequenceSpotRadius, puzzleConfig.sequenceSpotColor);
    this.spots = config.points.map((point) => ({
      x: point.x,
      y: point.y,
      inside: false,
      marker: scene.add
        .image(point.x, point.y, SEQUENCE_SPOT_TEXTURE_KEY)
        .setDisplaySize(puzzleConfig.sequenceSpotRadius * 2, puzzleConfig.sequenceSpotRadius * 2),
    }));
  }

  update(_time: number, _delta: number): void {
    if (this.solved) return;
    const ship = getPlayerShip();
    if (!ship) return;

    this.spots.forEach((spot, index) => {
      const distance = Phaser.Math.Distance.Between(ship.image.x, ship.image.y, spot.x, spot.y);
      const isInside = distance <= puzzleConfig.sequenceSpotRadius;
      if (isInside && !spot.inside) this.onSpotEntered(index);
      spot.inside = isInside;
    });
  }

  private onSpotEntered(index: number): void {
    if (index === this.nextIndex) {
      this.spots[index].marker.setTint(puzzleConfig.sequenceSpotSolvedColor);
      this.nextIndex++;
      if (this.nextIndex === this.spots.length) this.markSolved();
      return;
    }

    // Wrong spot for the current step -- reset the whole sequence rather
    // than partially crediting progress.
    this.nextIndex = 0;
    this.spots.forEach((spot) => spot.marker.clearTint());
  }
}
