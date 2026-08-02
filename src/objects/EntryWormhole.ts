import Phaser from 'phaser';
import { waypointTintConfig } from '../config/waypointTintConfig';

export interface EntryWormholeConfig {
  x: number;
  y: number;
  textureKey: string;
  radius: number;
}

// The level's launch position (GDD §11.14, split from the old HomeMarker).
// Visual-only — no physics/overlap, since nothing gameplay-relevant happens
// if the ship drifts back over it later; the ship already starts on top of
// it. Starts tinted "active" (you just arrived through it) and closes
// shortly after the level begins, per waypointTintConfig.entryCloseDelayMs.
export class EntryWormhole {
  constructor(scene: Phaser.Scene, config: EntryWormholeConfig) {
    const image = scene.add.image(config.x, config.y, config.textureKey);
    image.setDisplaySize(config.radius * 2, config.radius * 2);
    image.setTint(waypointTintConfig.activeTint);

    scene.time.delayedCall(waypointTintConfig.entryCloseDelayMs, () => {
      image.setTint(waypointTintConfig.inactiveTint);
    });
  }
}
