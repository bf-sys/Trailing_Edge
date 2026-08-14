import Phaser from 'phaser';
import { getPlayerShip, getExplorationController } from '../systems/ExplorationController';
import { abilityConfig } from '../config/abilityConfig';
import { teleportRangeRingConfig } from '../config/teleportRangeRingConfig';

// Teleport's range ring (2026-08-14 ability rework) -- world-space, same
// family as ShipStatusArcs/DestinationMarker: a ring of radius
// abilityConfig.teleport.maxRange centered on the ship, plus a reticle at
// the live clamped aim point, visible only while
// ExplorationController.isTeleportArmed(). Polled every frame rather than
// event-driven since both the ship and the cursor move continuously while
// armed -- same reasoning ShipStatusArcs.update() already uses. Display-only:
// reads ExplorationController's read-only getters, never sets teleport state.
export class TeleportRangeRing {
  private readonly graphics: Phaser.GameObjects.Graphics;

  constructor(scene: Phaser.Scene) {
    this.graphics = scene.add.graphics().setDepth(teleportRangeRingConfig.depth);
  }

  update(): void {
    this.graphics.clear();

    const ship = getPlayerShip();
    const controller = getExplorationController();
    if (!ship || !controller.isTeleportArmed()) return;

    const maxRange = abilityConfig.teleport.maxRange ?? 0;
    this.graphics.lineStyle(teleportRangeRingConfig.ringThickness, teleportRangeRingConfig.ringColor, teleportRangeRingConfig.ringAlpha);
    this.graphics.strokeCircle(ship.image.x, ship.image.y, maxRange);

    const aimPoint = controller.getTeleportAimPoint();
    if (!aimPoint) return;

    this.graphics.lineStyle(teleportRangeRingConfig.reticleThickness, teleportRangeRingConfig.reticleColor, 1);
    this.graphics.strokeCircle(aimPoint.x, aimPoint.y, teleportRangeRingConfig.reticleRadius);
  }
}
