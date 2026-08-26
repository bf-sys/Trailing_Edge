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
hazard types; structure is the fail resource, energy is an ability-gating
resource, not a fail resource) → find and recover the probe → find and reach
the Relay Beacon (a mandatory per-level waypoint, *not* a puzzle) → return via
the level's Exit Wormhole (a distinct location from the Entry Wormhole,
closed until the Relay Beacon is reached — GDD §3 revision, 2026-07-31;
previously one shared Home Marker) → spend unlocks → next level.
Puzzle-site elements (§6) are optional/additive content encountered along
the way, not a required step.

## Current project state (as of 2026-08-25)

**Phase 1's vertical slice is built and playtests end-to-end.** `src/`
implements `ExplorationController`, `ShipSurvivalComponent`,
`HazardZoneElement` (Debris Field, `blocksMovement: true`, zero resource
cost), `ResupplyPoint`/AsteroidField, `ProbeObject`, `RelayBeaconObject`,
`EntryWormhole`/`ExitWormhole`, `LevelObjectiveTracker`, hard-fail restart,
`HudOverlay` (off-screen objective marker), and `ShipStatusArcs`
(ship-relative energy/structure display) — see Architecture contract below
for the full current contract. A full run (Entry Wormhole → hazards →
AsteroidField → Probe → Relay Beacon → Exit Wormhole → `WinScene`) has been
playtested end-to-end with zero console errors.

**Phase 2a is also built** (completed 2026-08-10, committed 2026-08-11):
`PuzzleElementBase` and all five subtypes
(`SequenceSpotElement`/`ScanInteractElement`/`MovingSpotDurationElement`/
`PushPullObjectElement`/`TrailDrawElement`) plus `PuzzleSite`,
`AbilityComponent`, `ProgressionManager`, `SaveManager`, and the rest of
`HudOverlay` (ability icons + puzzle-site indicator) and `TitleScene`
(Start/Continue) are implemented and wired into `GameScene`'s test level
(`level-000`). `CheckpointManager` remains **deferred by design, not
unbuilt**.

**Two nuances Phase 2a's completion doesn't erase:**
- **Code vs. art.** Everything above is mechanically complete, but its
  *content* is still test-level placeholder instances — one instance of
  each puzzle element and each non-Debris hazard, all using
  procedurally-generated placeholder textures. Per `docs/STATUS.md`, no
  final art exists yet for any puzzle element, or for Solar Flare/Ion
  Storm/Nebula Field/Meteoroid. Sourcing that art is tracked separately.
- **Ability rework (decided and implemented 2026-08-14, playtested and
  committed 2026-08-15).** All three unlockable abilities have real
  in-world effects: `scan` reveals nearby hazards (`HazardScanOverlay` —
  outline colored by structure/energy cost, plus a name label) and drives
  `HudOverlay`'s off-screen objective marker for its duration window;
  `teleport` is an arm/left-click-confirm blink to a fixed max range that
  passes through solid colliders (`TeleportRangeRing` shows the
  range/reticle; switched from right-click after playtesting showed the
  browser's native context menu made right-click unreliable); `rocketBoost`
  is a straight-line speed burst along the ship's current facing that does
  *not* pass through colliders. `ProgressionManager` auto-grants only three
  abilities, in order `scan → teleport → rocketBoost`; `tractorBeam` is
  de-scoped from all player-facing UI (always unlocked, no grant ceremony)
  but unchanged mechanically — `PushPullObjectElement`'s Cargo Pod puzzle
  still gates on it. `AbilityUnlockScene` shows a paused, explicit-close-only
  popup whenever a real level grants one of the three (see Scene flow in
  Architecture contract for its exact timing). Test Level force-unlocks all
  three on entry. Full rationale: `docs/ability-rework-brainstorm-2026-08-14.md`.
  `docs/trailing_edge_art_asset_list.md` §1.5's flag (dedicated activation
  VFX — a beam/pulse/thruster-trail sprite effect, separate from the
  mechanical effects above) is now **resolved for all three real
  abilities**: `scan` got a one-shot activation pulse (`ScanActivationVfx`,
  2026-08-26 — an expanding ring from the ship out to
  `scanConfig.scanRadius`, event-driven off `AbilityComponent`'s
  `Activated` event); `rocketBoost`'s burst already extends
  `ShipThrusterTrail`'s emitter (2026-08-24, found already built while
  adding the scan VFX, not new that pass); `teleport` got
  `TeleportBlinkVfx` (2026-08-26 — a shrinking/fading ghost duplicate left
  at the origin plus the real ship popping in at the destination, each
  paired with a small violet ring flash, event-driven off a new
  `ExplorationController.EXPLORATION_EVENTS.TeleportConfirmed` event
  carrying both endpoints; the actual position change stays mechanically
  instant). `tractorBeam` stays de-scoped, the only one of the four
  without dedicated activation VFX, intentionally so.

**Test level split from real progression (2026-08-12).** `level-000` — the
original test level, carrying one instance of every hazard and every
puzzle-taxonomy element — is no longer `LEVEL_ORDER[0]`. It's pulled out of
progression into `config/levelOrder.ts`'s `TEST_LEVEL_ID`, reachable only via
a "Test Level" link on `TitleScene` (no save read/write either side of that
trip; `GameScene.handleLevelComplete()` special-cases it to return straight
to `TitleScene`). `LEVEL_ORDER[0]` is `level-001`, a fresh level meant as
both the real first level and the base for level-design iteration. This is
also the point where "one config file per level" (Tech stack, below) stopped
being aspirational — every level is a real `LevelConfig` object under
`src/levels/`, and `GameScene.create()` reads placements from
`getLevelConfig(this.levelId)` rather than hardcoding them.

