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

Core loop (GDD §3): launch from the level's Entry Wormhole → explore/scan
asteroids, encounter hazards along the way (levels typically mix multiple
hazard types; only structure-draining hazards can end the level, energy is
an ability-gating resource, not a fail resource) → find and recover the
probe → find and reach the Relay Beacon (a mandatory per-level waypoint,
*not* a puzzle) → return via the level's Exit Wormhole (a distinct location
from the Entry Wormhole, closed until the Relay Beacon is reached — GDD §3
revision, 2026-07-31; previously one shared Home Marker) → spend unlocks →
next level.
Puzzle-site elements (§6) are optional/additive content encountered along
the way, not a required step.

## Current project state (as of 2026-08-12)

**Phase 1's vertical slice is built and playtests end-to-end.** `src/`
implements `ExplorationController`, `ShipSurvivalComponent`,
`HazardZoneElement` (Debris Field, `blocksMovement: true`, zero resource
cost — matches the current design, not the pre-2026-08-07 drain version),
`ResupplyPoint`/AsteroidField, `ProbeObject`, `RelayBeaconObject`,
`EntryWormhole`/`ExitWormhole`, `LevelObjectiveTracker`, hard-fail restart,
`HudOverlay` (off-screen objective marker only, as of 2026-08-10), and
`ShipStatusArcs` (ship-relative energy/structure display, added
2026-08-10) — the full Phase 1 scope in Section 11/§12 below. A full run (Entry Wormhole → Debris Field → AsteroidField → Probe →
Relay Beacon → Exit Wormhole → `WinScene`) has been playtested with zero
console errors.

**Phase 2a is also now built** (completed 2026-08-10, committed
2026-08-11): `PuzzleElementBase` and all five subtypes
(`SequenceSpotElement`/`ScanInteractElement`/`MovingSpotDurationElement`/
`PushPullObjectElement`/`TrailDrawElement`) plus `PuzzleSite`,
`AbilityComponent`, `ProgressionManager`, `SaveManager`, and the rest of
`HudOverlay` (ability icons + puzzle-site indicator) and `TitleScene`
(Start/Continue) are all implemented and wired into `GameScene`'s one test
level (`level-000`). `CheckpointManager` remains **deferred by design, not
unbuilt** — nothing above changes that.

**Two important nuances Phase 2a's completion doesn't erase — check before
assuming a Phase 2b task is ready:**
- **Code vs. art.** Everything above is mechanically complete, but its
  *content* is still test-level placeholder instances, not authored Phase
  2b levels — one instance of each puzzle element and each of the four
  non-Debris hazards, all using procedurally-generated placeholder
  textures. Per `docs/STATUS.md`, no final art exists yet for any puzzle
  element, or for Solar Flare/Ion Storm/Nebula Field/Meteoroid. Sourcing
  that art is tracked separately and is **not** closed by this commit.
- **Ability rework implemented (2026-08-14, playtested and committed
  2026-08-15) — see Architecture contract below for full detail.** All
  three unlockable abilities now have real in-world effects: `scan`
  reveals nearby hazards (`HazardScanOverlay` — outline colored by
  structure/energy cost, plus a name label) and drives `HudOverlay`'s
  off-screen objective marker for its duration window; `teleport` is an
  arm/left-click-confirm blink to a fixed max range that passes through
  solid colliders (`TeleportRangeRing` shows the range/reticle; originally
  right-click-confirm, switched after playtesting showed the browser's
  native context menu made right-click unreliable to actually use);
  `rocketBoost` is a straight-line speed burst along the ship's current
  facing that does *not* pass through colliders. `ProgressionManager` now
  auto-grants only three abilities, in order `scan → teleport →
  rocketBoost`; `tractorBeam` is de-scoped from all player-facing UI
  (always unlocked, no grant ceremony, no icon, no unlock popup) but
  unchanged mechanically — `PushPullObjectElement`'s Cargo Pod puzzle
  still gates on it. A new `AbilityUnlockScene` shows a paused,
  explicit-close-only popup whenever a real level grants one of the
  three. Test Level force-unlocks all three on entry so its full ability
  surface is testable without playing through real levels first.
  `docs/trailing_edge_art_asset_list.md` §1.5's flag is about dedicated
  activation *VFX* (a beam/pulse/thruster-trail sprite effect) — still
  genuinely unaddressed and separate from the mechanical in-world effects
  above (a position change, a Graphics-drawn outline/ring); don't read
  this rework as having closed that gap.

