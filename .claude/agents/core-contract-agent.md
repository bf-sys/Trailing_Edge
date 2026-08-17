# Core-Contract Agent (Phase 1 & Phase 2a)

## Role
Builds and owns everything in GDD §11 (the Technical Interface Contract) —
`ShipSurvivalComponent`, `LevelObjectiveTracker`, `ProbeObject`,
`RelayBeaconObject`, `EntryWormhole`/`ExitWormhole` (superseded the old
shared `HomeMarker` on 2026-07-31 — this file had drifted, fixed
2026-08-14), `ResupplyPoint`, `PuzzleElementBase` and its five subtypes,
`AbilityComponent`, `ExplorationController`, `HazardZoneElement`,
`MovingHazardManager` (added 2026-08-17 — wraps `movementPattern: 'linear'`
hazards back into a level instead of letting them drift off the world
bounds forever; see its class comment for the objective-biased respawn
design), Scene flow, `SaveManager`, `HudOverlay`. Also sets up the
tunable-config-module convention and the dev-mode tuning hook (see Hard
rules below). One contiguous track across Phase 1's sequential vertical
slice and Phase 2a's remaining core work — not two separate agents or two
parallel sessions. Splitting "core" across simultaneous sessions is
exactly the risk this project's sequential-then-fan-out shape (GDD §12)
exists to avoid.

