import Phaser from 'phaser';
import { getPlayerShip } from '../systems/ExplorationController';
import { setCircleFromWorldRadius, setRectFromWorldSize } from './arcadeBodyHelpers';

export type HazardShape =
  | { kind: 'circle'; radius: number }
  | { kind: 'rectangle'; width: number; height: number };

export type HazardMovementPattern = 'static' | 'linear' | 'patrol';
export type HazardActivation = 'continuous' | 'pulsed';

export interface HazardZoneConfig {
  x: number;
  y: number;
  textureKey: string;
  // Player-facing name shown by scan's hazard-ID overlay (see
  // HazardScanOverlay) -- carried through from hazardConfig.ts's
  // per-type displayName, not authored per-placement.
  displayName: string;
  shape: HazardShape;
  movementPattern: HazardMovementPattern;
  speed: number; // px/s; ignored when movementPattern is 'static'
  headingRadians?: number; // direction of travel for 'linear'
  activation: HazardActivation;
  pulseIntervalSeconds?: number; // required when activation is 'pulsed'
  resourceCost: { energy: number; structure: number };
  // A solid, movement-blocking obstacle instead of an overlap-and-drain
  // zone (Debris Field, re-scoped 2026-08-07 — GDD §9/§11.3). No
  // onHazardContact()-equivalent call happens for these: a collider has no
  // "contact cost" to report, it just physically prevents entry.
  blocksMovement?: boolean;
  // Per-placement visual rotation (HazardPlacement.rotationRadians, added
  // 2026-08-15) -- purely cosmetic, applied to the sprite only; doesn't
  // touch the Arcade body (a circle body is rotation-invariant, and
  // rectangle-shape hazards don't use this today). Only meaningful for
  // movementPattern: 'static' hazards -- a 'linear' hazard with
  // spriteFacingOffsetRadians set overrides this at construction and on
  // every reposition() (see below), since a moving hazard's rotation
  // should track its heading, not stay fixed at an authored angle.
  rotationRadians?: number;
  // hazardConfig.ts's per-type spriteFacingOffsetRadians (see that file's
  // comment) -- when set, applied as `heading + offset` every time this
  // hazard's heading is established or changes (construction and
  // reposition()), so the sprite visually faces its direction of travel.
  spriteFacingOffsetRadians?: number;
}

// One parameterized class for all four open-world "zone" hazards (Debris
// Field, Solar Flare, Ion Storm, Nebula Field) plus Meteoroid — GDD §11.3's
// confirmed collapse of five hazard classes into one class + five content
// configs. Phase 1 only exercises the Debris Field config (static,
// movement-blocking, zero resource cost); the other branches exist so
// Phase 2b's remaining hazards are config, not code.
export class HazardZoneElement {
  private readonly config: HazardZoneConfig;
  private readonly zone: Phaser.Physics.Arcade.Image;
  private pulseElapsedSeconds = 0;

  constructor(scene: Phaser.Scene, config: HazardZoneConfig) {
    this.config = config;

    this.zone = scene.physics.add.image(config.x, config.y, config.textureKey);
    if (config.rotationRadians) this.zone.setRotation(config.rotationRadians);
    this.applyShape();
    this.applyMovement();

    // blocksMovement hazards still use a real Arcade collider -- that's a
    // physical separation response (§11.3's "solid collider"), not a
    // per-frame cost calculation, so Arcade's internal ~60Hz physics step
    // rate (decoupled from the render/update rate) doesn't undercount
    // anything here the way it would for resourceCost below.
    if (config.blocksMovement) {
      const ship = getPlayerShip();
      // Immovable so the ship's body is the one that gets pushed out on
      // overlap, not this zone -- still allowed to have its own velocity
      // via applyMovement() above for a future moving+blocking variant.
      (this.zone.body as Phaser.Physics.Arcade.Body).setImmovable(true);
      if (ship) scene.physics.add.collider(this.zone, ship.image);
    }
  }

  // Read-only queries for HazardScanOverlay (2026-08-14 ability rework) --
  // display-only consumers, same contract as every other getter added for a
  // HUD/overlay class in this codebase (e.g. LevelObjectiveTracker's
  // getCurrentObjectiveTarget()). No mutation surface exposed here.
  getPosition(): { x: number; y: number } {
    return { x: this.zone.x, y: this.zone.y };
  }

  getDisplayName(): string {
    return this.config.displayName;
  }

  getShape(): HazardShape {
    return this.config.shape;
  }

  getResourceCost(): { energy: number; structure: number } {
    return this.config.resourceCost;
  }

  getBlocksMovement(): boolean {
    return this.config.blocksMovement ?? false;
  }

