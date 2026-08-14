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
// gate no-ops at 0. scan is the deduction/information case (0 energy,
// cooldown only, per §7's Appendix rationale); rocketBoost is the
// capability-spend case (energy only, 0 cooldown). teleport lands in
// between. tractorBeam is deliberately de-scoped (2026-08-14 ability
// rework) -- always unlocked (see AbilityComponent.isUnlocked), no
// player-facing UI, driven entirely by PushPullObjectElement's own
// held-key check rather than a hotkey bound here.
export const abilityConfig: Record<AbilityType, AbilityCostData> = {
  scan: { energyCost: 0, cooldownSeconds: 3, hotkey: 'ONE', durationSeconds: 4 },
  tractorBeam: { energyCost: 0, cooldownSeconds: 0, hotkey: 'TWO' },
  teleport: { energyCost: 30, cooldownSeconds: 8, hotkey: 'THREE', maxRange: 350 },
  rocketBoost: { energyCost: 20, cooldownSeconds: 0, hotkey: 'FOUR', boostSpeed: 520, boostDurationSeconds: 0.6 },
};

// Fixed unlock order (2026-08-10 decision: ProgressionManager auto-grants
// the next entry here on level completion -- no player-choice UI).
// tractorBeam pulled out entirely 2026-08-14 -- see class comment above.
export const abilityUnlockOrder: AbilityType[] = ['scan', 'teleport', 'rocketBoost'];

registerTuning('ability', abilityConfig);
