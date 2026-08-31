# Gap Analysis — 2026-08-19

Run by the GDD Gap Agent against `main` @ `8c78620` ("Add level-007 and
level-008, generated via the GER agent team"). Tree was clean at the start
of this run (one previously-untracked doc file, `docs/reference/README.md`,
had already been resolved by the user before this run started — confirmed
via `git status`, nothing else untracked/modified). Implementation landed
on `feature/pause-scene-return-to-title`, left uncommitted for review.

## Method

Read `trailing_edge_gdd_draft_31.md` in full (§1–§13, all ~650 lines,
including the archived Unreal plan for context only), cross-checked against
`CLAUDE.md`'s condensed contract (no drift found between the two as of this
pass — CLAUDE.md's Architecture contract section and "Current project
state" accurately reflect the GDD's §11/§12, including the 2026-08-14/15
ability rework and the 2026-08-12 test-level/level-content split). Read
`docs/STATUS.md` (asset-readiness) and `docs/reference/level-design-guide.md`
(content-authoring conventions) for context on what's code-complete vs.
art/content-incomplete. Walked all 60 files under `src/` (`Read`/`Grep`),
checked every `SystemRegistry.register()` call site, every scene's
registration in `main.ts`, and cross-referenced every `src/config/*.ts`
module against its consumers to rule out orphaned ("present, not wired")
config. Ran `npx tsc --noEmit -p .` (clean) and grepped for hard-rule
violations (`localStorage` outside `SaveManager`, direct
`currentEnergy`/`currentStructure` writes outside `ShipSurvivalComponent`,
non-`arcadeBodyHelpers` `setCircle`/`setSize` calls) — none found. Also
read the prior `docs/history/gap-analysis-2026-08-11.md` for method/format
precedent and to check whether anything found this run had already been
flagged-and-deferred there (it hadn't — see below).

`git log -10` and `git status` confirmed a clean tree at commit `8c78620`,
in sync with `origin/main`. Per the task framing, recent history
(`9d4b9ab` through `8c78620`) is entirely Content-Agent/GER-pipeline level
work (`level-005` through `level-008`, a hitbox bugfix, a circuit breaker
for the GER loop) — no core-contract file has been touched since the
2026-08-15 ability-rework retiming (`8c2b88a`), which is exactly the kind
of gap the task brief predicted: a Scene-flow item that Phase 2a marked
"closed" on 2026-08-10/11 without every sub-requirement actually being
checked against the GDD's exact text.

## Checklist vs. actual state

### Phase 1 (GDD §12 step 1–6) — gate criteria

| Item | State | Evidence |
|---|---|---|
| `ExplorationController` (click-to-move, non-Newtonian, click-and-drag, ability hotkeys) | **Present & wired** | `src/systems/ExplorationController.ts`, self-registers via `SystemRegistry.register()` at module load, imported through `src/systems/index.ts` |
| `ShipSurvivalComponent` + Debris Field (`blocksMovement`, zero cost) + AsteroidField `ResupplyPoint` | **Present & wired** | `src/objects/ShipSurvivalComponent.ts` (private fields, `consumeEnergy`/`consumeStructure`/`regenEnergy`/`repairStructure` the only mutators); `hazardConfig.ts`'s `debrisField` entry matches the 2026-08-07 re-scope exactly |
| `ProbeObject`/`RelayBeaconObject`/`EntryWormhole`/`ExitWormhole`/`LevelObjectiveTracker` end-to-end | **Present & wired** | All five constructed and threaded through one shared `tracker` in `GameScene.create()`, sourced from each level's `LevelConfig` (not hardcoded, since the 2026-08-12 data-driven-levels change) |
| Hard-fail full-restart flow | **Present & wired** | `GameScene.wireHardFailRestart()` → `scene.restart({ levelId })` on `StructureDepleted`; `LevelObjectiveTracker`'s `probeFound`/`beaconReached` reset on every `create()` |
| Bare-minimum `HudOverlay` / `ShipStatusArcs` | **Present & wired** (superseded/expanded per 2026-08-10, 2026-08-14) | Both instantiated in `create()`, updated every frame; `ShipStatusArcs` is the horizontal-bar version (post-2026-08-14 dome-arc-to-bar switch) |
| **Gate checks** (`SystemRegistry` validated, 5 visually distinct hazards, tractor prototyped) | **Present** | `SystemRegistry` in active use by 2 systems (`exploration`, `progression`) with no key collisions; all 5 `hazardConfig.ts` entries have distinct shape/color/behavior; `PushPullObjectElement` (tractor-gated) built and wired |

**Phase 1 remains gate-clean.** No open Phase 1 items found — matches the
2026-08-11 run's finding, unchanged since.

### Phase 2a (GDD §12/§11.8, "still core work")

| Item | State | Evidence |
|---|---|---|
| All five `PuzzleElementBase` subtypes | **Present & wired** | `src/objects/puzzle/*.ts` (five files), each constructed via `src/levels/puzzleElementFactory.ts`'s `createPuzzleElement()`, grouped into a `PuzzleSite` per placement in `GameScene.create()`; `level-000` carries one exhaustive instance of each |
| `AbilityComponent` + 2026-08-14 ability rework (`scan` duration/hazard-ID, `teleport` arm/left-click-confirm, `rocketBoost` straight-line burst, `tractorBeam` de-scoped from UI) | **Present & wired** | `src/objects/AbilityComponent.ts`, `src/systems/ExplorationController.ts` (§11.4a effects), `src/objects/HazardScanOverlay.ts`, `src/objects/TeleportRangeRing.ts` — all match GDD §7/§11.4/§11.4a's text exactly, including the documented left-click-not-right-click switch |
| `ProgressionManager` (`abilityUnlockOrder`, 3 entries, Test Level force-grant) | **Present & wired** | `src/systems/ProgressionManager.ts`, durable `SystemRegistry` singleton, `init()` deliberately a no-op; `GameScene.create()`'s Test-Level branch force-grants all three |
| `SaveManager` (simplified, level-completion only) | **Present & wired** | `src/objects/SaveManager.ts`, sole `localStorage` touchpoint (grep-confirmed); two call sites (`GameScene.handleLevelComplete`, `TitleScene`) match §11.9 exactly |
| `HudOverlay` (ability icons sourced from `abilityUnlockOrder`, puzzle-site indicator, gated objective marker + `flashObjectiveMarker()`) | **Present & wired** | `src/objects/HudOverlay.ts` — every 2026-08-14 amendment (marker gated on `scan`-active-or-flash, `tractorBeam` excluded from icon row) present and correct |
| `AbilityUnlockScene` (2026-08-14, retimed 2026-08-15) | **Present & wired** | `src/scenes/AbilityUnlockScene.ts`; `GameScene`'s `pendingAbilityUnlock`/`GameSceneData.unlockedAbility` handoff matches the documented retiming (shown at the *start* of the next level, not the end of the granting one; terminal-level fallback shown at the old timing) exactly |
| `BootScene` | **Present & wired** | Loads all currently-sourced textures; starts `TitleScene` |
| `TitleScene` (Start/Continue/Test Level) | **Present & wired** | `Continue` gated on `hasSaveData()`; `Start` always begins at `LEVEL_ORDER[0]`; `Test Level` bypasses save read/write entirely, per spec |
| `WinScene` | **Present, minimal by design** | Shows terminal text only — GDD §11.8 explicitly allows this ("fine to keep minimal"). One stale comment (`// Not reachable yet — no levels exist.`) left over from before `LEVEL_ORDER` had real content — cosmetic doc-drift, not a functional gap, not touched this run per one-feature discipline |
| **`PauseScene`** | **Present, incompletely wired — see winning gap below** | Registered in `main.ts`, launched correctly from `GameScene`'s ESC handler — but implements only the "resume" half of what GDD §11.8 specifies, not the "one option: return to `TitleScene`" half |

**Phase 2a is not fully closed** — see the winning gap.

**Explicitly not gaps (checked, not just assumed):**
- Real art for puzzle elements and the three non-Debris/non-Meteoroid
  hazards is still placeholder/procedural. Tracked in `docs/STATUS.md`;
  asset-readiness gap, not a code gap.
- `puzzleElements: []` on every real level (`level-001`–`level-008`) —
  confirmed intentional per `docs/reference/level-design-guide.md` §4 and
  GDD §12's Phase 2b scope lever (puzzle-taxonomy content is optional,
  additive, explicitly deferred content work, not a code gap).