**Meteoroid collision rework (2026-08-21).** Speed bumped 60 → 140 → 280
px/s (the latter via later live-tuning), radius bumped 26 → 56, and it's now
a `blocksMovement: true` solid collider (ship physically bounces off it)
instead of a fly-through drain zone. Structure cost (25) is now applied as a
one-time hit on contact (`activation: 'impact'`, gated by
`hitCooldownSeconds: 1`) rather than a per-second drain — see Architecture
contract's `HazardZoneElement` bullet for the mechanism. This dropped the old
hard rule that `blocksMovement: true` hazards never call `onHazardContact()`
— a solid collider no longer implies zero contact cost.

**Energy Node pickups added (2026-08-24).** SubSpace's "greens," scaled
down: `EnergyNodeElement`/`EnergyNodeManager` (see Architecture contract)
scatter a fixed pool of pickups per level that grant a flat energy amount on
contact and reappear elsewhere (weighted toward the current objective) after
a cooldown. Landed alongside dropping `survivalConfig.energyRegenPerSecond`
`8` → `2` so the pickups are load-bearing rather than pure upside on an
already-adequate trickle. Playtested in-browser (spawn/keep-out, VFX,
collect → cooldown → respawn-elsewhere all confirmed, zero console errors);
tuning values are a first pass, not played over a full run yet.

**Energy Node pool size scales with level area (2026-08-25).** A flat
`poolSize: 5` was tuned only against `level-001`'s 2400x1350 footprint and
read as increasingly sparse on later, much larger levels. Replaced with
`computeEnergyNodePoolSize(levelWidth, levelHeight)` — scales the pool with
level area, anchored to the already-playtested 2400x1350/5 baseline, floored
at 5 so no level gets fewer nodes than that baseline. Not yet playtested for
feel on a larger level. `energyNodeConfig.maxNodesNearObjective` (see
Architecture contract) caps how densely a scaled-up pool can cluster near one
objective, added the same day as a follow-up.

**Ships start each level at 0 energy, not full (2026-08-24).**
`ShipSurvivalComponent`'s constructor sets `currentEnergy = 0` (structure
still starts full) — starting full just meant regen went unnoticed for a few
seconds before the player ever felt short on energy. Applies to both a fresh
level start and a hard-fail `scene.restart()`.

