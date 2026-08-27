import { registerTuning } from './devTuning';

export type AbilityType = 'scan' | 'tractorBeam' | 'teleport' | 'rocketBoost';

export interface AbilityCostData {
  energyCost: number;
  cooldownSeconds: number;
  hotkey: string; // Phaser keydown-<KEY> suffix, GDD §4 "abilities on number-key hotkeys"
  // Ability-rework fields (decided 2026-08-14, docs/ability-rework-brainstorm-2026-08-14.md)
  // -- optional/sibling to energyCost/cooldownSeconds, each meaningful to
  // exactly one ability type; undefined everywhere else.
  durationSeconds?: number; // scan: length of its hazard-ID/objective-marker window
  maxRange?: number; // teleport: fixed max blink distance (not distance-scaled cost)
  boostSpeed?: number; // rocketBoost: px/s during the burst
  boostDurationSeconds?: number; // rocketBoost: burst length
}

// Per-ability dual gate (GDD §7/§11.4) -- either field may be 0, either
// gate no-ops at 0. rocketBoost is the capability-spend case (energy only,
// near-zero cooldown just to prevent spam-clicking it for negligible gain).
// teleport gates mainly on its high energy cost, with a light cooldown on
// top. scan carries both an energy cost and a cooldown equal to its
// durationSeconds (2026-08-25: raised from 0 energy once scan started
// seeing real use, so the window can't be kept up continuously). tractorBeam
// is deliberately de-scoped (2026-08-14 ability rework) -- always unlocked
// (see AbilityComponent.isUnlocked), no player-facing UI, no
// ExplorationController binding -- its hotkey field is read only by
// PushPullObjectElement's own held-key check. Kept on FOUR (2026-08-15) so
// numbered slots 1-3 can match abilityUnlockOrder (scan/teleport/
// rocketBoost) without colliding with tractorBeam's key.
export const abilityConfig: Record<AbilityType, AbilityCostData> = {
  scan: { energyCost: 15, cooldownSeconds: 4, hotkey: 'ONE', durationSeconds: 4 },
  tractorBeam: { energyCost: 0, cooldownSeconds: 0, hotkey: 'FOUR' },
  teleport: { energyCost: 30, cooldownSeconds: 2, hotkey: 'TWO', maxRange: 350 },
  rocketBoost: { energyCost: 20, cooldownSeconds: 0.5, hotkey: 'THREE', boostSpeed: 520, boostDurationSeconds: 0.6 },
};

// Fixed unlock order (2026-08-10 decision: ProgressionManager auto-grants
// the next entry here on level completion -- no player-choice UI).
// tractorBeam pulled out entirely 2026-08-14 -- see class comment above.
export const abilityUnlockOrder: AbilityType[] = ['scan', 'teleport', 'rocketBoost'];

registerTuning('ability', abilityConfig);
