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
import { HudOverlay } from '../objects/HudOverlay';
import { STARFIELD_FAR_KEY, STARFIELD_NEAR_KEY } from '../objects/StarfieldBackground';
import { placeBackgroundSetPieces } from '../objects/BackgroundSetPieces';
import { DestinationMarker } from '../objects/DestinationMarker';

export const GAME_SCENE_KEY = 'GameScene';

interface GameSceneData {
  levelId: string;
}

// Test-map world size (GDD §9's new open question): deliberately larger
// than the 1280x720 viewport, with the camera following the ship, to
// exercise the Sinistar-style "bounded level, not screen-sized level"
// reading of §8 rather than the single-screen layout Phase 1 steps 1-5
// used so far.
const LEVEL_WIDTH = 2400;
const LEVEL_HEIGHT = 1350;

// Core-loop object placements (§11.11-11.14): find probe -> reach beacon ->
// reach the (separate) exit wormhole. Named consts, not inline literals, so
// each placed object and LevelObjectiveTracker's waypoints share one source
// of truth rather than duplicating coordinates.
const ENTRY_WORMHOLE_POSITION = { x: LEVEL_WIDTH / 2, y: LEVEL_HEIGHT / 2 };
const EXIT_WORMHOLE_POSITION = { x: 500, y: 1000 };
const PROBE_POSITION = { x: 2200, y: 200 };
const RELAY_BEACON_POSITION = { x: 200, y: 1150 };

// Parameterized by levelId only — always starts at the level's beginning,
// no mid-level resume (CheckpointManager is deferred). Doubles as Phase 1's
// "small test scene" — every placement below (hazard, resupply, probe,
// beacon, entry/exit wormhole) is hardcoded test-scene content, not real
// level-config authoring (that's Phase 2b's per-level authored-data work).
//
// A hard fail (onStructureDepleted) calls scene.restart(), which re-runs
// init()/create() on this SAME Scene instance (Phaser scenes are singletons
// per key) — GameScene's own mutable fields below must be reset at the top
// of create(), not just declared as field initializers, or they'd
// accumulate across restarts instead of starting clean.
export class GameScene extends Phaser.Scene {
  private levelId!: string;
  private hazards: HazardZoneElement[] = [];
  private resupplyPoints: ResupplyPoint[] = [];
  private hudOverlay!: HudOverlay;

  constructor() {
    super(GAME_SCENE_KEY);
  }

  init(data: GameSceneData): void {
    this.levelId = data.levelId;
  }

  create(): void {
    this.hazards = [];
    this.resupplyPoints = [];

    this.physics.world.setBounds(0, 0, LEVEL_WIDTH, LEVEL_HEIGHT);
    this.createParallaxBackground();
    placeBackgroundSetPieces(this, this.levelId, LEVEL_WIDTH, LEVEL_HEIGHT);

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
      ship.image.setPosition(ENTRY_WORMHOLE_POSITION.x, ENTRY_WORMHOLE_POSITION.y);
      ship.image.setCollideWorldBounds(true);
      this.cameras.main.setBounds(0, 0, LEVEL_WIDTH, LEVEL_HEIGHT);
      this.cameras.main.startFollow(ship.image, true, 0.1, 0.1);
    }

    // Debris Field — static, movement-blocking obstacle, zero resource
    // cost (re-scoped 2026-08-07, GDD §9/§11.3). activation/resourceCost
    // are inert for a blocksMovement hazard but still required by the
    // config type; left at 'continuous'/zero rather than made optional.
    this.hazards.push(
      new HazardZoneElement(this, {
        x: 1750,
        y: 950,
        textureKey: 'debris_large',
        shape: { kind: 'circle', radius: 60 },
        movementPattern: 'static',
        speed: 0,
        activation: 'continuous',
        resourceCost: { energy: 0, structure: 0 },
        blocksMovement: true,
      }),
    );

    // AsteroidField resupply point (structure repair only).
    this.resupplyPoints.push(
      new ResupplyPoint(this, { x: 650, y: 300, textureKey: 'asteroid_large', radius: 40 }),
    );

    // Core-loop objects (§11.11-11.14): find probe -> reach beacon -> reach
    // the exit wormhole. Spread across the level on purpose now that it's
    // bigger than the viewport — see GDD §9's off-screen-objective marker,
    // resolved via HudOverlay's edge-pinned arrow below.
    const tracker = new LevelObjectiveTracker({
      probe: PROBE_POSITION,
      relayBeacon: RELAY_BEACON_POSITION,
      exitWormhole: EXIT_WORMHOLE_POSITION,
    });

    new ProbeObject(this, { ...PROBE_POSITION, textureKey: 'probe', radius: 27 }, tracker);

    new RelayBeaconObject(
      this,
      // relay_beacon.png is 1124x656 (~1.71:1) -- displayWidth/Height match
      // that aspect ratio rather than forcing a square, per radius*2 elsewhere.
      { ...RELAY_BEACON_POSITION, textureKey: 'relay_beacon', radius: 45, displayWidth: 154, displayHeight: 90 },
      tracker,
    );

    new EntryWormhole(this, { ...ENTRY_WORMHOLE_POSITION, textureKey: 'wormhole', radius: 40 });

    new ExitWormhole(
      this,
      { ...EXIT_WORMHOLE_POSITION, textureKey: 'wormhole', radius: 40 },
      tracker,
      () => this.handleLevelComplete(),
    );

    this.hudOverlay = new HudOverlay(this, tracker);
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
    this.hudOverlay.update();
  }

  // Deliberately minimal: real levelOrder resolution + SaveManager.saveProgress()
  // are Phase 2a scope (§11.8/§11.9). This single test level just proves the
  // find-probe -> reach-beacon -> return sequence works end-to-end.
  private handleLevelComplete(): void {
    console.log('[level] complete — transitioning to WinScene (levelOrder/SaveManager not wired yet)');
    this.scene.start('WinScene');
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
    const width = LEVEL_WIDTH * 1.5;
    const height = LEVEL_HEIGHT * 1.5;
    const centerX = LEVEL_WIDTH / 2;
    const centerY = LEVEL_HEIGHT / 2;

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
