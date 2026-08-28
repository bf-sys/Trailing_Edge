import Phaser from 'phaser';
import { getPlayerShip, EXPLORATION_EVENTS } from '../systems/ExplorationController';
import { ABILITY_EVENTS } from './AbilityComponent';
import { SHIP_SURVIVAL_EVENTS } from './ShipSurvivalComponent';
import { LEVEL_OBJECTIVE_EVENTS, type LevelObjectiveTracker } from './LevelObjectiveTracker';
import { HAZARD_ZONE_EVENTS, type HazardZoneElement } from './HazardZoneElement';
import { RESUPPLY_EVENTS, type ResupplyPoint } from './ResupplyPoint';
import { ENERGY_NODE_EVENTS } from './EnergyNodeElement';
import type { EnergyNodeManager } from './EnergyNodeManager';
import { abilityConfig } from '../config/abilityConfig';
import { thrusterVfxConfig } from '../config/thrusterVfxConfig';
import { sfxConfig, musicConfig, physicalContactSfxCooldownMs, type SfxKey } from '../config/audioConfig';

// Fire-and-forget one-shot, sfxConfig's own volume applied. Exported for
// Scenes with no gameplay event to react to (TitleScene/PauseScene/
// HowToPlayScene/AbilityUnlockScene menu-button clicks) -- those call this
// directly rather than going through an AudioManager instance, which only
// exists per-GameScene-attempt alongside the gameplay objects it listens to.
export function playSfx(scene: Phaser.Scene, key: SfxKey): void {
  scene.sound.play(key, { volume: sfxConfig[key].volume });
}

// Idempotent (2026-08-28) -- TitleScene.create() re-runs every time the
// player returns there (WinScene, PauseScene's "Return to Title", a level
// jump back), and Phaser's SoundManager is one instance shared game-wide,
// not per-Scene -- re-adding/playing on every visit would stack duplicate
// overlapping instances of the same loop. Checked via scene.sound.get()
// (the SoundManager's own instance list) rather than a module-level flag, so
// it stays correct across a full page reload too.
export function startMusicOnce(scene: Phaser.Scene): void {
  const existing = scene.sound.get(musicConfig.key);
  if (existing?.isPlaying) return;
  const music = existing ?? scene.sound.add(musicConfig.key, { volume: musicConfig.volume, loop: true });
  music.play();
}

// GameScene-scoped, event-driven, same convention as ScanActivationVfx/
// TeleportBlinkVfx/ShipDamageFlash -- reacts to events other systems already
// emit rather than being called into directly, and never itself calls
// ShipSurvivalComponent's consume/regen methods (display/audio-only, same
// contract as every VFX class in this file's sibling modules). Only
// thrusterLoop needs a per-frame check (ship velocity has no discrete
// start/stop event), mirroring ShipThrusterTrail's own update() polling.
//
// Two loop sounds (hazardDrainLoop, resupplyLoop) are reference-counted
// rather than tracked as a single active/inactive flag -- a resupplyLoop
// count guards against two ResupplyPoint instances somehow both reporting
// active at once (geometrically near-impossible given one ship, but cheap
// to make correct); a hazardDrainLoop count is load-bearing, not defensive,
// since overlapping hazard zones (e.g. a Nebula Field drifted over by Ion
// Storm's trochoid path) can both be "in contact" simultaneously, and the
// loop must only stop once the LAST one exits, not the first.
export class AudioManager {
  private readonly scene: Phaser.Scene;
  private thrusterSound?: Phaser.Sound.BaseSound;
  private thrusterPlaying = false;
  private hazardDrainSound?: Phaser.Sound.BaseSound;
  private hazardContactCount = 0;
  private resupplySound?: Phaser.Sound.BaseSound;
  private resupplyActiveCount = 0;

  constructor(
    scene: Phaser.Scene,
    deps: {
      hazards: HazardZoneElement[];
      resupplyPoints: ResupplyPoint[];
      energyNodeManager: EnergyNodeManager;
      tracker: LevelObjectiveTracker;
    },
  ) {
    this.scene = scene;
    const ship = getPlayerShip();

    if (ship) {
      // Click-to-move confirm, teleport arm/blink -- same events
      // DestinationMarker/TeleportRangeRing/TeleportBlinkVfx already
      // subscribe to for their own VFX.
      ship.image.on(EXPLORATION_EVENTS.DestinationSet, () => playSfx(scene, 'clickConfirm'));
      ship.image.on(EXPLORATION_EVENTS.TeleportArmed, () => playSfx(scene, 'teleportArm'));
      ship.image.on(EXPLORATION_EVENTS.TeleportConfirmed, () => playSfx(scene, 'teleportBlink'));

      ship.ability.on(ABILITY_EVENTS.Activated, (type: string) => {
        if (type === 'scan') playSfx(scene, 'scanActivate');
        if (type === 'rocketBoost') this.playRocketBoost();
      });

      ship.survival.on(SHIP_SURVIVAL_EVENTS.StructureDepleted, () => playSfx(scene, 'shipExplosion'));
    }

    deps.tracker.on(LEVEL_OBJECTIVE_EVENTS.ProbeFound, () => playSfx(scene, 'probeFound'));
    deps.tracker.on(LEVEL_OBJECTIVE_EVENTS.BeaconReached, () => playSfx(scene, 'beaconReached'));

    deps.hazards.forEach((hazard) => this.wireHazard(hazard));
    deps.resupplyPoints.forEach((resupply) => this.wireResupply(resupply));
    deps.energyNodeManager.on(ENERGY_NODE_EVENTS.Collected, () => playSfx(scene, 'energyPickup'));
  }

