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
//
// 2026-08-17: level-005 and level-006 appended, in that order. Both sit in
// level-design-guide.md §8's post-full-unlock experimentation zone -- the
// player already has scan/teleport/rocketBoost (and tractorBeam,
// unlocked-by-default) by the time they reach either, so §4/§7's
// ability-gating constraints no longer apply. Registered here only after
// each passed the Evaluate/Refine GER loop individually (see each level
// file's header comment for its candidate/evaluation history).
//
// 2026-08-17: level-007 appended. Also sits in the post-full-unlock
// experimentation zone; its axis is three simultaneous debrisRing()-sealed
// pockets (Probe, the AsteroidField resupply point, and the mandatory
// Relay Beacon), structurally distinct from level-005's moving-hazard
// density push and level-006's single serpentine maze. Registered after
// passing Evaluate on round 2 of at most 3 (round 1 flagged one
// [placement] clearance issue, fixed and re-verified) -- see
// level-007.ts's header comment and docs/history/level-eval-log-2026-08-17.md
// for the full evaluation history.
//
// 2026-08-17: level-008 appended. Also sits in the post-full-unlock
// experimentation zone; its axis is Nebula Field density (a three-wall
// "Drift Expanse" gauntlet the player has to cross twice, plus four other
// intent-placed formations), with Debris Field deliberately kept minimal --
// structurally distinct from level-005's moving-hazard density push,
// level-006's single serpentine maze, and level-007's triple sealed ring.
// Registered after passing Evaluate on round 2 of at most 3 (round 1
// flagged two [placement] clearance issues -- the bridging toll's near end
// and the SW Ion Storm placement, both fixed and re-verified) -- see
// level-008.ts's header comment and docs/history/level-eval-log-2026-08-17.md
// for the full evaluation history.
//
// 2026-08-25: level-010 appended (level-009 not yet registered at the time
// this entry was appended -- a sibling GER batch, authored/evaluated
// concurrently; see docs/history/level-eval-log-2026-08-25.md for both
// candidates' entries). Also sits in the post-full-unlock experimentation
// zone; its axis is a serpentine four-wall Debris Field maze with a fully
// enclosed Debris Field vault embedded directly in one of the maze's own
// lanes, sealing the Probe, reachable only by teleport -- structurally
// distinct from level-006's maze-with-no-seal and level-007's
// triple-corner-pocket seals (this is the first level to combine a maze
// and a seal on the same structure). Registered after passing Evaluate on
// round 1 (flagged one [placement] issue: 5 of 7 Ion Storm/Meteoroid
// placements physically embedded in a maze wall during their fixed-heading
// first leg, since this maze's four parallel walls with disjoint-band gaps
// left no y-value that clears every wall for an interior-lane placement --
// fixed by relocating every Ion Storm west of the maze and every Meteoroid
// east of it, the only placements structurally guaranteed clean, and
// re-verified via a fresh full-first-leg trajectory simulation) -- see
// level-010.ts's header comment and
// docs/history/level-eval-log-2026-08-25.md for the full evaluation/fix
// history.
//
// 2026-08-25 (later same day): level-009 appended immediately before
// level-010, per the note above -- its candidate predates level-010's in
// the same concurrent GER batch, so it's inserted in front rather than
// appended after (the array itself is still append-only from the tail;
// this is the one-time reordering the level-010 entry above flagged as
// expected). Also sits in the post-full-unlock experimentation zone; its
// axis is the highest-yet combined Ion Storm+Meteoroid count (12 total),
// structurally distinct from level-010's maze+seal combination and every
// other level's axis. (The candidate originally also placed the project's
// first real Solar Flare instances; pulled same day at the project owner's
// request -- no sourced art yet and its role isn't settled -- see
// level-009.ts's own comment. level-design-guide.md §12's "Solar Flare has
// no placement precedent" item is therefore still open.) Registered after
// passing Evaluate on round 1 (flagged one
// [placement] issue: 5 of 7 Ion Storm and 2 of 5 Meteoroid placements
// physically overlapped a wall/objective/resupply point during their
// fixed-heading first leg, since the Generate stage's clearance check only
// covered each hazard's initial point, not the fact that Ion Storm/
// Meteoroid hold a constant perpendicular coordinate for their entire first
// leg -- fixed by re-simulating each flagged hazard's full first-leg
// trajectory and relocating it to a y/x that clears every static feature by
// 250px+ throughout, re-verified the same way) -- see level-009.ts's header
// comment and docs/history/level-eval-log-2026-08-25.md for the full
// evaluation/fix history.
export const LEVEL_ORDER: string[] = [
  'level-001',
  'level-002',
  'level-003',
  'level-004',
  'level-005',
  'level-006',
  'level-007',
  'level-008',
  'level-009',
  'level-010',
];

// Reachable only via TitleScene's "Test Level" entry point, never through
// LEVEL_ORDER progression -- GameScene.handleLevelComplete() special-cases
// this id to return to TitleScene instead of granting an ability/saving/
// advancing. Keep this level's content exhaustive (every hazard, every
// puzzle element) for exercising the full mechanical surface at once.
export const TEST_LEVEL_ID = 'level-000';
