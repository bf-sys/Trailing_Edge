import Phaser from 'phaser';
import { SystemRegistry } from '../systems/SystemRegistry';
import '../systems'; // side-effect import: registers any systems that exist so far
import { getPlayerShip } from '../systems/ExplorationController';
import { HazardZoneElement } from '../objects/HazardZoneElement';
import { ResupplyPoint } from '../objects/ResupplyPoint';
import { SHIP_SURVIVAL_EVENTS } from '../objects/ShipSurvivalComponent';
import { LevelObjectiveTracker, LEVEL_OBJECTIVE_EVENTS } from '../objects/LevelObjectiveTracker';
import { ProbeObject } from '../objects/ProbeObject';
import { RelayBeaconObject } from '../objects/RelayBeaconObject';
import { EntryWormhole } from '../objects/EntryWormhole';
import { ExitWormhole } from '../objects/ExitWormhole';
import { HudOverlay, type PuzzleSiteMarker } from '../objects/HudOverlay';
import { ShipStatusArcs } from '../objects/ShipStatusArcs';
import { getProgressionManager } from '../systems/ProgressionManager';
import { saveProgress } from '../objects/SaveManager';
import { LEVEL_ORDER, TEST_LEVEL_ID } from '../config/levelOrder';
import { STARFIELD_FAR_KEY, STARFIELD_NEAR_KEY } from '../objects/StarfieldBackground';
import { placeBackgroundSetPieces } from '../objects/BackgroundSetPieces';
import { DestinationMarker } from '../objects/DestinationMarker';
import { hazardConfig } from '../config/hazardConfig';
import type { HazardTypeConfig } from '../config/hazardConfig';
import { PuzzleElementBase } from '../objects/PuzzleElementBase';
import { PuzzleSite } from '../objects/PuzzleSite';
import { getLevelConfig } from '../levels';
import { createPuzzleElement, puzzleSiteMarkerPosition } from '../levels/puzzleElementFactory';

export const GAME_SCENE_KEY = 'GameScene';

interface GameSceneData {
  levelId: string;
}

// Parameterized by levelId only — always starts at the level's beginning,
// no mid-level resume (CheckpointManager is deferred). Every placement below
// (hazard, resupply, probe, beacon, entry/exit wormhole, puzzle element)
// comes from this.levelId's LevelConfig (src/levels/) — GameScene itself
// carries no per-level content, only the generic instantiation logic shared
// by every level.
//
// A hard fail (onStructureDepleted) calls scene.restart(), which re-runs
// init()/create() on this SAME Scene instance (Phaser scenes are singletons
// per key) — GameScene's own mutable fields below must be reset at the top
// of create(), not just declared as field initializers, or they'd
// accumulate across restarts instead of starting clean.
export class GameScene extends Phaser.Scene {
  private levelId!: string;
  private levelWidth!: number;
  private levelHeight!: number;
  private hazards: HazardZoneElement[] = [];
  private resupplyPoints: ResupplyPoint[] = [];
  private puzzleElements: PuzzleElementBase[] = [];
  private hudOverlay!: HudOverlay;
  private shipStatusArcs!: ShipStatusArcs;

  constructor() {
    super(GAME_SCENE_KEY);
  }

  init(data: GameSceneData): void {
    this.levelId = data.levelId;
  }

