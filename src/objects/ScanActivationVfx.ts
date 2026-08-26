import Phaser from 'phaser';
import { getPlayerShip } from '../systems/ExplorationController';
import { ABILITY_EVENTS } from './AbilityComponent';
import { scanConfig } from '../config/scanConfig';
import { scanVfxConfig } from '../config/scanVfxConfig';

// One-shot ring that expands outward from the ship to scanConfig.scanRadius
// and fades, played whenever scan actually activates. Fills the "dedicated
// activation VFX" gap docs/trailing_edge_art_asset_list.md §1.5 has flagged
// since the 2026-08-14 ability rework -- HazardScanOverlay already renders
// the *result* of an active scan (outlines/labels on nearby hazards) for
// its whole duration window, but nothing previously marked the instant of
// activation itself.
//
// A Graphics ring redrawn every tween frame, not a scaled texture/Image
// (contrast DestinationMarker, whose ping tops out well under 100px) --
// this ring travels all the way out to scanConfig.scanRadius (500px), and
// stretching a small pre-baked texture that far would blur/pixelate its
// stroke. Redrawing via strokeCircle() at the tween's live radius keeps the
// line crisp at any size, the same technique HazardScanOverlay already uses
// per-frame for its own outlines.
//
// Display-only and event-driven, same convention as DestinationMarker:
// reacts to AbilityComponent's Activated event rather than being called
// into directly by whatever triggers the ability.
export class ScanActivationVfx {
  constructor(private readonly scene: Phaser.Scene) {
    const ship = getPlayerShip();
    if (!ship) return;

    ship.ability.on(ABILITY_EVENTS.Activated, (type: string) => {
      if (type !== 'scan') return;
      this.playPulse(ship.image.x, ship.image.y);
    });
  }

  private playPulse(x: number, y: number): void {
    const graphics = this.scene.add.graphics().setDepth(scanVfxConfig.depth);
    const state = { progress: 0 };

    this.scene.tweens.add({
      targets: state,
      progress: 1,
      duration: scanVfxConfig.durationMs,
      ease: 'Cubic.Out',
      onUpdate: () => {
        const radius = scanConfig.scanRadius * state.progress;
        const alpha = scanVfxConfig.startAlpha * (1 - state.progress);
        graphics.clear();
        graphics.lineStyle(scanVfxConfig.strokeWidth, scanVfxConfig.color, alpha);
        graphics.strokeCircle(x, y, radius);
      },
      onComplete: () => graphics.destroy(),
    });
  }
}
