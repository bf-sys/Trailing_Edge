import Phaser from 'phaser';
import { PuzzleElementBase } from '../PuzzleElementBase';
import { setCircleFromWorldRadius } from '../arcadeBodyHelpers';
import { getPlayerShip } from '../../systems/ExplorationController';
import { puzzleConfig } from '../../config/puzzleConfig';

const SCAN_TARGET_TEXTURE_KEY = 'puzzle_scan_target';

// Procedurally generated once (same precedent as HudOverlay's objective
// marker / DestinationMarker's ping ring) -- a plain ring, no art asset
// needed for Phase 2a's placeholder pass.
function createScanTargetTexture(scene: Phaser.Scene, radius: number, color: number): void {
  if (scene.textures.exists(SCAN_TARGET_TEXTURE_KEY)) return;

  const diameter = radius * 2;
  const graphics = scene.make.graphics({}, false);
  graphics.lineStyle(3, color, 1);
  graphics.strokeCircle(radius, radius, radius - 2);
  graphics.generateTexture(SCAN_TARGET_TEXTURE_KEY, diameter, diameter);
  graphics.destroy();
}

export interface ScanInteractConfig {
  x: number;
  y: number;
}

// Scan Target / Marker (GDD §6/§9/§11.3) -- the base object-interact/scan
// puzzle element, "likely the cheapest asset on this list" per the art
// asset list. Simplest of the five subtypes by design: a plain
// proximity-overlap trigger, the same Arcade skeleton as
// ProbeObject/RelayBeaconObject, built first in Phase 2a specifically to
// validate PuzzleElementBase's abstract contract before the other four.
//
// Not gated behind the Scan ability -- Phase 2a only wires
// PushPullObjectElement's TractorBeam check (see abilityConfig.ts); Scan
// stays unlockable but has no in-world effect yet.
export class ScanInteractElement extends PuzzleElementBase {
  readonly image: Phaser.Physics.Arcade.Image;

  constructor(scene: Phaser.Scene, config: ScanInteractConfig) {
    super();

    createScanTargetTexture(scene, puzzleConfig.scanInteractRadius, 0x8fd3ff);
    this.image = scene.physics.add
      .image(config.x, config.y, SCAN_TARGET_TEXTURE_KEY)
      .setDisplaySize(puzzleConfig.scanInteractRadius * 2, puzzleConfig.scanInteractRadius * 2);

    const body = this.image.body as Phaser.Physics.Arcade.Body;
    setCircleFromWorldRadius(body, this.image, puzzleConfig.scanInteractRadius);

    const ship = getPlayerShip();
    if (ship) {
      scene.physics.add.overlap(this.image, ship.image, () => this.onPlayerArrival());
    }
  }

  private onPlayerArrival(): void {
    if (this.solved) return;
    this.markSolved();
    this.image.setTint(0x66ff99);
    (this.image.body as Phaser.Physics.Arcade.Body).enable = false;
  }
}
