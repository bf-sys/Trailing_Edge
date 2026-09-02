import Phaser from 'phaser';
import { LevelObjectiveTracker } from './LevelObjectiveTracker';
import { hudConfig } from '../config/hudConfig';
import { abilityConfig, abilityUnlockOrder } from '../config/abilityConfig';
import { getPlayerShip } from '../systems/ExplorationController';
import type { PuzzleSite } from './PuzzleSite';
import type { HazardZoneElement } from './HazardZoneElement';

const DEPTH = 2000;
const OBJECTIVE_MARKER_KEY = 'objective_marker';
const RESUPPLY_MARKER_KEY = 'resupply_marker';
const HAZARD_MARKER_KEY = 'hazard_marker';
// tractorBeam is de-scoped from all player-facing ability UI (2026-08-14
// ability rework) -- abilityUnlockOrder (now 3 entries) is the source of
// truth for what appears here, not every key in abilityConfig.
const ABILITY_TYPES = abilityUnlockOrder;

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
// match its visual center. Shared by all three edge-pinned markers below (key
// parameterized since each uses a different size/color; a third joined the
// original two 2026-09-02).
function createMarkerTexture(scene: Phaser.Scene, key: string, size: number, color: number): void {
  if (scene.textures.exists(key)) return;

  const diameter = size * 2;
  const graphics = scene.make.graphics({}, false);
  graphics.fillStyle(color, 1);
  graphics.fillTriangle(size, 0, 0, diameter, diameter, diameter);
  graphics.generateTexture(key, diameter, diameter);
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
  private readonly resupplyMarker: Phaser.GameObjects.Image;
  private readonly hazardMarker: Phaser.GameObjects.Image;
  private readonly abilityIcons: Phaser.GameObjects.Graphics;
  private readonly puzzleSiteIndicator: Phaser.GameObjects.Text;
  private puzzleSites: PuzzleSiteMarker[] = [];
  private resupplyPoints: { x: number; y: number }[] = [];
  private hazards: HazardZoneElement[] = [];
  // 2026-08-14 ability rework: one-shot objective-marker flash window (see
  // flashObjectiveMarker() below), timestamped in the same this.scene.time.now
  // clock updateObjectiveMarker() reads every frame.
  private markerFlashUntilMs = 0;

  constructor(scene: Phaser.Scene, tracker: LevelObjectiveTracker) {
    this.scene = scene;
    this.tracker = tracker;

    // Off-screen objective marker (resolves GDD §9's off-screen-objective-
    // visibility open question): a single edge-pinned arrow, not a minimap
    // — Probe -> Relay Beacon -> Exit Wormhole is a strictly linear
    // sequence, so there's only ever one target to point at. Points up by
    // default; rotation below accounts for that, same convention as
    // shipConfig's spriteFacingOffsetRadians.
    createMarkerTexture(scene, OBJECTIVE_MARKER_KEY, hudConfig.objectiveMarkerSize, hudConfig.objectiveMarkerColor);
    this.objectiveMarker = scene.add
      .image(0, 0, OBJECTIVE_MARKER_KEY)
      .setScrollFactor(0)
      .setDepth(DEPTH + 1)
      .setVisible(false);

    // Resupply waypoint marker (2026-08-21) — points at the nearest
    // AsteroidField ResupplyPoint while scan is active; see hudConfig.ts's
    // comment for why it's colored/sized the way it is.
    createMarkerTexture(scene, RESUPPLY_MARKER_KEY, hudConfig.resupplyMarkerSize, hudConfig.resupplyMarkerColor);
    this.resupplyMarker = scene.add
      .image(0, 0, RESUPPLY_MARKER_KEY)
      .setScrollFactor(0)
      .setDepth(DEPTH + 1)
      .setVisible(false);

    // Off-screen moving-hazard marker (2026-09-02) — points at the nearest
    // off-screen moving hazard (Ion Storm/Meteoroid) while scan is active;
    // see hudConfig.ts's comment for the color/pulse rationale.
    createMarkerTexture(scene, HAZARD_MARKER_KEY, hudConfig.hazardMarkerSize, hudConfig.hazardMarkerColor);
    this.hazardMarker = scene.add
      .image(0, 0, HAZARD_MARKER_KEY)
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

  // Display-only registration, same contract as setPuzzleSites() above —
  // HudOverlay never creates/owns ResupplyPoints, only reads their position
  // to decide where the resupply marker points. GameScene calls this once
  // per level, same call site as setPuzzleSites().
  setResupplyPoints(points: { x: number; y: number }[]): void {
    this.resupplyPoints = points;
  }

  // Display-only registration, same contract as the two above — HudOverlay
  // never creates/owns hazards, only reads position/movementPattern to
  // decide where the moving-hazard marker points. GameScene calls this once
  // per level with the same array it hands HazardScanOverlay.
  setHazards(hazards: HazardZoneElement[]): void {
    this.hazards = hazards;
  }

  // 2026-08-14 ability rework: opens a brief window where the objective
  // marker shows regardless of scan state. GameScene calls this once at
  // level start and on LevelObjectiveTracker's ProbeFound/BeaconReached
  // events -- the moments the game changes what it's asking of the player,
  // when they shouldn't be locked out of orientation by their energy state.
  flashObjectiveMarker(): void {
    this.markerFlashUntilMs = this.scene.time.now + hudConfig.objectiveMarkerFlashSeconds * 1000;
  }

  update(): void {
    this.updateObjectiveMarker();
    this.updateResupplyMarker();
    this.updateHazardMarker();
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

  // 2026-08-14 ability rework: the marker is no longer unconditional --
  // gated on scan's duration window OR the one-shot flash (see
  // flashObjectiveMarker() above) on top of the pre-existing off-screen
  // check below. Without either, the marker stays hidden even if the
  // target is off-screen -- the whole point of the rework is that
  // orientation is now something a player spends scan energy on, not a
  // free constant readout (see docs/ability-rework-brainstorm-2026-08-14.md).
  private updateObjectiveMarker(): void {
    const nowMs = this.scene.time.now;
    const ship = getPlayerShip();
    const scanActive = ship?.ability.isActive('scan', nowMs) ?? false;
    const flashing = nowMs < this.markerFlashUntilMs;

    if (!scanActive && !flashing) {
      this.objectiveMarker.setVisible(false);
      return;
    }

    const target = this.tracker.getCurrentObjectiveTarget();
    this.positionEdgeMarker(this.objectiveMarker, target.x, target.y);
  }

  // Resupply waypoint marker (2026-08-21, TODO.md) — points at the nearest
  // AsteroidField ResupplyPoint while scan is active. No flash window of its
  // own, unlike the objective marker above: resupply isn't tied to a
  // level-start/probe-found/beacon-reached moment, only to scan being on.
  private updateResupplyMarker(): void {
    const nowMs = this.scene.time.now;
    const ship = getPlayerShip();
    const scanActive = ship?.ability.isActive('scan', nowMs) ?? false;

    if (!scanActive || !ship || this.resupplyPoints.length === 0) {
      this.resupplyMarker.setVisible(false);
      return;
    }

    let nearest = this.resupplyPoints[0];
    let nearestDistance = Phaser.Math.Distance.Between(ship.image.x, ship.image.y, nearest.x, nearest.y);
    for (let i = 1; i < this.resupplyPoints.length; i++) {
      const point = this.resupplyPoints[i];
      const distance = Phaser.Math.Distance.Between(ship.image.x, ship.image.y, point.x, point.y);
      if (distance < nearestDistance) {
        nearest = point;
        nearestDistance = distance;
      }
    }

    this.positionEdgeMarker(this.resupplyMarker, nearest.x, nearest.y);
  }

  // Off-screen moving-hazard marker (2026-09-02) — same scan-gated
  // nearest-target convention as updateResupplyMarker() above, filtered to
  // movementPattern !== 'static' (Ion Storm/Meteoroid) since a stationary
  // hazard's danger is already fully conveyed by HazardScanOverlay's
  // on-screen outline — only a *moving* threat can be bearing down on you
  // from somewhere you can't currently see. Pulses alpha while visible,
  // unlike the two static markers, so it reads as more urgent.
  private updateHazardMarker(): void {
    const nowMs = this.scene.time.now;
    const ship = getPlayerShip();
    const scanActive = ship?.ability.isActive('scan', nowMs) ?? false;
    // Filtered to off-screen candidates *before* picking "nearest" — unlike
    // updateResupplyMarker() above, picking nearest-overall-then-hide-if-
    // onscreen would be wrong here: an on-screen Ion Storm sitting closer
    // than an off-screen homing Meteoroid must not swallow the pick, since
    // the whole point of this marker is surfacing a threat the player can't
    // currently see. A closer resupply point doesn't have that concern.
    const offScreenMovingHazards = this.hazards.filter(
      (hazard) => hazard.getMovementPattern() !== 'static' && this.isOffScreen(hazard.getPosition()),
    );

    if (!scanActive || !ship || offScreenMovingHazards.length === 0) {
      this.hazardMarker.setVisible(false);
      return;
    }

    let nearestPos = offScreenMovingHazards[0].getPosition();
    let nearestDistance = Phaser.Math.Distance.Between(ship.image.x, ship.image.y, nearestPos.x, nearestPos.y);
    for (let i = 1; i < offScreenMovingHazards.length; i++) {
      const pos = offScreenMovingHazards[i].getPosition();
      const distance = Phaser.Math.Distance.Between(ship.image.x, ship.image.y, pos.x, pos.y);
      if (distance < nearestDistance) {
        nearestPos = pos;
        nearestDistance = distance;
      }
    }

    this.positionEdgeMarker(this.hazardMarker, nearestPos.x, nearestPos.y);
    if (!this.hazardMarker.visible) return;

    const cyclesElapsed = nowMs / 1000 / hudConfig.hazardMarkerPulsePeriodSeconds;
    const pulseT = (Math.sin(cyclesElapsed * Math.PI * 2) + 1) / 2;
    this.hazardMarker.setAlpha(
      Phaser.Math.Linear(hudConfig.hazardMarkerPulseMinAlpha, hudConfig.hazardMarkerPulseMaxAlpha, pulseT),
    );
  }

  // Shared by all three edge-pinned markers (added 2026-08-21 alongside the
  // resupply marker — previously inlined in updateObjectiveMarker() only;
  // the hazard marker joined 2026-09-02). Doesn't touch alpha, so a caller
  // that wants a pulse (the hazard marker) is free to set it right after.
  // Hides the marker if its target is already on-screen (the whole point of
  // an edge-pinned arrow is orienting toward something off-screen); otherwise
  // clamps its position to the margin-inset screen rect along the
  // center->target ray, and rotates the (up-pointing) arrow to face it.
  private positionEdgeMarker(marker: Phaser.GameObjects.Image, targetX: number, targetY: number): void {
    if (!this.isOffScreen({ x: targetX, y: targetY })) {
      marker.setVisible(false);
      return;
    }

    const camera = this.scene.cameras.main;
    const screenX = targetX - camera.scrollX;
    const screenY = targetY - camera.scrollY;

    const centerX = camera.width / 2;
    const centerY = camera.height / 2;
    const dx = screenX - centerX;
    const dy = screenY - centerY;

    const margin = hudConfig.objectiveMarkerEdgeMargin;
    const halfWidth = centerX - margin;
    const halfHeight = centerY - margin;
    const scale = Math.min(dx !== 0 ? Math.abs(halfWidth / dx) : Infinity, dy !== 0 ? Math.abs(halfHeight / dy) : Infinity);

    marker.setPosition(centerX + dx * scale, centerY + dy * scale);
    marker.setRotation(Math.atan2(dy, dx) + Math.PI / 2);
    marker.setVisible(true);
  }

  // Factored out of positionEdgeMarker() (2026-09-02) so updateHazardMarker()
  // can filter candidate hazards to off-screen ones *before* picking
  // "nearest" — see that method's comment for why order matters there.
  private isOffScreen(target: { x: number; y: number }): boolean {
    const camera = this.scene.cameras.main;
    const screenX = target.x - camera.scrollX;
    const screenY = target.y - camera.scrollY;
    const margin = hudConfig.objectiveMarkerEdgeMargin;
    const withinViewport =
      screenX >= margin && screenX <= camera.width - margin && screenY >= margin && screenY <= camera.height - margin;
    return !withinViewport;
  }
}