- The GDD §9 "Sequential mandatory puzzle gating" open item — explicitly
  marked "not decided, no code changes made" in the GDD itself. Not this
  agent's call to resolve unilaterally; would also require touching
  `LevelObjectiveTracker`'s sequencing, which the GDD entry itself flags as
  contingent on a design decision, not an engineering gap.
- Ion Storm/Nebula Field visual differentiation, structure-vs-energy
  stakes legibility — both explicitly still-open design/art questions
  (GDD §9), reconfirmed unresolved-but-mitigated (via `scan`) across every
  level's GER evaluation log. Design questions requiring human/art-review
  judgment, not code gaps.
- `CheckpointManager` — deferred by design (§11.2), excluded from
  consideration per the task brief.
- Endurance-upgrade progression track — deferred by design (§7).

### Phase 2b (content) / Phase 3 (integration)

| Item | State | Evidence |
|---|---|---|
| Levels beyond `level-000` | **Present** — 8 real levels (`level-001`–`level-008`) in `LEVEL_ORDER`, each with required `probeLocation`/`relayBeaconLocation`/`entryWormholeLocation`/`exitWormholeLocation`, verified present on every file | `src/levels/level-00{1..8}.ts`, `src/config/levelOrder.ts` |
| Per-level authored TS config + loader (GDD §11.7) | **Present & wired** | `src/levels/levelTypes.ts`, `src/levels/index.ts` (`getLevelConfig`), `GameScene.create()` reads from it exclusively — the runner-up gap from the 2026-08-11 report is now closed |
| Full `LEVEL_ORDER` playthrough / `Continue` resume / packaged-build check (Phase 3) | **Not yet run this session** | Out of scope for a single-feature gap-closing run; noted for a future integration pass, not treated as this run's candidate |

