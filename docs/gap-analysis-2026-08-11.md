# Gap Analysis — 2026-08-11

Run by the GDD Gap Agent against `main` @ `9212817` ("Update CLAUDE.md:
Phase 2a is built, not just Phase 1"). Tree was clean at the start of this
run (no uncommitted work to preserve). Implementation landed on
`feature/hazard-config-extraction`, left uncommitted for review.

## Method

Read `trailing_edge_gdd_draft_31.md` §11 (contract) and §12 (phase plan) in
full, cross-checked against `CLAUDE.md`'s condensed summary (no drift found
between the two as of this pass — CLAUDE.md's 2026-08-11 refresh accurately
reflects the GDD), then read every file under `src/` (43 files) plus
`docs/STATUS.md` and `docs/reference/console-tuning-reference.md` for
asset-readiness/tuning-completeness context. `git log -10` and `git status`
confirmed a clean tree at commit `9212817`, three commits ahead of
`origin/main`, with Phase 2a's work already committed (`670c51a`) rather
than sitting uncommitted — consistent with the task framing that this was
previously-undocumented work now folded into history.

## Checklist vs. actual state

### Phase 1 (GDD §12 step 1-6) — gate criteria

| Item | State | Evidence |
|---|---|---|
| `ExplorationController` (click-to-move, non-Newtonian) | **Present & wired** | `src/systems/ExplorationController.ts`, registered via `SystemRegistry.register()` at module load, imported through `src/systems/index.ts` |
| `ShipSurvivalComponent` + Debris Field hazard + AsteroidField resupply | **Present & wired** | `src/objects/ShipSurvivalComponent.ts`; `HazardZoneElement` placed in `GameScene.create()`; `ResupplyPoint` likewise |
| `ProbeObject`/`RelayBeaconObject`/`EntryWormhole`/`ExitWormhole`/`LevelObjectiveTracker` end-to-end | **Present & wired** | All five constructed and threaded through one shared `tracker` in `GameScene.create()` |
| Hard-fail full-restart flow | **Present & wired** | `GameScene.wireHardFailRestart()` listens for `SHIP_SURVIVAL_EVENTS.StructureDepleted` → `scene.restart()` |
| Bare-minimum `HudOverlay` / `ShipStatusArcs` | **Present & wired** | Both instantiated in `create()`, updated every frame |
| **Gate checks** (SystemRegistry validated, 4 visually distinct hazards, tractor prototyped, stakes-legibility considered) | **Present** | `SystemRegistry.ts` in active use by 2 systems with no collision; all 5 `HazardZoneElement` configs exist and are placed together in the one test level; `PushPullObjectElement` (tractor-gated) built and wired |

**Phase 1 is gate-clean.** No open Phase 1 items found.

### Phase 2a (GDD §12, "still core work")

| Item | State | Evidence |
|---|---|---|
| `SequenceSpotElement` (Signal Array) | **Present & wired** | `src/objects/puzzle/SequenceSpotElement.ts`, instantiated + pushed into `puzzleElements`/`puzzleSiteMarkers` in `GameScene.create()` |
| `ScanInteractElement` | **Present & wired** | same pattern, `src/objects/puzzle/ScanInteractElement.ts` |
| `MovingSpotDurationElement` (Comet) | **Present & wired** | `src/objects/puzzle/MovingSpotDurationElement.ts` |
| `PushPullObjectElement` (Cargo Pod, tractor-gated) | **Present & wired** | `src/objects/puzzle/PushPullObjectElement.ts`; gates on `AbilityComponent.isUnlocked('tractorBeam')` per contract |
| `TrailDrawElement` (Beacon Cluster) | **Present & wired** | `src/objects/puzzle/TrailDrawElement.ts` |
| `PuzzleElementBase` / `PuzzleSite` | **Present & wired** | `src/objects/PuzzleElementBase.ts`, `src/objects/PuzzleSite.ts`; every element above extends/groups through these |
| `AbilityComponent` | **Present & wired** | `src/objects/AbilityComponent.ts`, composed onto `PlayerShip`; hotkeys bound in `ExplorationController.init()` |
| `ProgressionManager` | **Present & wired** | `src/systems/ProgressionManager.ts`, registered via `SystemRegistry`; `grantNextAbility()` called from `GameScene.handleLevelComplete()` |
| `SaveManager` (simplified) | **Present & wired** | `src/objects/SaveManager.ts`; single write site (`GameScene.handleLevelComplete()`), read from `TitleScene` |
| `BootScene`/`TitleScene`/`PauseScene`/`WinScene` | **Present & wired** | all four registered in `main.ts`'s scene array; `TitleScene` has working Start/Continue gated on `hasSaveData()` |
| `HudOverlay` ability icons + puzzle-site indicator | **Present & wired** | `updateAbilityIcons()`/`updatePuzzleSiteIndicator()` in `src/objects/HudOverlay.ts`, fed by `setPuzzleSites()` from `GameScene` |

