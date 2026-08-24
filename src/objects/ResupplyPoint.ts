import Phaser from 'phaser';
import { getPlayerShip } from '../systems/ExplorationController';
import { survivalConfig } from '../config/survivalConfig';
import { resupplyVfxConfig } from '../config/resupplyVfxConfig';
import { setCircleFromWorldRadius } from './arcadeBodyHelpers';

export interface ResupplyPointConfig {
  x: number;
  y: number;
  textureKey: string;
  radius: number;
}

const SPARK_KEY = 'resupply_spark';

// Called once from BootScene, same pattern as createThrusterParticleTexture
// (ShipThrusterTrail.ts) -- a small soft glow, generated once into the
// global texture manager.
export function createResupplySparkTexture(scene: Phaser.Scene): void {
  if (scene.textures.exists(SPARK_KEY)) return;

  const size = resupplyVfxConfig.sparkTextureSize;
  const center = size / 2;
  const graphics = scene.make.graphics({}, false);

  graphics.fillStyle(resupplyVfxConfig.color, 0.35);
  graphics.fillCircle(center, center, center);
  graphics.fillStyle(resupplyVfxConfig.color, 0.7);
  graphics.fillCircle(center, center, center * 0.6);
  graphics.fillStyle(resupplyVfxConfig.hotColor, 0.9);
  graphics.fillCircle(center, center, center * 0.25);

  graphics.generateTexture(SPARK_KEY, size, size);
  graphics.destroy();
}

// The asteroids you visit to repair structure (AsteroidField). No longer
// covers energy — energy regenerates passively (GDD §5/§11.1); the Star
// variant is retired as a resupply object (see EntryWormhole/ExitWormhole,
// §11.14).
//
// Solid obstacle (2026-08-24 rework, matching Debris Field's blocksMovement
// pattern -- CLAUDE.md's "ramifications to an existing level" call was made
// knowingly) -- a resupply stop is now a deliberate routing decision, not a
// drive-through. Immovable so the ship's body is the one Arcade shoves out,
// same as HazardZoneElement's blocksMovement branch.
//
// Repair range no longer comes from an Arcade overlap callback -- now that
// the asteroid also blocksMovement, Arcade's own collision separation keeps
// the ship's center outside the physical collision radius, so requiring
// literal overlap would mean repair could almost never actually trigger.
// Repair range is instead a manual per-frame distance check (physical
// radius + resupplyVfxConfig.rangeBuffer), the same fix
// HazardZoneElement.applyResourceCost() got 2026-08-11 for the same
// underlying reason: a callback-set flag only updates on Arcade's own
// ~60Hz physics step, silently undercounting a rate-based effect
// (structureRepairPerSecond) on a >60Hz display.
export class ResupplyPoint {
  private readonly zone: Phaser.Physics.Arcade.Image;
  private readonly radius: number;
  private readonly beam: Phaser.GameObjects.Graphics;
  private readonly sparkEmitter: Phaser.GameObjects.Particles.ParticleEmitter;
  private repairing = false;
  private impactPoint: { x: number; y: number } | null = null;

  constructor(scene: Phaser.Scene, config: ResupplyPointConfig) {
    this.radius = config.radius;

    this.zone = scene.physics.add.image(config.x, config.y, config.textureKey);
    this.zone.setDisplaySize(config.radius * 2, config.radius * 2);

    const body = this.zone.body as Phaser.Physics.Arcade.Body;
    setCircleFromWorldRadius(body, this.zone, config.radius);
    body.setImmovable(true);

    const ship = getPlayerShip();
    if (ship) scene.physics.add.collider(this.zone, ship.image);

    this.beam = scene.add.graphics().setDepth(resupplyVfxConfig.beamDepth);
    this.sparkEmitter = scene.add
      .particles(0, 0, SPARK_KEY, {
        lifespan: resupplyVfxConfig.sparkLifespanMs,
        speed: resupplyVfxConfig.sparkSpeed,
        scale: { start: resupplyVfxConfig.sparkScaleStart, end: resupplyVfxConfig.sparkScaleEnd },
        alpha: { start: resupplyVfxConfig.sparkAlphaStart, end: 0 },
        frequency: resupplyVfxConfig.sparkFrequency,
        blendMode: Phaser.BlendModes.ADD,
      })
      .setDepth(resupplyVfxConfig.beamDepth);
    this.sparkEmitter.stop();
  }

  // Read-only query for HudOverlay's resupply-waypoint marker (2026-08-21)
  // -- same display-only-consumer contract as HazardZoneElement.getPosition().
  getPosition(): { x: number; y: number } {
    return { x: this.zone.x, y: this.zone.y };
  }

  update(_time: number, delta: number): void {
    const ship = getPlayerShip();
    if (!ship) return;

    const distance = Phaser.Math.Distance.Between(this.zone.x, this.zone.y, ship.image.x, ship.image.y);
    const inRange = distance <= this.radius + resupplyVfxConfig.rangeBuffer;
    // Gated on structure actually being below max, not just proximity --
    // otherwise the laser would keep firing (cosmetically, since
    // repairStructure() itself already no-ops at full) at a ship sitting at
    // full structure. Checked every frame, not just at the inRange
    // transition, so the beam also stops the instant repair tops the ship
    // out mid-session, and starts if the ship takes damage while already
    // sitting in range.
    const snapshot = ship.survival.snapshot();
    const active = inRange && snapshot.currentStructure < snapshot.maxStructure;

    if (active && !this.repairing) {
      // New impact point once per repair session (on becoming active), not
      // every frame -- a fixed point for the session's duration reads as a
      // stable beam; re-randomizing every frame would just look like
      // flicker.
      this.impactPoint = this.pickImpactPoint();
      this.sparkEmitter.start();
    } else if (!active && this.repairing) {
      this.sparkEmitter.stop();
      this.impactPoint = null;
      this.beam.clear();
    }
    this.repairing = active;

    if (!this.repairing) return;

    ship.survival.repairStructure(survivalConfig.structureRepairPerSecond * (delta / 1000));
    this.drawBeam(ship.image.x, ship.image.y);
  }

  // Uniform-in-disk sampling (sqrt of a uniform radius fraction), not a
  // plain `Math.random() * radius` -- the latter clusters points toward the
  // center, since equal radius steps sweep out unequal area the farther out
  // they are.
  private pickImpactPoint(): { x: number; y: number } {
    const r = this.radius * resupplyVfxConfig.impactRadiusFactor * Math.sqrt(Math.random());
    const angle = Math.random() * Math.PI * 2;
    return { x: this.zone.x + Math.cos(angle) * r, y: this.zone.y + Math.sin(angle) * r };
  }

  private drawBeam(shipX: number, shipY: number): void {
    if (!this.impactPoint) return;

    this.beam.clear();
    this.beam.lineStyle(resupplyVfxConfig.beamWidth, resupplyVfxConfig.color, resupplyVfxConfig.beamAlpha);
    this.beam.lineBetween(shipX, shipY, this.impactPoint.x, this.impactPoint.y);

    this.sparkEmitter.setPosition(this.impactPoint.x, this.impactPoint.y);
  }
}
