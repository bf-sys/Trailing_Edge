# CLAUDE.md — Trailing Edge

Context for any Claude Code session working in this repo. Full design
rationale lives in `docs/trailing_edge_gdd_draft_31.md` (the GDD) — this file
is a working summary of what a coding/asset session needs to not violate, not
a replacement for it. When this file and the GDD disagree, the GDD wins; flag
the drift rather than silently trusting whichever you read first.

## What this project is

*Trailing Edge* — single-player space exploration/survival/puzzle game.
Per-expedition goal: locate an inactive probe, recover its cargo/data, return
home. Explicit non-goals: no combat system, no 4X/empire-management layer, no
control remapping in the initial build. (GDD §1, §10)

Three design pillars, deliberately kept on **separate layers** rather than
blended in the same moment — this separation is load-bearing, not
incidental (GDD §2):

| Layer | Pillar | Governs |
|---|---|---|
| Macro | Survival | Energy & structure totals; expedition risk/buffer |
| Meso | Exploration | Where you go, routing decisions |
| Micro | Puzzle-solving | Discrete, deterministic challenge sites |

Core loop (GDD §3): launch → explore/scan asteroids/find stars → hit the
level's one signature hazard (drains energy *or* structure, never both,
never ambient) → solve puzzle site(s) → recover probe → return → spend
unlocks → next level.

## Current project state (as of 2026-07-24)

**No game code exists yet.** This repo is currently in the asset-sourcing/prep
stage, run by the three-agent team documented in `README.md` and
`.claude/agents/*.md`. Section 11 below is the *target* architecture for when
code work starts (GDD Phase 1, §12) — don't treat any of it as already
implemented.

Asset prep status lives in `docs/STATUS.md` (read that first for what's
sourced/extracted vs. still open — e.g. the Relay Beacon sprite is currently
unresolved). Other reference docs live in `docs/`:
- `docs/trailing_edge_art_asset_list.md` — full asset taxonomy/requirements list
- `docs/phase1-manifest-and-tasks.md` — Phase 1 asset directory convention + per-file extraction tasks
- `docs/ATTRIBUTION.md` — license/credit ledger for sourced assets
- `docs/run-log-2026-07-24.md` — search-by-search detail behind the asset-sourcing pass
- `docs/asset-procurement-agent-flow.md` — mermaid diagram of the three-agent sourcing pipeline
- `assets/` — populated per the directory convention in `docs/phase1-manifest-and-tasks.md` (`ship/`, `hazards/`, `resupply/`, `puzzle/`, `ui/`)

## Tech stack (confirmed, GDD §11)

- **Phaser.io + TypeScript**, not plain JS. Load-bearing: every hard rule
  below is meant to be compiler-enforced via `private` TS fields.
- **Arcade physics**, not Matter.js. Accepted tradeoffs: Cargo Pod push/pull
  is position/velocity tweening, not real force application; Meteoroid is a
  velocity-and-overlap hazard, not a true physics collision. If
  tractor/repulsor abilities feel wrong once prototyped, the agreed fallback
  is to cut/de-emphasize that ability — **not** to revisit the physics engine.
- **Hand-authored TS/JSON level configs**, not Tiled. One config file per
  level, by design — keeps the project 100% agent-touchable and keeps
  content authoring low-collision for parallel agents.

