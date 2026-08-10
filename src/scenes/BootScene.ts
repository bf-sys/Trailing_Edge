import Phaser from 'phaser';
import { STARFIELD_FAR_KEY, STARFIELD_NEAR_KEY } from '../objects/StarfieldBackground';
import { createBackgroundSetPieceTextures } from '../objects/BackgroundSetPieces';
import { createDestinationMarkerTexture } from '../objects/DestinationMarker';

export const BOOT_SCENE_KEY = 'BootScene';

export class BootScene extends Phaser.Scene {
  constructor() {
    super(BOOT_SCENE_KEY);
  }

  preload(): void {
    this.load.image('ship_base', 'ship/ship_base.png');
    this.load.image('debris_large', 'hazards/debris_large.png');
    this.load.image('asteroid_large', 'resupply/asteroid_large.png');
    this.load.image('probe', 'objectives/probe.png');
    this.load.image('relay_beacon', 'objectives/relay_beacon.png');
    this.load.image('wormhole', 'objectives/wormhole.png');
    this.load.image(STARFIELD_FAR_KEY, 'backgrounds/bg_stars_far.png');
    this.load.image(STARFIELD_NEAR_KEY, 'backgrounds/bg_stars_near.png');
  }

  create(): void {
    createBackgroundSetPieceTextures(this);
    createDestinationMarkerTexture(this);
    this.scene.start('TitleScene');
  }
}
