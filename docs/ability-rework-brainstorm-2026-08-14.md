# Ability Rework Brainstorm — 2026-08-14

**Status: proposal only.** This document captures a design brainstorm
between the project owner and a Claude session — nothing here is
implemented, and nothing here is yet reflected in `trailing_edge_gdd_draft_31.md`,
`CLAUDE.md`, or `docs/STATUS.md`. Treat it as a candidate direction, not a
decision of record, until the owner formally folds it into the GDD. Written
up at the owner's request so the reasoning survives past the conversation
it happened in.

## The problem that started this

Phase 2a's four abilities (`scan`, `tractorBeam`, `teleport`, `rocketBoost`)
are implemented and gate correctly, but per `CLAUDE.md`'s Current project
state, only `tractorBeam` has a real in-world effect. In practice:

- **`scan` has no purpose.** It unlocks first (of `scan → tractorBeam →
  teleport → rocketBoost`) and currently does nothing in-world.
- **`tractorBeam` works but the owner doesn't want to invest further in it**
  — consistent with the risk already flagged in `CLAUDE.md`'s tech-stack
  section (Arcade physics, not Matter.js; agreed fallback if
  tractor/repulsor "feels wrong" is to cut/de-emphasize, not revisit the
  physics engine).
- **`teleport` and `rocketBoost` are functionally redundant** — both read as
  generic mobility assists with no distinct decision attached to choosing
  one over the other.

The underlying stakes: energy only matters if the abilities it gates are
worth saving energy for. If none of the four abilities have a legible
purpose, energy becomes a resource with no reason to exist, and every
energy-draining hazard (Solar Flare, Ion Storm, Nebula Field) loses its
teeth along with it.

**Reframe adopted during the brainstorm:** the fix doesn't require all four
abilities to be individually strong. It requires *at least one or two*
abilities with a legible reason to hoard energy for them — which is a
smaller, more finishable problem under a class-timeline scope constraint
than inventing new mechanics from scratch.

## Proposed direction

### 1. Rework `scan` into a threat-identification / orientation pulse

Instead of doing nothing, `scan` becomes a multi-second-duration pulse
(see "Technical implications" below) that:

- Reveals/identifies nearby hazards — specifically aimed at two problems
  already on record as unresolved in `CLAUDE.md`'s Open design questions:
  Ion Storm vs. Nebula Field being visually hard to distinguish, and
  "structure-vs-energy stakes legibility" (can the player tell a
  structure-draining hazard from an energy-draining one at a glance).
  Repurposing `scan` to answer both is a two-birds-one-stone move, not new
  scope.
- Also drives the level's directional objective marker (see #2) — `scan`
  becomes the single tool for both "what's around me" and "which way do I
  go," reinforcing why it makes sense as the *first* ability a player
  unlocks.

Note for future readers: this is the `scan` **ability**
(`AbilityComponent`), not `ScanInteractElement` (the Scan Target/Marker
puzzle-taxonomy element). The two are unrelated systems that happen to
share a name root — flagging this now the way `CLAUDE.md` already flags the
Relay Beacon/Signal Array naming collision, so it doesn't get conflated
later.

### 2. Objective marker tied to `scan`, not always-on

Current implementation: `HudOverlay`'s off-screen objective marker is
always visible, per the 2026-07-31 resolution to the "bounded, not
screen-sized levels" open question. The brainstorm concluded this can
change without reopening that problem:

- The marker is visible **only while `scan`'s duration window is active**,
  plus two free, energy-independent one-shot triggers: at level start, and
  whenever `LevelObjectiveTracker`'s current target changes (probe found,
  beacon reached). The free triggers exist so a player is never left with
  zero information at a moment the game just changed what it's asking of
  them, regardless of their energy state.
- Rationale for why this doesn't reopen the disorientation problem the
  always-on marker was built to solve: objective locations are static
  within a phase, so a single scan gives a usable bearing, not just a
  frozen snapshot — because the marker stays live for the scan's full
  duration while the ship is moving, the player gets bearing-rate-of-change
  for free (motion parallax), which is meaningfully more information than
  an instantaneous ping. Re-scanning at will (same energy/cooldown gate as
  the hazard-ID use) refreshes orientation after evasive maneuvering or a
  long stretch of flight.
