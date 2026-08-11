import { registerTuning } from './devTuning';

export type AbilityType = 'scan' | 'tractorBeam' | 'teleport' | 'rocketBoost';

export interface AbilityCostData {
  energyCost: number;
  cooldownSeconds: number;
  hotkey: string; // Phaser keydown-<KEY> suffix, GDD §4 "abilities on number-key hotkeys"
}

// Per-ability dual gate (GDD §7/§11.4) -- either field may be 0, either
// gate no-ops at 0. scan is the deduction/information case (0 energy,
// cooldown only, per §7's Appendix rationale); rocketBoost is the
// capability-spend case (energy only, 0 cooldown). tractorBeam/teleport
// land in between. Phase 2a (2026-08-10) wires only tractorBeam's
// isUnlocked() gate into PushPullObjectElement -- scan/teleport/rocketBoost
// are unlockable and their dual gate is fully functional, but have no
// in-world effect yet (flagged, not a Phase 2a deliverable, see
// trailing_edge_art_asset_list.md §1.5).
export const abilityConfig: Record<AbilityType, AbilityCostData> = {
  scan: { energyCost: 0, cooldownSeconds: 3, hotkey: 'ONE' },
  tractorBeam: { energyCost: 0, cooldownSeconds: 0, hotkey: 'TWO' },
  teleport: { energyCost: 30, cooldownSeconds: 8, hotkey: 'THREE' },
  rocketBoost: { energyCost: 20, cooldownSeconds: 0, hotkey: 'FOUR' },
};

// Fixed unlock order (2026-08-10 decision: ProgressionManager auto-grants
// the next entry here on level completion -- no player-choice UI).
export const abilityUnlockOrder: AbilityType[] = ['scan', 'tractorBeam', 'teleport', 'rocketBoost'];

registerTuning('ability', abilityConfig);
