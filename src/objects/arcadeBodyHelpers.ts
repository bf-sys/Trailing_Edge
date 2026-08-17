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
//
// setCircle(radius) with no offset args defaults the body's offset to
// (0,0) rather than centering on the sprite. Phaser's actual position
// formula (Body#updateFromGameObject) is
// `position.x = gameObject.x + scaleX * (offset.x - displayOriginX)`,
// so with offset.x left at 0 the circle only ends up truly centered when
// worldRadius*2 happens to equal displayWidth -- true for every caller
// that forces setDisplaySize(radius*2, radius*2) (Probe/ResupplyPoint/
// ScanInteractElement/ExitWormhole), silently false otherwise. Found
// 2026-08-17 via RelayBeaconObject, the one caller with a non-square
// display (154x90 to preserve relay_beacon.png's real aspect ratio)
// alongside a radius (45) that only matches half of displayHeight, not
// displayWidth -- its hit-circle was landing 32px left of the sprite's
// visual center, silently, since a static screenshot can't reveal an
// off-center hitbox any more than the original wrong-scale bug this
// function was written to fix could. Passing explicit offsets computed
// from displayOriginX/Y centers the circle correctly in every case,
// including the ones that were already accidentally correct (their
// offset comes out to exactly 0, unchanged from the old default).
export function setCircleFromWorldRadius(
  body: Phaser.Physics.Arcade.Body,
  image: Phaser.GameObjects.Image,
  worldRadius: number,
): void {
  const nativeRadius = worldRadius / image.scaleX;
  const offsetX = image.displayOriginX - nativeRadius;
  const offsetY = image.displayOriginY - nativeRadius;
  body.setCircle(nativeRadius, offsetX, offsetY);
}

export function setRectFromWorldSize(
  body: Phaser.Physics.Arcade.Body,
  image: Phaser.GameObjects.Image,
  worldWidth: number,
  worldHeight: number,
): void {
  body.setSize(worldWidth / image.scaleX, worldHeight / image.scaleY);
}
