import Phaser from 'phaser';
import { getPlayerShip, getExplorationController } from '../systems/ExplorationController';
import { setCircleFromWorldRadius, setRectFromWorldSize } from './arcadeBodyHelpers';

export type HazardShape =
  | { kind: 'circle'; radius: number }
  | { kind: 'rectangle'; width: number; height: number };

export type HazardMovementPattern = 'static' | 'linear' | 'patrol';
// 'impact' applies resourceCost as a one-time lump on contact rather than a
// per-second/per-pulse rate, gated by hitCooldownSeconds so a lingering
// overlap (e.g. getting shoved out by a blocksMovement collider) doesn't
// re-trigger every frame. Meteoroid is the first user (GDD §9's collision
// rework); any hazard can combine it with blocksMovement.
export type HazardActivation = 'continuous' | 'pulsed' | 'impact';

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
  hitCooldownSeconds?: number; // required when activation is 'impact'
  resourceCost: { energy: number; structure: number };
  // A solid, movement-blocking obstacle instead of a fly-through zone
  // (Debris Field, re-scoped 2026-08-07 — GDD §9/§11.3). Independent of
  // resourceCost/activation as of 2026-08-21 -- see the top of this file's
  // activation comment -- a blocksMovement hazard can still charge a
  // contact cost (e.g. Meteoroid's 'impact' hits); it just also physically
  // blocks entry via a real Arcade collider.
  blocksMovement?: boolean;
  // Experimental, added 2026-08-21 for Meteoroid: clears the player's
  // click-to-move destination on every contact with this hazard's
  // collider. Only meaningful when blocksMovement is true. Exists because
  // ExplorationController.update() re-drives velocity toward the target
  // every frame regardless of what's in the way -- if that target sits
  // beyond a blocksMovement hazard, steering fights Arcade's collision
  // separation frame after frame, which reads as getting stuck on it
  // rather than bouncing off. Cancelling the target lets
  // ExplorationController's decelerateToStop() take over instead, so
  // separation isn't immediately re-opposed. Per-hazard-type flag, not a
  // blanket blocksMovement behavior -- scoped to Meteoroid until playtesting
  // confirms it's worth generalizing.
  cancelTargetOnContact?: boolean;
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
  private readonly scene: Phaser.Scene;
  private readonly config: HazardZoneConfig;
  private readonly zone: Phaser.Physics.Arcade.Image;
  private pulseElapsedSeconds = 0;
  private lastHitTimeMs = -Infinity; // allows an 'impact' hazard's first contact to land immediately

  constructor(scene: Phaser.Scene, config: HazardZoneConfig) {
    this.scene = scene;
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
      // cancelTargetOnContact (see the field's comment above): fires every
      // physics step the bodies remain in contact, same as the cost side of
      // things -- repeatedly clearing an already-null target is harmless.
      const onCollide = config.cancelTargetOnContact ? () => getExplorationController().cancelTarget() : undefined;
      if (ship) scene.physics.add.collider(this.zone, ship.image, onCollide);
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

  update(time: number, delta: number): void {
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
    // the cost math and everything else in this method. The same manual
    // check serves 'impact' hazards too -- a hit is a discrete event gated
    // by hitCooldownSeconds, not a rate, so the 60Hz-undercount concern
    // above doesn't apply, and reusing this check avoids a second, physics
    // step-tied collision-detection path.
    //
    // blocksMovement no longer gates cost application (2026-08-21) -- a
    // hazard can be a solid collider *and* charge a contact cost (Meteoroid:
    // GDD §9's collision rework); it's just that today only Meteoroid's
    // resourceCost is nonzero while blocksMovement, so Debris Field's
    // behavior is unchanged in practice.
    //
    // 'impact' hazards use isCollidingWithShip() below rather than
    // isOverlappingShip(), and are checked before it -- isOverlappingShip()
    // treats the ship as a dimensionless point against the hazard's own
    // radius, an approximation that's harmless for the three big,
    // pass-through energy hazards (radius 70-100 vs. the ship's ~23-28px
    // half-extent) but wrong for a physically-sized, blocksMovement hazard
    // like Meteoroid (radius 40): Arcade's real collision response would
    // shove the ship's center back outside that naive radius before it ever
    // got close enough to register, so the hit would rarely land.
    if (this.config.activation === 'impact') {
      if (this.isCollidingWithShip()) this.applyImpactCost(time);
      return;
    }

    if (this.isOverlappingShip()) {
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

  // Body-accurate overlap test (circle vs. the ship's rectangle body, via
  // Arcade's own intersection math) rather than isOverlappingShip()'s
  // center-point approximation -- see the comment above its call site for
  // why 'impact' hazards need this instead.
  private isCollidingWithShip(): boolean {
    const ship = getPlayerShip();
    if (!ship) return false;
    return this.scene.physics.overlap(this.zone, ship.image);
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

  // 'impact' activation: resourceCost is a flat one-time hit, not a rate --
  // applied once per hitCooldownSeconds window regardless of how long the
  // overlap persists, so getting physically shoved out by a blocksMovement
  // collider (see constructor) doesn't re-trigger the same hit every frame
  // while separation is still resolving.
  private applyImpactCost(time: number): void {
    const ship = getPlayerShip();
    if (!ship) return;

    const cooldownMs = (this.config.hitCooldownSeconds ?? 1) * 1000;
    if (time - this.lastHitTimeMs < cooldownMs) return;
    this.lastHitTimeMs = time;

    const { resourceCost } = this.config;
    if (resourceCost.energy > 0) ship.survival.consumeEnergy(resourceCost.energy, 'hazard-zone');
    if (resourceCost.structure > 0) ship.survival.consumeStructure(resourceCost.structure, 'hazard-zone');
  }
}
