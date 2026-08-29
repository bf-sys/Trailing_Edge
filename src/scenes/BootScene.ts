import Phaser from 'phaser';
import { STARFIELD_FAR_KEY, STARFIELD_NEAR_KEY } from '../objects/StarfieldBackground';
import { createBackgroundSetPieceTextures } from '../objects/BackgroundSetPieces';
import { createDestinationMarkerTexture } from '../objects/DestinationMarker';
import { createThrusterParticleTexture } from '../objects/ShipThrusterTrail';
import { createResupplySparkTexture } from '../objects/ResupplyPoint';
import { createEnergyNodeTexture } from '../objects/EnergyNodeElement';
import { createShipExplosionTexture } from '../objects/ShipExplosionVfx';
import { sfxConfig, musicConfig } from '../config/audioConfig';
import { loadMasterVolume } from '../objects/SaveManager';

export const BOOT_SCENE_KEY = 'BootScene';

export class BootScene extends Phaser.Scene {
  constructor() {
    super(BOOT_SCENE_KEY);
  }

  preload(): void {
    (Object.keys(sfxConfig) as (keyof typeof sfxConfig)[]).forEach((key) => {
      this.load.audio(key, `audio/sfx/${sfxConfig[key].file}`);
    });
    this.load.audio(musicConfig.key, `audio/music/${musicConfig.file}`);

    this.load.image('ship_base', 'ship/ship_base.png');
    this.load.image('debris_large', 'hazards/debris_large.png');
    this.load.image('debris_large_alt2', 'hazards/debris_large_alt2.png');
    this.load.image('debris_large_alt3', 'hazards/debris_large_alt3.png');
    this.load.image('hazard_meteoroid', 'hazards/hazard_meteoroid.png');
    this.load.image('hazard_ion_storm', 'hazards/hazard_ion_storm.png');
    this.load.image('hazard_nebula_field', 'hazards/hazard_nebula_field.png');
    this.load.image('hazard_nebula_field_alt2', 'hazards/hazard_nebula_field_alt2.png');
    this.load.image('hazard_nebula_field_alt3', 'hazards/hazard_nebula_field_alt3.png');
    this.load.image('asteroid_large', 'resupply/asteroid_large.png');
    this.load.image('probe', 'objectives/probe.png');
    this.load.image('relay_beacon', 'objectives/relay_beacon.png');
    this.load.image('wormhole', 'objectives/wormhole.png');
    this.load.image(STARFIELD_FAR_KEY, 'backgrounds/bg_stars_far.png');
    this.load.image(STARFIELD_NEAR_KEY, 'backgrounds/bg_stars_near.png');
    this.load.image('window_corner', 'ui/window_corner.png');
    this.load.image('window_edge', 'ui/window_edge.png');
    this.load.image('window_titlebar', 'ui/window_titlebar.png');
    this.load.image('window_titlebar_cap', 'ui/window_titlebar_cap.png');
    this.load.image('window_fill', 'ui/window_fill.png');
    this.load.image('logo', 'ui/logo.png');
  }

  create(): void {
    // Applied once here, before TitleScene's startMusicOnce() plays
    // anything -- scene.sound is one SoundManager instance shared
    // game-wide, so this master level holds for the rest of the session
    // regardless of which Scene set it last (VolumeSlider mutates the same
    // property directly).
    const savedVolume = loadMasterVolume();
    if (savedVolume !== null) this.sound.volume = savedVolume;

    createBackgroundSetPieceTextures(this);
    createDestinationMarkerTexture(this);
    createThrusterParticleTexture(this);
    createResupplySparkTexture(this);
    createEnergyNodeTexture(this);
    createShipExplosionTexture(this);
    this.scene.start('TitleScene');
  }
}