  // Mutation surface for MovingHazardManager (2026-08-17) only -- every
  // other consumer above is read-only. Jumps this instance to a fresh
  // position and re-derives its velocity from headingRadians at the
  // config's already-authored speed, same formula applyMovement() used for
  // the initial heading. Used to wrap a 'linear' hazard back into the level
  // once it's drifted out of bounds, instead of destroying/recreating it
  // (GDD §9/§11.3 -- keeps HazardScanOverlay's one-label-per-hazard,
  // built-once assumption valid, since the hazard count never changes).
  reposition(x: number, y: number, headingRadians: number): void {
    this.zone.setPosition(x, y);
    const body = this.zone.body as Phaser.Physics.Arcade.Body;
    body.setVelocity(Math.cos(headingRadians) * this.config.speed, Math.sin(headingRadians) * this.config.speed);
    if (this.config.spriteFacingOffsetRadians !== undefined) {
      this.zone.setRotation(headingRadians + this.config.spriteFacingOffsetRadians);
    }
  }

  update(_time: number, delta: number): void {
    const dt = delta / 1000;

    // Resource-cost contact is checked directly here (distance/AABB against
    // the ship's current position) rather than via scene.physics.add.overlap()
    // -- 2026-08-11 fix. Arcade's overlap *callback* only fires on its own
    // internal ~60Hz physics step, decoupled from the render/update rate; on
    // a >60Hz display the old flag-set-by-callback approach silently missed
    // most render frames' worth of dt, applying drain at only
    // roughly (60/actual fps) of its configured rate while regenEnergy (a
    // plain per-frame call, no physics dependency) ran at full rate. Doing
    // the check here ties contact detection to the exact same dt driving
    // the cost math and everything else in this method.
    if (!this.config.blocksMovement && this.isOverlappingShip()) {
      this.applyResourceCost(dt);
    } else if (this.config.activation === 'pulsed') {
      this.pulseElapsedSeconds = 0; // no partial credit carried across an exit
    }
  }

  private isOverlappingShip(): boolean {
    const ship = getPlayerShip();
    if (!ship) return false;

    const { shape } = this.config;
    if (shape.kind === 'circle') {
      const distance = Phaser.Math.Distance.Between(this.zone.x, this.zone.y, ship.image.x, ship.image.y);
      return distance <= shape.radius;
    }

    return (
      Math.abs(ship.image.x - this.zone.x) <= shape.width / 2 &&
      Math.abs(ship.image.y - this.zone.y) <= shape.height / 2
    );
  }

  private applyShape(): void {
    const { shape } = this.config;
    const body = this.zone.body as Phaser.Physics.Arcade.Body;

    if (shape.kind === 'circle') {
      this.zone.setDisplaySize(shape.radius * 2, shape.radius * 2);
      setCircleFromWorldRadius(body, this.zone, shape.radius);
    } else {
      this.zone.setDisplaySize(shape.width, shape.height);
      setRectFromWorldSize(body, this.zone, shape.width, shape.height);
    }
  }

  private applyMovement(): void {
    const { movementPattern, speed } = this.config;
    const body = this.zone.body as Phaser.Physics.Arcade.Body;

    if (movementPattern === 'static') return;

    if (movementPattern === 'linear') {
      const heading = this.config.headingRadians ?? 0;
      body.setVelocity(Math.cos(heading) * speed, Math.sin(heading) * speed);
      if (this.config.spriteFacingOffsetRadians !== undefined) {
        this.zone.setRotation(heading + this.config.spriteFacingOffsetRadians);
      }
      return;
    }

    // 'patrol' is in the documented type union (GDD §11.3) but no waypoint
    // data is specified anywhere in the contract, and none of the five named
    // hazards (Debris Field, Solar Flare, Ion Storm, Nebula Field, Meteoroid)
    // use it — treat as reserved/unimplemented rather than guessing at a
    // waypoint schema.
    if (import.meta.env.DEV) {
      console.warn('[HazardZoneElement] movementPattern "patrol" is not implemented — treating as static.');
    }
  }

  private applyResourceCost(dt: number): void {
    const ship = getPlayerShip();
    if (!ship) return;

    const { activation, resourceCost, pulseIntervalSeconds } = this.config;

    if (activation === 'continuous') {
      if (resourceCost.energy > 0) ship.survival.consumeEnergy(resourceCost.energy * dt, 'hazard-zone');
      if (resourceCost.structure > 0) ship.survival.consumeStructure(resourceCost.structure * dt, 'hazard-zone');
      return;
    }

    // pulsed
    const interval = pulseIntervalSeconds ?? 1;
    this.pulseElapsedSeconds += dt;
    if (this.pulseElapsedSeconds < interval) return;
    this.pulseElapsedSeconds -= interval;

    if (resourceCost.energy > 0) ship.survival.consumeEnergy(resourceCost.energy, 'hazard-zone');
    if (resourceCost.structure > 0) ship.survival.consumeStructure(resourceCost.structure, 'hazard-zone');
  }
}
