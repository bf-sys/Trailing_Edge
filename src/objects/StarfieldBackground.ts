import Phaser from 'phaser';

export const STARFIELD_FAR_KEY = 'starfield_far';
export const STARFIELD_NEAR_KEY = 'starfield_near';

interface StarfieldLayerSpec {
  key: string;
  tileSize: number;
  starCount: number;
  minRadius: number;
  maxRadius: number;
  minAlpha: number;
  maxAlpha: number;
}

// Procedurally generated placeholder tiles — per-level backgrounds/starfields
// are still unsourced (docs/trailing_edge_art_asset_list.md §2.1). Two tile
// textures at different star density/brightness stand in for a "far" and
// "near" parallax layer until real background art replaces them.
//
// Tile size is deliberately large (1024, not a smaller "obviously tiling"
// size like 256) so the repeat interval is big enough to read as random
// rather than a visibly repeating pattern — starCount is scaled up with the
// tile area (16x tile area -> 16x star count) to keep the same density
// rather than just stretching the same few stars thinner.
const LAYERS: StarfieldLayerSpec[] = [
  { key: STARFIELD_FAR_KEY, tileSize: 1024, starCount: 640, minRadius: 1, maxRadius: 1.5, minAlpha: 0.3, maxAlpha: 0.6 },
  { key: STARFIELD_NEAR_KEY, tileSize: 1024, starCount: 352, minRadius: 1.5, maxRadius: 2.5, minAlpha: 0.5, maxAlpha: 0.9 },
];

// Called once from BootScene — generated textures live in the global
// texture manager, not per-scene, so GameScene restarts (hard-fail flow)
// never need to regenerate them.
export function createStarfieldTextures(scene: Phaser.Scene): void {
  for (const layer of LAYERS) {
    if (scene.textures.exists(layer.key)) continue;

    const graphics = scene.make.graphics({}, false);
    for (let i = 0; i < layer.starCount; i++) {
      const x = Math.random() * layer.tileSize;
      const y = Math.random() * layer.tileSize;
      const radius = Phaser.Math.FloatBetween(layer.minRadius, layer.maxRadius);
      const alpha = Phaser.Math.FloatBetween(layer.minAlpha, layer.maxAlpha);
      graphics.fillStyle(0xffffff, alpha);
      graphics.fillCircle(x, y, radius);
    }
    graphics.generateTexture(layer.key, layer.tileSize, layer.tileSize);
    graphics.destroy();
  }
}
