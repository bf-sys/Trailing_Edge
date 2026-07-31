import Phaser from 'phaser';
import { SystemRegistry, type GameSystem } from './SystemRegistry';
import { shipConfig } from '../config/shipConfig';
import { PlayerShip } from '../objects/PlayerShip';

interface Target {
  x: number;
  y: number;
}

function moveToward(current: number, desired: number, maxDelta: number): number {
  const delta = desired - current;
  if (Math.abs(delta) <= maxDelta) return desired;
  return current + Math.sign(delta) * maxDelta;
}

let currentPlayerShip: PlayerShip | undefined;

// Other systems that need the ship (hazards, resupply points, later the
// objective objects) look it up here rather than reaching into
// ExplorationController's internals.
export function getPlayerShip(): PlayerShip | undefined {
  return currentPlayerShip;
}

// Click-to-move, non-Newtonian ship movement (GDD §4). Owns the PlayerShip
// entity and its input binding; no other system should move the ship.
export class ExplorationController implements GameSystem {
  readonly key = 'exploration';

  private playerShip?: PlayerShip;
  private target: Target | null = null;

  init(scene: Phaser.Scene): void {
    const { width, height } = scene.scale;

    // ExplorationController is a SystemRegistry singleton that outlives any
    // one GameScene attempt (it's re-init'd on every hard-fail restart) — a
    // stale target from the previous attempt must not carry over.
    this.target = null;

    this.playerShip = new PlayerShip(scene, width / 2, height / 2);
    currentPlayerShip = this.playerShip;

    const setTargetFromPointer = (pointer: Phaser.Input.Pointer) => {
      this.target = { x: pointer.worldX, y: pointer.worldY };
    };

    scene.input.on('pointerdown', setTargetFromPointer);
    // Click-and-drag steering (Diablo-style click-to-move already supports
    // this) — keep re-targeting every frame the button is held, not just
    // on the initial click.
    scene.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (pointer.isDown) setTargetFromPointer(pointer);
    });
  }

  update(_time: number, delta: number): void {
    if (!this.playerShip) return;

    this.playerShip.survival.regenEnergy(delta);

    const ship = this.playerShip.image;
    const body = ship.body as Phaser.Physics.Arcade.Body;
    const dt = delta / 1000;

    if (!this.target) {
      this.decelerateToStop(body, dt);
      return;
    }

    const dx = this.target.x - ship.x;
    const dy = this.target.y - ship.y;
    const distance = Math.hypot(dx, dy);

    if (distance <= shipConfig.stopRadius) {
      body.setVelocity(0, 0);
      this.target = null;
      return;
    }

    const desiredSpeed =
      distance < shipConfig.arrivalRadius
        ? shipConfig.maxSpeed * (distance / shipConfig.arrivalRadius)
        : shipConfig.maxSpeed;

    const dirX = dx / distance;
    const dirY = dy / distance;
    const desiredVX = dirX * desiredSpeed;
    const desiredVY = dirY * desiredSpeed;

    const currentSpeed = Math.hypot(body.velocity.x, body.velocity.y);
    const rampRate = desiredSpeed > currentSpeed ? shipConfig.acceleration : shipConfig.deceleration;
    const maxDeltaV = rampRate * dt;

    const vx = moveToward(body.velocity.x, desiredVX, maxDeltaV);
    const vy = moveToward(body.velocity.y, desiredVY, maxDeltaV);
    body.setVelocity(vx, vy);

    if (Math.hypot(vx, vy) > 1) {
      ship.rotation = Math.atan2(vy, vx) + shipConfig.spriteFacingOffsetRadians;
    }
  }

  private decelerateToStop(body: Phaser.Physics.Arcade.Body, dt: number): void {
    const currentSpeed = Math.hypot(body.velocity.x, body.velocity.y);
    if (currentSpeed === 0) return;

    const maxDeltaV = shipConfig.deceleration * dt;
    if (currentSpeed <= maxDeltaV) {
      body.setVelocity(0, 0);
      return;
    }

    const scale = (currentSpeed - maxDeltaV) / currentSpeed;
    body.setVelocity(body.velocity.x * scale, body.velocity.y * scale);
  }
}

SystemRegistry.register(new ExplorationController());
