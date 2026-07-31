import Phaser from 'phaser';

export const LEVEL_OBJECTIVE_EVENTS = {
  ProbeFound: 'onProbeFound',
  BeaconReached: 'onBeaconReached',
} as const;

// Per-level, replaces CheckpointManager's role for the initial build (GDD
// §11.11): a hard fail wipes this state entirely (a fresh GameScene.create()
// constructs a fresh tracker) rather than partially preserving it. Kept out
// of GameScene's create()/update loop on purpose, per §11's SystemRegistry
// engineering principle that shared wiring files shouldn't accumulate
// one-off state.
export class LevelObjectiveTracker extends Phaser.Events.EventEmitter {
  private probeFound = false;
  private beaconReached = false;

  onProbeFound(): void {
    if (this.probeFound) return;
    this.probeFound = true;
    this.emit(LEVEL_OBJECTIVE_EVENTS.ProbeFound);
  }

  // No-ops if probeFound is false, per contract.
  onBeaconReached(): void {
    if (!this.probeFound || this.beaconReached) return;
    this.beaconReached = true;
    this.emit(LEVEL_OBJECTIVE_EVENTS.BeaconReached);
  }

  canReturn(): boolean {
    return this.probeFound && this.beaconReached;
  }
}
