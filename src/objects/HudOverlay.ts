import Phaser from 'phaser';
import { getPlayerShip } from '../systems/ExplorationController';
import { SHIP_SURVIVAL_EVENTS, type ResourceSnapshot } from './ShipSurvivalComponent';
import { LevelObjectiveTracker } from './LevelObjectiveTracker';
import { hudConfig } from '../config/hudConfig';

const DEPTH = 2000;
const PANEL_X = 16;
const PANEL_Y = 16;
const BAR_X = PANEL_X + 44;
const ENERGY_BAR_Y = PANEL_Y + 20;
const STRUCTURE_BAR_Y = PANEL_Y + 46;
const OBJECTIVE_MARKER_KEY = 'objective_marker';

// Generated once into the global texture manager (same pattern as
// StarfieldBackground's createStarfieldTextures) — an apex-up triangle, used
// as a plain Image so rotation follows the same proven convention as
// PlayerShip (faces up by default, rotation = atan2(dy,dx) + PI/2), rather
// than Phaser's Triangle Shape GameObject, whose rotation pivot doesn't
// match its visual center.
function createObjectiveMarkerTexture(scene: Phaser.Scene, size: number, color: number): void {
  if (scene.textures.exists(OBJECTIVE_MARKER_KEY)) return;

  const diameter = size * 2;
  const graphics = scene.make.graphics({}, false);
  graphics.fillStyle(color, 1);
  graphics.fillTriangle(size, 0, 0, diameter, diameter, diameter);
  graphics.generateTexture(OBJECTIVE_MARKER_KEY, diameter, diameter);
  graphics.destroy();
}

// Bare-minimum HudOverlay for Phase 1 (GDD §11.10/§12 step 5): energy and
// structure bars only — no ability icons or puzzle-site indicator, nothing
// to show for either in Phase 1. Display-only: bound to
// ShipSurvivalComponent.onResourceChanged, no gameplay logic lives here.
// Not Scene-specific — a plain object constructed once per GameScene
// session; its GameObjects are torn down automatically on Scene
// shutdown/restart like everything else in this scene.
export class HudOverlay {
  private readonly scene: Phaser.Scene;
  private readonly tracker: LevelObjectiveTracker;
  private readonly energyBar: Phaser.GameObjects.Image;
  private readonly structureBar: Phaser.GameObjects.Image;
  private readonly energyBarWidth: number;
  private readonly structureBarWidth: number;
  private readonly objectiveMarker: Phaser.GameObjects.Image;

  constructor(scene: Phaser.Scene, tracker: LevelObjectiveTracker) {
    this.scene = scene;
    this.tracker = tracker;

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

    // Off-screen objective marker (resolves GDD §9's off-screen-objective-
    // visibility open question): a single edge-pinned arrow, not a minimap
    // — Probe -> Relay Beacon -> Exit Wormhole is a strictly linear
    // sequence, so there's only ever one target to point at. Points up by
    // default; rotation below accounts for that, same convention as
    // shipConfig's spriteFacingOffsetRadians.
    createObjectiveMarkerTexture(scene, hudConfig.objectiveMarkerSize, hudConfig.objectiveMarkerColor);
    this.objectiveMarker = scene.add
      .image(0, 0, OBJECTIVE_MARKER_KEY)
      .setScrollFactor(0)
      .setDepth(DEPTH + 1)
      .setVisible(false);

    const ship = getPlayerShip();
    if (!ship) return;

    this.render(ship.survival.snapshot());
    ship.survival.on(SHIP_SURVIVAL_EVENTS.ResourceChanged, (snapshot: ResourceSnapshot) => this.render(snapshot));
  }

  update(): void {
    this.updateObjectiveMarker();
  }

  private updateObjectiveMarker(): void {
    const camera = this.scene.cameras.main;
    const target = this.tracker.getCurrentObjectiveTarget();
    const screenX = target.x - camera.scrollX;
    const screenY = target.y - camera.scrollY;

    const margin = hudConfig.objectiveMarkerEdgeMargin;
    const withinViewport =
      screenX >= margin && screenX <= camera.width - margin && screenY >= margin && screenY <= camera.height - margin;

    if (withinViewport) {
      this.objectiveMarker.setVisible(false);
      return;
    }

    const centerX = camera.width / 2;
    const centerY = camera.height / 2;
    const dx = screenX - centerX;
    const dy = screenY - centerY;

    // Clamp to the margin-inset screen rect along the center->target ray,
    // then rotate the (up-pointing) arrow to face the target.
    const halfWidth = centerX - margin;
    const halfHeight = centerY - margin;
    const scale = Math.min(dx !== 0 ? Math.abs(halfWidth / dx) : Infinity, dy !== 0 ? Math.abs(halfHeight / dy) : Infinity);

    this.objectiveMarker.setPosition(centerX + dx * scale, centerY + dy * scale);
    this.objectiveMarker.setRotation(Math.atan2(dy, dx) + Math.PI / 2);
    this.objectiveMarker.setVisible(true);
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
