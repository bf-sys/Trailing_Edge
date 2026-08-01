import Phaser from 'phaser';

export const LEVEL_OBJECTIVE_EVENTS = {
  ProbeFound: 'onProbeFound',
  BeaconReached: 'onBeaconReached',
} as const;

export interface ObjectiveWaypoint {
  x: number;
  y: number;
}

export interface ObjectiveWaypoints {
  probe: ObjectiveWaypoint;
  relayBeacon: ObjectiveWaypoint;
  exitWormhole: ObjectiveWaypoint;
}

// Per-level, replaces CheckpointManager's role for the initial build (GDD
// §11.11): a hard fail wipes this state entirely (a fresh GameScene.create()
// constructs a fresh tracker) rather than partially preserving it. Kept out
// of GameScene's create()/update loop on purpose, per §11's SystemRegistry
// engineering principle that shared wiring files shouldn't accumulate
// one-off state.
export class LevelObjectiveTracker extends Phaser.Events.EventEmitter {
  private probeFound = false;
  private beaconReached = false;

  constructor(private readonly waypoints: ObjectiveWaypoints) {
    super();
  }

  // Which world position the off-screen objective marker (HudOverlay)
  // should point at right now. Probe -> Relay Beacon -> Exit Wormhole is a
  // strictly linear sequence, so there's always exactly one current target
  // — kept here rather than in HudOverlay so the "which stage are we at"
  // decision stays with the class that already owns that state.
  getCurrentObjectiveTarget(): ObjectiveWaypoint {
    if (!this.probeFound) return this.waypoints.probe;
    if (!this.beaconReached) return this.waypoints.relayBeacon;
    return this.waypoints.exitWormhole;
  }

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
