import Phaser from 'phaser';
import { backgroundSetPieceConfig } from '../config/backgroundSetPieceConfig';
import { getSessionSeed } from '../systems/sessionSeed';

const PLANET_KEY = 'bg_setpiece_planet';
const GALAXY_KEY = 'bg_setpiece_galaxy';
const ROSTER_KEYS: string[] = [PLANET_KEY, GALAXY_KEY];

const TEXTURE_SIZE = 256;
const MAX_PLACEMENT_ATTEMPTS = 20;

// Purely decorative background dressing (no gameplay effect, no physics
// body) -- a handful of large, slow-parallax "set piece" images (a planet,
// a distant galaxy, ...) scattered across the level to break up the tiled
// starfield's (StarfieldBackground.ts) monotony. Placeholder textures only
// for now, procedurally generated the same way the starfield tiles are,
// until real roster art replaces them (docs/trailing_edge_art_asset_list.md
// §2.1).
//
// Seeded per level+session (Phaser.Math.RandomDataGenerator) so placement
// is stable across a hard-fail restart of the same level, varies between
// levels, and reshuffles on a fresh page load (a new "playthrough", in the
// current absence of SaveManager/Continue -- see systems/sessionSeed.ts).

// Called once from BootScene, same as StarfieldBackground's
// createStarfieldTextures -- generated textures live in the global texture
// manager, not per-scene, so a hard-fail restart never regenerates them.
export function createBackgroundSetPieceTextures(scene: Phaser.Scene): void {
  if (!scene.textures.exists(PLANET_KEY)) createPlanetTexture(scene);
  if (!scene.textures.exists(GALAXY_KEY)) createGalaxyTexture(scene);
}

// Called once per GameScene create() (including hard-fail restarts).
export function placeBackgroundSetPieces(
  scene: Phaser.Scene,
  levelId: string,
  levelWidth: number,
  levelHeight: number,
): void {
  const rng = new Phaser.Math.RandomDataGenerator([String(getSessionSeed()), levelId]);
  const placed: { x: number; y: number }[] = [];

  for (let i = 0; i < backgroundSetPieceConfig.count; i++) {
    const position = pickSpacedPosition(rng, levelWidth, levelHeight, placed);
    placed.push(position);

    scene.add
      .image(position.x, position.y, rng.pick(ROSTER_KEYS))
      .setScrollFactor(backgroundSetPieceConfig.scrollFactor)
      .setDepth(backgroundSetPieceConfig.depth)
      .setScale(rng.realInRange(backgroundSetPieceConfig.minScale, backgroundSetPieceConfig.maxScale))
      .setAlpha(rng.realInRange(backgroundSetPieceConfig.minAlpha, backgroundSetPieceConfig.maxAlpha))
      .setRotation(rng.rotation());
  }
}

// Rejection-samples world positions until one clears minSpacing from every
// already-placed set piece (or gives up after MAX_PLACEMENT_ATTEMPTS --
// decorative only, an occasional close pair is a non-issue).
function pickSpacedPosition(
  rng: Phaser.Math.RandomDataGenerator,
  levelWidth: number,
  levelHeight: number,
  placed: { x: number; y: number }[],
): { x: number; y: number } {
  for (let attempt = 0; attempt < MAX_PLACEMENT_ATTEMPTS; attempt++) {
    const x = rng.integerInRange(0, levelWidth);
    const y = rng.integerInRange(0, levelHeight);
    const farEnough = placed.every(
      (p) => Phaser.Math.Distance.Between(p.x, p.y, x, y) >= backgroundSetPieceConfig.minSpacing,
    );
    if (farEnough) return { x, y };
  }
  return { x: rng.integerInRange(0, levelWidth), y: rng.integerInRange(0, levelHeight) };
}

// Fake planet: a base circle plus an overlapping darker circle offset to one
// side, to suggest a shadowed hemisphere without needing real art.
function createPlanetTexture(scene: Phaser.Scene): void {
  const graphics = scene.make.graphics({}, false);
  const radius = TEXTURE_SIZE / 2;

  graphics.fillStyle(0x4d7ea8, 1);
  graphics.fillCircle(radius, radius, radius - 4);

  graphics.fillStyle(0x152736, 0.65);
  graphics.fillCircle(radius * 1.3, radius * 0.9, radius * 0.85);

  graphics.generateTexture(PLANET_KEY, TEXTURE_SIZE, TEXTURE_SIZE);
  graphics.destroy();
}

// Fake galaxy/nebula: a colored dot cloud rejection-sampled into an
// elliptical footprint, fading toward the edge -- reads as a distant cloud
// rather than a plain circle.
function createGalaxyTexture(scene: Phaser.Scene): void {
  const graphics = scene.make.graphics({}, false);
  const center = TEXTURE_SIZE / 2;
  const colors = [0x7a5cff, 0x4d7ea8, 0xd88fd8];

  for (let i = 0; i < 500; i++) {
    let x = 0;
    let y = 0;
    let normalizedDistance = 1;
    do {
      x = Math.random() * TEXTURE_SIZE;
      y = Math.random() * TEXTURE_SIZE;
      const dx = (x - center) / (center * 0.9);
      const dy = (y - center) / (center * 0.4);
      normalizedDistance = Math.sqrt(dx * dx + dy * dy);
    } while (normalizedDistance > 1);

    const alpha = Phaser.Math.FloatBetween(0.05, 0.5) * (1 - normalizedDistance);
    const color = colors[Math.floor(Math.random() * colors.length)];
    graphics.fillStyle(color, alpha);
    graphics.fillCircle(x, y, Phaser.Math.FloatBetween(1, 3));
  }

  graphics.generateTexture(GALAXY_KEY, TEXTURE_SIZE, TEXTURE_SIZE);
  graphics.destroy();
}