  // Called every frame from GameScene.update(), same as ShipThrusterTrail --
  // ship velocity has no discrete start/stop event to subscribe to instead.
  update(): void {
    const ship = getPlayerShip();
    if (!ship) return;

    const body = ship.image.body as Phaser.Physics.Arcade.Body;
    const speed = Math.hypot(body.velocity.x, body.velocity.y);
    const shouldPlay = speed >= thrusterVfxConfig.idleSpeedThreshold;

    if (shouldPlay && !this.thrusterPlaying) {
      this.thrusterSound = this.scene.sound.add('thrusterLoop', { volume: sfxConfig.thrusterLoop.volume, loop: true });
      this.thrusterSound.play();
      this.thrusterPlaying = true;
    } else if (!shouldPlay && this.thrusterPlaying) {
      this.thrusterSound?.stop();
      this.thrusterSound = undefined;
      this.thrusterPlaying = false;
    }
  }

  // Debris Field (zero resourceCost, blocksMovement) gets a debounced
  // contact thud off PhysicalContact -- isOverlappingShip()'s center-vs-
  // radius check (what ContactEnter/ContactExit fire from) never actually
  // triggers for a blocksMovement hazard, since Arcade's own collision
  // separation keeps the ship's center outside that radius (same reasoning
  // ResupplyPoint's own repair-range comment documents). Any hazard with a
  // nonzero resourceCost gets the sustained drain loop off ContactEnter/Exit
  // instead (Ion Storm, Nebula Field -- both 'continuous'), plus a one-shot
  // impact boom for 'impact' hazards (Meteoroid) off ImpactHit. A hazard
  // can't be both today (only Meteoroid combines blocksMovement with a
  // nonzero cost, and it's 'impact', not 'continuous' -- so it lands in the
  // isDrainHazard branch and never registers a PhysicalContact listener).
  private wireHazard(hazard: HazardZoneElement): void {
    const cost = hazard.getResourceCost();
    const isDrainHazard = cost.energy > 0 || cost.structure > 0;

    if (isDrainHazard) {
      hazard.on(HAZARD_ZONE_EVENTS.ContactEnter, () => this.startHazardDrainLoop());
      hazard.on(HAZARD_ZONE_EVENTS.ContactExit, () => this.stopHazardDrainLoop());
      hazard.on(HAZARD_ZONE_EVENTS.ImpactHit, () => playSfx(this.scene, 'meteoroidImpact'));
      return;
    }

    if (!hazard.getBlocksMovement()) return;

    let lastPlayedMs = -Infinity;
    hazard.on(HAZARD_ZONE_EVENTS.PhysicalContact, () => {
      const now = this.scene.time.now;
      if (now - lastPlayedMs < physicalContactSfxCooldownMs) return;
      lastPlayedMs = now;
      playSfx(this.scene, 'debrisImpact');
    });
  }

  private startHazardDrainLoop(): void {
    this.hazardContactCount++;
    if (this.hazardContactCount > 1) return;
    this.hazardDrainSound = this.scene.sound.add('hazardDrainLoop', { volume: sfxConfig.hazardDrainLoop.volume, loop: true });
    this.hazardDrainSound.play();
  }

  private stopHazardDrainLoop(): void {
    this.hazardContactCount = Math.max(0, this.hazardContactCount - 1);
    if (this.hazardContactCount > 0) return;
    this.hazardDrainSound?.stop();
    this.hazardDrainSound = undefined;
  }

  private wireResupply(resupply: ResupplyPoint): void {
    resupply.on(RESUPPLY_EVENTS.RepairStarted, () => {
      this.resupplyActiveCount++;
      if (this.resupplyActiveCount > 1) return;
      this.resupplySound = this.scene.sound.add('resupplyLoop', { volume: sfxConfig.resupplyLoop.volume, loop: true });
      this.resupplySound.play();
    });
    resupply.on(RESUPPLY_EVENTS.RepairStopped, () => {
      this.resupplyActiveCount = Math.max(0, this.resupplyActiveCount - 1);
      if (this.resupplyActiveCount > 0) return;
      this.resupplySound?.stop();
      this.resupplySound = undefined;
    });
  }

  // rocketBoost's source clip (9.3s) is far longer than the burst it plays
  // for (boostDurationSeconds, 0.6s) -- explicitly truncated via a timed
  // stop() rather than relying on the clip's own length, per the "can you
  // terminate playback at any point" conversation this feature came out of.
  // See docs/TODO.md for trimming the source file itself.
  private playRocketBoost(): void {
    const sound = this.scene.sound.add('rocketBoost', { volume: sfxConfig.rocketBoost.volume });
    sound.play();
    const durationMs = (abilityConfig.rocketBoost.boostDurationSeconds ?? 0) * 1000;
    this.scene.time.delayedCall(durationMs, () => sound.stop());
  }
}
