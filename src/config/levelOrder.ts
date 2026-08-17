// Linear level progression (GDD §11.7/§8 — no level-select). Content agents
// append new level ids here as Phase 2b adds levels; nobody hardcodes a
// "next level" pointer inside a level itself. Shared by GameScene (resolves
// "next level" on completion, §11.8) and TitleScene (Start always begins at
// LEVEL_ORDER[0]).
//
// 2026-08-12: level-000 (Phase 1/2a's original test level -- one instance
// of every hazard and every puzzle element) was pulled OUT of progression
// and is no longer LEVEL_ORDER[0]. Its compact size and full-roster content
// make it good for testing, not for a real "first level" a player starts
// on -- see TEST_LEVEL_ID below. level-001 is a fresh level (hazards, no
// puzzle-taxonomy content) meant as the actual first level and as a base
// for level-design iteration; growing LEVEL_ORDER beyond it is Phase 2b's
// job, not this file's.
//
// 2026-08-15: level-002 appended, 1.5x level-001's footprint -- same
// objective-spacing/Debris-Field-wall rules as level-001's redesign, with
// Nebula Field reintroduced deliberately (bypass-route tolls, not a third
// hazard type sprinkled in). Player reaches it with scan already unlocked
// (granted on level-001 completion, abilityUnlockOrder in abilityConfig.ts).
//
// 2026-08-17: level-003 appended, 1.5x level-002's footprint, same rules
// again -- plus a first: the Probe sits inside a sealed ring of Debris
// Field (level-003.ts's debrisRing()), reachable only via teleport. Safe
// to require here since teleport is already unlocked by this point
// (granted on level-002's completion).
//
// 2026-08-17: level-004 appended, originally 2x level-001's footprint
// (deliberately not matching level-003's size); **recalibrated the same
// day to match level-003's footprint exactly (5400x3038)** -- the size
// discontinuity was a miscommunication, not an intended design point, see
// level-004.ts's file comment for the rescale math. Same objective-spacing/
// Debris-Field-wall/Nebula-Field rules as 002/003; deliberately skips
// level-003's sealed debrisRing() (that was reinforcing a just-granted
// ability, not a running pattern). Also the first level whose start shows
// an ability-unlock popup for the *last* abilityUnlockOrder entry
// (rocketBoost, granted on level-003's completion) -- previously that
// grant hit handleLevelComplete()'s no-next-level fallback timing since
// level-003 was LEVEL_ORDER's last entry; now it takes the normal
// start-of-next-level path like scan/teleport did (GameScene.ts,
// AbilityUnlockScene bullet in CLAUDE.md's Architecture contract).
export const LEVEL_ORDER: string[] = ['level-001', 'level-002', 'level-003', 'level-004'];

// Reachable only via TitleScene's "Test Level" entry point, never through
// LEVEL_ORDER progression -- GameScene.handleLevelComplete() special-cases
// this id to return to TitleScene instead of granting an ability/saving/
// advancing. Keep this level's content exhaustive (every hazard, every
// puzzle element) for exercising the full mechanical surface at once.
export const TEST_LEVEL_ID = 'level-000';