**Every energy-draining hazard now also drains structure (2026-08-25, user
request/design decision).** `hazardConfig.ts` current values: Ion Storm
energy 25/s, structure 20/s (continuous); Nebula Field energy 20/s, structure
25/s (continuous), plus `exposureRampPerSecond: 0.15` — Nebula Field only,
not Ion Storm — linearly scales the effective rate by how long the ship has
stayed *continuously* inside it (resets to 0 the instant it leaves), so a
quick pass-through is barely affected but lingering escalates fast (~3.2s of
continuous stationary exposure now drains a full structure bar, vs. ~4s
unramped). Not applied to Ion Storm because its trochoid path (below) can
sweep over the ship involuntarily, unlike a static field the player chooses
to enter. Solar Flare: energy 28, structure 35 per pulse (2.5s interval) —
brought in line the same day for completeness despite having no placement
precedent in any real level yet; its number is a per-pulse lump (comparable
to Meteoroid's 25/hit), not derived from a per-second rate the way Nebula/Ion
Storm's were. Debris Field is the only hazard left with zero resource cost
of either kind.
**Deliberately reverses GDD §9's 2026-08-07 "Meteoroid is the only
structure-draining hazard" asymmetry** — flagged to the user as a GDD-level
design question before changing, made anyway at their explicit direction:
the game needs more run-fail tension on the hazards actually encountered
often, and a time limit or similar wasn't wanted as the alternative lever.
**Known, deferred consequence:** every existing level's Nebula Field
placement (especially level-008's dense "Drift Expanse" gauntlet) was
authored assuming energy-only cost. Discussed mitigations, neither
implemented yet: treat dense formations as a routing choice the way
level-006's maze is played rather than as unavoidable, and/or add an extra
`ResupplyPoint` to larger levels. Also flagged for later, not yet scoped: a
scan-driven way to read a hazard's *severity*, not just its structure/energy
split.

**Ion Storm's `movementPattern` switched to a new `'trochoid'` value
(2026-08-25, user request/experiment)** — see Architecture contract's
`HazardZoneElement` bullet for the mechanism. Goal: on large levels, a single
straight-line pass felt too brief to register; trochoid sweeps a wide
looping band instead. Meteoroid stays `'linear'` on purpose, so the two
moving hazards read as distinct threats. **A related orbit/dwell-loiter
experiment (triggered when a `'linear'` hazard neared its aim point
mid-transit) was tried the same day and reverted** after direct playtest
feedback that it made hazards move in ways that read as buggy — don't
reintroduce it without re-confirming the user wants another attempt. Only
the aim-point route-bias half of that pass survived:
`MovingHazardManager.pickAimPoint()` now samples along the live
player→objective segment (`movingHazardConfig.routeBiasMin`/`Max`) rather
than aiming exactly at the objective.

**Known, accepted gap: most existing Ion Storm/Meteoroid placements' first
leg was never verified against its full trajectory, only its initial point**
(2026-08-25 finding, deliberately left unfixed). Root cause: `hazardConfig.ts`
fixes each hazard type's heading (Ion Storm always west, Meteoroid always
east), so an authored `x`/`y` only sets the start of a line that holds a
constant perpendicular coordinate all the way to the map edge — an
initial-point-only clearance check misses anything that line crosses further
along. A `level-009`/`level-010` GER pass (`docs/history/level-eval-log-2026-08-25.md`)
hit this and fixed it for those two by simulating full trajectories. A
retroactive audit (standalone script, not committed) of every placement
across `level-001`–`level-008` found 34 of 41 flagged (20/22 Ion Storm —
mostly a side effect of the trochoid switch above invalidating placements
verified safe as a straight line; 14/19 Meteoroid — a latent gap since
original authoring). **Left unfixed at the user's explicit call:** every
flagged Meteoroid's start sits 1000px+ from its level's Entry Wormhole (well
outside the ~640px-radius spawn viewport), and every leg *after* the first
already ignores wall/objective geometry entirely by design (see
`MovingHazardManager`'s bullet below) — so a flagged-but-unwitnessed first
leg isn't meaningfully worse than any accepted post-wrap crossing. If a
future session adds more moving-hazard placements, simulate the full
first-leg trajectory before committing to coordinates rather than checking
only the initial point — the level-009/010 refiner agents' method
(grid-search a clear position, re-simulate the whole leg) is the reference
implementation.

**Fixed: a 'linear' hazard (Meteoroid) could freeze permanently mid-level
(2026-08-26).** Found via the adversarial QA tool (`tools/adversarial-qa/`,
a class assignment, not a project-mandated deliverable — see that
directory's README) while specifically hunting for Meteoroid/Debris-Field/
boundary pinch scenarios at the project owner's direction, then confirmed
with a dedicated repro sweep against Test Level
(`tools/adversarial-qa/repro-meteoroid-boundary-stall.mjs`). Mechanism: a
glancing (not dead-center) collision between the ship and a `blocksMovement`
`'linear'` hazard, landing in the same physics step as the ship's own
`setCollideWorldBounds(true)` clamp against the level edge, could zero
**both** bodies' Arcade velocity simultaneously. The ship could eventually
break free with further move commands, but the hazard could not — nothing
in `HazardZoneElement` had ever redriven a `'linear'` hazard's velocity
after construction/`reposition()`, so a zeroed hazard stayed zeroed forever,
short of `MovingHazardManager`'s out-of-bounds wrap threshold, meaning it
could never self-recover either. Root cause is believed to be in Phaser's
own Arcade Physics collision resolution, not this project's collision code
(which never touches a hazard's velocity outside construction/`reposition()`).
Fixed with two layers, both in the Architecture contract bullets below:
`HazardZoneElement.update()` now redrives a `'linear'` hazard's velocity
every frame (self-healing — the existing `'trochoid'` pattern already
established the same "don't trust Arcade to hold onto a hazard's motion"
precedent, just via hand-driven position instead), and `MovingHazardManager`
gained a stall-detection safety net (`movingHazardConfig.ts`'s
`stallDisplacementThresholdPx`/`stallTimeoutSeconds`) that force-repositions
any `'linear'`/`'trochoid'` hazard that hasn't visibly moved in
~0.75s — expected to almost never fire post-fix, defense-in-depth against
any other not-yet-discovered way a hazard's motion could get wedged.
Re-verified against the original repro sweep (all 8 y-offsets, including
the 2 that previously froze) with zero freezes after the fix; full traces
in `tools/adversarial-qa/reports/`.

Asset prep status lives in `docs/STATUS.md` (read that first for what's
sourced vs. still open). Other reference docs live in `docs/`:
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
- `docs/history/level-eval-log-2026-08-17.md` / `level-eval-log-2026-08-25.md` — full level GER evaluation/fix history per batch

Living reference guides (for the human, kept accurate over time) live in
`docs/reference/`:
- `docs/reference/console-tuning-reference.md` — `window.tuning` fields exposed for live console tuning while playtesting
- `docs/reference/art-production-guidelines.md` — format/resolution/style/naming parameters for producing new art
- `docs/reference/phaser-vfx-notes.md` — how Phaser handles VFX (particles/tweens/postFX/flipbooks), mapped to planned effects
- `docs/reference/level-design-guide.md` — level-authoring conventions (sizing, objective spacing, hazard placement, `MovingHazardManager`, verification checklist) — read before authoring a new level
- `docs/reference/sfx-asset-list.md` — the single audio asset list (SFX + the one music item), cut by Required-vs-Nice-to-have priority; consolidated 2026-08-26 from a since-deleted `docs/trailing_edge_audio_asset_list.md`
- `docs/reference/sfx-sourcing-candidates.md` — auto-generated (`tools/audio-triage/scan-kenney-audio.mjs`) filename-keyword triage of the project owner's local Kenney audio library against `sfx-asset-list.md`'s categories; a shortlist for a human listening pass, not a perceptual evaluation; rerun the script rather than hand-editing this file

## Tech stack (confirmed, GDD §11)

- **Phaser.io + TypeScript**, not plain JS. Load-bearing: every hard rule
  below is meant to be compiler-enforced via `private` TS fields.
- **Arcade physics**, not Matter.js. Accepted tradeoffs: Cargo Pod push/pull
  is position/velocity tweening, not real force application; Meteoroid is a
  velocity-and-overlap hazard, not a true physics collision. If
  tractor/repulsor abilities feel wrong once prototyped, the agreed fallback
  is to cut/de-emphasize that ability — **not** to revisit the physics engine.
- **Hand-authored TS level configs**, not Tiled. One config file per level
  under `src/levels/` (a `LevelConfig` object — see `src/levels/levelTypes.ts`)
  — keeps the project 100% agent-touchable and keeps content authoring
  low-collision for parallel agents.
- **Asset/gameplay-size decoupling.** Collision/interaction dimensions are
  always authored data, never derived from a sprite's native pixel size —
  sprites are scaled to fit via `setDisplaySize()`/`setScale()`, never the
  reverse. Keeps a future art pass from requiring gameplay/collision re-tuning.
- **Tunable parameters live in per-subsystem config modules** (e.g.
  `shipConfig.ts`, `survivalConfig.ts`), never inline in class logic, and
  are exposed on `window` in dev builds for live console tuning. Ship
  speed/accel/decel, energy regen rate, structure repair rate, and hazard/
  ability costs all go here.

**The real multi-agent risk isn't asset mergeability — it's shared "wiring"
files** (a main Scene's `create()`, a central index) where every system gets
instantiated. Mitigation, and a hard rule: use `SystemRegistry.register(system)`,
called from each system's own file at module load (`src/systems/index.ts`
is the side-effect import point — see `SystemRegistry.ts`). Agents append
imports; **nobody hand-edits `create()`.**

## Architecture contract (GDD §11) — current as of 2026-08-25; check `src/`
before assuming something is or isn't implemented rather than trusting this
file's age. `CheckpointManager` remains deferred by design.

- **`ShipSurvivalComponent`** — owns `currentEnergy`/`maxEnergy`/
  `currentStructure`/`maxStructure`, all `private`. Structure is the sole
  fail resource (hitting zero triggers a full level restart); energy is a
  mana-like ability-gating resource that regenerates passively and never
  fails the level on its own. **Hard rule: no puzzle element, hazard, or
  ability may touch these fields directly** — only
  `consumeEnergy`/`consumeStructure`/`regenEnergy`/`repairStructure`/
  `rechargeEnergy` (the last for `EnergyNodeElement` pickups — a flat,
  immediate grant rather than a per-second rate).
  **Regression to watch for:** don't let any code path treat energy
  depletion as a failure condition.
- **`CheckpointManager`** — **deferred, not built.** A hard fail (structure
  hits zero) triggers a full level restart instead (see
  `LevelObjectiveTracker`), not a checkpoint resume. Expected to return once
  maps and secondary progression grow.
- **`LevelObjectiveTracker`** (per-level, fills `CheckpointManager`'s role
  for now) — tracks `probeFound`/`beaconReached` booleans, reset on level
  start and on every hard-fail restart. `ExitWormhole` queries `canReturn()`
  before completing the level. Exposes `getCurrentObjectiveTarget()`, used
  by `HudOverlay`'s off-screen marker.
- **`ProbeObject`** — arrival trigger; `onPlayerArrival()` →
  `LevelObjectiveTracker.onProbeFound()`.
- **`RelayBeaconObject`** — mandatory per-level waypoint required after the
  probe, before return. **Not a puzzle** — plain navigate-to/arrival
  trigger. Distinct from the Signal Array puzzle element below (naming was
  split to avoid a collision).
- **`EntryWormhole`** / **`ExitWormhole`** — launch position and required
  return destination, **two distinct locations** (2026-07-31 revision;
  previously one shared `HomeMarker`). Both reuse the same final art
  (`objectives/wormhole.png`), distinguished only by tint. `EntryWormhole`
  is visual-only (no Arcade overlap; starts tinted "active", swaps to
  "inactive" shortly after level start). `ExitWormhole` starts tinted
  "inactive", opens once `LevelObjectiveTracker`'s beacon-reached event
  fires, and its `onPlayerArrival()` checks `canReturn()` before completing
  the level.
- **`PuzzleElementBase`** (abstract) and subtypes — optional/additive
  content, not required to complete a level; none ship in Phase 1. One
  test-level instance of each exists in `src/levels/level-000.ts`
  (`level-001` onward has an empty `puzzleElements` array), using
  placeholder procedural textures (no final art sourced yet):
  - `SequenceSpotElement` — Signal Array (renamed from "Relay Beacon")
  - `ScanInteractElement` — Scan Target/Marker
  - `MovingSpotDurationElement` — Comet (tracking)
  - `PushPullObjectElement` — Cargo Pod/Wreckage (checks
    `AbilityComponent.isUnlocked('tractorBeam')` first)
  - `TrailDrawElement` — Beacon Cluster
  - **`HazardZoneElement`** — one parameterized class for *all four*
    open-world hazards (Debris Field, Solar Flare, Ion Storm, Nebula Field)
    plus Meteoroid, via `shape`, `movementPattern`, `speed`, `activation`,
    `pulseIntervalSeconds`, `resourceCost`, and `blocksMovement`. **Don't
    build five/six hazard classes — this collapse is a confirmed decision,
    not an open question.** **Meteoroid is no longer the *only*
    structure-draining hazard as of 2026-08-25** (Nebula Field and Ion Storm
    both gained `resourceCost.structure`, Solar Flare too — see Current
    project state for current values) — its distinct identity is now its
    delivery (a one-time impact hit + physical knockback via
    `blocksMovement` collision), not exclusivity on fail-stakes. Debris
    Field alone stays zero-cost.
    Hard rule: `onHazardContact()` only calls
    `ShipSurvivalComponent.consumeEnergy/consumeStructure` — never sets
    resource values itself. `blocksMovement: true` no longer implies zero
    contact cost (decoupled 2026-08-21 for the Meteoroid rework) — a hazard
    can be a solid collider and still charge a cost on contact; whether a
    given hazard does both is a per-hazard content decision in
    `hazardConfig.ts`, not a rule of the class.
  - **`activation: 'impact'`** (added 2026-08-21, Meteoroid) — a third
    `HazardActivation` mode alongside `continuous`/`pulsed`: applies
    `resourceCost` as a one-time lump on contact, gated by
    `hitCooldownSeconds`, so a lingering overlap (while Arcade's collision
    separation is still shoving the ship clear) doesn't re-charge the cost
    every frame. Uses its own body-accurate `scene.physics.overlap()` check
    rather than `continuous`/`pulsed`'s manual center-distance-vs-radius
    one — that one treats the ship as a dimensionless point, which is
    wrong once a hazard is both physically-sized and `blocksMovement`
    (Arcade's real collision response would shove the ship's center back
    out before it ever crossed that naive radius).
  - **`cancelTargetOnContact`** (Meteoroid only) — clears
    `ExplorationController`'s click-to-move target on every collider
    contact, so `decelerateToStop()` brings the ship to a clean stop instead
    of steering re-driving velocity into the hazard every frame (confirmed
    via a synthetic A/B: without it, the ship creeps sideways along the
    hazard indefinitely). Arcade's collision separation has zero
    restitution — this produces a clean stop, not a bounce; see
    `knockbackSpeed` below for the actual bounce-like impulse.
  - **`knockbackSpeed`** (Meteoroid: 260, `shipConfig.maxSpeed`'s ceiling) —
    on a successful `'impact'` hit, sets the ship's velocity directly to
    this speed, **perpendicular** to the hazard's heading (deflecting
    sideways out of its path, not radially outward — a radial kick just
    gets caught back up to by a still-moving hazard, confirmed by
    playtesting). Deflection side is picked from whichever perpendicular
    the ship is already offset toward. **Known, unfixed edge case:** a fast
    hazard passing very close can still land a second hit if the ship
    decelerates to a stop right at the minimum-clearance margin. An instant
    position-snap (jump the ship outside the collision radius before the
    velocity kick) was prototyped and measurably fixed this, but wasn't
    shipped — the user wanted more time with the plain-velocity version
    first; the snap fix is known and available to reapply if wanted.
  - **`movementPattern: 'trochoid'`** (added 2026-08-25, Ion Storm) — a
    fourth `HazardMovementPattern` alongside `static`/`linear`/`patrol`
    (the last still reserved/unimplemented). An invisible carrier point
    advances in a straight line exactly like `'linear'` (same
    `speed`/`headingRadians`), but the hazard's actual drawn position orbits
    that carrier at `orbitRadius`/`orbitAngularSpeedRadiansPerSecond` (two
    `HazardZoneConfig` fields, only meaningful for this pattern) instead of
    sitting on it — a spirograph path sweeping a band roughly
    `2 * orbitRadius` wide instead of a single-pixel-wide line. Implemented
    via hand-driven `setPosition()` every frame (Arcade velocity zeroed so
    the physics body can't fight it) — the same technique `reposition()`
    already used for one-shot wrap teleports, applied continuously.
    `MovingHazardManager` needed no changes — it only reads
    `HazardZoneElement.getPosition()` (the real drawn position, already
    inclusive of the orbit offset) for wrap/out-of-bounds detection. Ion
    Storm's tuning (`orbitRadius: 220`, one loop per 5s) deliberately makes
    tangential loop speed exceed carrier speed, which is what produces
    genuine loop-backs rather than a gentle wobble. Meteoroid stays
    `'linear'` on purpose.
  - **`'linear'` velocity redrive** (added 2026-08-26, fixing the freeze
    bug described in Current project state) — `update()` now recomputes and
    re-sets a `'linear'` hazard's Arcade velocity from its *current* heading
    (`linearHeadingRadians`, an instance field distinct from
    `config.headingRadians` — the latter is only the fixed authored value
    for the first leg; the former tracks whatever `reposition()` last set it
    to) every single frame, rather than setting it once at construction/
    `reposition()` and trusting Arcade to keep integrating it unattended.
    Purely defensive/self-healing — under normal operation this redrives the
    exact value that was already there, no behavior change; it only matters
    if something external (confirmed: a same-physics-step collision with a
    world-bounds-clamped ship) zeroes it out from under the hazard.
  - **Debris Field re-scoped 2026-08-07 (GDD §9)** — was a static,
    structure-draining zone; now a solid, movement-blocking obstacle with
    **no resource drain** — naturally-occurring rock/ice debris, not ship
    wreckage (no established prior space-faring civilizations to leave
    wreckage). Name unchanged — an "Asteroid Field" rename was considered
    and rejected, since it would collide with the `AsteroidField` resupply
    object below.
  - **`MovingHazardManager`** (added 2026-08-17) — keeps `movementPattern:
    'linear'`/`'trochoid'` hazards (Ion Storm, Meteoroid) from drifting off
    into the world bounds and never coming back. One `GameScene`-owned
    instance per level (reset each `create()`, **not** a `SystemRegistry`
    singleton — moving-hazard state has no reason to survive a hard-fail
    restart). Design: **wrap, not destroy-and-respawn** — a fixed
    `HazardZoneElement` instance for the whole level; once its position
    drifts past the level bounds by more than its own radius,
    `reposition()` jumps it to a fresh perimeter point with a new heading.
    That heading is objective-biased, not uniformly random — aimed through
    a point sampled along the live player→objective segment
    (`movingHazardConfig.routeBiasMin`/`Max`), then jittered
    (`objectiveJitterRadius`) so it's not a deterministic beeline. **A
    moving hazard's path is never checked against wall/objective geometry,
    before or after this heading pick** — overlapping a Debris Field wall
    is accepted as a visual non-issue; see Current project state's
    trajectory-audit entry for why only a hazard's *first*, authored leg
    (not this ongoing wrap-driven one) is treated as something to verify. A
    hazard's authored level-file `x`/`y` only governs that first leg.
    First proven out on `level-003`/`level-004` (more abilities to handle a
    moving threat by that point) — later overridden for `level-001`/
    `level-002` at explicit user request (see `level-design-guide.md` §4).
    **Stall-detection safety net** (added 2026-08-26, alongside the
    `'linear'` velocity redrive above — same freeze-bug fix): `update()`
    now takes `deltaMs` and, independent of the out-of-bounds check, tracks
    each hazard's frame-to-frame displacement — if a `'linear'`/`'trochoid'`
    hazard moves less than `movingHazardConfig.stallDisplacementThresholdPx`
    for `stallTimeoutSeconds` straight (these patterns have no legitimate
    reason to ever sit still), it's force-`reposition()`'d the same as
    drifting out of bounds. Defense-in-depth, not the primary fix — expected
    to almost never actually fire now that the velocity redrive above
    prevents the confirmed freeze mechanism from persisting past one frame.
- **`AbilityComponent`** — per-ability dual gate (`energyCost`,
  `cooldownSeconds`), either settable to 0, plus a third `durationSeconds`
  gate, used so far only by `scan`; `isActive(type, nowMs)` reports whether
  that duration window is open. Rebuilt fresh on every `PlayerShip`/hard-fail
  restart, but delegates `isUnlocked()` to `ProgressionManager` so a restart
  never re-locks an already-earned ability — **except `tractorBeam`, which
  `isUnlocked()` special-cases to always return `true`** (de-scoped from
  player-facing UI). `scan` uses `isActive()` for hazard threat-ID
  (`HazardScanOverlay`) and driving `HudOverlay`'s off-screen marker.
  `teleport` has a fixed `maxRange`/flat cost, an arm/left-click-confirm
  input, and passes through `blocksMovement: true` hazards via a plain
  `setPosition()` call. `rocketBoost` is a straight-line burst along the
  ship's current facing, overriding click-to-move for its duration, and
  does *not* pass through solid colliders — that asymmetry with `teleport`
  is deliberate and confirmed in playtesting (a boost into a Debris Field
  stops dead, no refund).
- **`ProgressionManager`** — durable `SystemRegistry` singleton owning
  `unlockedAbilities`; its `init()` is a deliberate no-op so unlocks survive
  a hard-fail restart. `grantNextAbility()` auto-grants the next ability in
  a fixed order (`abilityUnlockOrder` in `abilityConfig.ts`, three entries:
  `scan → teleport → rocketBoost`) from `GameScene`'s level-completion
  handler — **no player-facing unlock-choice UI**. `tractorBeam` is never
  granted through this sequence. Endurance-upgrade stats (efficiency/
  recharge/capacity) are still **deferred**. Hard rule: never modifies
  fixed hazard costs or fixed puzzle costs. Test Level force-grants all
  three on entry.
- **`ResupplyPoint`** (AsteroidField only) — repairs structure while in
  range; no longer covers energy (passive regen instead) and doesn't
  register a checkpoint. **Reworked 2026-08-24:** the asteroid is now a
  solid `blocksMovement` obstacle (same mechanism as Debris Field/Meteoroid)
  — a resupply stop is a deliberate routing decision, not a drive-through.
  That broke the old Arcade *overlap*-callback repair trigger (a solid
  collider means Arcade's own separation keeps the ship's center outside
  the physical collision radius), so repair range is now a manual per-frame
  distance check against `radius + resupplyVfxConfig.rangeBuffer`. Also
  added a repair-laser VFX (`resupplyVfxConfig.ts`) — a beam from the ship
  to a randomized point inside the asteroid, plus a spark burst, reusing
  `shipStatusArcConfig.structureColor`.
- **Authored data** — per-hazard `CostData`, per-ability `AbilityCostData`,
  required per-level object placement (`probeLocation`,
  `relayBeaconLocation`, `entryWormholeLocation`, `exitWormholeLocation`),
  and `levelOrder: string[]` (linear progression — no level-select; content
  agents append to this array, never hardcode a "next level" pointer).
  Implemented as real `LevelConfig` objects under `src/levels/`
  (`getLevelConfig(levelId)`, `src/levels/index.ts`) — `GameScene.create()`
  reads placements from this via `HazardPlacement`/`ResupplyPlacement`/
  `PuzzleElementPlacement` (the latter turned into a live instance via
  `src/levels/puzzleElementFactory.ts`'s `createPuzzleElement()`).
- **Scene flow** — `BootScene` → `TitleScene` (Start/Continue) →
  `GameScene` (parameterized by `levelId` only — always starts at the
  level's beginning) → `WinScene` when `levelOrder` is exhausted;
  `PauseScene` as a stacked overlay, not a Scene swap. `AbilityUnlockScene`
  (implemented 2026-08-14, retimed 2026-08-15) is a fifth Scene, same
  stacked-overlay convention as `PauseScene`, paused, dismissed only by an
  explicit close button. **Timing:** whenever there's a next level to go
  to, `handleLevelComplete()` hands the granted ability off via
  `scene.start()`'s data (`GameSceneData.unlockedAbility`) instead of
  launching the popup itself, and the *next* level's `create()` launches it
  at the end, once the ship is already positioned at that level's Entry
  Wormhole — so the popup announces an ability in the level it's actually
  usable in, not the one just left. A hard-fail `scene.restart()` never
  passes `unlockedAbility`, so restarting never re-shows it. **Fallback:**
  the last ability granted on the last `LEVEL_ORDER` entry has no next level
  to hand off to, so `handleLevelComplete()` shows the popup at the
  completed level there instead, `onClose` starting `WinScene` directly.
  Never launched for `tractorBeam`. Copy per ability lives in
  `abilityUnlockContent.ts`.
- **`SaveManager`** — thin `localStorage` wrapper (module functions, not a
  class), level-completion saves only (no mid-level snapshot). **Hard
  rule: the only code allowed to touch `localStorage` directly.** Two call
  sites: `GameScene`'s level-completion handler (`saveProgress`) and
  `TitleScene`'s Start/Continue flow (`hasSaveData`/`loadProgress`).
- **`HudOverlay`** — display-only, screen-pinned. Owns the off-screen
  objective marker and ability icons (via `AbilityComponent.isUnlocked()`/
  `getCooldownRemainingMs()`, sourced from `abilityUnlockOrder` so
  `tractorBeam` never appears) and the puzzle-site-active indicator (via
  `PuzzleSite.solved`). Energy/structure bars live in `ShipStatusArcs`
  instead. The off-screen marker is visible only while `scan`'s duration
  window is active, plus a `flashObjectiveMarker()`-driven one-shot reveal
  at level start and on every objective-target change.
- **`ShipStatusArcs`** — world-space, ship-relative resource readout: a
  structure bar above the ship, a thinner energy bar below it, tracking the
  ship's position without rotating with its heading. Procedurally drawn via
  `Phaser.GameObjects.Graphics` — no art asset planned, a deliberate style
  choice. **Structure switched from a curved dome arc to a horizontal bar
  2026-08-14** — the arc read as a shield to playtesters, misrepresenting
  structure as absorbing damage rather than being consumed by it.
- **`HazardScanOverlay`** — world-space, display-only. While `scan` is
  active, draws an outline (orange = `resourceCost.structure > 0`, blue =
  `resourceCost.energy > 0`, gray = neither, i.e. `blocksMovement` hazards
  like Debris Field) plus a name label over every hazard within
  `scanConfig.scanRadius`. One `Text` label per hazard is created once and
  reused every frame.
- **`ScanActivationVfx`** (added 2026-08-26) — world-space, display-only,
  event-driven (subscribes to `AbilityComponent`'s `Activated` event rather
  than being called into directly, same convention as `DestinationMarker`).
  Plays a one-shot ring, Graphics-drawn and redrawn every tween frame (not a
  scaled texture — it travels out to `scanConfig.scanRadius`, too far for a
  small pre-baked texture to stretch cleanly), expanding from the ship and
  fading out over `scanVfxConfig.durationMs`. Marks the *instant* scan
  activates; `HazardScanOverlay` above still separately renders the
  *result* for the full duration window.
- **`TeleportRangeRing`** — world-space, display-only. A ring at
  `abilityConfig.teleport.maxRange` centered on the ship plus a reticle at
  the live clamped aim point, visible only while
  `ExplorationController.isTeleportArmed()`.
- **`TeleportBlinkVfx`** (added 2026-08-26) — world-space, display-only,
  event-driven off a new `ExplorationController.EXPLORATION_EVENTS.
  TeleportConfirmed` event (payload: `{ from, to }`, both world points) —
  not `AbilityComponent`'s `Activated` event, since that only carries the
  ability type, not the teleport's two endpoints. `confirmTeleport()` emits
  it right after its existing `setPosition()` call; the real position
  change stays synchronous/instant, this only decorates it. Plays two
  paired effects: a duplicate "ghost" sprite left at the origin (shrinks to
  nothing and fades, tinted `teleportBlinkVfxConfig.color`), and the real
  ship itself scaled down to `arrivalStartScaleFactor` the instant it
  arrives, then tweened back up to its normal per-axis scale — plus a small
  ring flash at each end (collapsing at the origin, expanding at the
  destination), same Graphics-redrawn-every-tween-frame technique as
  `ScanActivationVfx`, just much smaller/faster. Complements
  `TeleportRangeRing`, which only covers the aim-time state before confirm.
- **`EnergyNodeElement`/`EnergyNodeManager`** (added 2026-08-24) —
  `EnergyNodeManager` owns a fixed pool of pickups per level, sized via
  `computeEnergyNodePoolSize(levelWidth, levelHeight)` (scales with level
  area as of 2026-08-25) — same `GameScene`-owned, reset-per-`create()`,
  wrap-not-destroy lifecycle as `MovingHazardManager` (a fixed instance
  toggles visible/hidden rather than being recreated). Each pickup is an
  instant overlap-trigger granting `energyNodeConfig.rechargeAmount` via
  `rechargeEnergy()`, then starts a `respawnCooldownSeconds` timer before
  repositioning. Placement is rejection-sampled against three keep-outs:
  never inside a `blocksMovement` hazard's footprint, never within
  `entryKeepOutRadius` of the Entry Wormhole, never within `edgeMargin` of
  any level boundary. A respawn additionally biases toward the current
  objective (same aim-plus-jitter idea `MovingHazardManager` uses, except
  here the jittered point IS the landing position), capped by
  `energyNodeConfig.maxNodesNearObjective` (5) — `pickRespawnPosition()`
  counts live nodes already within `respawnJitterRadius` of the target and
  falls back to a plain uniform placement once the cap is hit, so a
  scaled-up pool can't pile an unbounded cluster onto one objective. No
  sourced art — a generated blue/white glow texture with a breathing tween,
  ambient sparkle emitter, and a one-shot burst on collection
  (`energyNodeVfxConfig.ts`). Landed alongside dropping
  `survivalConfig.energyRegenPerSecond` `8` → `2` so the pickups are a
  deliberate routing incentive, not a bonus on top of an adequate trickle.

## Development plan shape (GDD §12)

Sequential vertical slice first, **then** fan out — the fan-out is a
**core-contract-vs-content split**, not a by-layer split:

1. **Phase 0 — Contract lock.** This file is the contract. Flag — not
   silently resolve — a task that seems to require breaking a hard rule or
   hand-editing a shared wiring file.
2. **Phase 1 — done.** See Current project state above for what's built.
3. **Phase 2a — done** (completed 2026-08-10, committed 2026-08-11). See
   Current project state above.
4. **Phase 2b — content only, in progress.** Levels, hazard/puzzle
   placements (config, not code). Content agents never touch core files.
   `level-001` through `level-010` exist — see `src/config/levelOrder.ts`
   for the full per-level history and `docs/reference/level-design-guide.md`
   for the authoring conventions.
5. **Phase 3 — integration only, not yet started.** Full `levelOrder`
   playthrough, confirm `Continue` resumes correctly, `WinScene` on the true
   last level, a real packaged-build run.

## Puzzle taxonomy vs. hazard taxonomy — don't conflate these two tables (GDD §9)

**Open-world hazards** (drain resources, encountered while flying — except
Debris Field): Debris Field (static, blocks movement, no resource drain —
re-scoped 2026-08-07), Solar Flare (dynamic/timed burst, energy + structure
— unplaced in any real level yet), Ion Storm (trochoid drift as of
2026-08-25, energy + structure — visually same family as Nebula Field,
motion is the *only* difference; **still an open art-differentiation
question**, see Open design questions below), Nebula Field (static, energy +
structure), Meteoroid (dynamic/moving, structure only, one-time impact hit
— renamed from "Rogue Comet" to avoid colliding with the puzzle element
below). See Architecture contract's `HazardZoneElement` bullet for current
per-hazard cost values and the "no longer sole structure-draining hazard"
history.

**Puzzle-site elements** (optional/additive, cost-neutral by default):
Signal Array (sequence — renamed from "Relay Beacon," see below), Scan
Target/Marker, Comet (tracking — name belongs solely to this element, not
any hazard), Cargo Pod/Wreckage (push/pull, gated behind Tractor), Beacon
Cluster (trail/encircle).

**Core-loop objects** (required every level, not part of the above
taxonomy): Probe, Relay Beacon (mandatory navigate-to waypoint, required
after the probe and before return — **not** the same thing as Signal Array
above; the name was reassigned to this waypoint, causing the puzzle
element's rename), Entry Wormhole and Exit Wormhole (two distinct locations
as of 2026-07-31, both reusing the same final art tinted differently;
previously one shared Home Marker object).

## Phase 1 content scope (exactly these, nothing else)

One hazard (Debris Field — movement-blocking, zero resource cost, final
art), one resupply point (AsteroidField — structure repair only; energy
regenerates passively, final art), the Probe, the Relay Beacon (mandatory
waypoint, not a puzzle), the Entry Wormhole and Exit Wormhole (two distinct
locations, final art, tinted per-state), the ship, minimal HUD
(`HudOverlay`'s off-screen marker plus `ShipStatusArcs`'s procedurally-drawn
readout — no panel/bar art asset, by design). **No puzzle-taxonomy element
ships in Phase 1** — that taxonomy moved to Phase 2a. See `docs/STATUS.md`
for what's sourced vs. not (Ion Storm/Nebula Field cloud art has a decided
production approach but nothing sourced yet).

## Open design questions (GDD §9)

**Ion Storm vs. Nebula Field visual differentiation is still open** — color
alone is a weak signal (colorblind players; easy to under-read a slow drift
in a quick glance). Fallback options in reserve if color+animation doesn't
read clearly: particle trail, border/outline treatment, or reverting to two
distinct phenomena. **Production approach decided 2026-08-08, differentiation
itself still unresolved:** one shared asset pass serves both hazards — 2-3
distinct soft-cloud silhouette textures (not a Debris-Field-style
discrete-fragment cluster), each stretched via `setDisplaySize()`. See
`docs/reference/art-production-guidelines.md`'s "Nebula Field / Ion Storm
cloud art" section. Nothing sourced yet.

**Structure-vs-energy stakes legibility, reframed 2026-08-25:** the old
framing ("only Meteoroid carries real fail stakes, is the visual language
clear about that") no longer applies now that Nebula Field, Ion Storm, and
Solar Flare all carry structure cost too (see Current project state and
Architecture contract). What's still genuinely open: whether the *visual*
language (`HazardScanOverlay`'s orange/blue color coding) still reads
clearly now that most hazards carry the orange (structure-cost) treatment.
The reworked `scan` ability gives players an active, on-demand way to
identify a hazard's type/cost, but that's a mitigation layered on top, not a
resolution — both this and the Ion Storm/Nebula Field item above stay open
for the passive, no-`scan` case. The Accessibility/Telegraphing Reviewer
role (GDD §12.1) should keep evaluating the visual language on its own terms.

**Resolved (2026-07-31):** off-screen objective visibility. Resolved as a
single edge-pinned directional arrow (Sinistar-style), not a minimap —
`LevelObjectiveTracker` sequences the loop strictly linearly, so there's
only ever one current objective to point at. Implemented in `HudOverlay`.
Revisit if a future level needs multiple simultaneous objective/hazard
markers at once. **Amended 2026-08-14:** the marker's *visibility rule*
changed (see `HudOverlay` in Architecture contract) but the underlying
"one current objective, edge-pinned arrow, no minimap" design is unchanged.

**Resolved (2026-08-07):** Debris Field re-scoped from a structure-draining
zone to a movement-blocking obstacle — see Architecture contract's "Debris
Field re-scoped" bullet for the mechanism and rationale. An "Asteroid Field"
rename was considered and rejected (collides with the `AsteroidField`
resupply object). Final art sourced the same day; the full loop has since
been playtested end-to-end with it in place.