  create(): void {
    this.hazards = [];
    this.resupplyPoints = [];
    this.puzzleElements = [];

    const config = getLevelConfig(this.levelId);
    this.levelWidth = config.width;
    this.levelHeight = config.height;

    this.physics.world.setBounds(0, 0, this.levelWidth, this.levelHeight);
    this.createParallaxBackground();
    placeBackgroundSetPieces(this, this.levelId, this.levelWidth, this.levelHeight);

    this.add
      .text(8, 88, `levelId: ${this.levelId}\nClick to move`, { fontSize: '14px', color: '#ffffff' })
      .setScrollFactor(0)
      .setDepth(1000);

    // Nobody hand-edits this loop per-system — systems register themselves
    // via SystemRegistry from their own module (see src/systems/index.ts).
    // ExplorationController spawns the ship at a placeholder default (it has
    // no way to know this level's real Entry Wormhole position); reposition
    // it to the real spawn point immediately after.
    SystemRegistry.all().forEach((system) => system.init?.(this));

    const ship = getPlayerShip();
    if (ship) {
      ship.image.setPosition(config.entryWormholeLocation.x, config.entryWormholeLocation.y);
      ship.image.setCollideWorldBounds(true);
      this.cameras.main.setBounds(0, 0, this.levelWidth, this.levelHeight);
      this.cameras.main.startFollow(ship.image, true, 0.1, 0.1);
    }

    // Hazard placements (GDD §9/§11.3): x/y is this level's authored
    // content; shape/movement/cost per hazard type stays in hazardConfig.ts
    // (CLAUDE.md's "hazard ... costs" config-module convention).
    config.hazards.forEach((placement) => {
      this.placeHazard(placement.x, placement.y, hazardConfig[placement.type]);
    });

    // Resupply points (AsteroidField -- structure repair only).
    config.resupplyPoints.forEach((placement) => {
      this.resupplyPoints.push(new ResupplyPoint(this, placement));
    });

    // Puzzle-site elements (GDD §6/§11.3) -- optional/additive per the core
    // loop (§3); a level's config may leave this array empty (level-001).
    // Each placement gets its own single-element PuzzleSite (GDD §11.3's
    // grouping wrapper) so HudOverlay's puzzle-site indicator has something
    // to query.
    const puzzleSiteMarkers: PuzzleSiteMarker[] = [];

    config.puzzleElements.forEach((placement) => {
      const element = createPuzzleElement(this, placement);
      this.puzzleElements.push(element);
      const markerPosition = puzzleSiteMarkerPosition(placement);
      puzzleSiteMarkers.push({ ...markerPosition, site: new PuzzleSite([element]) });
    });

    // Core-loop objects (§11.11-11.14): find probe -> reach beacon -> reach
    // the exit wormhole. Spread across the level on purpose now that it's
    // bigger than the viewport — see GDD §9's off-screen-objective marker,
    // resolved via HudOverlay's edge-pinned arrow below.
    const tracker = new LevelObjectiveTracker({
      probe: config.probeLocation,
      relayBeacon: config.relayBeaconLocation,
      exitWormhole: config.exitWormholeLocation,
    });

    new ProbeObject(this, { ...config.probeLocation, textureKey: 'probe', radius: 27 }, tracker);

    new RelayBeaconObject(
      this,
      // relay_beacon.png is 1124x656 (~1.71:1) -- displayWidth/Height match
      // that aspect ratio rather than forcing a square, per radius*2 elsewhere.
      { ...config.relayBeaconLocation, textureKey: 'relay_beacon', radius: 45, displayWidth: 154, displayHeight: 90 },
      tracker,
    );

    new EntryWormhole(this, { ...config.entryWormholeLocation, textureKey: 'wormhole', radius: 40 });

    new ExitWormhole(
      this,
      { ...config.exitWormholeLocation, textureKey: 'wormhole', radius: 40 },
      tracker,
      () => this.handleLevelComplete(),
    );

    this.hudOverlay = new HudOverlay(this, tracker);
    this.hudOverlay.setPuzzleSites(puzzleSiteMarkers);
    this.shipStatusArcs = new ShipStatusArcs(this);
    new DestinationMarker(this);

    this.wireHardFailRestart();
    this.setUpObjectiveDebugReadout(tracker);

    this.input.keyboard?.on('keydown-ESC', () => {
      this.scene.launch('PauseScene');
      this.scene.pause();
    });
  }

  update(time: number, delta: number): void {
    SystemRegistry.all().forEach((system) => system.update?.(time, delta));
    this.hazards.forEach((hazard) => hazard.update(time, delta));
    this.resupplyPoints.forEach((resupply) => resupply.update(time, delta));
    this.puzzleElements.forEach((element) => element.update(time, delta));
    this.hudOverlay.update();
    this.shipStatusArcs.update();
  }

  // Real levelOrder resolution + SaveManager (GDD §11.8/§11.9, Phase 2a
  // Step 4): grants the next ability in ProgressionManager's fixed order
  // (2026-08-10 decision — auto-grant, no unlock-choice UI), then either
  // saves progress and advances to the next level, or transitions to
  // WinScene once LEVEL_ORDER is exhausted. TEST_LEVEL_ID is outside
  // LEVEL_ORDER entirely (2026-08-12) -- completing it returns straight to
  // TitleScene with no ability grant and no save, since it's a sandbox, not
  // part of the real playthrough.
  private handleLevelComplete(): void {
    if (this.levelId === TEST_LEVEL_ID) {
      this.scene.start('TitleScene');
      return;
    }

    getProgressionManager().grantNextAbility();

    const nextLevelId = LEVEL_ORDER[LEVEL_ORDER.indexOf(this.levelId) + 1];
    if (!nextLevelId) {
      this.scene.start('WinScene');
      return;
    }

    saveProgress(nextLevelId);
    this.scene.start('GameScene', { levelId: nextLevelId });
  }

