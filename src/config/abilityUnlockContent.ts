import type { AbilityType } from './abilityConfig';

export interface AbilityUnlockContent {
  title: string;
  description: string;
}

// Ability-unlock popup copy (2026-08-14 ability rework,
// docs/ability-rework-brainstorm-2026-08-14.md's "Ability-unlock info
// popup" section) -- only the three abilities in abilityUnlockOrder ever
// reach AbilityUnlockScene, so tractorBeam has no entry here.
export const abilityUnlockContent: Record<Exclude<AbilityType, 'tractorBeam'>, AbilityUnlockContent> = {
  scan: {
    title: 'Scan',
    description:
      'Reveals nearby hazards and points you toward your current objective for a few seconds. Costs no energy, just a short cooldown -- use it whenever you need a bearing.',
  },
  teleport: {
    title: 'Teleport',
    description:
      'Blink a short, fixed distance in any direction, passing straight through solid obstacles like Debris Fields. Press the hotkey to aim, then left-click to confirm.',
  },
  rocketBoost: {
    title: 'Rocket Boost',
    description:
      'A quick burst of speed along your current heading -- good for outrunning a hazard or racing to a resupply point. Solid obstacles still stop you cold, unlike Teleport.',
  },
};