**Test level split from real progression (2026-08-12).** `level-000` — the
single test level Phase 1/2a built, carrying one instance of every hazard
and every puzzle-taxonomy element — is no longer `LEVEL_ORDER[0]`. It's
exactly what makes it good for testing (compact, full mechanical surface in
one place) and bad as a real first level a player starts on, so it's been
pulled out of progression into `config/levelOrder.ts`'s `TEST_LEVEL_ID`,
reachable only via a "Test Level" link on `TitleScene` (no save read/write
on either side of that trip; `GameScene.handleLevelComplete()`
special-cases it to return straight to `TitleScene` instead of granting an
ability/advancing). `LEVEL_ORDER[0]` is now `level-001` — a fresh level
(same hazard roster, zero puzzle-taxonomy content) meant both as the real
first level and as the base for level-design iteration going forward. This
is also the point where "one config file per level" (Tech stack, below)
stopped being aspirational: both levels are real `LevelConfig` objects
under `src/levels/`, and `GameScene.create()` now reads placements from
`getLevelConfig(this.levelId)` instead of hardcoding them — check
`src/levels/` before assuming a placement lives in `GameScene.ts`.

Section 11 below is the contract for all of this — check `src/` before
assuming something is or isn't implemented rather than trusting this
file's age.

**Ability rework decided 2026-08-14, implemented the same day
(playtested and committed 2026-08-15).** `scan`/`teleport`/`rocketBoost`/
`tractorBeam` all changed as designed (new `scan` duration + threat-ID +
objective-marker role, `teleport` arm/left-click-confirm input with a
fixed range, `rocketBoost` straight-line burst, `tractorBeam`
dereferenced from player-facing ability UI), plus the new
`AbilityUnlockScene`. This re-closes the scoped slice of Phase 2a the
design pass had reopened — see Architecture contract's
`AbilityComponent`/`ProgressionManager`/`HudOverlay`/Scene-flow bullets
below and GDD §7/§11.4/§11.4a/§11.5/§11.8/§11.10, all now updated to
reflect the built state. Full rationale and the mechanics discussion
behind each decision: `docs/ability-rework-brainstorm-2026-08-14.md`
(still accurate for the "why"; the sections below are the "what's
actually built" where the two differ — e.g. teleport's confirm input,
switched from right-click to left-click after playtesting surfaced the
browser context-menu conflict). No new agent role was needed — this was
Core-Contract Agent's existing remit (GDD §12.1); a pre-existing stale
`HomeMarker` reference in `.claude/agents/core-contract-agent.md` was
also corrected while checking that.

**`AbilityUnlockScene`'s timing retimed 2026-08-15** (a follow-up to the
ability rework above, not part of it originally): the popup now shows at
the *start* of the level an ability is actually usable in, not the end of
the level that granted it — see the `AbilityUnlockScene` bullet in
Architecture contract below for the mechanism (`GameSceneData.unlockedAbility`
handed through `scene.start()`) and its one fallback case (the last
ability granted on the last `LEVEL_ORDER` entry, with no next level to
attach the popup to).

Asset prep status lives in `docs/STATUS.md` (read that first for what's
sourced vs. still open — e.g. Ion Storm/Nebula Field cloud art is planned
but not yet sourced, see its 2026-08-08 entry). Other reference docs live
in `docs/`:
- `docs/trailing_edge_art_asset_list.md` — full asset taxonomy/requirements list
- `docs/phase1-manifest-and-tasks.md` — Phase 1 asset directory convention + per-file extraction tasks
- `docs/ATTRIBUTION.md` — license/credit ledger for sourced assets
- `docs/asset-procurement-agent-flow.md` — mermaid diagram of the three-agent sourcing pipeline
- `assets/` — populated per the directory convention in `docs/phase1-manifest-and-tasks.md` (`ship/`, `hazards/`, `resupply/`, `objectives/`, `puzzle/`, `ui/`, `backgrounds/`)

