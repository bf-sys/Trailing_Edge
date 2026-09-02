import Phaser from 'phaser';
import { getPlayerShip } from '../systems/ExplorationController';
import { shipStatusArcConfig } from '../config/shipStatusArcConfig';
import { scanConfig } from '../config/scanConfig';
import type { HazardZoneElement } from './HazardZoneElement';

// Scan's hazard-ID overlay (2026-08-14 ability rework) -- world-space,
// display-only, same event/poll pattern as ShipStatusArcs: nothing here
// reads/writes gameplay state, it only queries AbilityComponent.isActive()
// and each HazardZoneElement's read-only getters. One Text label per hazard
// is created once and reused every frame (position/text/visibility updated
// in place) rather than destroyed/recreated, since GameScene never adds or
// removes hazards mid-level.
export class HazardScanOverlay {
  private readonly hazards: HazardZoneElement[];
  private readonly graphics: Phaser.GameObjects.Graphics;
  private readonly labels: Phaser.GameObjects.Text[];

  constructor(scene: Phaser.Scene, hazards: HazardZoneElement[]) {
    this.hazards = hazards;
    this.graphics = scene.add.graphics().setDepth(scanConfig.depth);
    this.labels = hazards.map((hazard) =>
      scene.add
        .text(0, 0, hazard.getDisplayName(), { fontSize: `${scanConfig.labelFontSize}px`, color: scanConfig.labelColorCss })
        .setOrigin(0.5, 1)
        .setDepth(scanConfig.depth)
        .setVisible(false),
    );
  }

  update(nowMs: number): void {
    this.graphics.clear();

    const ship = getPlayerShip();
    const scanActive = ship?.ability.isActive('scan', nowMs) ?? false;

    this.hazards.forEach((hazard, index) => {
      const label = this.labels[index];
      const cost = hazard.getResourceCost();
      // Zero-cost hazards (Debris Field) have nothing for scan to disclose --
      // they're already visible/solid and cost neither resource, so an
      // outline+label just reads as clutter (2026-09-02 playtest feedback).
      if (!scanActive || !ship || (cost.energy === 0 && cost.structure === 0)) {
        label.setVisible(false);
        return;
      }

      const pos = hazard.getPosition();
      const distance = Phaser.Math.Distance.Between(ship.image.x, ship.image.y, pos.x, pos.y);
      if (distance > scanConfig.scanRadius) {
        label.setVisible(false);
        return;
      }

      const outlineRadius = this.outlineRadiusFor(hazard) + scanConfig.outlineMargin;
      this.graphics.lineStyle(scanConfig.outlineThickness, this.colorFor(hazard), 1);
      this.graphics.strokeCircle(pos.x, pos.y, outlineRadius);

      label.setPosition(pos.x, pos.y - outlineRadius - scanConfig.labelOffsetY).setVisible(true);
    });
  }

  private colorFor(hazard: HazardZoneElement): number {
    const cost = hazard.getResourceCost();
    if (cost.structure > 0) return shipStatusArcConfig.structureColor;
    if (cost.energy > 0) return shipStatusArcConfig.energyColor;
    return scanConfig.neutralColor;
  }

  private outlineRadiusFor(hazard: HazardZoneElement): number {
    const shape = hazard.getShape();
    return shape.kind === 'circle' ? shape.radius : Math.max(shape.width, shape.height) / 2;
  }
}