**Phase 2a is closed.** This matches the refreshed `CLAUDE.md` — I found no
evidence contradicting it, and no leftover uncommitted Phase 2a work (it's
already in history at `670c51a`).

**Explicitly not gaps (per task framing, confirmed against `src/` rather
than taken on faith):**
- Only `tractorBeam` has an in-world effect; `scan`/`teleport`/`rocketBoost`
  gate correctly (`AbilityComponent.tryActivate()`, unlock/cooldown/energy
  all functional) but do nothing in-world yet. Confirmed via
  `abilityConfig.ts`'s own comment and absence of any consumer code for
  those three types beyond the gate itself. Flagged in-repo, not silently
  missing — left untouched.
- Real art for puzzle elements and the three non-Debris/non-Meteoroid
  hazards is placeholder (procedural shapes/`createHazardPlaceholderTexture`
  equivalents). Tracked in `docs/STATUS.md`; asset-sourcing gap, not a code
  gap — left untouched.
- `CheckpointManager` — deferred by design (§11.2), not built, not a gap.
- Endurance-upgrade progression track — deferred by design (§7), not built,
  not a gap.

### Phase 2b (content) / Phase 3 (integration)

| Item | State | Evidence |
|---|---|---|
| Additional levels beyond `level-000` | **Missing entirely** | `LEVEL_ORDER = ['level-000']` (`src/config/levelOrder.ts`); everything in `GameScene.create()` is one hardcoded test layout |
| Per-level authored TS/JSON config files (GDD §11.7) | **Missing entirely** | No `src/levels/` (or similar) directory; all placement/config is inline in `GameScene.create()`, explicitly flagged in its own comments as test-scene scaffolding, not real per-level authoring |
| Full `levelOrder` playthrough / `Continue` resume / packaged-build check | **Not applicable yet** | Phase 3 gates on Phase 2b having real content; nothing to integration-test beyond the one test level, which already playtests clean per `CLAUDE.md` |

Per GDD §12, Phase 2b is **content** work (levels, hazard/puzzle
*placement* against the already-closed `HazardZoneElement`/puzzle-element
classes) — explicitly the Content Agents' job, done in per-level files that
never touch core files. Building actual new levels is a design/content
decision outside this agent's remit (a "one feature, own files, reviewable"
build task doesn't fit "author a new level"), so I did not treat "add
level-001" as this run's candidate, and instead looked for what's *blocking*
Phase 2b from being safe to hand to a Content Agent at all.

### Cross-cutting hard-rule check (CLAUDE.md's Architecture contract)

