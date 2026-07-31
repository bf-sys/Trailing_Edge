import Phaser from 'phaser';
import { getPlayerShip } from '../systems/ExplorationController';
import { SHIP_SURVIVAL_EVENTS, type ResourceSnapshot } from './ShipSurvivalComponent';

const DEPTH = 2000;
const PANEL_X = 16;
const PANEL_Y = 16;
const BAR_X = PANEL_X + 44;
const ENERGY_BAR_Y = PANEL_Y + 20;
const STRUCTURE_BAR_Y = PANEL_Y + 46;

// Bare-minimum HudOverlay for Phase 1 (GDD §11.10/§12 step 5): energy and
// structure bars only — no ability icons or puzzle-site indicator, nothing
// to show for either in Phase 1. Display-only: bound to
// ShipSurvivalComponent.onResourceChanged, no gameplay logic lives here.
// Not Scene-specific — a plain object constructed once per GameScene
// session; its GameObjects are torn down automatically on Scene
// shutdown/restart like everything else in this scene.
export class HudOverlay {
  private readonly energyBar: Phaser.GameObjects.Image;
  private readonly structureBar: Phaser.GameObjects.Image;
  private readonly energyBarWidth: number;
  private readonly structureBarWidth: number;

  constructor(scene: Phaser.Scene) {
    scene.add.image(PANEL_X, PANEL_Y, 'panel_frame').setOrigin(0, 0).setScrollFactor(0).setDepth(DEPTH);

    scene.add
      .text(PANEL_X + 8, ENERGY_BAR_Y - 7, 'NRG', { fontSize: '12px', color: '#ffffff' })
      .setScrollFactor(0)
      .setDepth(DEPTH + 1);
    scene.add
      .text(PANEL_X + 8, STRUCTURE_BAR_Y - 7, 'STR', { fontSize: '12px', color: '#ffffff' })
      .setScrollFactor(0)
      .setDepth(DEPTH + 1);

    this.energyBar = scene.add
      .image(BAR_X, ENERGY_BAR_Y, 'bar_energy')
      .setOrigin(0, 0.5)
      .setScrollFactor(0)
      .setDepth(DEPTH + 1);
    this.structureBar = scene.add
      .image(BAR_X, STRUCTURE_BAR_Y, 'bar_structure')
      .setOrigin(0, 0.5)
      .setScrollFactor(0)
      .setDepth(DEPTH + 1);

    this.energyBarWidth = this.energyBar.width;
    this.structureBarWidth = this.structureBar.width;

    const ship = getPlayerShip();
    if (!ship) return;

    this.render(ship.survival.snapshot());
    ship.survival.on(SHIP_SURVIVAL_EVENTS.ResourceChanged, (snapshot: ResourceSnapshot) => this.render(snapshot));
  }

  private render(snapshot: ResourceSnapshot): void {
    const energyPct = Phaser.Math.Clamp(snapshot.currentEnergy / snapshot.maxEnergy, 0, 1);
    const structurePct = Phaser.Math.Clamp(snapshot.currentStructure / snapshot.maxStructure, 0, 1);

    // Crop rather than scaleX so the bar depletes by revealing less of the
    // pill-shaped sprite from the left, instead of squashing its rounded
    // caps into an ellipse.
    this.energyBar.setCrop(0, 0, this.energyBarWidth * energyPct, this.energyBar.height);
    this.structureBar.setCrop(0, 0, this.structureBarWidth * structurePct, this.structureBar.height);
  }
}
