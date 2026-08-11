import { registerTuning } from './devTuning';

// Shared tunables for Phase 2a's puzzle-site elements (GDD §6/§11.3). One
// file to start since each element's footprint is small; split into
// per-element modules later if a subtype accumulates enough of its own
// tunables to warrant it (matches CLAUDE.md's per-subsystem config
// convention).
export const puzzleConfig = {
  scanInteractRadius: 36, // px, ScanInteractElement's proximity-interact range
  scanInteractColor: 0x8fd3ff,

  sequenceSpotRadius: 32, // px, SequenceSpotElement's per-spot trigger range
  sequenceSpotColor: 0xd88fff,
  sequenceSpotSolvedColor: 0x66ff99,

  trailSampleIntervalMs: 100, // how often the ship's position is recorded
  trailMaxAgeMs: 6000, // rolling window -- older trail points are dropped
  trailMinPointsForCheck: 8, // minimum recorded points before testing encirclement
  trailCloseLoopThreshold: 60, // px -- how close start/end must be to count as "closed"
  trailColor: 0x8fd3ff,
  beaconMarkerRadius: 14,
  beaconMarkerColor: 0xffa8d8,
  beaconSolvedColor: 0x66ff99,

  movingSpotRadius: 34, // px, MovingSpotDurationElement's hold-inside range
  movingSpotHoldDurationMs: 2500, // continuous time inside required to solve
  movingSpotSpeed: 90, // px/s along its patrol path
  movingSpotColor: 0xffe066,
  movingSpotSolvedColor: 0x66ff99,

  pushPullInteractRadius: 90, // px, how close the ship must be to grab the pod
  pushPullSpeed: 140, // px/s the pod moves toward the ship while held
  pushPullSolveRadius: 24, // px, how close the pod must get to its target to solve
  pushPullPodColor: 0xc9a26b,
  pushPullTargetColor: 0x66ffcc,
  pushPullSolvedColor: 0x66ff99,
};

registerTuning('puzzle', puzzleConfig);