| Rule | Status |
|---|---|
| Survival fields private, touched only via `consumeEnergy`/`consumeStructure`/`regenEnergy`/`repairStructure` | Holds — checked `ShipSurvivalComponent.ts`, `HazardZoneElement.ts`, `ResupplyPoint.ts` |
| New systems registered via `SystemRegistry.register()` from their own file | Holds — `ExplorationController.ts`/`ProgressionManager.ts` both self-register; `src/systems/index.ts` is a pure side-effect import barrel |
| No direct `localStorage` outside `SaveManager` | Holds — grepped for `localStorage`, only hit is `src/objects/SaveManager.ts` |
| No puzzle/hazard/ability code sets resource values itself | Holds — all consumption routes through `ShipSurvivalComponent`'s public methods |
| Collision/interaction sizes are authored data, not derived from sprite pixel size | Holds — `arcadeBodyHelpers.ts`'s `setCircleFromWorldRadius`/`setRectFromWorldSize` used at every placement site |
| **Tunable values live in per-subsystem config modules, never inline** | **Violated** — see winning gap below. Every other subsystem (`shipConfig`, `survivalConfig`, `abilityConfig`, `puzzleConfig`, `hudConfig`, `shipStatusArcConfig`, `waypointTintConfig`, `destinationMarkerConfig`, `backgroundSetPieceConfig`) has a dedicated config module registered on `window.tuning`. Hazard shape/movement/activation/cost values did not — they were literal object expressions inline in `GameScene.create()`, one per hazard instance, for all five hazard types. `CLAUDE.md`'s tech-stack section names "hazard ... costs" explicitly as an example of what belongs in a config module. `docs/reference/console-tuning-reference.md` had this listed under its own "Not tunable from the console yet" section, confirming it as a known, still-open item rather than something newly discovered here. |

## Prioritization

Ranked candidates, most to least prioritized:

