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
export const LEVEL_ORDER: string[] = ['level-001'];

// Reachable only via TitleScene's "Test Level" entry point, never through
// LEVEL_ORDER progression -- GameScene.handleLevelComplete() special-cases
// this id to return to TitleScene instead of granting an ability/saving/
// advancing. Keep this level's content exhaustive (every hazard, every
// puzzle element) for exercising the full mechanical surface at once.
export const TEST_LEVEL_ID = 'level-000';
