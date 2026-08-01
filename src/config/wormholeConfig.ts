import { registerTuning } from './devTuning';

// Entry/exit wormhole pair (GDD §11.14): both reuse one placeholder sprite,
// distinguished only by tint. Entry starts active (you just arrived through
// it) and closes shortly after the level starts; Exit starts inactive and
// opens once the Relay Beacon is reached.
export const wormholeConfig = {
  activeTint: 0x88ffcc, // open/energized
  inactiveTint: 0x445566, // closed/dormant
  entryCloseDelayMs: 400, // delay before EntryWormhole visually closes
};

registerTuning('wormhole', wormholeConfig);
