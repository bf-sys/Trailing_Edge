import Phaser from 'phaser';
import { getPlayerShip } from '../systems/ExplorationController';
import { EXPLORATION_EVENTS, type TeleportConfirmedPayload } from '../systems/ExplorationController';
import { teleportBlinkVfxConfig } from '../config/teleportBlinkVfxConfig';

// Blink-moment VFX for teleport -- fills the "dedicated activation VFX" gap
// docs/trailing_edge_art_asset_list.md §1.5 still names for this ability
// (TeleportRangeRing only covers aim-time, before confirm). Two pieces,
// both played the instant ExplorationController.confirmTeleport() fires:
//
// - A departing "ghost": a duplicate of the ship's own sprite left behind
//   at the origin point, shrinking to nothing and fading out. The real
//   ship has already relocated by the time this event fires (confirmTeleport
//   emits after its setPosition() call), so a real duplicate GameObject is
//   the only way to show something happening at the point of departure.
// - The real ship popping in at the destination: scaled down to
//   arrivalStartScaleFactor the instant it arrives, then tweened back up to
//   its normal scale. Reads as "arriving," not a fade.
//
// Both are paired with a small ring flash (collapsing at the origin,
// expanding at the destination) using the same Graphics-redrawn-every-tween-
// frame technique as ScanActivationVfx, at a much smaller/faster scale
// (a local blink, not a map-scale pulse).
//
// Display-only and event-driven, same convention as DestinationMarker/
// ScanActivationVfx: reacts to ExplorationController's TeleportConfirmed
// event rather than being called into directly. The actual teleport stays
// mechanically instant -- this never delays or animates the real position
// change, only decorates it.
export class TeleportBlinkVfx {
  constructor(private readonly scene: Phaser.Scene) {
    const ship = getPlayerShip();
    if (!ship) return;

    ship.image.on(EXPLORATION_EVENTS.TeleportConfirmed, (payload: TeleportConfirmedPayload) => {
      this.playBlink(payload);
    });
  }

  private playBlink({ from, to }: TeleportConfirmedPayload): void {
    const ship = getPlayerShip();
    if (!ship) return;

    const baseScaleX = ship.image.scaleX;
    const baseScaleY = ship.image.scaleY;

    const ghost = this.scene.add
      .image(from.x, from.y, ship.image.texture.key)
      .setRotation(ship.image.rotation)
      .setScale(baseScaleX, baseScaleY)
      .setTint(teleportBlinkVfxConfig.color)
      .setDepth(ship.image.depth);

    this.scene.tweens.add({
      targets: ghost,
      scaleX: 0,
      scaleY: 0,
      alpha: 0,
      duration: teleportBlinkVfxConfig.durationMs,
      ease: 'Cubic.In',
      onComplete: () => ghost.destroy(),
    });

    ship.image.setScale(baseScaleX * teleportBlinkVfxConfig.arrivalStartScaleFactor, baseScaleY * teleportBlinkVfxConfig.arrivalStartScaleFactor);
    this.scene.tweens.add({
      targets: ship.image,
      scaleX: baseScaleX,
      scaleY: baseScaleY,
      duration: teleportBlinkVfxConfig.durationMs,
      ease: 'Back.Out',
    });

    this.playRing(from.x, from.y, false);
    this.playRing(to.x, to.y, true);
  }

  private playRing(x: number, y: number, expanding: boolean): void {
    const graphics = this.scene.add.graphics().setDepth(teleportBlinkVfxConfig.depth);
    const state = { progress: 0 };

    this.scene.tweens.add({
      targets: state,
      progress: 1,
      duration: teleportBlinkVfxConfig.durationMs,
      ease: expanding ? 'Cubic.Out' : 'Cubic.In',
      onUpdate: () => {
        const radius = expanding
          ? teleportBlinkVfxConfig.ringMaxRadius * state.progress
          : teleportBlinkVfxConfig.ringMaxRadius * (1 - state.progress);
        const alpha = teleportBlinkVfxConfig.ringStartAlpha * (1 - state.progress);
        graphics.clear();
        graphics.lineStyle(teleportBlinkVfxConfig.ringStrokeWidth, teleportBlinkVfxConfig.color, alpha);
        graphics.strokeCircle(x, y, radius);
      },
      onComplete: () => graphics.destroy(),
    });
  }
}
