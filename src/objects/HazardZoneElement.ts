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
  shape: HazardShape;
  movementPattern: HazardMovementPattern;
  speed: number; // px/s; ignored when movementPattern is 'static'
  headingRadians?: number; // direction of travel for 'linear'
  activation: HazardActivation;
  pulseIntervalSeconds?: number; // required when activation is 'pulsed'
  resourceCost: { energy: number; structure: number };
}

// One parameterized class for all four open-world "zone" hazards (Debris
// Field, Solar Flare, Ion Storm, Nebula Field) plus Meteoroid — GDD §11.3's
// confirmed collapse of five hazard classes into one class + five content
// configs. Phase 1 only exercises the Debris Field config (static,
// continuous, structure-cost); the other branches exist so Phase 2b's
// remaining hazards are config, not code.
export class HazardZoneElement {
  private readonly config: HazardZoneConfig;
  private readonly zone: Phaser.Physics.Arcade.Image;
  private overlapping = false;
  private pulseElapsedSeconds = 0;

  constructor(scene: Phaser.Scene, config: HazardZoneConfig) {
    this.config = config;

    this.zone = scene.physics.add.image(config.x, config.y, config.textureKey);
    this.applyShape();
    this.applyMovement();

    const ship = getPlayerShip();
    if (ship) {
      scene.physics.add.overlap(this.zone, ship.image, () => {
        this.overlapping = true;
      });
    }
  }

  update(_time: number, delta: number): void {
    const dt = delta / 1000;

    if (this.overlapping) {
      this.applyResourceCost(dt);
    } else if (this.config.activation === 'pulsed') {
      this.pulseElapsedSeconds = 0; // no partial credit carried across an exit
    }

    this.overlapping = false; // re-armed by next frame's overlap callback
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
