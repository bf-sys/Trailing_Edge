// Linear level progression (GDD §11.7/§8 — no level-select). Content agents
// append new level ids here as Phase 2b adds levels; nobody hardcodes a
// "next level" pointer inside a level itself. Shared by GameScene (resolves
// "next level" on completion, §11.8) and TitleScene (Start always begins at
// LEVEL_ORDER[0]). Exactly one level exists so far — Phase 1/2a's test
// level — growing this array is Phase 2b's job, not this file's.
export const LEVEL_ORDER: string[] = ['level-000'];
