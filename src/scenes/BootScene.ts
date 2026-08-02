import Phaser from 'phaser';
import { createStarfieldTextures } from '../objects/StarfieldBackground';
import { createBackgroundSetPieceTextures } from '../objects/BackgroundSetPieces';
import { createDestinationMarkerTexture } from '../objects/DestinationMarker';

export const BOOT_SCENE_KEY = 'BootScene';

export class BootScene extends Phaser.Scene {
  constructor() {
    super(BOOT_SCENE_KEY);
  }

  preload(): void {
    this.load.image('ship_base', 'ship/ship_base_PLACEHOLDER.png');
    this.load.image('debris_large', 'hazards/debris_large_PLACEHOLDER.png');
    this.load.image('asteroid_large', 'resupply/asteroid_large_PLACEHOLDER.png');
    this.load.image('probe', 'objectives/probe_PLACEHOLDER.png');
    this.load.image('relay_beacon_idle', 'objectives/relay_beacon_idle_PLACEHOLDER.png');
    this.load.image('relay_beacon_reached_overlay', 'objectives/relay_beacon_reached_overlay_PLACEHOLDER.png');
    this.load.image('wormhole', 'objectives/wormhole_PLACEHOLDER.png');
    this.load.image('panel_frame', 'ui/panel_frame_PLACEHOLDER.png');
    this.load.image('bar_energy', 'ui/bar_energy_PLACEHOLDER.png');
    this.load.image('bar_structure', 'ui/bar_structure_PLACEHOLDER.png');
  }

  create(): void {
    createStarfieldTextures(this);
    createBackgroundSetPieceTextures(this);
    createDestinationMarkerTexture(this);
    this.scene.start('TitleScene');
  }
}