### Cross-cutting hard-rule check (CLAUDE.md's Architecture contract)

| Rule | Status |
|---|---|
| Survival fields private, touched only via `consumeEnergy`/`consumeStructure`/`regenEnergy`/`repairStructure` | Holds — `ShipSurvivalComponent.ts`'s fields are `private`/`readonly`; every consumer (`HazardZoneElement`, `ResupplyPoint`, `AbilityComponent`) only calls the public methods; `ShipStatusArcs` only reads `snapshot()` |
| New systems registered via `SystemRegistry.register()` from their own file | Holds — `exploration`/`progression` both self-register at module load; `src/systems/index.ts` is a pure side-effect import barrel; `MovingHazardManager` is correctly *not* a `SystemRegistry` entry (documented, intentional — it's `GameScene`-owned, per-level state) |
| No direct `localStorage` outside `SaveManager` | Holds — grepped repo-wide, only hits in `src/objects/SaveManager.ts` |
| No puzzle/hazard/ability code sets resource values itself | Holds — every hazard/puzzle/ability consumption call routes through `ShipSurvivalComponent`'s public methods |
| Collision/interaction sizes are authored data, never derived from sprite pixel size | Holds — `arcadeBodyHelpers.ts`'s `setCircleFromWorldRadius`/`setRectFromWorldSize` used at every Arcade-body call site; the 2026-08-17 off-center-hitbox fix (`1daf98c`) is correctly generalized, not a one-off patch |
| Tunable values live in per-subsystem config modules, never inline | Holds — every `src/config/*.ts` module is referenced by its intended consumer(s) (no orphans, checked via grep-per-module) and registered on `window.tuning` |
| Nobody hand-edits a Scene's `create()` to wire a system | Holds — `GameScene.create()`'s only per-system loop is `SystemRegistry.all().forEach((system) => system.init?.(this))` |

No hard-rule violation found this run — a genuine change from the
2026-08-11 run, which found and closed one (`hazardConfig.ts` extraction).

## Prioritization

Ranked candidates, most to least prioritized:

1. **`PauseScene`'s missing "return to `TitleScene`" option — selected.**
   - **What's missing:** GDD §11.8 states explicitly: *"`PauseScene` —
     launched as an overlay on top of a paused `GameScene`
     ... One option: return to `TitleScene`. This is a hard cut, not a
     save point — whatever progress exists is only as current as the last
     level-completion save ... there's no separate 'save on pause'
     behavior, so pausing and returning to title never loses more than a
     hard-fail reset already would."* CLAUDE.md's Architecture contract
     mirrors this verbatim. The actual `src/scenes/PauseScene.ts` as of
     `8c78620` implements *only* the resume half: a semi-transparent
     overlay, a "Paused" label, and a `keydown-ESC` listener that resumes
     `GameScene`. There is no button, no keybind, and no code path of any
     kind that returns to `TitleScene` — a player who opens the pause menu
     has exactly one way out of the current level: resume it. This is a
     complete absence of an explicitly-named contract requirement, not a
     partial implementation or a style nit.
   - **Why it wasn't caught before:** the 2026-08-11 gap-analysis run
     checked `PauseScene` only for *registration* ("all four registered in
     `main.ts`'s scene array") — a necessary but not sufficient check. This
     run read the class's actual contents against the GDD's exact
     "One option: return to `TitleScene`" line and found the gap the
     registration-only check couldn't have caught. No later commit touched
     `PauseScene.ts` (last touched at its original creation, before
     `9212817`) to introduce or fix this — it's been present, unnoticed,
     since Phase 2a was first marked closed.
   - *Phase ordering:* Squarely Phase 2a, §11.8's Scene-flow line item —
     explicitly named alongside `BootScene`/`TitleScene`/`WinScene` as
     "core work" that "does need to close before Phase 2b, since ...
     Scene transitions are exactly the kind of shared-file risk the
     core-vs-content split exists to keep out of the parallel track." Phase
     2a is otherwise fully closed (see table above); this is the one
     remaining open Phase 2a item, and Phase 2b (8 levels' worth of content)
     has already been proceeding in parallel — exactly the situation
     CLAUDE.md's prioritization rubric singles out ("never propose Phase 2b
     content work over an open Phase 2a core gap" — this run doesn't do
     that; it closes the 2a gap instead of adding a 9th level).
   - *Contract-hard-rule risk:* Lower than a true hard-rule violation (no
     `private`-field bypass, no stray `localStorage` call), but it's a
     literal, named contract line ("one option: return to TitleScene") left
     unimplemented, not a soft convention. A player currently has no
     in-game way to abandon a level attempt and get back to `TitleScene`
     short of a hard browser refresh (which is also not equivalent —
     refreshing loses the dev-console debug hooks and re-runs `BootScene`'s
     preload unnecessarily) — a real, if minor, player-facing dead end that
     the GDD specifically called out as needing an explicit escape hatch.
   - *Wiring-only, not new construction:* `PauseScene` already exists, is
     already registered in `main.ts`, and is already correctly launched as
     a stacked overlay from `GameScene`'s ESC handler. This is a pure
     addition to one existing, self-contained file — no new class, no new
     Scene, no new registration.
   - *Blast radius:* `src/scenes/PauseScene.ts` only. Does **not** require
     touching `main.ts` (already registered), `GameScene.ts`'s `create()`
     (the ESC-launch call site is unaffected — `PauseScene` decides its own
     exit behavior internally, same pattern `AbilityUnlockScene`'s
     `onClose` callback already established for *its* Scene-transition
     logic, just self-contained rather than callback-driven since
     `PauseScene` doesn't need level-specific data to know where to go),
     or `SystemRegistry`. Confirmed via the diff below: one file changed.

2. **Runner-up: stale `WinScene` comment** (`// Not reachable yet — no
   levels exist.`) — considered and rejected as this run's pick.
   - Purely a doc/comment drift issue, not a functional gap — `WinScene`
     itself works correctly and is in fact now reachable (`LEVEL_ORDER` has
     8 entries). GDD §11.8 explicitly allows `WinScene` to stay minimal
     ("a message, maybe a return-to-title option ... fine to keep minimal").
     Fixing a stale comment doesn't close any GDD-mandated requirement the
     way the `PauseScene` gap does, and — notably — `WinScene` has no
     equivalent missing "return to TitleScene" requirement in the GDD text
     to begin with (unlike `PauseScene`, where it's explicitly named), so
     there's nothing functionally incomplete about it. Would have been a
     one-line drive-by fix bundled into the `PauseScene` change, but per
     this run's own scope discipline (one feature, no adjacent scope creep)
     it's left untouched and flagged here instead.

3. **Considered and rejected, no further action taken:**
   - *Additional levels / puzzle-taxonomy content placement* — Phase 2b
     content authorship (design decisions: placement, difficulty,
     narrative framing), already actively being produced by the
     Content-Agent/GER pipeline per recent history; not this agent's
     remit, and CLAUDE.md's rubric explicitly ranks an open Phase 2a core
     gap above any Phase 2b content work regardless.
   - *GDD §9's sequential mandatory puzzle-site gating* — explicitly
     undecided in the GDD itself ("not decided, no code changes made");
     implementing it would mean making a design call this agent isn't
     authorized to make, not closing an engineering gap.
   - *Real art for placeholder hazards/puzzle elements* — asset-readiness
     gap tracked in `docs/STATUS.md`, not a code gap.
   - *`CheckpointManager` / endurance-upgrade progression* — both deferred
     by design, excluded from consideration per the task brief and the
     GDD's own explicit "not currently due" framing.
   - *Phase 3 integration pass (full `LEVEL_ORDER` playthrough, packaged
     build check)* — gates on Phase 2b content being considered
     content-complete, which is an ongoing, actively-progressing content
     decision outside this run's scope, not a stalled or missing system.

## What was built

**Branch:** `feature/pause-scene-return-to-title` (created from a clean
`main` tree at `8c78620`; left uncommitted for review).

- **Modified:** `src/scenes/PauseScene.ts` — added a clickable "Resume"
  option (same interaction as the existing `ESC`-to-resume, now also
  available as a button, matching `TitleScene`/`AbilityUnlockScene`'s
  existing text-button convention) and the GDD-required "Return to Title"
  option. Selecting it performs the "hard cut" GDD §11.8 describes:
  `this.scene.stop('GameScene')` (tears down the current attempt — no
  partial state carries over, consistent with there being no save-on-pause
  behavior) followed by `this.scene.stop()` (this overlay) and
  `this.scene.start('TitleScene')`. No other file was touched — `main.ts`
  already registers `PauseScene`, and `GameScene.ts`'s existing
  `scene.launch('PauseScene')` call site needed no change, since the new
  behavior is entirely internal to `PauseScene`'s own button handlers.
- **Verified:** `npx tsc --noEmit -p .` passes clean (rerun after the edit).
- **Hard rules:** no `SystemRegistry` involvement needed (Scene
  registration, not a `GameSystem`); no `localStorage` touched; no
  survival-resource field touched; no shared wiring file (`main.ts`,
  `GameScene.create()`) edited.

No hard rule was broken to close this gap, and no shared wiring file
required a hand-edit.
