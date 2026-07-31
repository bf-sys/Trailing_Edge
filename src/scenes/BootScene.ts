import Phaser from 'phaser';
import { createStarfieldTextures } from '../objects/StarfieldBackground';

export const BOOT_SCENE_KEY = 'BootScene';

export class BootScene extends Phaser.Scene {
  constructor() {
    super(BOOT_SCENE_KEY);
  }

  preload(): void {
    this.load.image('ship_base', 'ship/ship_base_PLACEHOLDER.png');
    this.load.image('debris_large', 'hazards/debris_large.png');
    this.load.image('asteroid_large', 'resupply/asteroid_large.png');
    this.load.image('probe', 'objectives/probe_PLACEHOLDER.png');
    this.load.image('relay_beacon_idle', 'objectives/relay_beacon_idle.png');
    this.load.image('relay_beacon_reached_overlay', 'objectives/relay_beacon_reached_overlay.png');
    this.load.image('home_marker', 'objectives/home_marker_PLACEHOLDER.png');
    this.load.image('panel_frame', 'ui/panel_frame.png');
    this.load.image('bar_energy', 'ui/bar_energy.png');
    this.load.image('bar_structure', 'ui/bar_structure.png');
  }

  create(): void {
    createStarfieldTextures(this);
    this.scene.start('TitleScene');
  }
}
