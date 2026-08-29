import type { AbilityType } from './abilityConfig';

export interface AbilityUnlockContent {
  title: string;
  description: string;
}

// Ability-unlock popup copy (2026-08-14 ability rework,
// docs/ability-rework-brainstorm-2026-08-14.md's "Ability-unlock info
// popup" section) -- only the three abilities in abilityUnlockOrder ever
// reach AbilityUnlockScene, so tractorBeam has no entry here. Each
// description leads with the actual activation step (2026-08-29 playtest
// feedback -- players reached a new ability with no idea how to trigger
// it) before folding into what the ability does, one flowing sentence
// rather than a separate line. The literal key digits (1/2/3) mirror
// abilityConfig.ts's scan/teleport/rocketBoost hotkey fields (ONE/TWO/
// THREE) -- hand-written prose, not derived live, so keep these in sync if
// those hotkeys ever change.
export const abilityUnlockContent: Record<Exclude<AbilityType, 'tractorBeam'>, AbilityUnlockContent> = {
  scan: {
    title: 'Scan',
    description:
      'Press 1 to activate Scan, revealing nearby hazards and pointing you toward your current objective for a few seconds. Costs a small amount of energy and a short cooldown -- use it whenever you need a bearing.',
  },
  teleport: {
    title: 'Teleport',
    description:
      'Press 2 to aim, then left-click to confirm and blink a short, fixed distance in any direction, passing straight through solid obstacles like Debris Fields.',
  },
  rocketBoost: {
    title: 'Rocket Boost',
    description:
      'Press 3 to activate Rocket Boost, a quick burst of speed along your current heading -- good for outrunning a hazard or racing to a resupply point. Solid obstacles still stop you cold, unlike Teleport.',
  },
};

// Reuses AbilityUnlockScene's popup for a level-1-only movement/core-loop
// intro (2026-08-29, owner request) -- not a real ability, but the same
// paused/explicit-close popup is the one piece of UI every player is
// guaranteed to see, unlike HowToPlayScene which a player may never open.
// GameScene launches this only when TitleScene's Start button set
// isNewGameStart on the scene data (never on Continue, a level transition,
// or a hard-fail scene.restart() of level 1 itself) -- see GameScene's
// pendingLevelIntro field for why a hard-fail death on level 1 must not
// re-show this on every restart.
export const levelOneIntroContent: AbilityUnlockContent = {
  title: 'Getting Started',
  description:
    "Click and hold the left mouse button to fly your ship toward the cursor. Your goal: locate and recover this level's Probe, then head for the Relay Beacon. Reaching the beacon opens the Exit Wormhole -- return through it to complete the level.",
};