**The real multi-agent risk isn't asset mergeability — it's shared "wiring"
files** (a main Scene's `create()`, a central index) where every system gets
instantiated. Mitigation, and a hard rule once code exists: use
`SystemRegistry.register(system)`, called from each system's own file at
module load. Agents append imports; **nobody hand-edits `create()`.**

## Architecture contract (GDD §11) — build this when code work starts

- **`ShipSurvivalComponent`** — owns `currentEnergy`/`maxEnergy`/
  `currentStructure`/`maxStructure`, all `private`. **Hard rule: no puzzle
  element, hazard, or ability may touch these fields directly** — only
  `consumeEnergy`/`consumeStructure`/`rechargeEnergy`/`repairStructure`/
  `applyCheckpoint`.
- **`CheckpointManager`** (per-level) — registers checkpoints from both
  resupply-point visits and `PuzzleSite.onSiteSolved()`; restart repositions
  the player and restores solved-puzzle state but **not** in-progress
  unsolved puzzle state.
- **`PuzzleElementBase`** (abstract) and subtypes:
  - `SequenceSpotElement` — Relay Beacon
  - `ScanInteractElement` — Scan Target/Marker
  - `MovingSpotDurationElement` — Comet (tracking)
  - `PushPullObjectElement` — Cargo Pod/Wreckage (checks
    `AbilityComponent.isUnlocked(TractorBeam)` first)
  - `TrailDrawElement` — Beacon Cluster
  - **`HazardZoneElement`** — one parameterized class for *all four*
    open-world hazards (Debris Field, Solar Flare, Ion Storm, Nebula Field)
    plus Meteoroid, via `shape`, `movementPattern`, `speed`, `activation`,
    `pulseIntervalSeconds`, `resourceCost`. **Don't build five hazard
    classes — this collapse is a confirmed decision, not an open question.**
  - Hard rule: `onHazardContact()` only calls
    `ShipSurvivalComponent.consumeEnergy/consumeStructure` — never sets
    resource values itself.
- **`AbilityComponent`** — per-ability dual gate (`energyCost`,
  `cooldownSeconds`), either settable to 0. Puzzle elements query
  `isUnlocked()` before allowing gated interactions.
- **`ProgressionManager`** — owns `unlockedAbilities`. Endurance-upgrade
  half (efficiency/recharge/capacity stats) is **deferred**, not implemented,
  for the initial build. Hard rule: never modifies fixed hazard costs, fixed
  puzzle costs, or the level-authored checkpoint floor.
- **`ResupplyPoint`** (Star | AsteroidField) — Arcade overlap → recharge/
  repair, then registers a checkpoint.
- **Authored data** — per-hazard `CostData`, per-level checkpoint floor
  (authored as a % of that level's capacity, not a flat number), per-ability
  `AbilityCostData`, and `levelOrder: string[]` (linear progression — no
  level-select; content agents append to this array, never hardcode a "next
  level" pointer).
- **Scene flow** — `BootScene` → `TitleScene` (Start/Continue) →
  `GameScene` (parameterized by `levelId` + optional resume
  `CheckpointData`) → `WinScene` when `levelOrder` is exhausted;
  `PauseScene` as a stacked overlay, not a Scene swap.
- **`SaveManager`** — thin `localStorage` wrapper. **Hard rule: the only
  code allowed to touch `localStorage` directly.** Two call sites only:
  `CheckpointManager.registerCheckpoint()` and `GameScene`'s
  level-completion handler.
- **`HudOverlay`** — display-only, bound to existing events
  (`onResourceChanged`, `AbilityComponent.isUnlocked()`); no gameplay logic
  lives here.

## Development plan shape (GDD §12)

Sequential vertical slice first, **then** fan out — and the fan-out is a
**core-contract-vs-content split**, not a by-layer split:

1. **Phase 0 — Contract lock.** Section 11 above is the contract. Any
   session must flag — not silently resolve — a task that seems to require
   breaking a hard rule or hand-editing a shared wiring file.
2. **Phase 1 (weeks 1–2)** — single sequential session, gated on review at
   each step: `ExplorationController` → `ShipSurvivalComponent` + one
   `HazardZoneElement` (Debris Field) + one `ResupplyPoint` (Star) →
   `SequenceSpotElement`/`PuzzleSite` → `CheckpointManager` end-to-end →
   bare-minimum `HudOverlay` (bars only). Gate at week 2 before touching
   Phase 2: validate checkpoint/floor/hazard feel, validate
   `SystemRegistry`, prototype tractor/repulsor, confirm `HazardZoneElement`
   produces 4 visually distinct hazards.
3. **Phase 2a (early week 3, still core work)** — remaining puzzle element
   *types* (`MovingSpotDurationElement`, `PushPullObjectElement`,
   `TrailDrawElement`), remaining Scenes, `SaveManager`, full `HudOverlay`.
   Must close before 2b.
4. **Phase 2b (bulk of weeks 3–5, genuinely parallel)** — content only:
   levels, hazard placements (config, not code), puzzle-site instances.
   Content agents never touch core files. Scope lever if time is tight:
   fewer levels, or drop execution/timing taxonomy rows first (§6 already
   frames those as minority seasoning) — cut content, never Phase 1/2a.
5. **Phase 3 (last 2–3 days)** — integration only: full `levelOrder`
   playthrough, both `SaveManager` trigger paths, `WinScene` on the true
   last level, a real packaged-build run. No new content or systems.

## Puzzle taxonomy vs. hazard taxonomy — don't conflate these two tables (GDD §9)

**Open-world hazards** (drain resources, encountered while flying):
Debris Field (static, structure), Solar Flare (dynamic/timed burst, energy),
Ion Storm (dynamic/slow-drift, energy — visually same family as Nebula Field,
motion is the *only* difference, **still an open art-differentiation
question**), Nebula Field (static, energy), Meteoroid (dynamic/moving,
structure — renamed from "Rogue Comet" to avoid colliding with the puzzle
element below).

**Puzzle-site elements** (cost-neutral by default): Relay Beacon (sequence),
Scan Target/Marker, Comet (tracking — name belongs solely to this element,
not any hazard), Cargo Pod/Wreckage (push/pull, gated behind Tractor),
Beacon Cluster (trail/encircle).

## Phase 1 content scope (exactly these five, nothing else)

One hazard (Debris Field), one resupply point (Star), one puzzle element
(Relay Beacon), the ship, minimal HUD. Everything else in the taxonomy is
Phase 2a/2b — see `docs/STATUS.md` for what's currently sourced-but-not-yet-scoped
(Cargo Pod, base tileset) vs. genuinely not started.

## Open design questions (GDD §9)

Ion Storm vs. Nebula Field visual differentiation is still open — color
alone is a weak signal (colorblind players; easy to under-read a slow drift
in a quick glance). Validate with a real placeholder asset during the week
1–2 vertical slice rather than deciding on paper; fallback options (particle
trail, border/outline treatment, or reverting to two distinct phenomena) are
in reserve if color+animation doesn't read clearly.
