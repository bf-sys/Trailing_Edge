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

## Current project state (as of 2026-08-08)

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
console errors. **Not yet built** (Phase 2a, not started):
`PuzzleElementBase` and its five subtypes, `AbilityComponent`,
`ProgressionManager`, `SaveManager`, `CheckpointManager` (deferred by
design, not just unbuilt). Section 11 below is the contract for both —
check `src/` before assuming something is or isn't implemented rather than
trusting this file's age.

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
instantiated. Mitigation, and a hard rule: use `SystemRegistry.register(system)`,
called from each system's own file at module load (`src/systems/index.ts`
is the side-effect import point — see `SystemRegistry.ts`). Agents append
imports; **nobody hand-edits `create()`.**

## Architecture contract (GDD §11) — Phase 1 items are built (see Current project state above); Phase 2a items below aren't yet

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
- **`HudOverlay`** — display-only, screen-pinned. Owns the off-screen
  objective marker (`LevelObjectiveTracker.getCurrentObjectiveTarget()`) and,
  once built, ability icons/puzzle-site indicator via
  `AbilityComponent.isUnlocked()`; no gameplay logic lives here.
  **Energy/structure bars moved out 2026-08-10** — see `ShipStatusArcs`
  below.
- **`ShipStatusArcs`** — world-space, ship-relative resource readout (added
  2026-08-10): a curved structure arc above the ship, a straight energy bar
  below it, both tracking the ship's position every frame without rotating
  with its heading. Bound to `ShipSurvivalComponent.onResourceChanged`, same
  display-only contract as `HudOverlay`. Procedurally drawn via
  `Phaser.GameObjects.Graphics` — no art asset required or planned; this is
  a deliberate style choice validated via an in-browser prototype, not a
  placeholder awaiting real art. Coexists with `HudOverlay`, doesn't replace
  it.

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
**Implemented 2026-08-07** — `HazardZoneElement` has a `blocksMovement`
parameter (immovable Arcade body + `physics.add.collider()` in place of
the overlap-and-drain listener); Phase 1's Debris Field placement uses it.
Final art sourced the same day (`hazards/debris_large.png`); the full loop
has since been playtested end-to-end with it in place.
