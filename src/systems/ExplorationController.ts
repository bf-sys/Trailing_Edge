import Phaser from 'phaser';
import { SystemRegistry, type GameSystem } from './SystemRegistry';
import { shipConfig } from '../config/shipConfig';
import { abilityConfig } from '../config/abilityConfig';
import { PlayerShip } from '../objects/PlayerShip';

interface Target {
  x: number;
  y: number;
}

interface BoostState {
  headingRadians: number;
  endTimeMs: number;
}

export const EXPLORATION_EVENTS = {
  DestinationSet: 'onDestinationSet',
  TeleportConfirmed: 'onTeleportConfirmed',
} as const;

export interface TeleportConfirmedPayload {
  from: { x: number; y: number };
  to: { x: number; y: number };
}

function moveToward(current: number, desired: number, maxDelta: number): number {
  const delta = desired - current;
  if (Math.abs(delta) <= maxDelta) return desired;
  return current + Math.sign(delta) * maxDelta;
}

let currentPlayerShip: PlayerShip | undefined;

// Other systems that need the ship (hazards, resupply points, later the
// objective objects) look it up here rather than reaching into
// ExplorationController's internals.
export function getPlayerShip(): PlayerShip | undefined {
  return currentPlayerShip;
}

// Dev-only debug handle, same convention as main.ts's window.game.
if (import.meta.env.DEV) {
  (window as unknown as { getPlayerShip: typeof getPlayerShip }).getPlayerShip = getPlayerShip;
}

// Click-to-move, non-Newtonian ship movement (GDD §4). Owns the PlayerShip
// entity and its input binding; no other system should move the ship.
export class ExplorationController implements GameSystem {
  readonly key = 'exploration';

  private playerShip?: PlayerShip;
  private scene?: Phaser.Scene;
  private target: Target | null = null;
  private boosting: BoostState | null = null;
  private teleportArmed = false;