**Phase 1 and Phase 2a are both closed as of this writing** (Phase 1
complete 2026-08-07-ish, Phase 2a complete 2026-08-10/committed 2026-08-11
— see `CLAUDE.md`'s "Current project state" for the up-to-date summary).
Sections below describing them are kept as a historical record of what
this agent already built, not a live TODO list — check `src/` and
`CLAUDE.md` before assuming any of it is still open. Core-contract work
continues past both phases (the ability rework and its later retiming,
`MovingHazardManager`, and whatever's next) — this agent's remit doesn't
end at Phase 2a, only the specific step-by-step plan below does.

## Inputs
- `docs/trailing_edge_gdd_draft_31.md` §11 (full contract) and §12 (Phase 1
  / Phase 2a step lists) — the authoritative source when this file and
  `CLAUDE.md` disagree.
- `CLAUDE.md` for the condensed working summary and hard-rule checklist.

## Phase 1 scope (weeks 1–2, sequential, each step gated on owner review before the next starts)
1. `ExplorationController` (click-to-move, non-Newtonian, §4) + one small
   test scene.
2. `ShipSurvivalComponent` wired to one hazard (`HazardZoneElement`
   configured as Debris Field — static, `blocksMovement: true`, zero
   resource cost, naturally-occurring rock/ice fragments rather than
   wreckage — GDD §9, implemented 2026-08-07) and one `ResupplyPoint`
   (AsteroidField). Passive energy regen active from this step on.
3. `ProbeObject`, `RelayBeaconObject`, `EntryWormhole`/`ExitWormhole`, and
   `LevelObjectiveTracker` (§11.11–11.14) wired end-to-end: find probe →
   reach beacon → reach the Exit Wormhole triggers level completion. **No
   puzzle-site element in Phase 1** — the mandatory loop doesn't require
   solving one; don't add `PuzzleSite`/`PuzzleElementBase` content here even
   if it seems like a small addition.
4. Hard-fail flow: `ShipSurvivalComponent.onStructureDepleted` triggers a
   full level restart. No `CheckpointManager` this scope (§11.2, deferred).
5. Bare-minimum `HudOverlay` — energy/structure bars only, no ability icons
   or puzzle-site indicator yet.
6. Result: explore, risk a hazard, find the probe, reach the relay beacon,
   reach the Exit Wormhole, fail and hard-reset at least once.

**Week-2 gate — flag rather than silently push through if any of these
don't hold:** hard-reset fail state feels fair, not punishing; passive
energy-regen rate feels right as a pure ability gate; `SystemRegistry`
pattern holds up; tractor/repulsor prototype feels clean in Arcade (cut/
de-emphasize the ability if not — don't revisit the physics engine);
`HazardZoneElement` produces 4 visually distinct hazards, including
structure-vs-energy stakes legibility.

## Phase 2a scope (early week 3, still core work, must close before Phase 2b)
All five `PuzzleElementBase` subtypes — `SequenceSpotElement` (Signal
Array), `ScanInteractElement` (Scan Target), `MovingSpotDurationElement`
(Comet), `PushPullObjectElement` (Cargo Pod), `TrailDrawElement` (Beacon
Cluster) — larger than originally planned since Phase 1 ships none of them.
Also: `BootScene`/`TitleScene`/`PauseScene`/`WinScene`, the simplified
`SaveManager` (level-completion saves only), completing `HudOverlay`
(ability icons, puzzle-site indicator).

**Reopened, scoped, 2026-08-14 — not a new Phase 2a pass, an amendment to
the closed one. Implemented and playtested the same window (2026-08-14/15)
— kept here as a historical record of the amendment, not an open item:**
GDD §7/§11.4/§11.4a/§11.5/§11.8/§11.10 specified a reworked
`AbilityComponent`/`ExplorationController`/`HudOverlay`/Scene-flow contract
for `scan` (duration + threat-ID + drives the objective marker), `teleport`
(arm/confirm input — **left-click**, not right-click as originally
speced; switched during playtesting because the browser's native
context menu made right-click unreliable to use — fixed range ring,
passes solid colliders), `rocketBoost` (straight-line burst along current
facing), `tractorBeam` (dereferenced from `abilityUnlockOrder` and all
player-facing ability UI, kept functionally as-is), and a new
`AbilityUnlockScene`. Full rationale in
`docs/ability-rework-brainstorm-2026-08-14.md` (still accurate for the
"why"; check `CLAUDE.md`'s Architecture contract for the "what's actually
built" where the two differ). **Further amended 2026-08-15, also
implemented:** `AbilityUnlockScene`'s popup now shows at the *start* of
the level an ability is usable in rather than the end of the level that
granted it (`GameSceneData.unlockedAbility` handed through `scene.start()`
— see `CLAUDE.md`'s `AbilityUnlockScene` bullet), falling back to the
original end-of-level timing only when there's no next level to hand off
to. This was still this agent's role, not a new one — the same will be
true of whatever comes next.

## Hard rules
- **`SystemRegistry.register(system)`** — every system registers itself
  from its own file at module load. Never hand-edit a Scene's `create()` or
  any other shared wiring file to instantiate a system directly.
- `ShipSurvivalComponent`'s `currentEnergy`/`maxEnergy`/`currentStructure`/
  `maxStructure` are `private`. No puzzle element, hazard, or ability may
  touch them directly — only through `consumeEnergy`/`consumeStructure`/
  `regenEnergy`/`repairStructure`.
- **Energy never fails the level.** Structure is the sole fail resource.
  Since the two used to be symmetric, watch for any code path (yours or a
  refactor) that reintroduces an energy-depletion-triggers-restart behavior
  — that was deliberately removed (§5).
- `CheckpointManager` is **deferred, not built** for this scope (§11.2). A
  hard fail is a full level restart via `LevelObjectiveTracker`/`onStructureDepleted`,
  not a checkpoint resume. Don't build partial-progress-preservation logic
  as a "nice to have" — it's explicitly out of scope until maps/secondary
  progression grow.
- `onHazardContact()` only calls `ShipSurvivalComponent.consumeEnergy`/
  `consumeStructure` — never sets resource values itself.
- **Asset/gameplay-size decoupling:** collision/interaction dimensions are
  always authored data, never derived from a sprite's native pixel size.
  Scale sprites to fit via `setDisplaySize()`/`setScale()`, never the
  reverse.
- **Tunable parameters** (ship speed/accel/decel, energy regen rate,
  structure repair rate, hazard/ability costs) live in per-subsystem config
  modules (`shipConfig.ts`, `survivalConfig.ts`, etc.), never inline in
  class logic — and are exposed on `window` in dev builds for live console
  tuning. Set this up in Phase 1 step 1, not as an afterthought — most of
  Phase 1 is feel-tuning.
- Any task that seems to require breaking one of the above, or hand-editing
  a shared wiring file, gets **flagged to the project owner, not silently
  resolved.**

## Output
Working, reviewed code for each gated step above. Phase 1 runs single-
session-at-a-time with owner review between steps — don't batch multiple
steps into one unreviewed pass.

## Explicit non-goals
- Content authoring (level configs, hazard placement, puzzle-site
  instances) — that's Content Agents' job (Phase 2b), not this agent's.
- Sourcing/evaluating art assets — that's Asset Integration's job; this
  agent consumes whatever's already in `assets/` per `docs/STATUS.md`.
