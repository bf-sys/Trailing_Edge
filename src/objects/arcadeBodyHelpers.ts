import Phaser from 'phaser';

// Phaser's Arcade Body#setCircle()/#setSize() take dimensions in the
// sprite's native (unscaled) texture pixels, not its display size -- Body
// re-derives world-space width/height each frame as
// `sourceWidth/Height * gameObject.scale`. Passing an authored gameplay
// radius/size straight in (as if it were already world-space) silently
// shrinks the real hitbox whenever displaySize is much smaller than native
// resolution. This is exactly what happened once real AI-generated art
// (much higher native resolution than the old placeholders) replaced
// Probe/AsteroidField/ExitWormhole/RelayBeaconObject's sprites
// (2026-08-01) -- their collision radii silently shrank to a few px, only
// caught via an actual playtest, since a static screenshot can't reveal an
// invisible hitbox being wrong size.
//
// Call these AFTER setDisplaySize()/setScale(), so image.scaleX/scaleY
// reflect the GameObject's final display size.
export function setCircleFromWorldRadius(
  body: Phaser.Physics.Arcade.Body,
  image: Phaser.GameObjects.Image,
  worldRadius: number,
): void {
  body.setCircle(worldRadius / image.scaleX);
}

export function setRectFromWorldSize(
  body: Phaser.Physics.Arcade.Body,
  image: Phaser.GameObjects.Image,
  worldWidth: number,
  worldHeight: number,
): void {
  body.setSize(worldWidth / image.scaleX, worldHeight / image.scaleY);
}
