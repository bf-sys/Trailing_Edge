import { registerTuning } from './devTuning';

// Per-sound tunables (mirrors hazardConfig.ts/abilityConfig.ts's "one config
// module per subsystem" convention) -- lets each sourced clip be mixed
// independently rather than all playing at Phaser's default full volume.
// `file` is relative to assets/audio/sfx/ (BootScene.preload() loads each
// key from `audio/sfx/${file}`). `loop: true` marks a sound AudioManager
// starts/stops around a duration window (thruster, hazard drain, resupply
// repair) rather than firing once and letting it finish on its own.
export interface SfxTypeConfig {
  file: string;
  volume: number;
  loop?: boolean;
}

export type SfxKey =
  | 'clickConfirm'
  | 'thrusterLoop'
  | 'debrisImpact'
  | 'hazardDrainLoop'
  | 'meteoroidImpact'
  | 'shipExplosion'
  | 'probeFound'
  | 'beaconReached'
  | 'resupplyLoop'
  | 'energyPickup'
  | 'scanActivate'
  | 'teleportArm'
  | 'teleportBlink'
  | 'rocketBoost'
  | 'uiClick'
  | 'uiPauseToggle';

// Selections per docs/reference/sfx-selections.md (2026-08-28). Volumes are a
// first pass, not a playtested mix -- retune via window.tuning.audio.sfx.
// Two source files (resupplyLoop, rocketBoost) are longer than the moment
// they're triggered for (11.6s/9.3s clips against a ~5s repair session and a
// 0.6s boost burst respectively) -- AudioManager stops them explicitly
// rather than letting them play out, but see docs/TODO.md's "trim the longer
// source files" item for cleaning up the source clips themselves.
export const sfxConfig: Record<SfxKey, SfxTypeConfig> = {
  clickConfirm: { file: 'click_confirm.ogg', volume: 0.5 },
  thrusterLoop: { file: 'thruster_loop.ogg', volume: 0.22, loop: true },
  debrisImpact: { file: 'debris_impact.wav', volume: 0.6 },
  hazardDrainLoop: { file: 'hazard_drain_loop.ogg', volume: 0.45, loop: true },
  meteoroidImpact: { file: 'meteoroid_impact.mp3', volume: 0.8 },
  shipExplosion: { file: 'ship_explosion.ogg', volume: 0.9 },
  probeFound: { file: 'probe_found.ogg', volume: 0.7 },
  beaconReached: { file: 'beacon_reached.mp3', volume: 0.7 },
  resupplyLoop: { file: 'resupply_loop.mp3', volume: 0.4, loop: true },
  energyPickup: { file: 'energy_pickup.ogg', volume: 0.6 },
  scanActivate: { file: 'scan_activate.ogg', volume: 0.6 },
  teleportArm: { file: 'teleport_arm.ogg', volume: 0.5 },
  teleportBlink: { file: 'teleport_blink.ogg', volume: 0.6 },
  rocketBoost: { file: 'rocket_boost.mp3', volume: 0.7 },
  uiClick: { file: 'ui_click.ogg', volume: 0.5 },
  uiPauseToggle: { file: 'ui_pause_toggle.ogg', volume: 0.5 },
};

// Minimum time between retriggers of a sound that can otherwise fire many
// times per second (Debris Field's Arcade collider callback runs on every
// physics step of sustained contact -- see HazardZoneElement's
// HAZARD_ZONE_EVENTS.PhysicalContact). Audio-specific debounce, not a
// gameplay cooldown -- HazardZoneElement itself stays unaware audio exists.
export const physicalContactSfxCooldownMs = 500;

export const musicConfig = {
  key: 'musicAmbient' as const,
  file: 'ambient_loop.ogg', // relative to assets/audio/music/
  volume: 0.35,
};

registerTuning('audio', { sfx: sfxConfig, music: musicConfig });
