import Phaser from 'phaser';
import { getPlayerShip } from '../systems/ExplorationController';
import { setCircleFromWorldRadius } from './arcadeBodyHelpers';
import { energyNodeConfig } from '../config/energyNodeConfig';
import { energyNodeVfxConfig } from '../config/energyNodeVfxConfig';
import type { Point } from '../levels/levelTypes';

export const ENERGY_NODE_KEY = 'energy_node_glow';

// Called once from BootScene, same pattern as createThrusterParticleTexture/
// createResupplySparkTexture -- a small soft glow, generated once into the
// global texture manager.
export function createEnergyNodeTexture(scene: Phaser.Scene): void {
  if (scene.textures.exists(ENERGY_NODE_KEY)) return;

  const size = energyNodeVfxConfig.textureSize;
  const center = size / 2;
  const graphics = scene.make.graphics({}, false);

  graphics.fillStyle(energyNodeVfxConfig.color, 0.35);
  graphics.fillCircle(center, center, center);
  graphics.fillStyle(energyNodeVfxConfig.color, 0.7);
  graphics.fillCircle(center, center, center * 0.6);
  graphics.fillStyle(energyNodeVfxConfig.hotColor, 0.9);
  graphics.fillCircle(center, center, center * 0.25);

  graphics.generateTexture(ENERGY_NODE_KEY, size, size);
  graphics.destroy();
}

// SubSpace-style "green" pickup (2026-08-24): instant overlap-trigger, same
// arrival pattern as ProbeObject, granting a flat
// energyNodeConfig.rechargeAmount via ShipSurvivalComponent.rechargeEnergy().
// Wraps rather than destroys/respawns -- EnergyNodeManager owns a fixed pool
// of these (same "wrap, don't replace" choice MovingHazardManager made for
// hazards): on collection this instance hides/disables its body and starts
// a cooldown; once isReadyToRespawn() is true, EnergyNodeManager (which owns
// placement/keep-out logic) calls respawnAt() with a freshly chosen
// position.
export class EnergyNodeElement {
  private readonly zone: Phaser.Physics.Arcade.Image;
  private readonly glowEmitter: Phaser.GameObjects.Particles.ParticleEmitter;
  private readonly burstEmitter: Phaser.GameObjects.Particles.ParticleEmitter;
  private readonly pulseTween: Phaser.Tweens.Tween;
  private collected = false;
  private cooldownRemainingMs = 0;

  constructor(scene: Phaser.Scene, position: Point) {
    this.zone = scene.physics.add.image(position.x, position.y, ENERGY_NODE_KEY);
    this.zone.setDisplaySize(energyNodeConfig.radius * 2, energyNodeConfig.radius * 2);
    const body = this.zone.body as Phaser.Physics.Arcade.Body;
    setCircleFromWorldRadius(body, this.zone, energyNodeConfig.radius);

    this.glowEmitter = scene.add
      .particles(position.x, position.y, ENERGY_NODE_KEY, {
        lifespan: energyNodeVfxConfig.sparkleLifespanMs,
        speed: energyNodeVfxConfig.sparkleSpeed,
        scale: { start: energyNodeVfxConfig.sparkleScaleStart, end: energyNodeVfxConfig.sparkleScaleEnd },
        alpha: { start: energyNodeVfxConfig.sparkleAlphaStart, end: 0 },
        frequency: energyNodeVfxConfig.sparkleFrequency,
        blendMode: Phaser.BlendModes.ADD,
      })
      .setDepth(energyNodeVfxConfig.depth);

    this.burstEmitter = scene.add
      .particles(0, 0, ENERGY_NODE_KEY, {
        lifespan: energyNodeVfxConfig.burstLifespanMs,
        speed: energyNodeVfxConfig.burstSpeed,
        scale: { start: energyNodeVfxConfig.burstScaleStart, end: energyNodeVfxConfig.burstScaleEnd },
        alpha: { start: energyNodeVfxConfig.burstAlphaStart, end: 0 },
        blendMode: Phaser.BlendModes.ADD,
      })
      .setDepth(energyNodeVfxConfig.depth);
    this.burstEmitter.stop();

    this.zone.setScale(energyNodeVfxConfig.pulseScaleFrom).setAlpha(energyNodeVfxConfig.pulseAlphaFrom);
    this.pulseTween = scene.tweens.add({
      targets: this.zone,
      scale: energyNodeVfxConfig.pulseScaleTo,
      alpha: energyNodeVfxConfig.pulseAlphaTo,
      duration: energyNodeVfxConfig.pulseDurationMs,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.InOut',
    });

    const ship = getPlayerShip();
    if (ship) scene.physics.add.overlap(this.zone, ship.image, () => this.handleCollect());
  }

  update(_time: number, delta: number): void {
    if (!this.collected) return;
    this.cooldownRemainingMs -= delta;
  }

  isReadyToRespawn(): boolean {
    return this.collected && this.cooldownRemainingMs <= 0;
  }

  getPosition(): Point {
    return { x: this.zone.x, y: this.zone.y };
  }

  // Read by EnergyNodeManager's maxNodesNearObjective cap -- a collected
  // node (hidden, cooling down) doesn't count toward "how many are
  // currently sitting near the objective."
  isLive(): boolean {
    return !this.collected;
  }

  // EnergyNodeManager-only mutation surface, same contract as
  // HazardZoneElement.reposition() -- every other consumer is read-only.
  respawnAt(x: number, y: number): void {
    this.zone.setPosition(x, y);
    this.zone.setVisible(true);
    (this.zone.body as Phaser.Physics.Arcade.Body).enable = true;
    this.glowEmitter.setPosition(x, y);
    this.glowEmitter.start();
    this.pulseTween.restart();
    this.collected = false;
  }

  private handleCollect(): void {
    if (this.collected) return;
    this.collected = true;
    this.cooldownRemainingMs = energyNodeConfig.respawnCooldownSeconds * 1000;

    getPlayerShip()?.survival.rechargeEnergy(energyNodeConfig.rechargeAmount);

    this.burstEmitter.explode(energyNodeVfxConfig.burstCount, this.zone.x, this.zone.y);
    this.zone.setVisible(false);
    (this.zone.body as Phaser.Physics.Arcade.Body).enable = false;
    this.glowEmitter.stop();
    this.pulseTween.pause();
  }
}
