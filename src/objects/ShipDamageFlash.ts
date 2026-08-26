import Phaser from 'phaser';
import { getPlayerShip } from '../systems/ExplorationController';
import { SHIP_SURVIVAL_EVENTS, type StructureHitPayload } from './ShipSurvivalComponent';
import { shipDamageFlashConfig } from '../config/shipDamageFlashConfig';
import { shipConfig } from '../config/shipConfig';
import type { PlayerShip } from './PlayerShip';

// Instant hit-feedback flash -- fills docs/reference/phaser-vfx-notes.md's
// "damage splat/feedback" mapping-table row. A red-filled duplicate of the
// ship's own sprite, revealed through an expanding circular GeometryMask
// centered on an approximate impact point rather than a flat full-ship
// tint (owner request, 2026-08-26) -- the real ship's art stays fully
// visible everywhere the reveal hasn't spread to yet, and the duplicate
// (not the real ship) carries the flash color, so nothing here ever
// touches the real ship's own tint.
//
// Impact point: StructureHitPayload.atWorldPos is the hazard's own
// position at the moment of the hit (see HazardZoneElement's
// consumeStructure() call sites) -- an approximation, not a precise pixel,
// per explicit owner direction ("rough approximation... no need for a
// precise pixel"). Converted to a direction (hazard -> ship) and applied as
// a fixed offset from the ship's center, on the theory that "roughly which
// side got hit" reads fine without tracking the exact contact point.
//
// Reacts to ShipSurvivalComponent's StructureHit event, a purpose-built
// signal distinct from the generic ResourceChanged (which fires on every
// mutation -- regen ticks, repairs -- with no delta/source/position and
// isn't a meaningful trigger for hit-feedback on its own).
//
// A single overlay/mask pair is reused across a run of hits rather than
// spawning one per hit: a one-time impact (Meteoroid) grows, holds
// briefly, and fades; sustained contact (Ion Storm/Nebula Field, which
// call consumeStructure every frame while overlapping) keeps re-arming the
// hold timer and reads as a steady held flash for as long as contact
// continues, rather than restarting the grow animation ~60 times/second
// (which would just look like flicker). Needs its own update() (called
// from GameScene.update(), same convention as HazardScanOverlay/
// TeleportRangeRing/ShipThrusterTrail) because the overlay must keep
// tracking the ship's live position through the hold phase, when no tween
// is actively driving anything.
export class ShipDamageFlash {
  private readonly maxRadius = Math.hypot(shipConfig.displayWidth, shipConfig.displayHeight);
  private radius = 0;
  private offsetX = 0;
  private offsetY = 0;
  private overlay?: Phaser.GameObjects.Image;
  private maskGraphics?: Phaser.GameObjects.Graphics;
  private growTween?: Phaser.Tweens.Tween;
  private fadeTween?: Phaser.Tweens.Tween;
  private fadeTimer?: Phaser.Time.TimerEvent;

  constructor(private readonly scene: Phaser.Scene) {
    const ship = getPlayerShip();
    if (!ship) return;

    ship.survival.on(SHIP_SURVIVAL_EVENTS.StructureHit, (payload: StructureHitPayload) => {
      this.onHit(ship, payload);
    });
  }

  // Repositions the overlay/mask to the ship's current position every
  // frame, independent of tween state -- the hold phase between the grow
  // and fade tweens has nothing else driving per-frame updates, and a hit
  // can carry real knockback (Meteoroid), so a one-time position snapshot
  // would visibly detach from the ship within a single flash.
  update(): void {
    if (!this.overlay || !this.maskGraphics) return;
    const ship = getPlayerShip();
    if (!ship) return;

    this.overlay.setPosition(ship.image.x, ship.image.y).setRotation(ship.image.rotation);
    this.maskGraphics.clear();
    this.maskGraphics.fillStyle(0xffffff);
    this.maskGraphics.fillCircle(ship.image.x + this.offsetX, ship.image.y + this.offsetY, this.radius);
  }

  private onHit(ship: PlayerShip, { atWorldPos }: StructureHitPayload): void {
    // Direction from the ship TOWARD the hazard, not the reverse -- the
    // reveal should start on the side of the ship facing the threat, not
    // the far side.
    const impactAngle = atWorldPos
      ? Phaser.Math.Angle.Between(ship.image.x, ship.image.y, atWorldPos.x, atWorldPos.y)
      : Math.random() * Math.PI * 2; // no position available -- an arbitrary side still reads better than skipping the effect
    const edgeDistance = this.maxRadius / 2;
    this.offsetX = Math.cos(impactAngle) * edgeDistance;
    this.offsetY = Math.sin(impactAngle) * edgeDistance;

    if (!this.overlay) this.createOverlay(ship);
    this.overlay!.setAlpha(shipDamageFlashConfig.peakAlpha);

    this.fadeTween?.remove();
    this.fadeTween = undefined;
    this.fadeTimer?.remove();

    if (this.radius < this.maxRadius) {
      this.growTween?.remove();
      const state = { radius: this.radius };
      this.growTween = this.scene.tweens.add({
        targets: state,
        radius: this.maxRadius,
        duration: shipDamageFlashConfig.growMs,
        ease: 'Cubic.Out',
        onUpdate: () => {
          this.radius = state.radius;
        },
      });
    }

    this.fadeTimer = this.scene.time.delayedCall(shipDamageFlashConfig.holdMs, () => this.startFade());
  }

  private createOverlay(ship: PlayerShip): void {
    this.overlay = this.scene.add
      .image(ship.image.x, ship.image.y, ship.image.texture.key)
      .setDisplaySize(ship.image.displayWidth, ship.image.displayHeight)
      .setRotation(ship.image.rotation)
      .setTintFill(shipDamageFlashConfig.color)
      .setDepth(shipDamageFlashConfig.depth)
      .setAlpha(0);

    this.maskGraphics = this.scene.make.graphics({}, false);
    this.overlay.setMask(new Phaser.Display.Masks.GeometryMask(this.scene, this.maskGraphics));
  }

  private startFade(): void {
    this.fadeTween = this.scene.tweens.add({
      targets: this.overlay,
      alpha: 0,
      duration: shipDamageFlashConfig.fadeMs,
      onComplete: () => {
        this.overlay?.destroy();
        this.maskGraphics?.destroy();
        this.overlay = undefined;
        this.maskGraphics = undefined;
        this.radius = 0;
      },
    });
  }
}
