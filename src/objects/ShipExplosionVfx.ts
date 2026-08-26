import Phaser from 'phaser';
import { shipExplosionVfxConfig } from '../config/shipExplosionVfxConfig';

const EXPLOSION_KEY = 'ship_explosion_particle';

// Called once from BootScene, same pattern as ShipThrusterTrail's
// createThrusterParticleTexture -- three concentric circles at decreasing
// radius/increasing intensity so it reads as a hot glow once scaled by the
// particle emitter, not a flat dot.
export function createShipExplosionTexture(scene: Phaser.Scene): void {
  if (scene.textures.exists(EXPLOSION_KEY)) return;

  const size = shipExplosionVfxConfig.textureSize;
  const center = size / 2;
  const graphics = scene.make.graphics({}, false);

  graphics.fillStyle(shipExplosionVfxConfig.color, 0.4);
  graphics.fillCircle(center, center, center);
  graphics.fillStyle(shipExplosionVfxConfig.color, 0.8);
  graphics.fillCircle(center, center, center * 0.6);
  graphics.fillStyle(shipExplosionVfxConfig.hotColor, 1);
  graphics.fillCircle(center, center, center * 0.3);

  graphics.generateTexture(EXPLOSION_KEY, size, size);
  graphics.destroy();
}

// Quick arcade-style death burst (owner request, 2026-08-26) -- masks the
// ship's disappearance on a hard fail, with the level restart delayed
// until this finishes. A one-shot particle burst (Phaser's
// emitter.explode(), built for exactly this) plus a light camera shake,
// played at the ship's last position once GameScene hides the real sprite.
// A debris-scatter addition was considered and explicitly declined (owner:
// the burst alone "looks great") -- this is the settled design, not a
// placeholder awaiting a follow-up.
//
// Deliberately NOT event-driven off StructureDepleted itself, unlike every
// other VFX class this session (ScanActivationVfx, TeleportBlinkVfx,
// ShipDamageFlash) -- GameScene's hard-fail handler needs to sequence
// input-disable/physics-pause/ship-hide around this and knows when the
// explosion is done via the onComplete callback, so it calls play()
// directly. First scoped exception to "VFX only reacts, never gates
// gameplay" -- the entire point here is to delay scene.restart() until
// this finishes, not just decorate an already-instant event.
export class ShipExplosionVfx {
  constructor(private readonly scene: Phaser.Scene) {}

  play(x: number, y: number, onComplete: () => void): void {
    const emitter = this.scene.add
      .particles(x, y, EXPLOSION_KEY, {
        lifespan: shipExplosionVfxConfig.lifespanMs,
        speed: shipExplosionVfxConfig.speed,
        scale: { start: shipExplosionVfxConfig.scaleStart, end: shipExplosionVfxConfig.scaleEnd },
        alpha: { start: shipExplosionVfxConfig.alphaStart, end: shipExplosionVfxConfig.alphaEnd },
        blendMode: Phaser.BlendModes.ADD,
        emitting: false,
      })
      .setDepth(shipExplosionVfxConfig.depth);

    emitter.explode(shipExplosionVfxConfig.particleCount);
    this.scene.cameras.main.shake(shipExplosionVfxConfig.shakeDurationMs, shipExplosionVfxConfig.shakeIntensity);

    this.scene.time.delayedCall(shipExplosionVfxConfig.totalDurationMs, () => {
      emitter.destroy();
      onComplete();
    });
  }
}