  // Hard-fail flow (GDD §11.1/§5/§12 step 4): hitting zero structure resets
  // position, structure, and energy to the level's starting values via a
  // full scene.restart() — no CheckpointManager, no partial state carried
  // over. levelId flows back through init() the same way scene.start() does.
  private wireHardFailRestart(): void {
    const ship = getPlayerShip();
    if (!ship) return;

    ship.survival.on(SHIP_SURVIVAL_EVENTS.StructureDepleted, () => {
      console.warn('[survival] structure depleted — restarting level');
      this.scene.restart({ levelId: this.levelId });
    });
  }

  // Placeholder parallax background (no per-level starfield art sourced
  // yet, docs/trailing_edge_art_asset_list.md §2.1) — two procedurally
  // generated star tiles at different scrollFactors give a sense of motion
  // and depth on a level bigger than the viewport. Sized well past the
  // level bounds so panning near an edge never runs out of tiled texture.
  // placeBackgroundSetPieces() (called from create(), above) adds a further
  // decorative layer on top of this — a few random planet/galaxy set pieces,
  // purely visual, to break up the tiled starfield's monotony.
  private createParallaxBackground(): void {
    const width = this.levelWidth * 1.5;
    const height = this.levelHeight * 1.5;
    const centerX = this.levelWidth / 2;
    const centerY = this.levelHeight / 2;

    this.add.tileSprite(centerX, centerY, width, height, STARFIELD_FAR_KEY).setScrollFactor(0.15).setDepth(-100);
    // ADD blend: bg_stars_near.jpg is a fully opaque (non-transparent) JPG,
    // same as bg_stars_far.jpg -- stacked normally, its solid black
    // background would completely occlude the far layer beneath it. ADD
    // blending means black pixels (0,0,0) contribute nothing, so only the
    // near layer's actual stars add their brightness on top of far's,
    // letting both layers read instead of just whichever is on top.
    this.add
      .tileSprite(centerX, centerY, width, height, STARFIELD_NEAR_KEY)
      .setScrollFactor(0.4)
      .setDepth(-90)
      .setBlendMode(Phaser.BlendModes.ADD);
  }

  // Places one HazardZoneElement instance from a hazardConfig.ts entry at
  // this level's authored x/y (level content, stays in src/levels/ per GDD
  // §11.7 -- only the hazard-type defaults live in the shared config
  // module). Generates the type's placeholder circle texture first if the
  // config carries one (Solar Flare/Ion Storm/Nebula Field/Meteoroid have
  // no sourced art yet, docs/STATUS.md); Debris Field skips this since it
  // already has final sourced art loaded by BootScene.
  private placeHazard(x: number, y: number, config: HazardTypeConfig): void {
    if (config.placeholderTexture && config.shape.kind === 'circle') {
      this.createHazardPlaceholderTexture(
        config.textureKey,
        config.shape.radius,
        config.placeholderTexture.color,
        config.placeholderTexture.alpha,
      );
    }

    this.hazards.push(new HazardZoneElement(this, { x, y, ...config }));
  }

  // Placeholder texture for the four hazardConfig.ts entries with no
  // sourced art yet (Solar Flare/Ion Storm/Nebula Field/Meteoroid,
  // docs/STATUS.md) -- a flat generated circle, same procedural-texture
  // precedent as everything else added this phase (createObjectiveMarkerTexture,
  // ScanInteractElement's ring, ...). Real per-hazard art is Phase 2b's job,
  // tracked in trailing_edge_art_asset_list.md.
  private createHazardPlaceholderTexture(key: string, radius: number, color: number, alpha: number): void {
    if (this.textures.exists(key)) return;

    const diameter = radius * 2;
    const graphics = this.make.graphics({}, false);
    graphics.fillStyle(color, alpha);
    graphics.fillCircle(radius, radius, radius);
    graphics.generateTexture(key, diameter, diameter);
    graphics.destroy();
  }

  // Objective flags have no HUD requirement in Phase 1 (only the
  // puzzle-site indicator is deferred by name, but there's no formal
  // display spec for probe/beacon state either) — kept as a debug-only
  // readout, separate from HudOverlay.
  private setUpObjectiveDebugReadout(tracker: LevelObjectiveTracker): void {
    const objectiveReadout = this.add
      .text(8, 112, 'probe: no  beacon: no', { fontSize: '14px', color: '#ffd28f' })
      .setScrollFactor(0)
      .setDepth(1000);

    tracker.on(LEVEL_OBJECTIVE_EVENTS.ProbeFound, () => objectiveReadout.setText('probe: yes  beacon: no'));
    tracker.on(LEVEL_OBJECTIVE_EVENTS.BeaconReached, () => objectiveReadout.setText('probe: yes  beacon: yes'));
  }
}
