import Phaser from 'phaser';
import { PuzzleElementBase } from '../PuzzleElementBase';
import { getPlayerShip } from '../../systems/ExplorationController';
import { puzzleConfig } from '../../config/puzzleConfig';
import { abilityConfig } from '../../config/abilityConfig';

const CARGO_POD_TEXTURE_KEY = 'puzzle_cargo_pod';
const PUSH_PULL_TARGET_TEXTURE_KEY = 'puzzle_push_pull_target';

function createCargoPodTexture(scene: Phaser.Scene, radius: number, color: number): void {
  if (scene.textures.exists(CARGO_POD_TEXTURE_KEY)) return;

  const size = radius * 2;
  const graphics = scene.make.graphics({}, false);
  graphics.fillStyle(color, 1);
  graphics.fillRect(0, 0, size, size);
  graphics.generateTexture(CARGO_POD_TEXTURE_KEY, size, size);
  graphics.destroy();
}

function createTargetMarkerTexture(scene: Phaser.Scene, radius: number, color: number): void {
  if (scene.textures.exists(PUSH_PULL_TARGET_TEXTURE_KEY)) return;

  const diameter = radius * 2;
  const graphics = scene.make.graphics({}, false);
  graphics.lineStyle(3, color, 1);
  graphics.strokeCircle(radius, radius, radius - 2);
  graphics.generateTexture(PUSH_PULL_TARGET_TEXTURE_KEY, diameter, diameter);
  graphics.destroy();
}

export interface PushPullObjectConfig {
  x: number;
  y: number;
  targetX: number;
  targetY: number;
}

// Cargo Pod / Wreckage (GDD §6/§9/§11.3) -- move an object to a target spot
// by holding the tractor-beam hotkey while nearby. Per GDD's confirmed
// Arcade-physics tradeoff, this is direct per-frame position movement
// toward the ship (not a real force/impulse) -- re-deriving a fresh tween
// every frame would be jittery, so a plain distance/direction step each
// update() achieves the same "tweening toward the player" intent GDD
// describes. Gated behind `AbilityComponent.isUnlocked('tractorBeam')` per
// §11.3's explicit hard requirement -- the one ability effect Phase 2a
// actually wires (see abilityConfig.ts's comment). Highest-variance element
// of the five per the build plan: if this doesn't feel clean, the agreed
// fallback is to de-emphasize/cut it, not revisit Arcade physics.
export class PushPullObjectElement extends PuzzleElementBase {
  readonly image: Phaser.GameObjects.Image;
  private readonly targetMarker: Phaser.GameObjects.Image;
  private readonly targetX: number;
  private readonly targetY: number;
  private readonly tractorKey?: Phaser.Input.Keyboard.Key;

  constructor(scene: Phaser.Scene, config: PushPullObjectConfig) {
    super();

    this.targetX = config.targetX;
    this.targetY = config.targetY;

    createTargetMarkerTexture(scene, puzzleConfig.pushPullSolveRadius, puzzleConfig.pushPullTargetColor);
    this.targetMarker = scene.add
      .image(config.targetX, config.targetY, PUSH_PULL_TARGET_TEXTURE_KEY)
      .setDisplaySize(puzzleConfig.pushPullSolveRadius * 2, puzzleConfig.pushPullSolveRadius * 2);

    createCargoPodTexture(scene, puzzleConfig.pushPullSolveRadius, puzzleConfig.pushPullPodColor);
    this.image = scene.add
      .image(config.x, config.y, CARGO_POD_TEXTURE_KEY)
      .setDisplaySize(puzzleConfig.pushPullSolveRadius * 2, puzzleConfig.pushPullSolveRadius * 2);

    this.tractorKey = scene.input.keyboard?.addKey(abilityConfig.tractorBeam.hotkey);
  }

  update(_time: number, delta: number): void {
    if (this.solved) return;
    const ship = getPlayerShip();
    if (!ship) return;

    const distanceToShip = Phaser.Math.Distance.Between(this.image.x, this.image.y, ship.image.x, ship.image.y);
    const held = this.tractorKey?.isDown ?? false;
    const allowed = held && ship.ability.isUnlocked('tractorBeam') && distanceToShip <= puzzleConfig.pushPullInteractRadius;

    if (allowed) {
      const dx = ship.image.x - this.image.x;
      const dy = ship.image.y - this.image.y;
      const distance = Math.hypot(dx, dy);
      if (distance > 1) {
        const step = Math.min(distance, puzzleConfig.pushPullSpeed * (delta / 1000));
        this.image.x += (dx / distance) * step;
        this.image.y += (dy / distance) * step;
      }
    }

    const distanceToTarget = Phaser.Math.Distance.Between(this.image.x, this.image.y, this.targetX, this.targetY);
    if (distanceToTarget <= puzzleConfig.pushPullSolveRadius) this.onDelivered();
  }

  private onDelivered(): void {
    this.markSolved();
    this.image.setTint(puzzleConfig.pushPullSolvedColor);
    this.targetMarker.setTint(puzzleConfig.pushPullSolvedColor);
  }
}
