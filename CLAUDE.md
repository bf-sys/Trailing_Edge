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

## Current project state (as of 2026-07-29)

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
- `docs/asset-procurement-agent-flow.md` — mermaid diagram of the three-agent sourcing pipeline
- `assets/` — populated per the directory convention in `docs/phase1-manifest-and-tasks.md` (`ship/`, `hazards/`, `resupply/`, `puzzle/`, `ui/`)

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
instantiated. Mitigation, and a hard rule once code exists: use
`SystemRegistry.register(system)`, called from each system's own file at
module load. Agents append imports; **nobody hand-edits `create()`.**

## Architecture contract (GDD §11) — build this when code work starts

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
  the same placeholder sprite (formerly the Star asset), distinguished only
  by tint — no new art needed. `EntryWormhole` is visual-only (no Arcade
  overlap; starts tinted "active", swaps to "inactive" shortly after level
  start). `ExitWormhole` starts tinted "inactive", opens ("active") once
  `LevelObjectiveTracker`'s beacon-reached event fires, and its
  `onPlayerArrival()` checks `LevelObjectiveTracker.canReturn()` before
  completing the level. `LevelObjectiveTracker` also exposes
  `getCurrentObjectiveTarget()`, used by `HudOverlay`'s off-screen marker
  (see Open design questions below).
- **`PuzzleElementBase`** (abstract) and subtypes — **optional/additive
  content, not required to complete a level; none of these ship in Phase 1**
  (see Phase 1 content scope below):
  - `SequenceSpotElement` — Signal Array (renamed from "Relay Beacon" — see
    `RelayBeaconObject` above)
  - `ScanInteractElement` — Scan Target/Marker
  - `MovingSpotDurationElement` — Comet (tracking)
  - `PushPullObjectElement` — Cargo Pod/Wreckage (checks
    `AbilityComponent.isUnlocked(TractorBeam)` first)
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
- **`AbilityComponent`** — per-ability dual gate (`energyCost`,
  `cooldownSeconds`), either settable to 0. Puzzle elements query
  `isUnlocked()` before allowing gated interactions.
- **`ProgressionManager`** — owns `unlockedAbilities`. Endurance-upgrade
  half (efficiency/recharge/capacity stats) is **deferred**, not implemented,
  for the initial build. Hard rule: never modifies fixed hazard costs or
  fixed puzzle costs.
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
  checkpoint system).
- **Scene flow** — `BootScene` → `TitleScene` (Start/Continue) →
  `GameScene` (parameterized by `levelId` only — always starts at the
  level's beginning, no mid-level resume) → `WinScene` when `levelOrder` is
  exhausted; `PauseScene` as a stacked overlay, not a Scene swap.
- **`SaveManager`** — thin `localStorage` wrapper, simplified to
  level-completion saves only (no mid-level snapshot, since
  `CheckpointManager` is deferred). **Hard rule: the only code allowed to
  touch `localStorage` directly.** One call site: `GameScene`'s
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
   `HazardZoneElement` (Debris Field, structure-cost) + one `ResupplyPoint`
   (AsteroidField, passive energy regen active) — **flagged drift:** this
   describes what Phase 1 actually built; Debris Field's design has since
   moved to a movement-blocking obstacle with `blocksMovement: true` and no
   resource drain (see "Debris Field re-scoped" above), and the code hasn't
   been updated to match yet → `ProbeObject`/`RelayBeaconObject`/
   `EntryWormhole`/`ExitWormhole`/`LevelObjectiveTracker` wired end-to-end → hard-fail flow
   (full level restart, no `CheckpointManager`) → bare-minimum `HudOverlay`
   (bars only). **No puzzle-site element in Phase 1** — the mandatory loop
   doesn't require solving one. Gate at week 2 before touching Phase 2:
   does the hard-reset fail state feel fair, does the passive energy-regen
   rate feel right, validate `SystemRegistry`, prototype tractor/repulsor,
   confirm `HazardZoneElement` produces 4 visually distinct hazards
   (including structure-vs-energy stakes legibility).
3. **Phase 2a (early week 3, still core work)** — **all five** puzzle
   element types (`SequenceSpotElement`/Signal Array,
   `ScanInteractElement`, `MovingSpotDurationElement`,
   `PushPullObjectElement`, `TrailDrawElement`) — larger than originally
   planned since Phase 1 ships none of them — plus remaining Scenes, the
   now-simplified `SaveManager`, full `HudOverlay`. Must close before 2b.
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
resource drain — re-scoped 2026-08-07**), Solar Flare (dynamic/timed burst,
energy), Ion Storm (dynamic/slow-drift, energy — visually same family as
Nebula Field, motion is the *only* difference, **still an open art-
differentiation question**), Nebula Field (static, energy), Meteoroid
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
both reusing the same placeholder sprite, formerly the Star asset, tinted
differently; previously one shared Home Marker object).

## Phase 1 content scope (exactly these, nothing else)

One hazard (Debris Field — movement-blocking, zero resource cost, per the
2026-08-07 re-scope), one resupply point (AsteroidField
— structure repair only; energy regenerates passively, no dedicated object), the Probe,
the Relay Beacon (mandatory waypoint, not a puzzle), the Entry Wormhole and
Exit Wormhole (two distinct locations, placeholder: reused Star asset
tinted per-state), the ship, minimal HUD. **No
puzzle-taxonomy element ships in Phase 1** — Signal Array and the rest of
the taxonomy above move to Phase 2a. See `docs/STATUS.md` for what's
currently sourced-but-not-yet-scoped (Cargo Pod, base tileset) vs.
genuinely not started — note the asset scope there still reflects the old
Star-as-resupply framing and needs a follow-up pass.

## Open design questions (GDD §9)

Ion Storm vs. Nebula Field visual differentiation is still open — color
alone is a weak signal (colorblind players; easy to under-read a slow drift
in a quick glance). Validate with a real placeholder asset during the week
1–2 vertical slice rather than deciding on paper; fallback options (particle
trail, border/outline treatment, or reverting to two distinct phenomena) are
in reserve if color+animation doesn't read clearly.

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
minimap may become warranted then.

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
**Design-only so far** — `HazardZoneElement` needs a new `blocksMovement`
parameter and a solid Arcade collider path; Phase 1's code hasn't been
touched yet.
