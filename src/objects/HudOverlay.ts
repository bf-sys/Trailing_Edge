import Phaser from 'phaser';
import { LevelObjectiveTracker } from './LevelObjectiveTracker';
import { hudConfig } from '../config/hudConfig';
import { abilityConfig, type AbilityType } from '../config/abilityConfig';
import { getPlayerShip } from '../systems/ExplorationController';
import type { PuzzleSite } from './PuzzleSite';

const DEPTH = 2000;
const OBJECTIVE_MARKER_KEY = 'objective_marker';
const ABILITY_TYPES = Object.keys(abilityConfig) as AbilityType[];

export interface PuzzleSiteMarker {
  x: number;
  y: number;
  site: PuzzleSite;
}

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

// HudOverlay for Phase 1 (GDD §11.10/§12 step 5), completed for Phase 2a
// (2026-08-10): off-screen objective marker, ability icons, and the
// puzzle-site-active indicator. Energy/structure bars moved out to
// ShipStatusArcs (world-space, ship-relative) on 2026-08-10, so this class
// no longer owns those. Display-only, no gameplay logic lives here. Not
// Scene-specific — a plain object constructed once per GameScene session;
// its GameObjects are torn down automatically on Scene shutdown/restart
// like everything else in this scene.
export class HudOverlay {
  private readonly scene: Phaser.Scene;
  private readonly tracker: LevelObjectiveTracker;
  private readonly objectiveMarker: Phaser.GameObjects.Image;
  private readonly abilityIcons: Phaser.GameObjects.Graphics;
  private readonly puzzleSiteIndicator: Phaser.GameObjects.Text;
  private puzzleSites: PuzzleSiteMarker[] = [];

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

    // Ability icons (GDD §11.10) — one square per abilityConfig entry,
    // left-to-right in authored order, procedurally drawn (no art asset,
    // same precedent as everything else in this file/ShipStatusArcs).
    this.abilityIcons = scene.add.graphics().setScrollFactor(0).setDepth(DEPTH + 1);

    // Puzzle-site-active indicator (GDD §11.10) — "even just a highlight or
    // icon" per the GDD, so a single text label shown while the ship is
    // near any unsolved PuzzleSite. Nothing is registered until GameScene
    // calls setPuzzleSites() (Phase 2a Step 5's test-level content), so this
    // correctly never shows in a scene without puzzle-site instances.
    this.puzzleSiteIndicator = scene.add
      .text(scene.scale.width / 2, hudConfig.puzzleSiteIndicatorY, 'Puzzle site nearby', {
        fontSize: '14px',
        color: '#ffd28f',
      })
      .setOrigin(0.5, 0)
      .setScrollFactor(0)
      .setDepth(DEPTH + 1)
      .setVisible(false);
  }

  // Display-only registration — HudOverlay never creates/owns puzzle sites,
  // it only reads their position/solved state to decide whether to show the
  // indicator above.
  setPuzzleSites(sites: PuzzleSiteMarker[]): void {
    this.puzzleSites = sites;
  }

  update(): void {
    this.updateObjectiveMarker();
    this.updateAbilityIcons();
    this.updatePuzzleSiteIndicator();
  }

  private updateAbilityIcons(): void {
    this.abilityIcons.clear();

    const ship = getPlayerShip();
    if (!ship) return;

    const nowMs = this.scene.time.now;
    ABILITY_TYPES.forEach((type, index) => {
      const x = hudConfig.abilityIconX + index * (hudConfig.abilityIconSize + hudConfig.abilityIconSpacing);
      const y = hudConfig.abilityIconY;
      const size = hudConfig.abilityIconSize;
      const unlocked = ship.ability.isUnlocked(type);

      this.abilityIcons.fillStyle(hudConfig.abilityIconColors[type], unlocked ? 1 : hudConfig.abilityIconLockedAlpha);
      this.abilityIcons.fillRect(x, y, size, size);

      if (!unlocked) return;

      // Cooldown sweep: a dark rect wipes from full-height down to nothing
      // as the cooldown counts down — the same "draw an overlay
      // proportional to remaining/total" idea as ShipStatusArcs's arcs,
      // applied to a rect since these are square icons.
      const remainingMs = ship.ability.getCooldownRemainingMs(type, nowMs);
      const totalMs = abilityConfig[type].cooldownSeconds * 1000;
      if (remainingMs <= 0 || totalMs <= 0) return;

      const pct = remainingMs / totalMs;
      this.abilityIcons.fillStyle(hudConfig.abilityCooldownOverlayColor, hudConfig.abilityCooldownOverlayAlpha);
      this.abilityIcons.fillRect(x, y, size, size * pct);
    });
  }

  private updatePuzzleSiteIndicator(): void {
    const ship = getPlayerShip();
    if (!ship || this.puzzleSites.length === 0) {
      this.puzzleSiteIndicator.setVisible(false);
      return;
    }

    const nearby = this.puzzleSites.some(
      (marker) =>
        !marker.site.solved &&
        Phaser.Math.Distance.Between(ship.image.x, ship.image.y, marker.x, marker.y) <=
          hudConfig.puzzleSiteIndicatorRadius,
    );
    this.puzzleSiteIndicator.setVisible(nearby);
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
