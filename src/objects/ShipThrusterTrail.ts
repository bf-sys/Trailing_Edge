import Phaser from 'phaser';
import { getPlayerShip, getExplorationController } from '../systems/ExplorationController';
import { shipConfig } from '../config/shipConfig';
import { thrusterVfxConfig } from '../config/thrusterVfxConfig';

const THRUSTER_KEY = 'thruster_particle';

// Called once from BootScene, same pattern as createDestinationMarkerTexture
// (DestinationMarker.ts) -- a small soft glow, generated once into the
// global texture manager. Three concentric circles at decreasing radius/
// increasing alpha (rather than one flat-alpha fill, the hazard-placeholder
// pattern) so it reads as a glow instead of a hard-edged dot once the
// emitter scales it down over a particle's lifetime.
export function createThrusterParticleTexture(scene: Phaser.Scene): void {
  if (scene.textures.exists(THRUSTER_KEY)) return;

  const size = thrusterVfxConfig.textureSize;
  const center = size / 2;
  const graphics = scene.make.graphics({}, false);

  graphics.fillStyle(thrusterVfxConfig.color, 0.35);
  graphics.fillCircle(center, center, center);
  graphics.fillStyle(thrusterVfxConfig.color, 0.7);
  graphics.fillCircle(center, center, center * 0.6);
  graphics.fillStyle(thrusterVfxConfig.hotColor, 0.9);
  graphics.fillCircle(center, center, center * 0.25);

  graphics.generateTexture(THRUSTER_KEY, size, size);
  graphics.destroy();
}

// Continuous thruster exhaust trail (docs/reference/phaser-vfx-notes.md's
// particle-emitter recommendation) -- purely decorative, no gameplay effect.
// Display-only, same spirit as ShipStatusArcs/HazardScanOverlay: no gameplay
// system calls into this, it just reads the ship's own Arcade body velocity
// every frame. Unlike those two, both this effect's position AND its
// on/off state must be re-evaluated every frame (not just on an event), so
// there's no constructor-time event subscription -- update() does all the
// work. During a rocketBoost burst (ExplorationController.isBoosting()),
// the same emitter switches to a longer-lived/faster-traveling variant
// (thrusterVfxConfig.boostLifespanMs/boostSpeed) so the trail visibly
// extends for the burst rather than getting a second, separate VFX
// (2026-08-24 follow-up).
export class ShipThrusterTrail {
  private readonly emitter: Phaser.GameObjects.Particles.ParticleEmitter;
  private thrusting = false;
  private boosted = false;

  constructor(scene: Phaser.Scene) {
    this.emitter = scene.add
      .particles(0, 0, THRUSTER_KEY, {
        lifespan: thrusterVfxConfig.lifespanMs,
        speed: thrusterVfxConfig.speed,
        scale: { start: thrusterVfxConfig.scaleStart, end: thrusterVfxConfig.scaleEnd },
        alpha: { start: thrusterVfxConfig.alphaStart, end: thrusterVfxConfig.alphaEnd },
        frequency: thrusterVfxConfig.frequency,
        blendMode: Phaser.BlendModes.ADD,
      })
      .setDepth(thrusterVfxConfig.depth);

    // Starts idle -- emitter.start() only fires once a real thrust frame
    // sets this.thrusting true in update() below.
    this.emitter.stop();
  }

  // Called every frame from GameScene.update() -- position/angle must track
  // the ship's live position and heading, and emission must react to the
  // ship's live speed, unlike ShipStatusArcs's event-driven render(). start()/
  // stop() are only called on an idle<->thrusting transition, not every
  // frame thrusting stays true -- start() resets the emitter's internal flow
  // counter each time it's called, so calling it every frame would fight its
  // own `frequency` timing instead of producing a steady stream.
  update(): void {
    const ship = getPlayerShip();
    if (!ship) return;

    const body = ship.image.body as Phaser.Physics.Arcade.Body;
    const speed = Math.hypot(body.velocity.x, body.velocity.y);

    const boosting = getExplorationController().isBoosting();
    if (boosting !== this.boosted) {
      // updateConfig(), not the emitter.lifespan/speed setters -- those
      // setters only poke each EmitterOp's already-sampled `current` value
      // (fine for lifespan, a plain number) and silently no-op for a
      // min/max range op like `speed` (EmitterOp.onChange() only clamps a
      // single number against the *existing* start/end; it can't install a
      // new range). updateConfig() re-parses a merged config through the
      // same loadConfig() path the constructor used, which is the only way
      // to actually change a ranged op's bounds at runtime.
      this.emitter.updateConfig({
        lifespan: boosting ? thrusterVfxConfig.boostLifespanMs : thrusterVfxConfig.lifespanMs,
        speed: boosting ? thrusterVfxConfig.boostSpeed : thrusterVfxConfig.speed,
      });
      this.boosted = boosting;
    }

    if (speed < thrusterVfxConfig.idleSpeedThreshold) {
      if (this.thrusting) {
        this.emitter.stop();
        this.thrusting = false;
      }
      return;
    }

    // ship.rotation bakes in shipConfig.spriteFacingOffsetRadians (the
    // sprite's "faces up" art rotated to face travel direction) -- subtract
    // it back out to recover the plain travel-direction angle, the same
    // correction ExplorationController's rocketBoost hotkey handler applies.
    const travelAngle = ship.image.rotation - shipConfig.spriteFacingOffsetRadians;
    const rearAngle = travelAngle + Math.PI;
    const rearAngleDeg = Phaser.Math.RadToDeg(rearAngle);

    this.emitter.setPosition(
      ship.image.x + Math.cos(rearAngle) * thrusterVfxConfig.rearOffset,
      ship.image.y + Math.sin(rearAngle) * thrusterVfxConfig.rearOffset,
    );
    this.emitter.setEmitterAngle({
      min: rearAngleDeg - thrusterVfxConfig.angleSpreadDegrees,
      max: rearAngleDeg + thrusterVfxConfig.angleSpreadDegrees,
    });

    if (!this.thrusting) {
      this.emitter.start();
      this.thrusting = true;
    }
  }
}
