import { registerTuning } from './devTuning';

// Off-screen objective marker (resolves GDD §9's off-screen-objective-
// visibility open question): a single edge-pinned arrow is sufficient since
// Probe -> Relay Beacon -> Exit Wormhole is a strictly linear sequence, so
// only one objective is ever "current".
export const hudConfig = {
  objectiveMarkerEdgeMargin: 32, // px inset from the viewport edge
  objectiveMarkerSize: 18, // px, arrow triangle size
  objectiveMarkerColor: 0xffcc33,
};

registerTuning('hud', hudConfig);