- **Considered and rejected:** a "decaying cone of uncertainty" marker that
  would persist at degrading precision between scans. Dropped as
  unnecessary complexity — the motion-parallax effect plus re-scan-on-demand
  already covers the disorientation-after-maneuvering case without a new
  HUD system, which matters more than usual given the timeline.
- One accepted tradeoff, deliberately not treated as a bug: a player who
  gets disoriented right after a hazard drains their energy may not be able
  to afford an immediate re-scan. This is read as the intended macro/meso
  tension (spend energy now on an escape tool, or hold it for orientation)
  rather than an unfair cost, specifically because it's now optional/
  player-initiated rather than a mandatory tax on basic navigation.

### 3. Differentiate `teleport` and `rocketBoost` along the pillar split

Rather than both being generic "move fast," split them onto different
pillars, each with its own decision attached:

- **`teleport` → Meso/Exploration tool.** Short-range blink that passes
  through solid colliders — the one thing that lets a player bypass a
  Debris Field wall (movement-blocking since its 2026-08-07 re-scope)
  without rerouting around it. Ties directly to Debris Field's own
  redesign rationale ("the first hazard tied to the Meso/Exploration pillar
  rather than only Macro/Survival").
- **`rocketBoost` → Macro/Survival tool.** Reactive burst along current
  heading, not obstacle-passing — outrun a Solar Flare's timed pulse, or
  close distance to a resupply point before structure runs out. A panic
  button, not a routing tool.

This gives the two abilities different *decisions* (plan a shortcut vs.
react to an emergency) instead of the same decision at different speeds.

Follow-up pass (2026-08-14) worked out the actual mechanics of each,
grounded in `ExplorationController.ts`/`AbilityComponent.ts`/`PlayerShip.ts`
as currently built rather than assumed from scratch:

**Rocket Boost — mechanics (settled).** Rapid straight-line propulsion
along the ship's current facing, ignoring the click-to-move target for the
boost's duration.

- Heading source: `ship.rotation`. It's already kept continuously in sync
  with velocity direction while the ship is moving, and simply retained
  as-is while stopped — so it covers both the moving and stationary
  activation cases with no new heading-tracking needed.
- `ExplorationController.update()` needs a `boosting`-state branch that
  overrides the normal target-seeking velocity calculation for the boost's
  duration, driving velocity directly along the captured heading instead of
  toward `this.target`.
- **`maxVelocity` gotcha (caught in review, worth preserving):**
  `PlayerShip` calls `this.image.setMaxVelocity(shipConfig.maxSpeed)` once
  at construction — an Arcade body-level cap. A boost speed above
  `maxSpeed` will be silently clamped back down to normal speed unless the
  cap is explicitly raised for the boost window and restored afterward.
  Flagging this now because it's the kind of bug that reads as "boost does
  nothing" rather than throwing an error.
- **Destination target still updates in the background.** Clicks/drags
  during the boost window keep updating `this.target` via the existing
  `pointerdown`/`pointermove` handlers with no changes needed — those
  handlers don't know or care about boost state. Only the movement branch
  in `update()` needs to ignore `this.target` while boosting is active.
  Movement resumes toward wherever `this.target` currently is the instant
  the boost window ends, so there's no dead/unresponsive input period
  during or immediately after a boost.
- **Debris Field interaction (a feature, not a bug to fix):** boosting into
  a Debris Field just gets stopped by its existing solid collider, same as
  normal movement — the energy is already spent, no refund. This
  reinforces the pillar split for free: teleport passes through solid
  obstacles (its whole job), boost does not (it's a reactive speed tool,
  not a routing tool) — terrain punishes boost and rewards teleport
  differently without any extra design work to make that true.
- Still open: exact `boostSpeed`/`boostDurationSeconds` tuning values —
  not decided in this pass.

**Teleport — mechanics (settled).** Arm/confirm input, fixed cost and
fixed max range.

- **Input:** pressing the `teleport` hotkey enters an aiming state that
  suppresses normal left-click movement; the right mouse button confirms
  the destination and fires. Right-click isn't currently bound to anything
  in `ExplorationController` — this is new input wiring, not a
  repurposing of existing behavior. Rejected alternative: reading the
  cursor's position directly at hotkey-press time with no separate confirm
  step. Simpler to build, but leaves no room for a range preview and risks
  misfiring off a cursor position that was really being used to steer
  movement a moment earlier, not to aim a teleport.
- **Cost/range:** flat energy cost, fixed max range — not distance-scaled.
  This keeps teleport inside `AbilityComponent.tryActivate`'s existing
  all-or-nothing, single-flat-cost-per-type contract with zero changes to
  its signature. A distance-scaled cost was considered and rejected: it
  would require `tryActivate` to accept a computed cost instead of reading
  a fixed number from `abilityConfig`, and it forces a new decision the
  architecture has never needed before — fail the activation outright if
  the player can't afford the full clicked distance, or clamp the actual
  teleport distance to what they can afford (a one-off exception to the
  all-or-nothing rule no other ability has). The ability's actual purpose
  (bypass a Debris Field) doesn't obviously benefit from fine-grained
  distance pricing anyway.
- **Range communication:** a range ring, radius equal to the max teleport
  distance, centered on the ship and shown only while armed — reusing the
  procedural-`Graphics`-drawing pattern already established by
  `ShipStatusArcs` and `DestinationMarker` rather than a new sprite asset.
  If the cursor is beyond the ring when the player confirms, the actual
  destination clamps to the ring's edge along that direction, and the
  reticle is drawn *at the clamped point*, not the raw cursor position —
  the player always sees exactly where they'll land before committing.
- Still open: whether teleport keeps a cooldown on top of its flat energy
  cost — `abilityConfig.teleport` currently has both `energyCost: 30` and
  `cooldownSeconds: 8`; not revisited in this pass, current values stand
  unless changed later.

### 4. De-scope `tractorBeam` deliberately

Rather than investing further design effort, formally invoke the fallback
`CLAUDE.md` already documents for this ability: leave it exactly as built
(gating only `PushPullObjectElement`/Cargo Pod, the one puzzle instance
that already uses it), and treat it as an intentionally minor/support
ability rather than one of the two abilities carrying the "worth hoarding
energy for" weight. No further scope planned against it.

### Ideas raised and explicitly rejected

- **An energy-gated "shield" ability** (temporary structure-damage
  mitigation) was raised as another way to make energy matter, and rejected
  — it would make energy indirectly fail-relevant, contradicting the
  existing hard rule that structure is the sole fail resource and energy
  "never fails the level on its own."

## Technical implications (not yet built)

Noted here for whoever picks this up next, not as instructions to
implement immediately:

- `AbilityComponent` would need a `durationSeconds`-style field, a natural
  sibling to the existing per-ability `energyCost`/`cooldownSeconds` fields
  (same "settable to 0" pattern).
- Marker visibility logic in `HudOverlay` would need to key off
  "`scan` currently active" OR "one-shot flash active," rather than being
  unconditional.
- The one-shot flash needs two trigger points: `GameScene` level start, and
  `LevelObjectiveTracker`'s existing probe-found/beacon-reached events —
  both already fire today, just not wired to this.
- `teleport`'s collider-passing behavior and `rocketBoost`'s burst-along-
  heading behavior are both currently unbuilt in-world effects (per the
  Phase 2a "gate vs. in-world effect" caveat in `CLAUDE.md`) — this
  proposal defines what those effects should be, it doesn't build them.
- `ExplorationController` would need a `boosting` state (captured heading +
  end time) and a temporary raise/restore of `PlayerShip.image`'s
  `setMaxVelocity` cap around the boost window (see `rocketBoost` mechanics
  above — the existing cap silently clamps any boost speed above
  `shipConfig.maxSpeed` otherwise).
- `ExplorationController` would also need a `teleport`-armed state that
  suppresses left-click movement while active, plus a new right-mouse-button
  listener — not currently bound anywhere in the input wiring — to confirm
  and fire.
- A new range-ring visual (Graphics-drawn, same family as `ShipStatusArcs`/
  `DestinationMarker`) shown only while teleport is armed, with the
  confirm reticle clamped to the ring's edge when the cursor is aimed
  beyond max range.

## Ability-unlock info popup (raised 2026-08-14)

Side concern raised alongside the ability rework, not exclusive to any one
ability: when a new ability is granted, show a paused, no-time-pressure
popup describing what it does, dismissed only by an explicit close/exit
button — not a timer, not click-anywhere.

Grounded in what's already built rather than designed from scratch:

- **Insertion point:** `GameScene.handleLevelComplete()` currently calls
  `getProgressionManager().grantNextAbility()` and then immediately
  transitions to either the next level (`scene.start('GameScene', ...)`)
  or `WinScene` if `LEVEL_ORDER` is exhausted. That immediate transition is
  where a popup needs to interpose. It should only appear when
  `grantNextAbility()` returns a non-null `AbilityType` — it returns `null`
  once every ability in `abilityUnlockOrder` has already been granted,
  which will happen on some later level completions once all three are
  unlocked.
- **Pattern to reuse:** `PauseScene` already establishes the "stacked
  overlay via `scene.launch()`, not a scene swap" convention (GDD §11's
  Scene flow) for exactly this kind of paused, no-pressure UI moment — a
  new scene (e.g. `AbilityUnlockScene`) launched the same way is the
  natural fit rather than inventing a new mechanism. Its close/exit button
  would perform the level transition `handleLevelComplete()` currently
  does immediately, so that transition needs to become deferred, not
  removed.
