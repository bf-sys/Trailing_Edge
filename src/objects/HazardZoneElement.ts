import Phaser from 'phaser';
import { getPlayerShip, getExplorationController } from '../systems/ExplorationController';
import { setCircleFromWorldRadius, setRectFromWorldSize } from './arcadeBodyHelpers';

export type HazardShape =
  | { kind: 'circle'; radius: number }
  | { kind: 'rectangle'; width: number; height: number };

// 'trochoid' (added 2026-08-25, Ion Storm experiment -- user request): an
// invisible "carrier" point advances in a straight line exactly like
// 'linear' (same speed/headingRadians), but the hazard's actual drawn
// position orbits that carrier at orbitRadius/orbitAngularSpeedRadiansPerSecond
// instead of sitting on it -- a corkscrewing/spirograph path that sweeps a
// band roughly 2x orbitRadius wide across the map instead of a single
// infinitely-thin line, on purpose distinct from Meteoroid's straight
// charge. See HazardZoneElement's initTrochoid()/update() for the math.
export type HazardMovementPattern = 'static' | 'linear' | 'trochoid' | 'patrol';
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
  // Added 2026-08-21 for Meteoroid, alongside cancelTargetOnContact: on a
  // successful 'impact' hit (same hitCooldownSeconds gate as resourceCost,
  // applied from the same call site), sets the ship's velocity to this
  // speed pointed directly away from this hazard's center -- a deliberate
  // outward impulse, since Arcade's own collision separation has zero
  // restitution and produces no bounce on its own (confirmed via the
  // cancelTargetOnContact experiment: without an explicit kick, contact
  // just resolves to a dead stop, which is hard to escape by normal
  // acceleration alone while still touching the hazard's collider). Only
  // meaningful alongside blocksMovement + activation: 'impact'.
  knockbackSpeed?: number;
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
  // Continuous cosmetic self-rotation (added 2026-08-21, Ion Storm's
  // swirl), independent of movementPattern/heading -- unlike
  // spriteFacingOffsetRadians (which sets an absolute rotation once per
  // heading change, to face direction of travel), this increments rotation
  // every update() frame regardless of whether or how the hazard is
  // moving. Positive values spin clockwise (Phaser's y-down screen space
  // makes increasing rotation read as clockwise, same as plain canvas
  // rotation). Purely visual -- doesn't touch the Arcade body, same as
  // rotationRadians above.
  spinRadiansPerSecond?: number;
  // Radius (px) of the loop around the carrier point -- only meaningful
  // when movementPattern is 'trochoid'. 0/undefined degenerates to plain
  // linear travel (the offset term vanishes), so this is safe to leave
  // unset on any non-trochoid hazard.
  orbitRadius?: number;
  // Angular speed (radians/s) of that loop -- only meaningful alongside
  // orbitRadius. Independent of spinRadiansPerSecond (that's the sprite's
  // own cosmetic self-rotation; this is the path's geometry) -- a hazard
  // can have both at once, spiraling through the map while its texture
  // also spins in place.
  orbitAngularSpeedRadiansPerSecond?: number;
  // 'continuous' activation only (added 2026-08-25, Nebula Field, user
  // request) -- linearly ramps resourceCost's effective rate the longer the
  // ship stays continuously inside this hazard, so lingering is punished
  // more than proportionally to time while a quick pass-through stays
  // nearly unaffected. Effective rate at a given moment is
  // `resourceCost * (1 + exposureRampPerSecond * continuousExposureSeconds)`
  // -- see update()/applyResourceCost(). continuousExposureSeconds resets to
  // 0 the instant the ship leaves the zone (same reset-on-exit pattern
  // pulseElapsedSeconds already uses), so there's no "banked" penalty across
  // separate passes. Unset/0 means no ramp -- the exact pre-2026-08-25
  // behavior, still the default for every other hazard (deliberately not
  // applied to Ion Storm -- see the field's own decision note in
  // hazardConfig.ts).
  exposureRampPerSecond?: number;
  // Render layer override (added 2026-08-24, Ion Storm/Meteoroid): unset
  // means "leave at Phaser's default depth 0," same layer as every other
  // static world object (Debris Field, Nebula Field, Solar Flare, Probe,
  // resupply, wormholes, ...). Set on the two 'linear' hazards so they
  // draw above that static layer but still below PlayerShip's depth 10
  // (see PlayerShip.ts) -- the codebase's established depth ladder,
  // documented alongside destinationMarkerConfig/thrusterVfxConfig/etc.
  depth?: number;
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
  private continuousExposureSeconds = 0; // exposureRampPerSecond's input -- see that field's comment

  // 'trochoid' movement state -- the carrier is an invisible point that
  // advances in a straight line (same math 'linear' uses for its Arcade
  // velocity, just hand-tracked instead of handed to the physics body);
  // the hazard's actual drawn position is the carrier plus a rotating
  // offset (trochoidAngle around orbitRadius). Unused/left at zero for
  // every other movementPattern.
  private trochoidCarrierX = 0;
  private trochoidCarrierY = 0;
  private trochoidHeadingRadians = 0;
  private trochoidAngle = 0;

  // 'linear' movement state (2026-08-26 fix) -- the hazard's *current*
  // heading, which reposition() changes on every wrap (MovingHazardManager),
  // as distinct from config.headingRadians (the fixed authored value for the
  // hazard's first leg only). update() redrives velocity from this every
  // frame -- see that method's comment for why.
  private linearHeadingRadians = 0;

  constructor(scene: Phaser.Scene, config: HazardZoneConfig) {
    this.scene = scene;
    this.config = config;

    this.zone = scene.physics.add.image(config.x, config.y, config.textureKey);
    if (config.depth !== undefined) this.zone.setDepth(config.depth);
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
    if (this.config.movementPattern === 'trochoid') {
      this.initTrochoid(x, y, headingRadians);
      if (this.config.spriteFacingOffsetRadians !== undefined) {
        this.zone.setRotation(headingRadians + this.config.spriteFacingOffsetRadians);
      }
      return;
    }

    this.zone.setPosition(x, y);
    this.linearHeadingRadians = headingRadians;
    const body = this.zone.body as Phaser.Physics.Arcade.Body;
    body.setVelocity(Math.cos(headingRadians) * this.config.speed, Math.sin(headingRadians) * this.config.speed);
    if (this.config.spriteFacingOffsetRadians !== undefined) {
      this.zone.setRotation(headingRadians + this.config.spriteFacingOffsetRadians);
    }
  }

  // Resets the carrier/angle for a fresh 'trochoid' leg (construction or a
  // MovingHazardManager wrap). Angle always restarts at 0, and the carrier
  // is placed orbitRadius *behind* (x, y) along the angle-0 direction so the
  // hazard's actual displayed position lands exactly on (x, y) this frame --
  // otherwise the visible sprite would jump orbitRadius away from whatever
  // point a level author/MovingHazardManager actually asked for. Also zeroes
  // Arcade velocity, since position is hand-driven every frame in update()
  // rather than left to the physics body's own integration.
  private initTrochoid(x: number, y: number, headingRadians: number): void {
    const radius = this.config.orbitRadius ?? 0;
    this.trochoidHeadingRadians = headingRadians;
    this.trochoidAngle = 0;
    this.trochoidCarrierX = x - radius;
    this.trochoidCarrierY = y;
    (this.zone.body as Phaser.Physics.Arcade.Body).setVelocity(0, 0);
    this.zone.setPosition(x, y);
  }

  update(time: number, delta: number): void {
    const dt = delta / 1000;

    if (this.config.movementPattern === 'trochoid') {
      const radius = this.config.orbitRadius ?? 0;
      const angularSpeed = this.config.orbitAngularSpeedRadiansPerSecond ?? 0;
      this.trochoidCarrierX += Math.cos(this.trochoidHeadingRadians) * this.config.speed * dt;
      this.trochoidCarrierY += Math.sin(this.trochoidHeadingRadians) * this.config.speed * dt;
      this.trochoidAngle += angularSpeed * dt;
      this.zone.setPosition(
        this.trochoidCarrierX + Math.cos(this.trochoidAngle) * radius,
        this.trochoidCarrierY + Math.sin(this.trochoidAngle) * radius,
      );
    }

    // 2026-08-26 fix: re-assert a 'linear' hazard's velocity every frame
    // instead of trusting Arcade to keep integrating the value set once at
    // construction/reposition() -- confirmed bug (tools/adversarial-qa's
    // repro-meteoroid-boundary-stall.mjs): a glancing collision between the
    // ship and this hazard landing in the same physics step as the ship's
    // own world-bounds clamp can zero BOTH bodies' velocity, and with
    // nothing redriving it, a zeroed 'linear' hazard stayed frozen forever
    // (short of MovingHazardManager's out-of-bounds wrap threshold, so it
    // could never self-recover through the normal path either). Redriving
    // here is self-healing -- if Arcade zeroes it again for any reason, the
    // very next frame restores the correct velocity instead of leaving it
    // stuck. Same "don't trust Arcade to hold onto a hazard's motion"
    // precedent 'trochoid' above already established for Ion Storm (that
    // one hand-drives position and zeroes Arcade velocity outright; this one
    // keeps real Arcade-driven movement, since Meteoroid's blocksMovement
    // collision response depends on it, just stops trusting it to persist
    // unattended).
    if (this.config.movementPattern === 'linear') {
      const body = this.zone.body as Phaser.Physics.Arcade.Body;
      body.setVelocity(Math.cos(this.linearHeadingRadians) * this.config.speed, Math.sin(this.linearHeadingRadians) * this.config.speed);
    }

    if (this.config.spinRadiansPerSecond) this.zone.rotation += this.config.spinRadiansPerSecond * dt;

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
      // exposureRampPerSecond's clock -- counts up only while actually
      // inside a 'continuous' hazard. Incremented before applyResourceCost()
      // reads it below; whether the ramp uses the pre- or post-increment
      // value doesn't matter in practice, a single frame's dt is negligible
      // against the ramp's own timescale.
      if (this.config.activation === 'continuous') this.continuousExposureSeconds += dt;
      this.applyResourceCost(dt);
    } else {
      this.continuousExposureSeconds = 0; // no partial credit carried across an exit
      if (this.config.activation === 'pulsed') this.pulseElapsedSeconds = 0;
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
      this.linearHeadingRadians = heading;
      body.setVelocity(Math.cos(heading) * speed, Math.sin(heading) * speed);
      if (this.config.spriteFacingOffsetRadians !== undefined) {
        this.zone.setRotation(heading + this.config.spriteFacingOffsetRadians);
      }
      return;
    }

    if (movementPattern === 'trochoid') {
      this.initTrochoid(this.config.x, this.config.y, this.config.headingRadians ?? 0);
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
      // exposureRampPerSecond (2026-08-25, Nebula Field): linearly scales
      // the effective rate by how long the ship's been continuously inside
      // this hazard. Unset/0 -> ramp is always 1, i.e. the exact
      // pre-2026-08-25 flat-rate behavior every other 'continuous' hazard
      // still uses.
      const ramp = 1 + (this.config.exposureRampPerSecond ?? 0) * this.continuousExposureSeconds;
      if (resourceCost.energy > 0) ship.survival.consumeEnergy(resourceCost.energy * ramp * dt, 'hazard-zone');
      if (resourceCost.structure > 0) ship.survival.consumeStructure(resourceCost.structure * ramp * dt, 'hazard-zone', this.getPosition());
      return;
    }

    // pulsed
    const interval = pulseIntervalSeconds ?? 1;
    this.pulseElapsedSeconds += dt;
    if (this.pulseElapsedSeconds < interval) return;
    this.pulseElapsedSeconds -= interval;

    if (resourceCost.energy > 0) ship.survival.consumeEnergy(resourceCost.energy, 'hazard-zone');
    if (resourceCost.structure > 0) ship.survival.consumeStructure(resourceCost.structure, 'hazard-zone', this.getPosition());
  }

  // 'impact' activation: resourceCost is a flat one-time hit, not a rate --
  // applied once per hitCooldownSeconds window regardless of how long the
  // overlap persists, so getting physically shoved out by a blocksMovement
  // collider (see constructor) doesn't re-trigger the same hit every frame
  // while separation is still resolving. knockbackSpeed (if set) rides the
  // same gate -- one hit, one kick.
  private applyImpactCost(time: number): void {
    const ship = getPlayerShip();
    if (!ship) return;

    const cooldownMs = (this.config.hitCooldownSeconds ?? 1) * 1000;
    if (time - this.lastHitTimeMs < cooldownMs) return;
    this.lastHitTimeMs = time;

    const { resourceCost } = this.config;
    if (resourceCost.energy > 0) ship.survival.consumeEnergy(resourceCost.energy, 'hazard-zone');
    if (resourceCost.structure > 0) ship.survival.consumeStructure(resourceCost.structure, 'hazard-zone', this.getPosition());

    if (this.config.knockbackSpeed) this.applyKnockback(ship.image, this.config.knockbackSpeed);
  }

  // Runs after ExplorationController.update() this same frame (GameScene.update()'s
  // SystemRegistry pass, which drives ExplorationController, precedes its
  // hazards.forEach() pass), so this velocity isn't immediately overwritten
  // by steering before the next frame -- from there, decelerateToStop()
  // (this.target is already null via cancelTargetOnContact) decays it
  // naturally like coasting, the same as any other ramp-down.
  // Perpendicular to the hazard's line of travel, not radially outward from
  // its center -- a straight-on hit's radial direction points straight back
  // the way the ship came, which a still-moving hazard just catches back up
  // to (playtesting: still felt "sticky" head-on with the radial version).
  // Deflecting sideways, out of the hazard's path, is what actually
  // resolves a head-on hit. Static hazards have no defined line of travel;
  // headingRadians defaults to 0 the same way applyMovement()'s does.
  private applyKnockback(ship: Phaser.Physics.Arcade.Image, speed: number): void {
    const heading = this.config.headingRadians ?? 0;
    const perpX = -Math.sin(heading);
    const perpY = Math.cos(heading);

    // Pick whichever perpendicular side the ship is already offset toward
    // (sign of its position relative to the hazard's travel line), so the
    // kick continues a glancing deflection rather than an arbitrary
    // left/right. A true dead-center hit has no side to prefer; default to
    // +perp deterministically rather than leaving the ship with no lateral
    // kick at all (Math.sign(0) is 0, which is falsy -- `|| 1` catches it).
    const dx = ship.x - this.zone.x;
    const dy = ship.y - this.zone.y;
    const side = Math.sign(dx * perpX + dy * perpY) || 1;

    (ship.body as Phaser.Physics.Arcade.Body).setVelocity(perpX * side * speed, perpY * side * speed);
  }
}
