import Phaser from 'phaser';
import { getPlayerShip } from '../systems/ExplorationController';
import { SHIP_SURVIVAL_EVENTS, type ResourceSnapshot } from './ShipSurvivalComponent';
import { shipStatusArcConfig } from '../config/shipStatusArcConfig';

// World-space resource readout that follows the ship — a style experiment
// alongside HudOverlay's screen-pinned straight bars, not a replacement
// (2026-08-10). Structure renders as a curved arc above the ship, energy as
// a straight bar below it. Display-only: reacts to
// ShipSurvivalComponent.onResourceChanged, same pattern HudOverlay already
// uses, no gameplay logic lives here. Procedurally drawn via Graphics rather
// than sprites, so no art asset is required (same precedent as HudOverlay's
// generated objective-marker texture).
export class ShipStatusArcs {
  private readonly graphics: Phaser.GameObjects.Graphics;

  constructor(scene: Phaser.Scene) {
    this.graphics = scene.add.graphics().setDepth(shipStatusArcConfig.depth);

    const ship = getPlayerShip();
    if (!ship) return;

    this.render(ship.survival.snapshot());
    ship.survival.on(SHIP_SURVIVAL_EVENTS.ResourceChanged, (snapshot: ResourceSnapshot) => this.render(snapshot));
  }

  // Called every frame from GameScene.update() — position must track the
  // ship continuously (movement doesn't fire onResourceChanged), while the
  // arc redraw in render() only needs to happen when a value actually
  // changes.
  update(): void {
    const ship = getPlayerShip();
    if (!ship) return;
    this.graphics.setPosition(ship.image.x, ship.image.y);
  }

  private render(snapshot: ResourceSnapshot): void {
    const energyPct = Phaser.Math.Clamp(snapshot.currentEnergy / snapshot.maxEnergy, 0, 1);
    const structurePct = Phaser.Math.Clamp(snapshot.currentStructure / snapshot.maxStructure, 0, 1);

    this.graphics.clear();
    this.drawArc(structurePct);
    this.drawEnergyBar(energyPct);
  }

  // Sweeps left (180°) -> top (270°) -> right (360°) as pct goes 0->1, i.e.
  // a dome over the ship rather than a full ring. Drawn relative to the
  // Graphics object's own local origin (0,0) — update() moves that origin
  // to the ship's world position every frame, so points here never need the
  // ship's coordinates baked in.
  private drawArc(pct: number): void {
    if (pct <= 0) return;
    const startAngle = Math.PI;
    const endAngle = Math.PI + pct * Math.PI;

    this.graphics.lineStyle(shipStatusArcConfig.arcThickness, shipStatusArcConfig.structureColor, 1);
    this.graphics.beginPath();
    this.graphics.arc(0, 0, shipStatusArcConfig.arcRadius, startAngle, endAngle, false);
    this.graphics.strokePath();
  }

  // Straight bar beneath the ship, left-aligned fill. A dark track is drawn
  // first since there's nothing else here to show the bar's full-width
  // extent once it's mostly depleted.
  private drawEnergyBar(pct: number): void {
    const { energyBarWidth: width, energyBarHeight: height, energyBarOffsetY: y } = shipStatusArcConfig;
    const x = -width / 2;

    this.graphics.fillStyle(shipStatusArcConfig.energyBarTrackColor, shipStatusArcConfig.energyBarTrackAlpha);
    this.graphics.fillRect(x, y, width, height);

    if (pct <= 0) return;
    this.graphics.fillStyle(shipStatusArcConfig.energyColor, 1);
    this.graphics.fillRect(x, y, width * pct, height);
  }
}