- **Both transition targets need to be captured, not just the common one:**
  next level, or `WinScene` if this was the last one — worth flagging since
  it's easy to build this only against the "next level" case and forget
  that a final-level ability grant can still happen right before
  `WinScene`.
- **Getting the popup its content** is simplest as a direct scene-launch
  data pass (`this.scene.launch('AbilityUnlockScene', { unlockedAbility:
  next, ... })`), the same pattern `GameSceneData` already uses for
  `levelId` — no need to also route it through `ProgressionManager`'s
  existing `PROGRESSION_EVENTS.AbilityUnlocked` event, though that event is
  already emitted and available if some other display (e.g. `HudOverlay`'s
  ability icons) wants to react to the same moment independently.
- **Not designed here:** what the popup actually says per ability. That's
  new content — presumably a short description per `AbilityType` in a small
  config table alongside `abilityConfig` — not authored in this pass.

## Open follow-up

**Resolved (2026-08-14):** the auto-unlock sequence becomes
`scan → teleport → rocketBoost`. `tractorBeam` is pulled out of
`abilityUnlockOrder` entirely rather than reordered within it — per an
explicit "keep it, just reorder" decision: it stays built exactly as
already shipped (Cargo Pod/Wreckage puzzle untouched, no already-closed
Phase 2a work reopened or removed), but is **dereferenced from
player-facing ability UI entirely**, not merely skipped in the unlock
ceremony — it doesn't appear in `HudOverlay`'s ability-icon row, doesn't
get an unlock popup (see below), and isn't something the player equips or
perceives as a fourth named ability. Mechanically this means
`isUnlocked('tractorBeam')` is effectively always true from the start (no
grant trigger, no `ProgressionManager` event needed for it), and any
per-ability display logic (icons, the popup below) needs to iterate only
`abilityUnlockOrder`'s three entries rather than every key in
`abilityConfig`. **Confirmed, not just a maybe:** `HudOverlay.ts` line 10
currently does `const ABILITY_TYPES = Object.keys(abilityConfig) as
AbilityType[]`, which pulls all four keys including `tractorBeam` — this
line needs to change to source from `abilityUnlockOrder` instead, or the
icon row will show `tractorBeam` regardless of this decision.

`scan` unlocking first (now first of three, not first of four) has a
stronger justification than before the rework: it teaches hazard-reading
and orientation before either escape/routing tool. That part of the
original order was never actually in question.
