import Phaser from 'phaser';
import { SystemRegistry } from '../systems/SystemRegistry';
import '../systems'; // side-effect import: registers any systems that exist so far
import { getPlayerShip } from '../systems/ExplorationController';
import { HazardZoneElement } from '../objects/HazardZoneElement';
import { MovingHazardManager } from '../objects/MovingHazardManager';
import { EnergyNodeManager } from '../objects/EnergyNodeManager';
import { HazardScanOverlay } from '../objects/HazardScanOverlay';
import { TeleportRangeRing } from '../objects/TeleportRangeRing';
import { ResupplyPoint } from '../objects/ResupplyPoint';
import { SHIP_SURVIVAL_EVENTS } from '../objects/ShipSurvivalComponent';
import { LevelObjectiveTracker, LEVEL_OBJECTIVE_EVENTS } from '../objects/LevelObjectiveTracker';
import { ProbeObject } from '../objects/ProbeObject';
import { RelayBeaconObject } from '../objects/RelayBeaconObject';
import { EntryWormhole } from '../objects/EntryWormhole';
import { ExitWormhole } from '../objects/ExitWormhole';
import { HudOverlay, type PuzzleSiteMarker } from '../objects/HudOverlay';
import { ShipStatusArcs } from '../objects/ShipStatusArcs';
import { LevelIntroBanner } from '../objects/LevelIntroBanner';
import { getProgressionManager } from '../systems/ProgressionManager';
import { saveProgress } from '../objects/SaveManager';
import { LEVEL_ORDER, TEST_LEVEL_ID, getLevelNumber } from '../config/levelOrder';
import { abilityUnlockOrder } from '../config/abilityConfig';
import { STARFIELD_FAR_KEY, STARFIELD_NEAR_KEY } from '../objects/StarfieldBackground';
import { placeBackgroundSetPieces } from '../objects/BackgroundSetPieces';
import { DestinationMarker } from '../objects/DestinationMarker';
import { ShipThrusterTrail } from '../objects/ShipThrusterTrail';
import { ScanActivationVfx } from '../objects/ScanActivationVfx';
import { TeleportBlinkVfx } from '../objects/TeleportBlinkVfx';
import { ShipDamageFlash } from '../objects/ShipDamageFlash';
import { ShipExplosionVfx } from '../objects/ShipExplosionVfx';
import { hazardConfig } from '../config/hazardConfig';
import type { HazardTypeConfig } from '../config/hazardConfig';
import { PuzzleElementBase } from '../objects/PuzzleElementBase';
import { PuzzleSite } from '../objects/PuzzleSite';
import { getLevelConfig } from '../levels';
import type { HazardPlacement } from '../levels/levelTypes';
import { createPuzzleElement, puzzleSiteMarkerPosition } from '../levels/puzzleElementFactory';
import { ABILITY_UNLOCK_SCENE_KEY } from './AbilityUnlockScene';
import type { AbilityType } from '../config/abilityConfig';

export const GAME_SCENE_KEY = 'GameScene';

interface GameSceneData {
  levelId: string;
  // Set by the previous level's handleLevelComplete() when it granted an
  // ability (2026-08-15 rework -- see the AbilityUnlockScene launch at the
  // end of create() below for why this moved here instead of firing at the
  // completed level, before the transition).
  unlockedAbility?: AbilityType;
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
  private pendingAbilityUnlock: AbilityType | undefined;
  private hazards: HazardZoneElement[] = [];
  private movingHazards: HazardZoneElement[] = [];
  private movingHazardManager!: MovingHazardManager;
  private energyNodeManager!: EnergyNodeManager;
  private resupplyPoints: ResupplyPoint[] = [];
  private puzzleElements: PuzzleElementBase[] = [];
  private hudOverlay!: HudOverlay;
  private shipStatusArcs!: ShipStatusArcs;
  private hazardScanOverlay!: HazardScanOverlay;
  private teleportRangeRing!: TeleportRangeRing;
  private shipThrusterTrail!: ShipThrusterTrail;
  private shipDamageFlash!: ShipDamageFlash;
  private shipExplosionVfx!: ShipExplosionVfx;
  private levelIntroBanner!: LevelIntroBanner;

  constructor() {
    super(GAME_SCENE_KEY);
  }

  init(data: GameSceneData): void {
    this.levelId = data.levelId;
    this.pendingAbilityUnlock = data.unlockedAbility;
  }