1. **Hazard config extraction (`hazardConfig.ts`)** — **selected.**
   - *Phase ordering:* Not Phase 2b content (no new level/placement data
     added) and not a re-opening of Phase 1/2a scope — it's closing an
     infrastructure convention CLAUDE.md says should have existed "from the
     start of Phase 1, since most of Phase 1 is feel-tuning." Effectively an
     open Phase-1-adjacent gate item that slipped through because Debris
     Field (Phase 1's only hazard) got its config inline before the
     `window.tuning` convention had a name, and Phase 2a's four additional
     hazard configs (Solar Flare/Ion Storm/Nebula Field/Meteoroid) copied
     that same inline pattern instead of establishing the missing module.
   - *Contract-hard-rule risk:* Direct, named violation of an explicit hard
     rule (see table above), not merely "not built yet." Every other
     subsystem in the same codebase already follows the pattern this gap
     violates, so it's also an internal-consistency risk — the next agent
     touching hazards has an inline-literal precedent to copy from unless
     this is fixed.
   - *Wiring-only, not new construction:* `HazardZoneElement` itself is
     fully built and correctly wired for all 5 hazard types; this is a
     values-relocation refactor (config extraction), the cheapest class of
     fix per the agent's own prioritization rubric — no new class, no new
     gameplay behavior, no new files beyond one config module.
   - *Blast radius:* Touches `GameScene.ts`, but only the hazard-placement
     block (values → references) and adds one `placeHazard()` helper method
     — it does not touch `SystemRegistry`, does not register anything by
     hand-editing `create()`'s system-init loop, and doesn't change any
     other Scene. Confirmed via `git diff --stat`: 2 files modified (one of
     them docs), 1 file added.
   - *Self-documented as open:* `docs/reference/console-tuning-reference.md`
     already listed this exact gap under "Not tunable from the console yet"
     before this run — not a new discovery, a known item finally closed.

2. **Runner-up: extract Phase 2b's per-level config mechanism** (a
   `LevelConfig` schema + loader so `GameScene.create()` reads a per-level
   data file instead of hardcoding `level-000`'s entire layout inline).
   - Why it lost: GDD §11.7 frames "one hand-authored TS/JSON config file
     per level" as part of Phase 2b's *content* deliverable, not a
     separate Phase 2a/contract deliverable with its own gate — the GDD's
     own phase plan bundles the loader mechanism into "content production
     against the closed core contract," implying Content Agents build the
     first real level file(s) and whatever minimal loading code they need
     alongside them, not that the Core-Contract Agent pre-builds an empty
     schema speculatively. More importantly: this fix would require
     restructuring most of `GameScene.create()` (probe/beacon/wormhole
     placement, puzzle-site placement, hazard placement, camera/world
     bounds — nearly the entire method), which is a much larger blast
     radius against the one Scene file every future content/core agent
     touches, and it would require making non-trivial, currently-undecided
     design calls (what exactly is the `LevelConfig` shape? does it cover
     camera bounds? background set pieces?) that read as exactly the kind
     of thing this run's own rules say to flag rather than decide
     unilaterally. Flagging it here rather than building it: **a follow-up
     session should scope the `LevelConfig` schema explicitly before a
     Content Agent is asked to author `level-001`**, since right now doing
     so would require that agent to hand-edit `GameScene.create()` directly
     — precisely the shared-wiring-file risk the project's own
     `SystemRegistry` precedent was built to avoid for systems, with no
     equivalent yet for level content.

3. **Considered and rejected as this run's pick, no further action taken:**
   - *Ability in-world effects for scan/teleport/rocketBoost* — explicitly
     flagged in the task brief as known-and-intentional, not a gap to
     silently complete.
   - *Real art for placeholder hazards/puzzle elements* — asset-readiness
     gap, tracked in `docs/STATUS.md`, not a code gap, out of scope for a
     code-focused gap-closing run.
   - *`CheckpointManager`* — deferred by design (§11.2), reintroduction is
     an explicit future decision point ("once maps and secondary
     progression grow"), not currently due.
   - *Additional levels (`level-001`+)* — Phase 2b content authorship, a
     design decision (placement, difficulty, narrative framing) rather than
     an engineering gap; also blocked on item 2 above being scoped first.
   - *`console-tuning-reference.md`'s stale "AbilityComponent doesn't exist
     yet" bullet* — noticed while editing the adjacent "not tunable yet"
     list (it's wrong — `AbilityComponent` exists and is already tunable via
     `window.tuning.ability`), but it's a pre-existing, unrelated doc-drift
     item, not part of the hazard-config gap. Left untouched per this run's
     one-feature discipline; worth a quick follow-up fix since it's cheap
     and already noticed.

## What was built

**Branch:** `feature/hazard-config-extraction` (created from a clean `main`
tree at `9212817`; left uncommitted for review).

- **New:** `src/config/hazardConfig.ts` — a `Record<HazardType,
  HazardTypeConfig>` covering all five named hazards (`debrisField`,
  `solarFlare`, `ionStorm`, `nebulaField`, `meteoroid`). Each entry holds
  `textureKey`, `shape`, `movementPattern`/`speed`/`headingRadians`,
  `activation`/`pulseIntervalSeconds`, `resourceCost`, `blocksMovement`
  (Debris Field only), and `placeholderTexture` (the four hazards with no
  sourced art yet). Registered on `window.tuning.hazard` via the existing
  `registerTuning()` convention. Deliberately excludes `x`/`y` — per-level
  *placement* stays authored content in `GameScene.ts`, consistent with GDD
  §11.7 treating placement and per-type defaults as separate concerns.
- **Modified:** `src/scenes/GameScene.ts` — replaced five inline
  `HazardZoneElement` literal configs (~90 lines) with a new
  `placeHazard(x, y, config)` helper that (a) generates the placeholder
  texture if the config carries one and (b) constructs the
  `HazardZoneElement` from `{ x, y, ...config }`. `createHazardPlaceholderTexture()`
  is unchanged in signature/behavior, just now called from the new helper
  instead of five separate call sites.
- **Modified:** `docs/reference/console-tuning-reference.md` — added a
  `window.tuning.hazard` section documenting the new module (fields, live
  vs. next-restart-only tuning caveats, example console commands), and
  removed the now-closed "Hazard costs ... currently a literal object
  inline" bullet from the "not tunable yet" list.
- **Verified:** `npm run typecheck` (`tsc --noEmit`) and `npm run build`
  both pass clean with no new warnings; behavior is unchanged (same five
  hazard instances at the same positions/parameters as before — this is a
  pure config-extraction refactor, not a gameplay change).

No hard rule was broken to close this gap, and no shared wiring file
required a system-registration-style hand-edit — `GameScene.create()`'s
`SystemRegistry.all().forEach(...)` loop (the actual protected wiring
point) was not touched.