Dated, point-in-time process logs (not kept up to date, referenced by
`STATUS.md` for detail it deliberately doesn't repeat) live in
`docs/history/`:
- `docs/history/run-log-2026-07-24.md` — search-by-search detail behind the first asset-sourcing pass
- `docs/history/phase1-prep-log.md` — full per-item prep record (conversions, placeholder flags, kickbacks)

Living reference guides (for the human, kept accurate over time — distinct
from the process/state docs above) live in `docs/reference/`:
- `docs/reference/console-tuning-reference.md` — `window.tuning` fields exposed for live console tuning while playtesting
- `docs/reference/art-production-guidelines.md` — format/resolution/style/naming parameters for producing new art
- `docs/reference/phaser-vfx-notes.md` — how Phaser handles VFX (particles/tweens/postFX/flipbooks), mapped to planned effects (thrusters, scanner, damage)
- `docs/reference/level-design-guide.md` — level-authoring conventions distilled from `level-001`–`level-004` (sizing, objective spacing, Debris/Nebula Field placement, `MovingHazardManager`, the 180°-flip variety trick, a verification checklist) — read before authoring a new level, especially for parallel/agent-driven content work

## Tech stack (confirmed, GDD §11)

- **Phaser.io + TypeScript**, not plain JS. Load-bearing: every hard rule
  below is meant to be compiler-enforced via `private` TS fields.
- **Arcade physics**, not Matter.js. Accepted tradeoffs: Cargo Pod push/pull
  is position/velocity tweening, not real force application; Meteoroid is a
  velocity-and-overlap hazard, not a true physics collision. If
  tractor/repulsor abilities feel wrong once prototyped, the agreed fallback
  is to cut/de-emphasize that ability — **not** to revisit the physics engine.
- **Hand-authored TS level configs**, not Tiled. One config file per level
  under `src/levels/` (a `LevelConfig` object — see `src/levels/levelTypes.ts`),
  by design — keeps the project 100% agent-touchable and keeps content
  authoring low-collision for parallel agents. **Implemented 2026-08-12**
  (previously aspirational — every placement lived inline in `GameScene.create()`
  regardless of `levelId`); see "Test level split" under Current project
  state below.
- **Asset/gameplay-size decoupling.** Collision/interaction dimensions are
  always authored data, never derived from a sprite's native pixel size —
  sprites are scaled to fit via `setDisplaySize()`/`setScale()`, never the
  reverse. Keeps a future art pass (including resolution changes) from
  requiring gameplay/collision re-tuning.
- **Tunable parameters live in per-subsystem config modules** (e.g.
  `shipConfig.ts`, `survivalConfig.ts`), never inline in class logic, and
  are exposed on `window` in dev builds for live console tuning. Ship
  speed/accel/decel, energy regen rate, structure repair rate, and hazard/
  ability costs all go here — this is the primary lever for rapid human
  playtesting/tuning during Phase 1.

**The real multi-agent risk isn't asset mergeability — it's shared "wiring"
files** (a main Scene's `create()`, a central index) where every system gets
instantiated. Mitigation, and a hard rule: use `SystemRegistry.register(system)`,
called from each system's own file at module load (`src/systems/index.ts`
is the side-effect import point — see `SystemRegistry.ts`). Agents append
imports; **nobody hand-edits `create()`.**

## Architecture contract (GDD §11) — Phase 1 and Phase 2a items below are all built (see Current project state above) as of 2026-08-12; `CheckpointManager` remains deferred by design, and the `AbilityComponent`/`ExplorationController`/`HudOverlay`/Scene-flow items below carry the 2026-08-14 ability rework, implemented and playtested (full rationale in `docs/ability-rework-brainstorm-2026-08-14.md`; GDD §7/§11.4/§11.4a/§11.5/§11.8/§11.10)

- **`ShipSurvivalComponent`** — owns `currentEnergy`/`maxEnergy`/
  `currentStructure`/`maxStructure`, all `private`. Structure is the sole
  fail resource (hitting zero triggers a full level restart); energy is a
  mana-like ability-gating resource that regenerates passively and never
  fails the level on its own. **Hard rule: no puzzle element, hazard, or
  ability may touch these fields directly** — only
  `consumeEnergy`/`consumeStructure`/`regenEnergy`/`repairStructure`.
  **Regression to watch for:** don't let any code path treat energy
  depletion as a failure condition — that was deliberately removed.
- **`CheckpointManager`** — **deferred, not built for the initial 5-week
  scope.** A hard fail (structure hits zero) triggers a full level restart
  instead (see `LevelObjectiveTracker` below), not a checkpoint resume.
  Expected to return once maps and secondary progression grow.
- **`LevelObjectiveTracker`** (per-level, replaces `CheckpointManager`'s role
  for now) — tracks `probeFound`/`beaconReached` booleans, reset on level
  start and on every hard-fail restart (no partial memory across a fail).
  `ExitWormhole` queries `canReturn()` before completing the level.
- **`ProbeObject`** — arrival trigger; `onPlayerArrival()` →
  `LevelObjectiveTracker.onProbeFound()`.
- **`RelayBeaconObject`** — mandatory per-level waypoint required after the
  probe, before return. **Not a puzzle** — plain navigate-to/arrival
  trigger. Distinct from the Signal Array puzzle element below (naming was
  split to avoid a collision — "Relay Beacon" used to name that puzzle).
- **`EntryWormhole`** / **`ExitWormhole`** — launch position and required
  return destination, **two distinct locations** (2026-07-31 revision;
  previously one shared `HomeMarker`, now superseded/removed). Both reuse
  the same final art (`objectives/wormhole.png`, originally reassigned from
  the old Star asset), distinguished only by tint. `EntryWormhole` is visual-only (no Arcade
  overlap; starts tinted "active", swaps to "inactive" shortly after level
  start). `ExitWormhole` starts tinted "inactive", opens ("active") once
  `LevelObjectiveTracker`'s beacon-reached event fires, and its
  `onPlayerArrival()` checks `LevelObjectiveTracker.canReturn()` before
  completing the level. `LevelObjectiveTracker` also exposes
  `getCurrentObjectiveTarget()`, used by `HudOverlay`'s off-screen marker
  (see Open design questions below).
- **`PuzzleElementBase`** (abstract) and subtypes — **built 2026-08-10
  (Phase 2a). Optional/additive content, not required to complete a level;
  none of these ship in Phase 1** (see Phase 1 content scope below); one
  test-level instance of each currently exists in `src/levels/level-000.ts`
  (the test level — see Current project state above; `level-001`'s config
  has an empty `puzzleElements` array), grouped one-per-`PuzzleSite`, all
  using placeholder procedural textures (no final art sourced yet, per
  `docs/STATUS.md`) — authored Phase 2b level placement is still separate,
  unstarted work:
  - `SequenceSpotElement` — Signal Array (renamed from "Relay Beacon" — see
    `RelayBeaconObject` above)
  - `ScanInteractElement` — Scan Target/Marker
  - `MovingSpotDurationElement` — Comet (tracking)
  - `PushPullObjectElement` — Cargo Pod/Wreckage (checks
    `AbilityComponent.isUnlocked('tractorBeam')` first — the one ability
    with a real in-world effect so far, see Current project state above)
  - `TrailDrawElement` — Beacon Cluster
  - **`HazardZoneElement`** — one parameterized class for *all four*
    open-world hazards (Debris Field, Solar Flare, Ion Storm, Nebula Field)
    plus Meteoroid, via `shape`, `movementPattern`, `speed`, `activation`,
    `pulseIntervalSeconds`, `resourceCost`, and (added 2026-08-07)
    `blocksMovement`. **Don't build five/six hazard classes — this collapse
    is a confirmed decision, not an open question**; `blocksMovement` is one
    more parameter on the same class, not a new one. Meteoroid is now the
    *only* structure-draining hazard with real fail stakes — Debris Field no
    longer drains anything (see below); energy-draining hazards (Solar
    Flare, Ion Storm, Nebula Field) stay lower-stakes/ability-limiting —
    worth telegraphing that difference visually, not just each hazard's
    identity.
  - Hard rule: `onHazardContact()` only calls
    `ShipSurvivalComponent.consumeEnergy/consumeStructure` — never sets
    resource values itself. **Exception:** `blocksMovement: true` hazards
    don't call `onHazardContact()` at all — a solid collider has no
    "contact cost," it just physically blocks entry.
  - **Debris Field re-scoped 2026-08-07 (GDD §9):** was a static,
    structure-draining zone; now a solid, movement-blocking obstacle with
    **no resource drain** — naturally-occurring rock/ice debris, not ship
    wreckage (the lore never established prior space-faring civilizations
    to leave wreckage). Name is unchanged — renaming to "Asteroid Field"
    was considered and rejected, since it would collide with the
    already-established `AsteroidField` resupply object below. **Implemented
    2026-08-07** — Phase 1's `HazardZoneElement` config now sets
    `blocksMovement: true` with zero resource cost.
  - **`MovingHazardManager`, added 2026-08-17** — keeps `movementPattern:
    'linear'` hazards (Ion Storm, Meteoroid — the only two entries using
    it) from drifting off into the world bounds and never coming back,
    which is what `HazardZoneElement`'s own movement code alone would do
    (nothing calls `setCollideWorldBounds` on a hazard's body). One
    `GameScene`-owned instance per level (reset each `create()`, like
    `this.hazards`/`this.resupplyPoints` — **not** a `SystemRegistry`
    singleton; moving-hazard state has no reason to survive a hard-fail
    restart the way `ProgressionManager`'s unlocks do). Design: **wrap, not
    destroy-and-respawn** — chosen specifically so `HazardScanOverlay`'s
    "one label per hazard, created once" assumption (see its class
    comment) never has to change. Each managed `HazardZoneElement` is a
    fixed instance for the whole level; once its position drifts past the
    level bounds by more than its own radius, `HazardZoneElement.reposition()`
    (a new mutation method, the only one on that otherwise read-only-getter
    class) jumps it to a fresh point on the level's perimeter with a new
    heading, at its already-configured speed. That new heading is
    objective-biased, not uniformly random: aimed through a point near
    `LevelObjectiveTracker.getCurrentObjectiveTarget()` (the same read-only
    getter `HudOverlay`'s off-screen marker already polls), offset by a
    random jitter (`movingHazardConfig.objectiveJitterRadius`, 350px) so
    it's not a deterministic beeline. First proven out on `level-003`/
    `level-004` (`src/levels/`) — placed there rather than `level-001`/
    `level-002` since the player has more abilities to handle a moving
    threat by that point. A hazard's authored level-file `x`/`y` only
    governs its first leg, before it first wraps.
- **`AbilityComponent`** — **built 2026-08-10 (Phase 2a); ability rework
  implemented 2026-08-14** (GDD §7, §11.4, §11.4a — full rationale in
  `docs/ability-rework-brainstorm-2026-08-14.md`). Per-ability dual gate
  (`energyCost`, `cooldownSeconds`), either settable to 0, plus a third
  `durationSeconds` gate (same "settable to 0" pattern), used so far only
  by `scan`; `isActive(type, nowMs)` reports whether that duration window
  is currently open. Rebuilt fresh on every `PlayerShip`/hard-fail
  restart, but delegates `isUnlocked()` to `ProgressionManager` rather
  than owning unlock state itself, so a restart never re-locks an
  already-earned ability — **except `tractorBeam`, which `isUnlocked()`
  now special-cases to always return `true` without consulting
  `ProgressionManager` at all** (de-scoped from player-facing UI, per the
  rework). `scan` uses `isActive()` for its two new jobs beyond its
  puzzle-grammar role: hazard threat-identification
  (`HazardScanOverlay` — outline colored by structure/energy cost plus a
  name label) and driving `HudOverlay`'s off-screen objective marker (see
  that bullet below). `teleport` has a fixed `maxRange`/flat cost, an
  arm/left-click-confirm input (originally right-click, switched after
  playtesting showed the browser's native context menu made right-click
  unreliable to actually use — see `TeleportRangeRing`'s range-ring/
  reticle visual), and passes through `blocksMovement: true` hazards via a
  plain `setPosition()` call. `rocketBoost` is a straight-line burst along
  the ship's current facing (`ship.rotation`, corrected for
  `shipConfig.spriteFacingOffsetRadians`), overriding click-to-move for
  its duration via `ExplorationController`'s `boosting` state, and does
  *not* pass through solid colliders — that asymmetry with `teleport` is
  deliberate (§7) and confirmed in playtesting (a boost into a Debris
  Field stops dead, no refund). Puzzle elements query `isUnlocked()`
  before allowing gated interactions — only `PushPullObjectElement` does
  so today, and it's unaffected by any of the above (`tractorBeam`
  mechanically unchanged).
- **`ProgressionManager`** — **built 2026-08-10 (Phase 2a).** Durable
  `SystemRegistry` singleton owning `unlockedAbilities`; its `init()` is a
  deliberate no-op so unlocks survive a hard-fail `GameScene` restart (only
  `ShipSurvivalComponent`'s resources/position reset, not this).
  `grantNextAbility()` auto-grants the next ability in a fixed order
  (`abilityUnlockOrder` in `abilityConfig.ts`) from `GameScene`'s
  level-completion handler — **no player-facing unlock-choice UI**, a
  2026-08-10 decision, not a placeholder for one. Endurance-upgrade half
  (efficiency/recharge/capacity stats) is still **deferred**, not
  implemented, for the initial build. Hard rule: never modifies fixed
  hazard costs or fixed puzzle costs. **`abilityUnlockOrder` changed from
  four entries to three (2026-08-14 ability rework, implemented):**
  `scan → teleport → rocketBoost` — `tractorBeam` is never granted through
  this sequence (see `AbilityComponent` above). Test Level
  (`config/levelOrder.ts`'s `TEST_LEVEL_ID`) force-grants all three on
  entry via a `GameScene.create()` loop over `abilityUnlockOrder`, so its
  full ability surface is testable without first completing real levels.
- **`ResupplyPoint`** (AsteroidField only) — Arcade overlap → repair
  structure. No longer covers energy (passive regen instead) and no longer
  registers a checkpoint (deferred). The Star variant is retired as a
  resupply object — see `EntryWormhole`/`ExitWormhole` above.
- **Authored data** — per-hazard `CostData`, per-ability `AbilityCostData`,
  required per-level object placement (`probeLocation`,
  `relayBeaconLocation`, `entryWormholeLocation`, `exitWormholeLocation`),
  and `levelOrder: string[]`
  (linear progression — no level-select; content agents append to this
  array, never hardcode a "next level" pointer). Per-level checkpoint-floor
  values are removed for the initial build (tied to the deferred
  checkpoint system). **Implemented 2026-08-12** as real `LevelConfig`
  objects under `src/levels/` (`getLevelConfig(levelId)`, `src/levels/index.ts`)
  — `GameScene.create()` reads placements from this instead of hardcoding
  them, via `HazardPlacement`/`ResupplyPlacement`/`PuzzleElementPlacement`
  (the latter turned into a live instance via
  `src/levels/puzzleElementFactory.ts`'s `createPuzzleElement()`).
- **Scene flow** — `BootScene` → `TitleScene` (Start/Continue) →
  `GameScene` (parameterized by `levelId` only — always starts at the
  level's beginning, no mid-level resume) → `WinScene` when `levelOrder` is
  exhausted; `PauseScene` as a stacked overlay, not a Scene swap.
  **`AbilityUnlockScene`, implemented 2026-08-14, retimed 2026-08-15**
  (GDD §11.8): a fifth Scene, same stacked-overlay convention as
  `PauseScene`, paused, dismissed only by an explicit close button. **When
  is it shown changed 2026-08-15:** originally launched from
  `GameScene.handleLevelComplete()` at the completed level, before the
  transition (2026-08-14's timing); now, whenever there's a next level to
  go to, `handleLevelComplete()` hands the granted ability off via
  `scene.start()`'s data (`GameSceneData.unlockedAbility`) instead of
  launching the popup itself, and the *next* level's `create()` launches
  it at the end, once the ship is already positioned at that level's Entry
  Wormhole — so the popup announces an ability standing in the level it's
  actually usable in, not the one just left. Only fires once: a hard-fail
  `scene.restart()` never passes `unlockedAbility`, so restarting a level
  never re-shows it. The pre-2026-08-15 timing survives as a fallback for
  the one case with no "next level" to hand off to — the last ability
  granted on the last `LEVEL_ORDER` entry, where completion goes straight
  to `WinScene` — `handleLevelComplete()` still shows the popup at the
  completed level there, `onClose` starting `WinScene` directly. Never
  launched for `tractorBeam` (it isn't in `abilityUnlockOrder`, so
  `grantNextAbility()` can never return it). Copy per ability lives in
  `abilityUnlockContent.ts`.
- **`SaveManager`** — **built 2026-08-10 (Phase 2a).** Thin `localStorage`
  wrapper (module functions, not a class — encapsulation is the hard rule,
  not a `private` field), simplified to level-completion saves only (no
  mid-level snapshot, since `CheckpointManager` is deferred). **Hard rule:
  the only code allowed to touch `localStorage` directly.** Two call sites:
  `GameScene`'s level-completion handler (`saveProgress`) and `TitleScene`'s
  Start/Continue flow (`hasSaveData`/`loadProgress` — Continue only renders
  if a save exists, and resumes at the saved `levelId`, never a mid-level
  position).
- **`HudOverlay`** — display-only, screen-pinned. Owns the off-screen
  objective marker (`LevelObjectiveTracker.getCurrentObjectiveTarget()`)
  and, **built 2026-08-10 (Phase 2a)**, ability icons (via
  `AbilityComponent.isUnlocked()`/`getCooldownRemainingMs()`) and the
  puzzle-site-active indicator (via `PuzzleSite.solved`, registered through
  `setPuzzleSites()`); no gameplay logic lives here.
  **Energy/structure bars moved out 2026-08-10** — see `ShipStatusArcs`
  below. **Two changes from the 2026-08-14 ability rework, implemented**
  (GDD §11.10): ability icons now source from `abilityUnlockOrder` (three
  entries) rather than every key of `abilityConfig`, so `tractorBeam` no
  longer appears in the icon row. And the off-screen objective marker is
  no longer unconditionally visible: it shows only while `scan`'s duration
  window is active (`AbilityComponent.isActive('scan', ...)`), plus a
  `flashObjectiveMarker()`-driven one-shot reveal at level start and on
  every `LevelObjectiveTracker` target change (`ProbeFound`/
  `BeaconReached`) — see Open design questions below.
- **`ShipStatusArcs`** — world-space, ship-relative resource readout (added
  2026-08-10): a curved structure arc above the ship, a straight energy bar
  below it, both tracking the ship's position every frame without rotating
  with its heading. Bound to `ShipSurvivalComponent.onResourceChanged`, same
  display-only contract as `HudOverlay`. Procedurally drawn via
  `Phaser.GameObjects.Graphics` — no art asset required or planned; this is
  a deliberate style choice validated via an in-browser prototype, not a
  placeholder awaiting real art. Coexists with `HudOverlay`, doesn't replace
  it. **Structure switched from a curved dome arc to a horizontal bar
  2026-08-14** — the arc read as a shield to playtesters, misrepresenting
  structure as absorbing damage rather than being consumed by it;
  structure now occupies the position/width the energy bar used to have,
  energy sits directly beneath it, thinner.
- **`HazardScanOverlay`** — world-space, display-only (2026-08-14 ability
  rework, implemented). While `AbilityComponent.isActive('scan', ...)`,
  draws an outline (orange = `resourceCost.structure > 0`, blue =
  `resourceCost.energy > 0`, gray = neither, i.e. `blocksMovement` hazards
  like Debris Field) plus a name label over every `HazardZoneElement`
  within `scanConfig.scanRadius` of the ship. Reuses
  `shipStatusArcConfig`'s structure/energy colors so the color language
  means the same thing everywhere in the HUD. One `Text` label per hazard
  is created once and reused every frame rather than destroyed/recreated,
  since `GameScene` never adds or removes hazards mid-level.
- **`TeleportRangeRing`** — world-space, display-only (2026-08-14 ability
  rework, implemented). A ring at `abilityConfig.teleport.maxRange`
  centered on the ship plus a reticle at the live clamped aim point,
  visible only while `ExplorationController.isTeleportArmed()`. Polled
  every frame via `getTeleportAimPoint()`, same reasoning
  `ShipStatusArcs.update()` already uses for continuous ship-relative
  tracking.

## Development plan shape (GDD §12)

Sequential vertical slice first, **then** fan out — and the fan-out is a
**core-contract-vs-content split**, not a by-layer split:

1. **Phase 0 — Contract lock.** Section 11 above is the contract. Any
   session must flag — not silently resolve — a task that seems to require
   breaking a hard rule or hand-editing a shared wiring file.
2. **Phase 1 (weeks 1–2)** — single sequential session, gated on review at
   each step: `ExplorationController` → `ShipSurvivalComponent` + one
   `HazardZoneElement` (Debris Field, `blocksMovement: true`, zero resource
   cost — updated 2026-08-07 to match the re-scope below; originally built
   as a structure-drain zone, since resolved) + one `ResupplyPoint`
   (AsteroidField, passive energy regen active) → `ProbeObject`/`RelayBeaconObject`/
   `EntryWormhole`/`ExitWormhole`/`LevelObjectiveTracker` wired end-to-end → hard-fail flow
   (full level restart, no `CheckpointManager`) → bare-minimum `HudOverlay`
   (bars only; **superseded 2026-08-10** — resource bars moved to
   `ShipStatusArcs`, a ship-relative world-space readout, see Architecture
   contract above). **No puzzle-site element in Phase 1** — the mandatory loop
   doesn't require solving one. Gate at week 2 before touching Phase 2:
   does the hard-reset fail state feel fair, does the passive energy-regen
   rate feel right, validate `SystemRegistry`, prototype tractor/repulsor,
   confirm `HazardZoneElement` produces 4 visually distinct hazards
   (including structure-vs-energy stakes legibility).
3. **Phase 2a — done (completed 2026-08-10, committed 2026-08-11).**
   **All five** puzzle element types (`SequenceSpotElement`/Signal Array,
   `ScanInteractElement`, `MovingSpotDurationElement`,
   `PushPullObjectElement`, `TrailDrawElement`) — larger than originally
   planned since Phase 1 shipped none of them — plus `AbilityComponent`/
   `ProgressionManager`, the now-simplified `SaveManager`, full
   `HudOverlay`, and `TitleScene`'s Start/Continue are all implemented and
   wired into the one test level. What's still open is content/art, not
   code: no puzzle element or non-Debris hazard has final art yet (see
   Current project state above), and only `tractorBeam` has a real
   in-world effect. Closed before 2b, as required.
4. **Phase 2b (bulk of weeks 3–5, genuinely parallel)** — content only:
   levels, required per-level probe/relay-beacon/home-marker placement,
   hazard placements (config, not code), optional puzzle-site instances.
   Content agents never touch core files. Scope lever if time is tight:
   fewer levels, or drop execution/timing taxonomy rows first (§6 already
   frames those as minority seasoning) — cut content, never Phase 1/2a, and
   never the required probe/beacon/home-marker placements.
5. **Phase 3 (last 2–3 days)** — integration only: full `levelOrder`
   playthrough, confirm `Continue` resumes at the right level (one save
   trigger now, not two), `WinScene` on the true last level, a real
   packaged-build run. No new content or systems.

## Puzzle taxonomy vs. hazard taxonomy — don't conflate these two tables (GDD §9)

**Open-world hazards** (drain resources, encountered while flying — except
Debris Field, see below): Debris Field (static, **blocks movement, no
resource drain — re-scoped and implemented 2026-08-07**), Solar Flare
(dynamic/timed burst, energy), Ion Storm (dynamic/slow-drift, energy —
visually same family as Nebula Field, motion is the *only* difference,
**still an open art-differentiation question; the shared 2-3-variant
cloud-texture production approach for both is decided as of 2026-08-08, see
Open design questions below**), Nebula Field (static, energy), Meteoroid
(dynamic/moving, structure — renamed from "Rogue Comet" to avoid colliding
with the puzzle element below, and now the *only* structure-draining
open-world hazard).

**Puzzle-site elements** (optional/additive, cost-neutral by default):
Signal Array (sequence — renamed from "Relay Beacon," see below), Scan
Target/Marker, Comet (tracking — name belongs solely to this element, not
any hazard), Cargo Pod/Wreckage (push/pull, gated behind Tractor), Beacon
Cluster (trail/encircle).

**Core-loop objects** (required every level, not part of the above
taxonomy): Probe, Relay Beacon (mandatory navigate-to waypoint, required
after the probe and before return — **not** the same thing as Signal Array
above; the name was reassigned to this waypoint, causing the puzzle
element's rename), Entry Wormhole and Exit Wormhole (launch position and
required return destination — two distinct locations as of 2026-07-31,
both reusing the same final art, `wormhole.png` (originally reassigned
from the old Star asset), tinted differently; previously one shared Home
Marker object).

## Phase 1 content scope (exactly these, nothing else)

One hazard (Debris Field — movement-blocking, zero resource cost, final art
sourced 2026-08-07, per the re-scope), one resupply point (AsteroidField
— structure repair only; energy regenerates passively, no dedicated object,
final art), the Probe (final art), the Relay Beacon (mandatory waypoint,
not a puzzle, final art), the Entry Wormhole and Exit Wormhole (two
distinct locations, final art — `wormhole.png`, originally reassigned from
the old Star asset, tinted per-state), the ship (final art), minimal HUD
(`HudOverlay`'s off-screen objective marker plus `ShipStatusArcs`'s
procedurally-drawn ship-relative energy/structure display — no panel/bar
art asset, by design as of 2026-08-10). **No puzzle-taxonomy element ships in Phase 1** —
Signal Array and the rest of the taxonomy above move to Phase 2a. See
`docs/STATUS.md` for what's currently sourced-but-not-yet-scoped (Cargo Pod)
vs. genuinely not started (Ion Storm/Nebula Field cloud art — production
approach decided 2026-08-08, nothing sourced yet).

**Phase 2a's code is now complete** (see Current project state above), but
don't read that as Phase 2b content being underway — the puzzle-taxonomy
and non-Debris-hazard code above still has exactly one placeholder-art test
instance each, in the same single test level. Authored per-level placement
of any of it, and sourcing final art for any of it, are still unstarted
Phase 2b/asset-track work.

## Open design questions (GDD §9)

Ion Storm vs. Nebula Field visual differentiation is still open — color
alone is a weak signal (colorblind players; easy to under-read a slow drift
in a quick glance). Validate with a real placeholder asset during the week
1–2 vertical slice rather than deciding on paper; fallback options (particle
trail, border/outline treatment, or reverting to two distinct phenomena) are
in reserve if color+animation doesn't read clearly. **Production approach
decided 2026-08-08, differentiation itself still unresolved:** one shared
asset pass serves both hazards — 2-3 distinct soft-cloud silhouette
textures (not a Debris-Field-style discrete-fragment cluster, since a
nebula is diffuse gas rather than countable objects), each stretched via
`setDisplaySize()`. See `docs/reference/art-production-guidelines.md`'s
"Nebula Field / Ion Storm cloud art" section. Nothing sourced yet.

Also newly open: structure-vs-energy stakes legibility. Since only
structure can end a level (energy is a non-fail, ability-gating resource),
Meteoroid — now the sole structure-draining hazard, since Debris Field's
2026-08-07 re-scope removed it from this list (see "Debris Field re-scoped"
above) — carries real fail stakes while the energy-draining hazards (Solar
Flare, Ion Storm, Nebula Field) and the movement-blocking Debris Field
don't. Whether the current visual language communicates that difference is
untested, and now a sharper question with only one hazard on the fail-stakes
side. Same validation timing as the item above.

**Resolved (2026-07-31):** off-screen objective visibility (raised
2026-07-30, §8's levels are "bounded," not "screen-sized," so the
vertical-slice test map's Probe/Relay Beacon/Exit Wormhole can all be
off-screen at once). Resolved as a single edge-pinned directional arrow
(Sinistar-style), not a minimap — `LevelObjectiveTracker` already sequences
the loop strictly linearly, so there's only ever one current objective to
point at. Implemented in `HudOverlay` via
`LevelObjectiveTracker.getCurrentObjectiveTarget()`. Revisit if a future
level needs multiple simultaneous objective/hazard markers at once — a
minimap may become warranted then. **Amended 2026-08-14, implemented:**
the marker's *visibility rule* changed — see the `HudOverlay` bullet in
Architecture contract above — but the underlying "one current objective,
edge-pinned arrow, no minimap" design this entry resolved is unchanged.

**Not resolved by `scan`'s 2026-08-14 rework (flagging explicitly, don't
read the item below as closed):** the reworked `scan` ability now gives
players an *active, on-demand* way to identify a hazard's type and which
resource it threatens (`docs/ability-rework-brainstorm-2026-08-14.md`,
GDD §7).
That's a mitigation layered on top of the Ion Storm/Nebula Field and
structure-vs-energy items below, not a resolution of either — both stay
open for the passive, no-ability case (an early level before `scan`
unlocks, or a player who's out of energy/on cooldown still needs to read
hazards without it). The Accessibility/Telegraphing Reviewer role (GDD
§12.1) should keep evaluating the visual language on its own terms.

**Resolved (2026-08-07):** Debris Field re-scoped from a structure-draining
zone to a movement-blocking obstacle — two problems prompted it: it felt
mechanically redundant with Nebula Field (both static drain zones, just
different resources) and its ship-wreckage fiction didn't fit a setting
with no established prior space-faring civilizations. Fix: keep the name,
change the fiction to naturally-occurring rock/ice debris, change the
mechanic to a solid collider with zero resource drain — the first hazard
tied to the Meso/Exploration pillar (routing) rather than only Macro/
Survival. An "Asteroid Field" rename was considered and rejected — it would
collide with the existing `AsteroidField` resupply object. Visual
differentiation from that object (many small fragments vs. one large
ore-rich rock) is locked in, `docs/reference/art-production-guidelines.md`.
**Implemented 2026-08-07** — `HazardZoneElement` has a `blocksMovement`
parameter (immovable Arcade body + `physics.add.collider()` in place of
the overlap-and-drain listener); Phase 1's Debris Field placement uses it.
Final art sourced the same day (`hazards/debris_large.png`); the full loop
has since been playtested end-to-end with it in place.