  init(scene: Phaser.Scene): void {
    const { width, height } = scene.scale;
    this.scene = scene;

    // ExplorationController is a SystemRegistry singleton that outlives any
    // one GameScene attempt (it's re-init'd on every hard-fail restart) — a
    // stale target/boost/arm state from the previous attempt must not carry
    // over.
    this.target = null;
    this.boosting = null;
    this.teleportArmed = false;

    this.playerShip = new PlayerShip(scene, width / 2, height / 2);
    currentPlayerShip = this.playerShip;

    const setTargetFromPointer = (pointer: Phaser.Input.Pointer) => {
      this.target = { x: pointer.worldX, y: pointer.worldY };
    };

    // teleport-armed (2026-08-14 ability rework) repurposes left-click from
    // "move here" to "confirm teleport destination" while aiming --
    // originally right-click, switched 2026-08-15 since a real right-click
    // pops the browser's native context menu (Save image as/Inspect/etc.),
    // which has no preventDefault anywhere in this codebase and made the
    // confirm input unreliable to actually use.
    scene.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (this.teleportArmed) {
        if (pointer.leftButtonDown()) this.confirmTeleport(pointer, scene.time.now);
        return;
      }
      setTargetFromPointer(pointer);
    });
    // Click-and-drag steering (Diablo-style click-to-move already supports
    // this) — keep re-targeting every frame the button is held, not just
    // on the initial click.
    scene.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (this.teleportArmed) return;
      if (pointer.isDown) setTargetFromPointer(pointer);
    });

    // Destination-ping VFX hook (DestinationMarker) — fires once per
    // steering action, on release, rather than every pointermove tick
    // while dragging (which would spam the effect). Emitted via
    // this.playerShip.image (a GameObject, itself an EventEmitter) rather
    // than `this` or a dedicated emitter on ExplorationController: this
    // class is a SystemRegistry singleton that outlives any one GameScene
    // attempt, but this.playerShip.image is recreated fresh every restart,
    // so listeners subscribed to it each restart never accumulate.
    scene.input.on('pointerup', () => {
      if (this.target) {
        this.playerShip?.image.emit(EXPLORATION_EVENTS.DestinationSet, { x: this.target.x, y: this.target.y });
      }
    });

    // Ability hotkeys (GDD §4 "abilities on number-key hotkeys"). Bound
    // here since this is the existing per-scene input-wiring site; each
    // listener reads this.playerShip at press time, not capture time, so it
    // stays correct across a hard-fail restart's fresh PlayerShip. Per-type
    // wiring (2026-08-14 ability rework), not a generic loop over
    // abilityConfig's keys -- each ability's in-world effect now differs.
    // tractorBeam gets no binding here at all: it's driven entirely by
    // PushPullObjectElement's own held-key check (see abilityConfig.ts).
    scene.input.keyboard?.on(`keydown-${abilityConfig.scan.hotkey}`, () => {
      this.playerShip?.ability.tryActivate('scan', scene.time.now);
    });

    // teleport: arm/left-click-confirm (2026-08-14 ability rework, switched
    // from right-click 2026-08-15 -- see the pointerdown handler above) --
    // the hotkey only toggles an aiming state; tryActivate (energy/cooldown
    // spend) happens on confirm, in confirmTeleport() below. Pressing the
    // hotkey again while armed cancels aiming without spending anything --
    // the smallest reasonable cancel affordance, not specified further in
    // docs/ability-rework-brainstorm-2026-08-14.md.
    scene.input.keyboard?.on(`keydown-${abilityConfig.teleport.hotkey}`, () => {
      const ship = this.playerShip;
      if (!ship) return;

      if (this.teleportArmed) {
        this.teleportArmed = false;
        return;
      }
      if (!ship.ability.isUnlocked('teleport')) return;
      this.teleportArmed = true;
    });

    scene.input.keyboard?.on(`keydown-${abilityConfig.rocketBoost.hotkey}`, () => {
      const ship = this.playerShip;
      if (!ship || !ship.ability.tryActivate('rocketBoost', scene.time.now)) return;

      const cost = abilityConfig.rocketBoost;
      const boostSpeed = cost.boostSpeed ?? shipConfig.maxSpeed;
      const boostDurationMs = (cost.boostDurationSeconds ?? 0) * 1000;

      // maxVelocity gotcha (docs/ability-rework-brainstorm-2026-08-14.md):
      // PlayerShip's constructor sets an Arcade body-level cap at
      // shipConfig.maxSpeed -- raise it for the boost window or boostSpeed
      // silently clamps back down. Restored in endBoost().
      ship.image.setMaxVelocity(boostSpeed);
      this.boosting = {
        // ship.rotation already has shipConfig.spriteFacingOffsetRadians
        // baked in (so the "faces up" sprite visually points along its
        // travel direction) -- subtract it back out to recover the plain
        // atan2(vy,vx)-style travel angle the boost velocity math expects.
        headingRadians: ship.image.rotation - shipConfig.spriteFacingOffsetRadians,
        endTimeMs: scene.time.now + boostDurationMs,
      };
    });
  }

  update(time: number, delta: number): void {
    if (!this.playerShip) return;

    this.playerShip.survival.regenEnergy(delta);

    const ship = this.playerShip.image;
    const body = ship.body as Phaser.Physics.Arcade.Body;
    const dt = delta / 1000;

    if (this.boosting) {
      if (time >= this.boosting.endTimeMs) {
        this.endBoost(ship);
        // Falls through to normal movement below, same frame -- the
        // instant boosting ends, control resumes toward this.target (kept
        // updating in the background by pointerdown/pointermove the whole
        // time) with no dead/unresponsive tick in between.
      } else {
        const boostSpeed = abilityConfig.rocketBoost.boostSpeed ?? shipConfig.maxSpeed;
        body.setVelocity(Math.cos(this.boosting.headingRadians) * boostSpeed, Math.sin(this.boosting.headingRadians) * boostSpeed);
        return;
      }
    }

    if (!this.target) {
      this.decelerateToStop(body, dt);
      return;
    }

    const dx = this.target.x - ship.x;
    const dy = this.target.y - ship.y;
    const distance = Math.hypot(dx, dy);

    if (distance <= shipConfig.stopRadius) {
      body.setVelocity(0, 0);
      this.target = null;
      return;
    }

    const desiredSpeed =
      distance < shipConfig.arrivalRadius
        ? shipConfig.maxSpeed * (distance / shipConfig.arrivalRadius)
        : shipConfig.maxSpeed;

    const dirX = dx / distance;
    const dirY = dy / distance;
    const desiredVX = dirX * desiredSpeed;
    const desiredVY = dirY * desiredSpeed;

    const currentSpeed = Math.hypot(body.velocity.x, body.velocity.y);
    const rampRate = desiredSpeed > currentSpeed ? shipConfig.acceleration : shipConfig.deceleration;
    const maxDeltaV = rampRate * dt;

    const vx = moveToward(body.velocity.x, desiredVX, maxDeltaV);
    const vy = moveToward(body.velocity.y, desiredVY, maxDeltaV);
    body.setVelocity(vx, vy);

    if (Math.hypot(vx, vy) > 1) {
      ship.rotation = Math.atan2(vy, vx) + shipConfig.spriteFacingOffsetRadians;
    }
  }

  // Restores the maxVelocity cap raised in the rocketBoost hotkey handler
  // above -- must run before any other movement math this frame, or the
  // ship keeps boostSpeed available a frame longer than intended.
  private endBoost(ship: Phaser.Physics.Arcade.Image): void {
    ship.setMaxVelocity(shipConfig.maxSpeed);
    this.boosting = null;
  }

  // Left-click confirm while armed (2026-08-14 ability rework). Left armed
  // on a failed tryActivate (insufficient energy/still on cooldown) rather
  // than disarming -- nothing about being armed becomes invalid just
  // because the attempt failed, so forcing a hotkey re-press to try again
  // would be needless friction. A plain position set (not a tween/physics
  // move) passes through solid colliders for free, no Debris Field
  // special-casing needed -- unlike rocketBoost, which stops dead against one.
  private confirmTeleport(pointer: Phaser.Input.Pointer, nowMs: number): void {
    const ship = this.playerShip;
    if (!ship) return;

    const destination = this.clampToTeleportRange(pointer.worldX, pointer.worldY);
    if (!ship.ability.tryActivate('teleport', nowMs)) return;

    const origin = { x: ship.image.x, y: ship.image.y };
    ship.image.setPosition(destination.x, destination.y);
    // Blink is still mechanically instant (position updates this frame,
    // same as before) -- this event only drives the display-only
    // TeleportBlinkVfx, it doesn't defer or animate the actual move.
    ship.image.emit(EXPLORATION_EVENTS.TeleportConfirmed, { from: origin, to: destination });
    this.teleportArmed = false;
  }

  // Clamps an arbitrary world point to teleport's fixed maxRange from the
  // ship's current position -- shared by confirmTeleport (actual
  // destination) and getTeleportAimPoint (the range ring's live reticle),
  // so the reticle the player sees while aiming always matches exactly
  // where confirming would actually send them.
  private clampToTeleportRange(worldX: number, worldY: number): { x: number; y: number } {
    const ship = this.playerShip;
    const maxRange = abilityConfig.teleport.maxRange ?? 0;
    if (!ship) return { x: worldX, y: worldY };

    const dx = worldX - ship.image.x;
    const dy = worldY - ship.image.y;
    const distance = Math.hypot(dx, dy);
    if (distance <= maxRange || distance === 0) return { x: worldX, y: worldY };

    const scale = maxRange / distance;
    return { x: ship.image.x + dx * scale, y: ship.image.y + dy * scale };
  }

  // Clears the current click-to-move destination without touching velocity
  // directly -- the next update() frame's !this.target branch takes over
  // via decelerateToStop() on its own. Added 2026-08-21 (experimental) for
  // HazardZoneElement's cancelTargetOnContact: a blocksMovement hazard's
  // collider fires this on every contact frame so steering stops re-driving
  // the ship back toward a destination on the far side of the hazard,
  // fighting Arcade's own collision separation.
  cancelTarget(): void {
    this.target = null;
  }

  // Read-only queries for TeleportRangeRing (display-only, polled every
  // frame the same way ShipStatusArcs tracks the ship continuously).
  isTeleportArmed(): boolean {
    return this.teleportArmed;
  }

  // Read-only query for ShipThrusterTrail (2026-08-24 follow-up to the
  // normal thrust trail) -- lets the VFX layer swap to a longer/faster
  // trail variant for the duration of a rocketBoost burst without owning
  // any boost state itself.
  isBoosting(): boolean {
    return this.boosting !== null;
  }

  getTeleportAimPoint(): { x: number; y: number } | null {
    if (!this.teleportArmed || !this.scene) return null;
    const pointer = this.scene.input.activePointer;
    return this.clampToTeleportRange(pointer.worldX, pointer.worldY);
  }

  private decelerateToStop(body: Phaser.Physics.Arcade.Body, dt: number): void {
    const currentSpeed = Math.hypot(body.velocity.x, body.velocity.y);
    if (currentSpeed === 0) return;

    const maxDeltaV = shipConfig.deceleration * dt;
    if (currentSpeed <= maxDeltaV) {
      body.setVelocity(0, 0);
      return;
    }

    const scale = (currentSpeed - maxDeltaV) / currentSpeed;
    body.setVelocity(body.velocity.x * scale, body.velocity.y * scale);
  }
}

const explorationController = new ExplorationController();
SystemRegistry.register(explorationController);

// Other systems/objects (TeleportRangeRing) look it up here rather than
// constructing their own instance -- same pattern as getPlayerShip()/
// getProgressionManager().
export function getExplorationController(): ExplorationController {
  return explorationController;
}

// Dev-only debug handle, same convention as main.ts's window.game.
if (import.meta.env.DEV) {
  (window as unknown as { getExplorationController: typeof getExplorationController }).getExplorationController =
    getExplorationController;
}
