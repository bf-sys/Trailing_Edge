import Phaser from 'phaser';
import { destinationMarkerConfig } from '../config/destinationMarkerConfig';
import { getPlayerShip, EXPLORATION_EVENTS } from '../systems/ExplorationController';

const MARKER_KEY = 'destination_marker';
const TEXTURE_SIZE = 72;

// Called once from BootScene, same pattern as StarfieldBackground's
// createStarfieldTextures -- a plain ring, generated once into the global
// texture manager.
export function createDestinationMarkerTexture(scene: Phaser.Scene): void {
  if (scene.textures.exists(MARKER_KEY)) return;

  const graphics = scene.make.graphics({}, false);
  const center = TEXTURE_SIZE / 2;
  const radius = center - destinationMarkerConfig.strokeWidth;

  graphics.lineStyle(destinationMarkerConfig.strokeWidth, destinationMarkerConfig.color, 1);
  graphics.strokeCircle(center, center, radius);
  graphics.generateTexture(MARKER_KEY, TEXTURE_SIZE, TEXTURE_SIZE);
  graphics.destroy();
}

// Quick expanding-ring VFX shown at the ship's click-to-move destination
// (docs/reference/phaser-vfx-notes.md's "scanner ping" pattern) -- purely
// decorative, no gameplay effect. Display-only and event-driven, same
// convention as HudOverlay: reacts to ExplorationController's
// DestinationSet event rather than being called into directly.
export class DestinationMarker {
  constructor(scene: Phaser.Scene) {
    const ship = getPlayerShip();
    if (!ship) return;

    ship.image.on(EXPLORATION_EVENTS.DestinationSet, (position: { x: number; y: number }) => {
      this.playPing(scene, position);
    });
  }

  private playPing(scene: Phaser.Scene, position: { x: number; y: number }): void {
    const ring = scene.add
      .image(position.x, position.y, MARKER_KEY)
      .setDepth(destinationMarkerConfig.depth)
      .setScale(destinationMarkerConfig.startScale)
      .setAlpha(destinationMarkerConfig.startAlpha);

    scene.tweens.add({
      targets: ring,
      scale: destinationMarkerConfig.endScale,
      alpha: 0,
      duration: destinationMarkerConfig.durationMs,
      ease: 'Cubic.Out',
      onComplete: () => ring.destroy(),
    });
  }
}