  create(): void {
    this.hazards = [];
    this.movingHazards = [];
    this.resupplyPoints = [];
    this.puzzleElements = [];

    // Undo wireHardFailRestart()'s pre-death input/physics disable -- see
    // that method's comment. scene.restart() reuses this same Scene
    // instance's InputPlugin/KeyboardPlugin/physics world rather than
    // recreating them, so these flags must be explicitly reset here on
    // every create() (level start, level transition, and hard-fail
    // restart alike) rather than assumed to reset themselves.
    this.input.enabled = true;
    if (this.input.keyboard) this.input.keyboard.enabled = true;
    this.physics.resume();

    const config = getLevelConfig(this.levelId);
    this.levelWidth = config.width;
    this.levelHeight = config.height;

    // Test Level is a sandbox outside LEVEL_ORDER (2026-08-12) with no save
    // read/write on entry or exit -- force-granting every unlockable
    // ability here (not via a save-driven grant) makes its full hazard/
    // ability surface testable without first playing through real levels.
    // grantNextAbility() no-ops once exhausted, so re-entering the Test
    // Level within the same session is safe to call this again.
    if (this.levelId === TEST_LEVEL_ID) {
      abilityUnlockOrder.forEach(() => getProgressionManager().grantNextAbility());
    }

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
    // 'linear'/'trochoid' movement hazards (Ion Storm, Meteoroid)
    // additionally get tracked in movingHazards -- see MovingHazardManager,
    // constructed below once the tracker it needs exists. 'trochoid' (added
    // 2026-08-25) still wraps/respawns the same way 'linear' always has --
    // MovingHazardManager only ever reads the hazard's actual drawn position
    // (HazardZoneElement.getPosition()), which already accounts for the
    // orbit offset, so no manager-side change was needed for it.
    config.hazards.forEach((placement) => {
      const typeConfig = hazardConfig[placement.type];
      const hazard = this.placeHazard(placement, typeConfig);
      if (typeConfig.movementPattern === 'linear' || typeConfig.movementPattern === 'trochoid') {
        this.movingHazards.push(hazard);
      }
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

    // Wraps 'linear' hazards (movingHazards, collected above) back into the
    // level instead of letting them drift off into the world bounds forever
    // -- needs the tracker for its objective-biased respawn heading, so
    // constructed here rather than alongside the hazard-placement loop.
    this.movingHazardManager = new MovingHazardManager(this.movingHazards, tracker, this.levelWidth, this.levelHeight);

    // Energy pickups (2026-08-24) -- constructed here since it needs both
    // this.hazards (for blocksMovement keep-out) and tracker (for
    // objective-weighted respawn), same as movingHazardManager above.
    this.energyNodeManager = new EnergyNodeManager(
      this,
      this.hazards,
      tracker,
      config.entryWormholeLocation,
      this.levelWidth,
      this.levelHeight,
    );

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
    this.hudOverlay.setResupplyPoints(this.resupplyPoints.map((resupply) => resupply.getPosition()));
    // 2026-08-14 ability rework: the objective marker is no longer
    // always-on (see HudOverlay.flashObjectiveMarker()) -- flash once at
    // level start, and again on each of these two moments the game changes
    // what it's asking of the player, so a scan-less/energy-less player is
    // never left with zero orientation info right when it matters most.
    // Deferred one tick via delayedCall(0, ...): a freshly booted Scene's
    // this.time.now reads 0 synchronously inside create() (its Clock
    // hasn't ticked yet) and only jumps to the real elapsed time on the
    // next frame -- calling flashObjectiveMarker() directly here would
    // stamp its expiry against that stale 0 baseline instead of the real
    // clock, making the flash expire almost instantly instead of lasting
    // hudConfig.objectiveMarkerFlashSeconds.
    this.time.delayedCall(0, () => this.hudOverlay.flashObjectiveMarker());
    tracker.on(LEVEL_OBJECTIVE_EVENTS.ProbeFound, () => this.hudOverlay.flashObjectiveMarker());
    tracker.on(LEVEL_OBJECTIVE_EVENTS.BeaconReached, () => this.hudOverlay.flashObjectiveMarker());
    this.shipStatusArcs = new ShipStatusArcs(this);
    this.hazardScanOverlay = new HazardScanOverlay(this, this.hazards);
    this.teleportRangeRing = new TeleportRangeRing(this);
    new DestinationMarker(this);
    new ScanActivationVfx(this);
    new TeleportBlinkVfx(this);
    this.shipDamageFlash = new ShipDamageFlash(this);
    this.shipExplosionVfx = new ShipExplosionVfx(this);
    this.shipThrusterTrail = new ShipThrusterTrail(this);
    this.levelIntroBanner = new LevelIntroBanner(this);

    this.wireHardFailRestart();
    this.setUpObjectiveDebugReadout(tracker);

    this.input.keyboard?.on('keydown-ESC', () => {
      this.scene.launch('PauseScene');
      this.scene.pause();
    });

    // 2026-08-26 prototype: "Level N" banner (LevelIntroBanner), top-third,
    // screen-pinned. Chosen over a blocking interstitial scene specifically
    // to dodge sequencing against the ability-unlock popup below -- when one
    // is pending, the popup owns the screen first and the banner's hold
    // timer starts only once the player explicitly closes it (its onClose
    // below), same principle as the LevelIntroBanner file comment. A hard-
    // fail scene.restart() re-runs this same create() with no
    // pendingAbilityUnlock, so it re-shows on every restart, not just a
    // fresh level arrival -- deliberate, since a restarted level is still
    // "level N" and there's no popup to wait on.
    const introLabel = this.levelId === TEST_LEVEL_ID ? 'Test Level' : `Level ${getLevelNumber(this.levelId)}`;

    // 2026-08-15: show the previous level's ability-unlock popup here, at
    // the start of the level where it's actually usable, instead of at the
    // end of the level that granted it (where the old 2026-08-14 rework
    // put it). Only fires once -- handleLevelComplete() only sets
    // unlockedAbility on the scene.start() data for a fresh arrival, and a
    // hard-fail scene.restart() never passes it, so restarting a level
    // never re-shows this.
    if (this.pendingAbilityUnlock) {
      const abilityType = this.pendingAbilityUnlock;
      this.pendingAbilityUnlock = undefined;
      this.scene.pause();
      this.scene.launch(ABILITY_UNLOCK_SCENE_KEY, {
        abilityType: abilityType as Exclude<AbilityType, 'tractorBeam'>,
        onClose: () => {
          this.scene.resume(GAME_SCENE_KEY);
          this.levelIntroBanner.show(introLabel);
        },
      });
    } else {
      this.levelIntroBanner.show(introLabel);
    }
  }

  update(time: number, delta: number): void {
    SystemRegistry.all().forEach((system) => system.update?.(time, delta));
    this.hazards.forEach((hazard) => hazard.update(time, delta));
    this.movingHazardManager.update(delta);
    this.energyNodeManager.update(time, delta);
    this.resupplyPoints.forEach((resupply) => resupply.update(time, delta));
    this.puzzleElements.forEach((element) => element.update(time, delta));
    this.hudOverlay.update();
    this.shipStatusArcs.update();
    this.hazardScanOverlay.update(time);
    this.teleportRangeRing.update();
    this.shipThrusterTrail.update();
    this.shipDamageFlash.update();
  }

  // Real levelOrder resolution + SaveManager (GDD §11.8/§11.9, Phase 2a
  // Step 4): grants the next ability in ProgressionManager's fixed order
  // (2026-08-10 decision — auto-grant, no unlock-choice UI), then either
  // saves progress and advances to the next level, or transitions to
  // WinScene once LEVEL_ORDER is exhausted. TEST_LEVEL_ID is outside
  // LEVEL_ORDER entirely (2026-08-12) -- completing it returns straight to
  // TitleScene with no ability grant and no save, since it's a sandbox, not
  // part of the real playthrough.
  //
  // 2026-08-15 (superseding the 2026-08-14 "Ability-unlock info popup"
  // rework): when there IS a next level, the popup no longer interposes
  // here at all -- it's handed off via scene.start()'s data (unlockedAbility)
  // and shown at the START of that next level instead (end of create()
  // above), since that's the level the new ability is actually usable in,
  // not the one being left. The one case that still shows it here is the
  // terminal one: the last ability granted on the last LEVEL_ORDER entry
  // has no "next level" to attach the popup to (completion goes straight to
  // WinScene) -- kept as the pre-2026-08-15 fallback rather than dropping
  // the announcement entirely. grantNextAbility() returns null once every
  // entry in abilityUnlockOrder is already unlocked. tractorBeam is never
  // in abilityUnlockOrder, so grantNextAbility() can never return it -- the
  // cast below documents that rather than guarding against a case that
  // can't happen.
  private handleLevelComplete(): void {
    if (this.levelId === TEST_LEVEL_ID) {
      this.scene.start('TitleScene');
      return;
    }

    const nextLevelId = LEVEL_ORDER[LEVEL_ORDER.indexOf(this.levelId) + 1];
    const grantedAbility = getProgressionManager().grantNextAbility();

    if (nextLevelId) {
      saveProgress(nextLevelId);
      this.scene.start('GameScene', {
        levelId: nextLevelId,
        unlockedAbility: grantedAbility ?? undefined,
      });
      return;
    }

    // No next level -- fallback (see comment above): show the popup here,
    // before WinScene, same as every level did pre-2026-08-15.
    if (!grantedAbility) {
      this.scene.start('WinScene');
      return;
    }

    this.scene.pause();
    this.scene.launch(ABILITY_UNLOCK_SCENE_KEY, {
      abilityType: grantedAbility as Exclude<AbilityType, 'tractorBeam'>,
      onClose: () => this.scene.start('WinScene'),
    });
  }

  // Hard-fail flow (GDD §11.1/§5/§12 step 4): hitting zero structure resets
  // position, structure, and energy to the level's starting values via a
  // full scene.restart() — no CheckpointManager, no partial state carried
  // over. levelId flows back through init() the same way scene.start() does.
  //
  // 2026-08-26 (owner request): the restart is no longer immediate -- input
  // is disabled and physics paused so nothing else can happen mid-death,
  // the real ship sprite is hidden, and a quick arcade-style explosion
  // (ShipExplosionVfx) plays at its last position before scene.restart()
  // actually fires, arcade-style "die, then respawn" pacing instead of an
  // instant cut.
  //
  // Bug fixed 2026-08-27: scene.restart() does NOT tear down the Scene's
  // InputPlugin/KeyboardPlugin -- Phaser reuses the same Scene instance and
  // its plugins across a restart, only re-running init()/create(). The
  // input.enabled/input.keyboard.enabled = false set below was never being
  // reset back to true anywhere, so the very first hard-fail death disabled
  // keyboard input (ability hotkeys, ESC-for-pause) for the rest of the
  // browser session. create() now explicitly re-enables input/physics at
  // the top -- see the block right after the mutable-field resets above.
  private wireHardFailRestart(): void {
    const ship = getPlayerShip();
    if (!ship) return;

    ship.survival.on(SHIP_SURVIVAL_EVENTS.StructureDepleted, () => {
      console.warn('[survival] structure depleted — playing death sequence');
      this.input.enabled = false;
      if (this.input.keyboard) this.input.keyboard.enabled = false;
      this.physics.pause();

      const { x, y } = ship.image;
      ship.image.setVisible(false);
      this.shipExplosionVfx.play(x, y, () => {
        this.scene.restart({ levelId: this.levelId });
      });
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
  // config carries one (only Solar Flare has no sourced art yet,
  // docs/STATUS.md); Debris Field, Ion Storm, Nebula Field, and Meteoroid
  // all skip this since they have final sourced art loaded by BootScene.
  private placeHazard(placement: HazardPlacement, config: HazardTypeConfig): HazardZoneElement {
    if (config.placeholderTexture && config.shape.kind === 'circle') {
      this.createHazardPlaceholderTexture(
        config.textureKey,
        config.shape.radius,
        config.placeholderTexture.color,
        config.placeholderTexture.alpha,
      );
    }

    const hazard = new HazardZoneElement(this, {
      ...config,
      x: placement.x,
      y: placement.y,
      textureKey: placement.textureKey ?? config.textureKey,
      rotationRadians: placement.rotationRadians,
    });
    this.hazards.push(hazard);
    return hazard;
  }

  // Placeholder texture for the one hazardConfig.ts entry with no sourced
  // art yet (Solar Flare, docs/STATUS.md) -- a flat generated circle, same
  // procedural-texture precedent as everything else added this phase
  // (createObjectiveMarkerTexture, ScanInteractElement's ring, ...). Real
  // per-hazard art is tracked in trailing_edge_art_asset_list.md.
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
