import Phaser from 'phaser';
import { LevelObjectiveTracker } from './LevelObjectiveTracker';
import { hudConfig } from '../config/hudConfig';

const DEPTH = 2000;
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

// HudOverlay for Phase 1 (GDD §11.10/§12 step 5). Energy/structure bars
// moved out to ShipStatusArcs (world-space, ship-relative) on 2026-08-10 —
// this class now owns only the off-screen objective marker. Display-only,
// no gameplay logic lives here. Not Scene-specific — a plain object
// constructed once per GameScene session; its GameObjects are torn down
// automatically on Scene shutdown/restart like everything else in this
// scene.
export class HudOverlay {
  private readonly scene: Phaser.Scene;
  private readonly tracker: LevelObjectiveTracker;
  private readonly objectiveMarker: Phaser.GameObjects.Image;

  constructor(scene: Phaser.Scene, tracker: LevelObjectiveTracker) {
    this.scene = scene;
    this.tracker = tracker;

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
}
