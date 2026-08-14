# Trailing Edge — Design Document (Working Draft v0.2)

*Personal design reference. Sections marked **OPEN** are undecided — resolve before treating this as final. Sections marked **ASSUMPTION** reflect a default I've picked to keep the doc moving; override freely.*

---

## 1. Concept

Single-player space exploration/survival/puzzle game. Goal per expedition: locate an inactive probe, recover its cargo/data, return home.

**Explicit non-goals:** combat systems, 3X/4X empire-scale strategy, initial control remapping.

### 1.1 Narrative Frame

Earth is experiencing environmental instability (specific cause TBD — doesn't need resolving for this frame to function). In response, Earth sent a set of advanced probes to nearby star systems to assess candidate worlds as a serious contingency — a possible backup home, not a full evacuation mandate. Contact was lost with the probes before their habitability data could be transmitted back. An older, but reliable and proven, ship is brought out of mothballs and put into service to recover the probes and retrieve what they found.

**Summary:** Kept intentionally light-touch — the premise ties into progression (§7), per-level cargo/data rewards, and the discrete level structure (§8) without requiring any new systems, and the instability's specific cause is deliberately left unresolved (full rationale in Appendix, §1).

### 1.2 Title: *Trailing Edge*

Ties to the narrative and design on three fronts, none forced: the player's ship is deliberately trailing-edge technology (older, reliable, proven) recovering data from leading-edge probe technology (§1.1); "trailing" doubles as the literal act of following the probes' path through each system; and "trailing edge" is itself a real aerodynamics/orbital-mechanics term, keeping the title grounded in the setting rather than purely metaphorical.

---

## 2. Design Pillars

Three pillars, deliberately separated by **layer** rather than blended at the same moment (blending them was identified as a direct source of unfairness — see Design Notes below):

| Layer | Pillar | What it governs |
|---|---|---|
| Macro | Survival | Structure as the fail resource; energy as an ability-gating resource; overall expedition risk/buffer |
| Meso | Exploration | Where you go, what you investigate, routing decisions |
| Micro | Puzzle-solving | Discrete challenge sites; deterministic, solvable problems |

**Design Notes (why this matters):** Survival design wants scarcity and consequence; puzzle design wants legibility (a player should be able to trace failure to their own reasoning). Blending them at the same moment — e.g., random resource attrition interrupting an in-progress puzzle — reads as unfair rather than tense. Keeping survival as the layer that sets the *budget* going into a puzzle (rather than a live threat during it) avoids this. See §5 for the one nuance that still needs deciding.

---

## 3. Core Loop (per level)

1. Launch from the level's **Entry Wormhole** (a fixed start position — reuses the same placeholder sprite as the Exit Wormhole below, tinted "active"; closes shortly after the level begins, see §11.14).
2. Explore level region; scan asteroids (structure material) and encounter hazards along the way. Levels typically mix multiple hazard types rather than featuring exactly one — early levels may lean on a single hazard as a soft tutorial (§9).
3. Locate and recover the probe.
4. Find and reach the **Relay Beacon** — a mandatory per-level waypoint, required after the probe and before return is possible. Simple navigate-to; not a puzzle (distinct from the Signal Array puzzle element, §6/§9 — this naming was reassigned to avoid a collision, see Appendix).
5. Return via the level's **Exit Wormhole** — a distinct location from the Entry Wormhole (2026-07-31 revision; was a single "Home Marker" serving both roles). Starts tinted "inactive"/closed and opens once the Relay Beacon is reached (§11.14).
6. Spend recovered data/cargo on new ability unlocks (survival endurance upgrades deferred for the initial build, §7).
7. Proceed to next level.

Puzzle-site elements (§6) are optional, additive content encountered along the way (e.g. blocking or bordering the path to the probe) — not a required step in this sequence.

This is structurally similar to an ARPG hub-and-return loop (town → dungeon → town).

**Summary:** Energy/structure reset when a level is first entered. A mid-level hard fail (structure reaches zero) fully restarts the level from this same reset state — **no checkpoint system for the initial build** (deferred; see §5 and Appendix). Stakes are level-scoped, not campaign-scoped (see Appendix, §3 for full rationale).

---

## 4. Controls

- Click-to-move, explicitly non-Newtonian (accessibility over flight-sim realism).
- Abilities on number-key hotkeys. **Exception (decided 2026-08-14, not yet implemented — §7):** `teleport`'s hotkey arms an aiming state rather than firing immediately; the right mouse button confirms the destination and fires. This is the only ability whose activation isn't a single keypress, since it's the only one needing a spatial target.
- No control remapping in initial build (deferred — don't forget it needs revisiting before wider release/testing with other players).
- Overall control feel: comparable to Diablo.

---

## 5. Survival Systems: Structure & Energy

**Player-facing summary:** Your ship runs on two resources with different jobs. Structure is your hit points — hazards are always visible before they hit you, so damage is on you, not a surprise, but run it to zero and the level fails outright: a hard restart from the level's beginning. Energy is more like mana — it gates which abilities you can use, replenishing on its own over time; running low limits what you can do, but it never ends the level by itself.

- **Structure (the fail resource):** repaired using material gathered by scanning asteroids (`ResupplyPoint`/AsteroidField, §11.6). Drained by structural hazards (Meteoroid, collisions). Hitting zero triggers a full level restart — position, structure, and energy all reset to the level's starting values. **No checkpoint/partial-resume system for the initial build** — deferred, expected to return once maps and secondary progression grow (see Appendix). *Debris Field is no longer in this drain list as of 2026-08-07 — it's a movement-blocking obstacle now, not a resource drain; see §9/§11.3.*
- **Energy (the ability-gating resource):** regenerates passively at a fixed rate — no dedicated resupply object. Drained directly by some hazards (Solar Flare, Ion Storm, Nebula Field) and by abilities with a nonzero energy cost (per-ability dual gate model; see §7). Reserved, not yet designed: map objects/hazards that modify the regen rate itself (slow or speed up recharge) rather than just draining the pool directly.
- **Layering rule:** hazards are discrete, telegraphed, and tied to specific level content — not ambient ticking depletion. This keeps survival legible: a hazard is something to learn and route around, similar in character to a puzzle element, rather than a random tax on the player.
- **Stakes asymmetry:** because only structure can end the level, structure-draining hazards are the higher-stakes family and energy-draining hazards are lower-stakes/ability-limiting pressure. Worth telegraphing that difference visually, not just each hazard's identity (see §9).

**Clarifying details:** Hazard contact during puzzle-solving (when puzzle-site elements exist in a level, §6) draws on the same structure buffer as hazards encountered while flying — there's no separate "puzzle health." (Full rationale in Appendix, §5.)

---

## 6. Puzzle Interaction Taxonomy

| Interaction | Type | Example Phenomena | Notes |
|---|---|---|---|
| Object interact / scan | Deduction | Scan Target / Marker | Core information-gathering primitive |
| Move to a spot | Deduction | *(no phenomenon named yet — only the sequenced and moving-target variants below were given names; this is the same primitive without either)* | Basic traversal/placement |
| Move to spots in a particular order | Deduction | Signal Array | Sequencing puzzle (renamed from "Relay Beacon" — that name now belongs to the mandatory core-loop waypoint, §3/§9) |
| Stay in a moving spot for a duration | **Execution/timing** | Comet (tracking) | Reintroduces twitch-skill demand — flag intentionally if kept |
| Avoid particular spots/areas | Deduction *or* execution, depending on whether hazards are static (deduction: find the safe path) or dynamic/timed (execution: react in real time) | Debris Field, Nebula Field (static/deduction); Solar Flare, Ion Storm, Meteoroid (dynamic/execution) | Worth tagging each instance explicitly during level design |
| Move objects near/far or in particular order (push/pull) | Deduction | Cargo Pod / Wreckage | Maps directly to tractor/repulsor abilities |
| Trail/draw a path, or encircle objects | Deduction (or execution if time-limited) | Beacon Cluster | |

**Summary:** Execution/timing puzzles are intentional minority seasoning (e.g., staying near a moving comet to scan it, avoiding a moving asteroid mid-puzzle), not the taxonomy's core (full rationale in Appendix, §6).

**Scope note:** This taxonomy is additive, not all-or-nothing — each row is an independent element type once the `PuzzleElementBase` pattern (§11.3) exists, so the initial build can ship with a subset (e.g. just the deduction-type rows) and add the remainder as time permits, rather than needing all seven implemented before anything is playable. For the initial 5-week build, Phase 1 ships with **none** of these — the mandatory per-level loop (§3) no longer requires solving a puzzle to reach the probe — with all rows becoming Phase 2a core-track work instead. See §12 for how this affects the Content Agents' scope.

---

## 7. Abilities & Progression

Two progression tracks, intentionally serving different layers:

**Ability unlocks (micro layer — new puzzle grammar, but see the
2026-08-14 reframe below):**
- Scan → object-interact puzzles
- Tractor/repulsor beam → push/pull puzzles
- Teleport → reach/bypass puzzles
- Rocket boost → timing/reach puzzles

**Reframe (decided 2026-08-14, not yet implemented — see
`docs/ability-rework-brainstorm-2026-08-14.md` for the full brainstorm this
distills):** the list above still holds for each ability's puzzle-grammar
role, but three of the four abilities now also carry a job outside the
micro/puzzle layer — this section's original "micro layer only" framing no
longer fully describes them. Motivating problem: with `scan` doing nothing
in-world, `tractorBeam` deliberately de-emphasized (per the tractor/repulsor
exit ramp already on record in §11's Arcade-physics tradeoff), and
`teleport`/`rocketBoost` reading as near-duplicate mobility assists, energy
had no legible reason to matter — and hazards that drain energy lose their
stakes along with it. Resolution below keeps the fix to as few abilities as
possible rather than inventing new mechanics from scratch, per this
project's class-timeline scoping discipline (§10).

- **`scan`** — reworked into a duration-window pulse (a new authored
  `durationSeconds` field, §11.7) serving three jobs at once: (1) its
  original object-interact puzzle-grammar role, unchanged; (2) hazard
  threat-identification — revealing/labeling a nearby hazard's type and
  which resource it threatens, aimed directly at §9's still-open Ion
  Storm/Nebula Field differentiation and structure-vs-energy legibility
  items (see §9's note — **this is an additional player-initiated aid,
  not a resolution of either open item**, which stay open for passive,
  no-ability legibility); (3) driving the off-screen objective marker
  (§11.10) — visible while `scan`'s window is active, plus two
  energy-independent one-shot reveals (level start, and each
  `LevelObjectiveTracker` target change) so a player is never left
  without a bearing regardless of energy state. Stays first in the
  unlock order — arguably a stronger first ability now than before the
  rework, since it teaches hazard-reading and orientation before either
  escape/routing tool.
- **`teleport`** — reworked into the **Meso/Exploration** pillar's
  ability: a short blink that passes through solid colliders, the one way
  to bypass a `blocksMovement: true` hazard (Debris Field, §9) without
  rerouting — a direct match for Debris Field's own 2026-08-07 re-scope
  into "the first hazard tied to routing rather than only survival."
  Fixed max range, flat energy cost — **not** distance-scaled, a
  deliberate choice to keep it inside the existing all-or-nothing
  per-ability cost gate (§11.4) rather than adding a one-off exception
  to that model for marginal strategic depth. Input: hotkey arms an
  aiming state (normal click-to-move suppressed while armed), a range
  ring shows the max-distance limit, right mouse button confirms — if
  aimed beyond the ring, the destination clamps to the ring's edge and
  the confirm reticle is drawn at the clamped point, never the raw
  cursor, so the player always sees exactly where they'll land before
  committing (§11.4a).
- **`rocketBoost`** — reworked into the **Macro/Survival** pillar's
  ability: a rapid straight-line burst along the ship's current facing,
  overriding click-to-move steering for the burst's duration and then
  resuming toward whatever destination is current when it ends. A
  reactive/panic-button tool — outrun a timed energy-hazard pulse, or
  close distance to a resupply point before structure runs out — not a
  routing tool. Unlike `teleport`, it does **not** pass through solid
  colliders: boosting into a `blocksMovement: true` hazard just gets
  stopped by the existing collider, energy already spent, no refund.
  That asymmetry is deliberate, not an oversight — it's what makes the
  Meso/Macro split between these two abilities mechanically true, not
  just thematic (§11.4a).
- **`tractorBeam`** — mechanically unchanged (push/pull, gates Cargo
  Pod/Wreckage, §11.3) and **not** removed, but dereferenced from
  player-facing ability UI entirely: pulled out of the auto-unlock
  sequence below, not shown in the ability-icon HUD (§11.10), no unlock
  popup. Effectively always-available from the start with no ceremony,
  consistent with its already-decided status as the intentionally-minor
  support ability (per the tractor/repulsor cut/de-emphasize fallback
  already on record in §11).

**Fixed auto-unlock order (superseding the prior four-entry sequence):**
`scan → teleport → rocketBoost` — three entries, not four. Each grant is
accompanied by a paused, no-time-pressure info popup describing the new
ability, dismissed only by an explicit close/exit button (§11.8's new
`AbilityUnlockScene`) — not shown for `tractorBeam`, which was never
added to this sequence in the first place.

**Ability-unlock info popup (decided 2026-08-14, not yet implemented):**
see §11.8 for the Scene-flow mechanics. Content (what each popup actually
says) is not authored as part of this GDD pass.

**Summary — ability cost model:** Each ability has up to three
independently-authored gates — an energy cost, a cooldown, and (added
2026-08-14 for `scan`) a duration — any of which may be settable to 0/omitted
where irrelevant (pure-cooldown and pure-energy abilities remain the
special cases where one of the original two is 0). Which gates apply to
which ability is decided per-ability during implementation;
information/deduction abilities (e.g. scan) are good candidates for 0
energy cost + cooldown + duration, capability-spending abilities (e.g.
rocket boost) for energy cost + 0 cooldown, and `teleport` for a flat
energy cost + cooldown with a fixed (not cost-scaled) range (full
rationale in Appendix, §7).

**Endurance upgrades (macro layer — survival buffer) — DEFERRED for the initial build:**
- Energy efficiency / recharge speed
- Structure-loss reduction / repair speed & efficiency
- Top speed / turn radius

Cut from initial scope: statistical modifiers are harder to quantify and playtest than ability unlocks, and lower return-on-investment for a first build — ability unlocks are easier to design, easier for a player to feel the impact of, and already required for puzzle-content gating regardless. Ability unlocks alone are sufficient progression for the initial project. This track can be reintroduced later without disrupting ability-gating, since the two were already designed as independent layers (§2).

Because abilities gate puzzle content and endurance upgrades (when they exist) only affect the macro buffer, stat growth shouldn't trivialize puzzle difficulty — **provided** puzzle-entry resource costs are fixed by level design rather than derived from current player stats. For the initial build this concern doesn't arise at all, since there's no endurance-stat growth in scope; it becomes relevant only if/when this track is reintroduced.

**Summary — puzzle-site costs:** Fixed by level design, not derived from current player stats — endurance upgrades widen the macro-layer margin without softening any individual puzzle's designed difficulty (full rationale in Appendix, §7).

---

## 8. Level Structure

Discrete levels (level-select style), chosen for implementation/iteration simplicity over a single continuous world. Trade-off worth naming: this makes "exploration" mean *exploring within a bounded level* rather than *exploring an open world*.

---

## 9. Open Questions Log (consolidated)

**Still open:**

1. Ion Storm vs. Nebula Field art differentiation — the phenomenon-to-taxonomy mapping (formerly this item; resolved via reference table, see Appendix) settled Ion Storm and Nebula Field as the same visual family (drifting cloud) with motion as the *only* behavioral difference: Ion Storm is a slow-moving hazard area, Nebula Field is static. Current assumption is that color plus simple animation is sufficient to tell them apart at a glance. Worth treating as genuinely open rather than settled: color alone is a weak signal for colorblind players, and "slow-moving" is the kind of difference that's easy to under-read in a still image or a quick glance mid-flight — the actual test is whether a player can tell, in motion, at normal play speed, that one is drifting before they're already in its path, since misreading Ion Storm as static would violate §5's telegraphing rule the same way the original name-collision would have. Recommend validating with an actual placeholder asset during the week 1–2 vertical slice (§12, archived Unreal plan's sequencing logic still applies) rather than deciding this on paper — if color + animation doesn't read clearly, the fallback options (distinct particle trail, a border/outline treatment, or accepting a name change back to two visually distinct phenomena) are worth having in reserve rather than discovering the need for them after several levels already use both. **Production approach decided 2026-08-08, differentiation itself still open:** `docs/reference/art-production-guidelines.md`'s new "Nebula Field / Ion Storm cloud art" section scopes one shared asset-production pass for both hazards — 2-3 distinct soft-cloud silhouette textures (not a Debris-Field-style discrete-fragment cluster, since a nebula is diffuse gas rather than countable objects), each stretched via `setDisplaySize()` rather than composed from smaller pieces. The fallback options above (particle trail, border/outline) would most likely layer onto this shared texture set per-hazard rather than require separate base art, but that's still to validate with a real placeholder, not decided here — this paragraph is about how the art gets *produced*, not a resolution of whether motion alone reads clearly. **Related mitigation, not a resolution (decided 2026-08-14):** the reworked `scan` ability (§7) will let a player actively reveal a hazard's type on demand. That's a player-initiated aid layered on top of this question, not an answer to it — this item stays open for passive, no-ability legibility (a player with `scan` on cooldown, or who hasn't unlocked it yet on an early level, still needs to tell these apart at a glance).

2. Structure-vs-energy stakes legibility — since only structure can end a level (energy is a non-fail, ability-gating resource, §5), structure-draining hazards carry real fail stakes while energy-draining hazards (Solar Flare, Ion Storm, Nebula Field) don't. **Narrower as of 2026-08-07:** Meteoroid is now the *only* structure-draining open-world hazard — Debris Field moved to a movement-blocking obstacle with no resource drain at all (see Resolved item 2 below), so this is no longer a two-hazard vs. three-hazard split but a one-vs-three split, making the visual-legibility question sharper, not milder. Whether the current visual language communicates that difference (not just each hazard's individual identity) is untested — worth checking during the week 1–2 vertical slice and again once more hazard types exist in Phase 2b. **Related mitigation, not a resolution (decided 2026-08-14):** same caveat as item 1 above — the reworked `scan` ability (§7) can tell a player which resource a hazard threatens on demand, but that doesn't substitute for the passive visual language this item asks about; keep this open for the no-ability case.

**Resolved:**

1. Off-screen objective visibility (2026-07-31) — resolved as a single edge-pinned directional arrow (Sinistar-style), not a minimap. Since `LevelObjectiveTracker` already sequences the loop strictly linearly (Probe → Relay Beacon → Exit Wormhole, §11.11–11.14), there's only ever one "current" objective to point at — no need to juggle multiple simultaneous markers, which was the main complexity a minimap would have had to solve. Implemented in `HudOverlay` (§11.10): `LevelObjectiveTracker.getCurrentObjectiveTarget()` exposes the current target's world position (keeping the "which stage are we at" decision with the class that already owns that state), and `HudOverlay` clamps it to the viewport edge when off-screen, display-only per its existing contract. Revisit if a future level introduces multiple simultaneous objectives/hazards that need tracking at once — a minimap may become warranted then, per the original open item's reasoning. **Amended 2026-08-14, not yet implemented:** the marker is no longer unconditionally visible — it's tied to the reworked `scan` ability instead (§7, §11.10). The always-on behavior above is superseded, not the underlying "one current objective, edge-pinned arrow, no minimap" design — see §11.10 for the current contract.

2. Debris Field re-scoped to a movement-blocking obstacle, not a resource drain (2026-08-07) — two separate problems prompted this. Mechanically: Debris Field (static/structure) and Nebula Field (static/energy) read as too similar in *feel* despite draining different resources — both are "sit in a zone, take passive drain, avoidance is the only counterplay" — echoing the same too-similar-static-hazards concern already flagged for Ion Storm/Nebula Field above. Narratively: Debris Field's original fiction (ship wreckage) doesn't fit a setting that never establishes prior space-faring civilizations litter-able with wrecks. Resolved: Debris Field **keeps its name** (an "Asteroid Field" rename was considered and rejected — it would collide with the already-established `AsteroidField` resupply object, §11.6, two objects with the same name doing opposite things) but its fiction changes to naturally-occurring rock/ice debris, and its mechanic changes to a solid, movement-blocking collision — no resource drain at all — rather than an overlap-and-drain zone. This makes it the first hazard to affect the Meso/Exploration pillar (routing) rather than only the Macro/Survival pillar (§2). Visual differentiation from AsteroidField (many small loose fragments vs. one large ore-rich rock) is locked in — see `docs/reference/art-production-guidelines.md`. **Implemented in code (2026-08-07).** `HazardZoneElement` (§11.3) now takes a `blocksMovement` param: an immovable Arcade body plus `physics.add.collider()` in place of the overlap-and-drain listener, with no resource-cost call at all. Phase 1's vertical slice (§12 step 2) now configures Debris Field with `blocksMovement: true` and zero resource cost, matching this resolution.

---

## 10. Explicit Non-Goals (restated for scope discipline)

- No combat system.
- No 4X/empire-management layer.
- No control remapping in initial build.

---

## 11. Technical Interface Contract (Phaser.io, TypeScript, agentic build)

**Three decisions confirmed (no longer flagged as ASSUMPTION — override still possible, but these are settled defaults now, not placeholders):**
- **TypeScript, not plain JS.** Load-bearing, not stylistic — every "hard rule" below (e.g. "only this class writes to `currentEnergy`") is compiler-enforced via `private` fields in TS, which was the deciding factor over plain JS's lower tooling overhead.
- **Arcade physics, not Matter.js.** Chosen over Matter's rigid-body model for its lower conceptual overhead; the tradeoff accepted explicitly is that Cargo Pod push/pull (§11.3) is implemented as direct position/velocity tweening toward the player rather than genuine force application, and Meteoroid (§9 appendix) is a velocity-and-overlap moving hazard rather than a true physics collision. If tractor/repulsor abilities feel wrong once prototyped, the agreed fallback is to de-emphasize or cut that ability in favor of one that fits Arcade cleanly, not to revisit the physics-engine choice.
- **Hand-authored TS/JSON config for levels, not Tiled.** Chosen specifically to keep 100% of the project agent-touchable — no GUI-authoring step sitting outside the agentic workflow. Accepted tradeoff: placements are by coordinate/parameter rather than visual drag-and-drop, and a lightweight visualizer may be worth building later purely to sanity-check level layouts, not as a required part of the pipeline.

**Engineering principle:** Phaser has no binary/GUI-authored logic layer — everything is already text, already mergeable. The actual multi-agent risk isn't asset mergeability (that problem doesn't exist here); it's that JS/TS projects collapse toward a small number of shared "wiring" files (a main Scene's `create()`, a central index) where every system gets instantiated. That file is the real merge-conflict hazard. Mitigation: a `SystemRegistry.register(system)` call, invoked from each system's own file at module load — agents append to a list of imports, never hand-edit `create()`. Section 12's plan assumes this pattern is in place; if you skip it, expect the "content is safe to parallelize" claim in §12 to stop being true.

**Asset/gameplay-size decoupling:** gameplay-relevant dimensions (a hazard's collision shape, the ship's hitbox, a puzzle element's interaction radius) are always authored data, never derived from a sprite's native pixel size. Sprites are scaled to fit the authored size via Phaser's `setDisplaySize()`/`setScale()` — never the reverse. This decouples a future art pass (including resolution changes) from gameplay/collision tuning; swapping a texture should never require re-tuning a hazard's feel.

**Tunable parameters:** gameplay-numeric constants (ship speed/acceleration/deceleration, energy regen rate, structure repair rate, per-hazard costs, per-ability costs) live in per-subsystem, plain-data TS config modules (e.g. `shipConfig.ts`, `survivalConfig.ts`) — never inline in a class's logic. This generalizes §11.7's "authored data" pattern to all tunable values, not just per-level/per-hazard content. In dev builds, these config objects are also exposed on `window` (e.g. `window.tuning = shipConfig`) for live tweaking from the browser console without a file edit or reload — cheap to add, and worth building on day one of Phase 1 given how much of Phase 1 is feel-tuning (ship movement, energy regen rate).

### 11.1 `ShipSurvivalComponent` (composed onto the player Ship object)
*Tracks your ship's structure and energy. Structure is the fail resource; energy just gates ability use.*
- **State (private):** `currentEnergy`, `maxEnergy`, `currentStructure`, `maxStructure` (`max*` modified by `ProgressionManager` endurance upgrades if/when that track exists — deferred, §7).
- **Functions:** `consumeEnergy(amount, source): boolean` — gates ability activation only, never fails the level; `consumeStructure(amount, source): boolean`; `regenEnergy(delta): void` — called every update tick at the authored passive rate (`survivalConfig`, §11's tunable-parameters convention), no resupply object involved; `repairStructure(amount): void` (resupply-point objects only).
- **Events:** Phaser's built-in `EventEmitter` — `onStructureDepleted` (triggers a full level restart — see §11.11 `LevelObjectiveTracker`), `onResourceChanged` (display binding only — `ShipStatusArcs`, §11.10a, as of 2026-08-10; previously `HudOverlay`). No `onEnergyDepleted`-triggers-failure event — energy running low has no failure-side effect for the initial build (§5 notes this as a reserved space for future non-fail effects).
- **Hard rule (TS-enforced):** `currentEnergy`/`currentStructure` are `private`. No puzzle element, hazard, or ability may reference them directly. **Regression to watch for specifically:** since energy and structure used to be symmetric fail resources, don't let any code path treat energy depletion as a failure condition — that behavior was deliberately removed (§5).

### 11.2 `CheckpointManager` — **DEFERRED, not built for the initial 5-week scope**
*Would remember where you last made real progress, so a failure sends you back there instead of to the very start of the level — not needed while maps are small and secondary progression (§7's endurance track) doesn't exist yet.*

For the initial build, a hard fail (`ShipSurvivalComponent.onStructureDepleted`) triggers a full level restart instead — see §11.11 `LevelObjectiveTracker`. This section is retained as a design reference for when checkpoints are reintroduced (expected once maps and secondary progression grow, per §5's Appendix rationale), not as current scope:
- **State (reserved):** `lastCheckpointLocation`, `lastCheckpointResourceSnapshot`, `puzzleSitesSolvedSinceLevelStart`.
- **Functions (reserved):** `registerCheckpoint(source, data): void`, `restartFromCheckpoint(): void` — repositions player, restores resources to a checkpoint snapshot and solved-puzzle state; would not restore in-progress-unsolved puzzle state.

### 11.3 `PuzzleElementBase` (abstract) and hazard/puzzle element mapping

*This is every puzzle piece and hazard the player actually encounters — scan targets, sequences, moving-object hazards, push/pull objects — plus the rule that most hazards are variations on the same underlying thing.*

**Puzzle-site elements** (derived from `PuzzleElementBase`; optional/additive per §6 — not required to complete a level, §3; cost-neutral by default per §5's "hazard contact" clause; mapped to §9's reference table). **None of these ship in Phase 1** — all five are Phase 2a core-track work (§12):
- `SequenceSpotElement` — Signal Array (renamed from "Relay Beacon" — that name now belongs to the mandatory core-loop waypoint, §11.13)
- `ScanInteractElement` — Scan Target / Marker (the base interact case; may not need a distinct subclass beyond `PuzzleElementBase` itself)
- `MovingSpotDurationElement` — Comet (tracking)
- `PushPullObjectElement` — Cargo Pod / Wreckage; queries `AbilityComponent.isUnlocked(TractorBeam)` before allowing interaction (§7's ability-gating link)
- `TrailDrawElement` — Beacon Cluster

**Open-world hazards — one parameterized class, not five:** all four "zone" hazards from §9's table (Debris Field, Solar Flare, Ion Storm, Nebula Field) differ only in authored parameters, not in code. Recommend a single `HazardZoneElement` taking: `shape`, `movementPattern: 'static' | 'linear' | 'patrol'`, `speed`, `activation: 'continuous' | 'pulsed'`, `pulseIntervalSeconds`, `resourceCost: { energy, structure }`, and (added 2026-08-07) `blocksMovement: boolean`. Meteoroid also fits this class (`movementPattern: 'linear'`, structure cost) rather than needing a separate moving-hazard-object type, since Arcade's overlap callbacks handle "zone overlap" and "moving hazard contact" identically at the interface level — a moving `HazardZoneElement` and a stationary one differ only in whether `speed` is nonzero. **This collapses what could have been five hazard classes into one class + five content configs — confirmed as the approach going into Phase 1, since it changes what counts as "core" vs. "content" in §12 below.** Adding `blocksMovement` doesn't reopen that decision — it's still one class, just one more parameter axis, not a sixth class. Reserved, not yet designed: an optional rate-modifier field so a zone can slow/speed energy regen instead of (or in addition to) draining it directly (§5).
- **Hard rule:** `onHazardContact()` calls `ShipSurvivalComponent.consumeEnergy/consumeStructure` — never modifies resource values itself; enforce via the same private-field discipline as 11.1. **Exception (2026-08-07):** hazards with `blocksMovement: true` (Debris Field, re-scoped — §9) don't call `onHazardContact()` at all. A solid Arcade collider has no "contact cost" to report — it just physically prevents entering the zone. The hard rule still binds every hazard that drains a resource; a blocking hazard simply isn't one of those.
- `PuzzleSite` groups elements under one completion condition; `onSiteSolved()` marks solved state for HUD/telegraphing purposes (no checkpoint side effect — `CheckpointManager` is deferred, §11.2).

### 11.4 `AbilityComponent` (composed onto the player Ship object)
*Tracks which special abilities you've unlocked, and whether you're currently allowed to use them.*
- **State:** `unlockedAbilities: Set<AbilityType>`.
- **Functions:** `isUnlocked(type): boolean`, `tryActivate(type): boolean` — checks cooldown (if authored `cooldownSeconds` > 0), duration (if authored `durationSeconds` > 0, added 2026-08-14 for `scan` — not yet implemented), and energy cost (if authored `energyCost` > 0) via `ShipSurvivalComponent.consumeEnergy`; any gate no-ops when its field is 0, per §7's dual/triple-gate model. Cost stays a single flat, authored number per ability type (§11.7) — deliberately not computed per-activation (e.g. not scaled to a clicked `teleport` distance), so this stays all-or-nothing with no partial-spend exception.
- Cooldowns via Phaser's `Time.addEvent` or a timestamp comparison against `scene.time.now` — don't build a second timer system.
- **`tractorBeam` exception (decided 2026-08-14, not yet implemented):** `isUnlocked('tractorBeam')` returns `true` unconditionally rather than consulting `ProgressionManager` — it's deliberately excluded from the unlock sequence below (§7), not merely reordered within it. Any per-ability display logic (ability icons, §11.10; the unlock popup, §11.8) must iterate `abilityUnlockOrder` (three entries) rather than every key of the ability-cost config, or `tractorBeam` will surface in player-facing UI it's meant to be dereferenced from.

### 11.4a `ExplorationController` — ability-driven movement effects (added 2026-08-14, not yet implemented)
*What `teleport` and `rocketBoost` actually do to the ship, once `AbilityComponent.tryActivate()` succeeds — as opposed to the gate/cost model §11.4 owns.* Both are effects on `ExplorationController` (§4, §12 Phase 1 step 1), the click-to-move system, not new classes of their own.

- **`rocketBoost`:** on activation, captures the ship's current heading from `ship.rotation` (already kept continuously in sync with velocity direction while moving, and simply retained while stopped — no new heading-tracking needed) and drives velocity directly along it for `durationSeconds`, overriding the normal click-to-move target-seeking calculation. Clicks/drags during the boost window keep updating the click-to-move target in the background exactly as they do outside a boost — nothing needs to suppress input — so movement resumes toward the current target the instant the boost ends, with no dead input period. **Implementation note:** the ship's Arcade body has a `setMaxVelocity()` cap set once at construction (§11's asset/gameplay-size-decoupling sibling concern — a tunable, not this section's subject, but worth flagging here since it's easy to miss): a boost speed above the ship's normal max speed will be silently clamped back down unless that cap is explicitly raised for the boost window and restored after. Boosting into a `blocksMovement: true` hazard is simply stopped by the hazard's existing solid collider, same as ordinary movement — energy already spent, no refund; this is deliberate (§7), not a bug to fix later.
- **`teleport`:** on hotkey press, enters an aiming state that suppresses normal click-to-move input; a range ring (radius = the ability's fixed max distance, §7) renders centered on the ship, procedurally drawn the same way as `ShipStatusArcs`/the objective-marker texture (§11.10a, §11.10) rather than a new sprite asset. The right mouse button confirms: if the cursor is within the ring, the ship blinks directly there; if beyond it, the destination clamps to the ring's edge along that direction and the confirm reticle is drawn at the clamped point, not the raw cursor position, so the player always sees exactly where they'll land before committing. Passes through solid colliders — the one ability that can cross a `blocksMovement: true` hazard (§7, §9's Debris Field entry).

### 11.5 `ProgressionManager`
*Keeps track of which abilities you've earned across the whole game.*
- Owns `unlockedAbilities`. Endurance multipliers deferred for the initial build (§7) — interface reserves the hooks without implementing them.
- **Hard rule:** never modifies fixed per-hazard costs, fixed per-puzzle costs, or the level-authored checkpoint floor (§5, §7).
- **`abilityUnlockOrder` is now three entries, not four** (decided 2026-08-14, not yet implemented): `scan → teleport → rocketBoost`. `tractorBeam` is never granted through this sequence — see §11.4's exception above.

### 11.6 `ResupplyPoint` (AsteroidField)
*The asteroids you visit to repair structure.* No longer covers energy — energy regenerates passively (§5, §11.1); the Star variant is retired as a resupply object (see `EntryWormhole`/`ExitWormhole`, §11.14).
- An Arcade-physics-enabled `Phaser.GameObjects.Container`. `onPlayerArrival()` wired via Arcade overlap callback (not a manual per-frame distance check) → `repairStructure`.

### 11.7 Authored data
*The numbers and settings a level designer sets by hand — hazard costs, ability costs, per-level object placement, and what order the levels play in.*
- Per-hazard `CostData { energyCost, structureCost }` plus the `HazardZoneElement` parameters above — authored as typed TS/JSON level-config objects (one file per level, preserving low agent-collision), not via an external editor.
- Per-level checkpoint-floor values (`levelFloorEnergy`/`levelFloorStructure`) are **removed for the initial build** — tied to the now-deferred checkpoint system (§11.2); revisit if/when checkpoints return.
- Per-ability `AbilityCostData { energyCost, cooldownSeconds }` — either field may be 0. **Extended 2026-08-14, not yet implemented:** adds an optional `durationSeconds` field, a sibling to the two above and following the same "may be 0/omitted where irrelevant" pattern — authored for `scan` (§7), unused by the other three abilities. `teleport`'s fixed max range (§7, §11.4a) is a separate authored field on the same record, not derived from `energyCost` — the two are deliberately not linked by a cost-to-distance formula (§7).
- Per-level object placement: `probeLocation`, `relayBeaconLocation`, `entryWormholeLocation`, `exitWormholeLocation` (§11.12–11.14) — required in every level config, unlike the optional puzzle-site/hazard placements.
- Level sequence: an ordered array of level-config identifiers (`levelOrder: string[]`), owned by whichever module resolves "next level" on completion (11.8). Linear progression (§8: no level-select) means this ordering is the only place "what comes next" is decided — content agents adding a level append to this array, they don't hardcode a "next level" pointer inside the level they're authoring.
- Tunable gameplay parameters (ship movement, energy regen rate, structure repair rate) — see §11's "Tunable parameters" convention above; these live in per-subsystem config modules, not per-level config, since they're global defaults rather than per-level content.

### 11.8 Scene flow

*The screens the player actually moves through — title, playing a level, pausing, and the win screen at the end — and how they connect.*

Five Scenes as of 2026-08-14 (not yet implemented — four until the new one below lands), no level-select — progression is linear, the next level loads automatically on completion:
- **`BootScene`** — loads assets/asset-pack manifests, then starts `TitleScene`.
- **`TitleScene`** — "Start" and "Continue" buttons. `Continue` is only shown/enabled if `SaveManager.hasSaveData()` (11.9) returns true. `Start` always begins at `levelOrder[0]` with default (full) resources, and **overwrites** any existing save the first time progress is made (not on button press — see 11.9's hard rule) so an old save can't linger and desync from a fresh run.
- **`GameScene`** — parameterized by which level config to load (`levelId`) only; always starts at that level's beginning (Entry Wormhole, full resources) — no mid-level resume for the initial build, since `CheckpointManager` is deferred (§11.2). A hard fail (`onStructureDepleted`) restarts the current `GameScene` the same way. On completing the level's find-probe → find-beacon → return sequence (§11.11 `LevelObjectiveTracker`), grants the next ability in `abilityUnlockOrder` if any remain (§7, §11.5); if one was granted, launches `AbilityUnlockScene` below instead of transitioning immediately. Either way, the eventual transition resolves the next `levelId` from `levelOrder` (11.7) and either restarts `GameScene` with the next level, or — if `levelOrder` is exhausted — transitions to `WinScene`.
- **`AbilityUnlockScene`** (added 2026-08-14, not yet implemented) — launched as a stacked overlay on the just-completed `GameScene`, same `scene.launch()` convention as `PauseScene` below rather than a new mechanism, showing what the just-granted ability does. Paused, no-time-pressure by design — dismissed only by an explicit close/exit button, never a timer or click-anywhere. Its close button performs the level transition `GameScene` deferred above; that transition target (next `levelId`, or `WinScene` if this was the last level) is passed through as scene-launch data, the same pattern `GameScene` already uses for `levelId`, so the correct destination fires regardless of which one applies. Never launched for `tractorBeam` (§7, §11.4) — it isn't part of `abilityUnlockOrder`.
- **`WinScene`** — reached when `levelOrder` is exhausted. No decided content beyond "the game is won" at this point (a message, maybe a return-to-title option) — fine to keep minimal, since nothing else in the contract depends on what it shows, only on the fact that something distinct from looping back into `GameScene` exists for this case.
- **`PauseScene`** — launched as an overlay on top of a paused `GameScene` (Phaser's scene-stacking, not a scene swap, so `GameScene`'s state isn't torn down). One option: return to `TitleScene`. This is a hard cut, not a save point — whatever progress exists is only as current as the last level-completion save (11.9, no mid-level checkpoint exists to fall back on for this scope, §11.2); there's no separate "save on pause" behavior, so pausing and returning to title never loses more than a hard-fail reset already would.

### 11.9 `SaveManager` (persistence for Continue)

*Remembers your progress between play sessions, so "Continue" on the title screen picks up where you left off.*

- **State:** none held in memory beyond what's needed per call — this is a thin wrapper around `localStorage`, not a live game-state cache.
- **Storage shape:** a single `localStorage` key holding `{ levelId: string }`. Simpler than originally designed — with `CheckpointManager` deferred (§11.2), there's no mid-level snapshot to persist; "Continue" always resumes at the start of `levelId`.
- **Functions:** `saveProgress(levelId): void`, `loadProgress(): SaveData | null`, `hasSaveData(): boolean`.
- **Hard rule (TS-enforced via module encapsulation, not a class-private field, since this is a singleton-style module rather than an instance):** `SaveManager` is the only code that touches `localStorage` directly. One call site: `GameScene`'s level-completion handler (11.8) calls `saveProgress(nextLevelId)` when advancing. No other code should reach for `localStorage` — if a future feature seems to need to, that's a sign it should go through `SaveManager`, not around it.

### 11.10 `HudOverlay`

*The on-screen display during play — ability icons and a signal that a puzzle site is active, plus the off-screen objective marker (§9). Energy/structure bars moved out to §11.10a `ShipStatusArcs` on 2026-08-10 — this class no longer owns them.*

- Ability icons reflect `AbilityComponent.isUnlocked()`/cooldown state (11.4) — read-only from the HUD's side; it queries, it doesn't gate. **Source list changed 2026-08-14, not yet implemented:** iterates `abilityUnlockOrder` (three entries, §11.5) rather than every key of the ability-cost config, so `tractorBeam` — dereferenced from player-facing ability UI (§7, §11.4) — never appears here.
- A minimal "puzzle site active" indicator (even just a highlight or icon) so §5's telegraphing has an in-the-moment on-screen signal, not just a design-doc guarantee — relevant once Phase 2a's puzzle-site elements exist; nothing to show in Phase 1.
- Off-screen objective marker: a single edge-pinned directional arrow, sourced from `LevelObjectiveTracker.getCurrentObjectiveTarget()` (§9's "Off-screen objective visibility," resolved 2026-07-31). **Amended 2026-08-14, not yet implemented:** no longer unconditionally visible. Shown only while `scan`'s duration window is active (§7), plus two energy-independent one-shot reveals — level start, and each `LevelObjectiveTracker` target change (probe found, beacon reached) — so a player is never left without a bearing at a moment the game just changed what it's asking of them, regardless of energy state. Rationale for why this doesn't reopen the disorientation problem the always-on version solved: objective locations are static within a phase, and the marker stays live for the full scan duration while the ship moves, so the player gets bearing-rate-of-change for free (motion parallax) — meaningfully more information than a single frozen reading — and can re-scan at will to refresh orientation after maneuvering.
- Not Scene-specific: instantiated once per `GameScene` session, torn down on Scene transition, not persisted across levels (there's nothing in it that needs to persist — `SaveManager` already owns everything that does).

### 11.10a `ShipStatusArcs` (added 2026-08-10)

*World-space, ship-relative energy/structure display — an RTS-unit-health-bar-style readout that follows the ship instead of sitting in a fixed screen corner. A deliberate style choice, validated via an in-browser prototype before being adopted, not a placeholder awaiting real art.*

- Structure renders as a curved arc above the ship; energy renders as a straight bar below it. Both track the ship's position every frame; neither rotates with the ship's heading, so the readout stays screen-upright while the hull turns.
- Bound to `ShipSurvivalComponent.onResourceChanged` — display-only, same event contract 11.1 already establishes for `HudOverlay`; no gameplay logic lives here.
- Procedurally drawn via `Phaser.GameObjects.Graphics` (arc + rect), not sprites — no art asset required, matching the precedent set by `HudOverlay`'s generated objective-marker texture.
- Coexists with `HudOverlay`, not a replacement for it — `HudOverlay` still owns the off-screen objective marker and (once built) ability icons/puzzle-site indicator.

### 11.11 `LevelObjectiveTracker` (per-level, replaces `CheckpointManager`'s role for the initial build)

*Remembers whether you've found the probe and reached the relay beacon yet this attempt — much thinner than the deferred `CheckpointManager`, since a hard fail wipes this state entirely rather than partially preserving it.*
- **State:** `probeFound: boolean`, `beaconReached: boolean` — reset to `false` on level start and on every hard-fail restart (§11.1's `onStructureDepleted`); no partial memory across a fail, by design (§5).
- **Functions:** `onProbeFound(): void` (called by `ProbeObject`, §11.12), `onBeaconReached(): void` (called by `RelayBeaconObject`, §11.13; no-ops if `probeFound` is false), `canReturn(): boolean` — `true` only once both flags are set; queried by `ExitWormhole` (§11.14) before it will trigger level completion. Also exposes `getCurrentObjectiveTarget()` (added 2026-07-31) — the current objective's world position, for `HudOverlay`'s off-screen marker (§9, §11.10).
- **Rationale for a dedicated class instead of `GameScene`-local flags:** keeps this sequencing logic out of `GameScene`'s `create()`/update loop — consistent with §11's `SystemRegistry` engineering principle that shared wiring files shouldn't accumulate one-off state.

### 11.12 `ProbeObject`
*The probe you're recovering this level.*
- Arcade-overlap-triggered pickup. `onPlayerArrival()` → `LevelObjectiveTracker.onProbeFound()`, plus a one-time recovery-data/cargo effect (§7's progression hook; narrative framing per GDD §1.1).

### 11.13 `RelayBeaconObject`
*The mandatory waypoint you reach after the probe, before you're allowed to return. Not a puzzle — plain navigation.*
- Arcade-overlap-triggered waypoint. `onPlayerArrival()` → `LevelObjectiveTracker.onBeaconReached()`. Distinct from the Signal Array puzzle element (§6/§9/§11.3) — same "beacon" flavor, different behavior, hence the naming split (Appendix).

### 11.14 `EntryWormhole` and `ExitWormhole`
*The level's launch position and required return destination — as of 2026-07-31, two distinct locations rather than one shared `HomeMarker` (superseded).* Both reuse the same placeholder sprite (formerly the Star asset used for the old `HomeMarker`), distinguished only by tint — no new art needed for this split.
- **`EntryWormhole`** — the launch position. Visual-only, no Arcade overlap (nothing gameplay-relevant happens if the ship drifts back over it later; it starts tinted "active" and swaps to "inactive" shortly after the level begins).
- **`ExitWormhole`** — the required return destination, at a distinct location from `EntryWormhole`. Starts tinted "inactive"; opens (tints "active") once `LevelObjectiveTracker`'s `BeaconReached` event fires. Arcade-overlap-triggered: `onPlayerArrival()` checks `LevelObjectiveTracker.canReturn()` — if `true`, fires level completion (advances `levelOrder` or transitions to `WinScene`, §11.8); otherwise a no-op (arriving early, before the probe/beacon are done, doesn't do anything).

---

## 12. Development Plan — Phased

**Shape, not a re-derivation:** sequential vertical slice first, then fan out — but the fan-out is a **core-contract-vs-content split**, where all reusable core systems are built and closed out before content production begins.

**Phase 0 — Contract lock.** Section 11 is the contract, including the `SystemRegistry` wiring pattern. Any agent session gets it as context and must flag — not silently resolve — any task that seems to require breaking a hard rule or hand-editing a shared wiring file instead of registering additively.

**Phase 1 — Weeks 1–2, sequential, single agent session at a time, each step gated on your review before the next starts.**
1. `ExplorationController` (click-to-move, non-Newtonian, §4) + one small test scene.
2. `ShipSurvivalComponent` wired to one hazard (`HazardZoneElement` configured as Debris Field — static, movement-blocking, zero resource cost, per the 2026-08-07 re-scope, §9) and one `ResupplyPoint` (AsteroidField). Passive energy regen active from this step on (§5, §11.1).
3. `ProbeObject`, `RelayBeaconObject`, `EntryWormhole`/`ExitWormhole`, and `LevelObjectiveTracker` (§11.11–11.14) wired together end-to-end: find probe → reach beacon → reach the Exit Wormhole triggers level completion. **No puzzle-site element in Phase 1** — Signal Array and the rest of §6's taxonomy are Phase 2a work (see below); the mandatory loop doesn't require solving one.
4. Hard-fail flow: `ShipSurvivalComponent.onStructureDepleted` triggers a full level restart (`scene.restart()` or equivalent — position, structure, and energy back to level-start values). No `CheckpointManager` this scope (§11.2, deferred).
5. A bare-minimum `HudOverlay` (11.10) — no ability icons or puzzle-site indicator yet. You need *some* way to see the resource state to playtest steps 2–4 at all; originally this meant screen-pinned energy/structure bars in `HudOverlay` itself, **superseded 2026-08-10** by `ShipStatusArcs` (11.10a), a ship-relative world-space readout — full HUD polish (ability icons, puzzle-site indicator) is still Phase 2a, not Phase 1.
6. **Result:** the same playable loop §3 describes — explore, risk a hazard, find the probe, reach the relay beacon, reach the Exit Wormhole, fail and hard-reset at least once along the way.

**Gate — end of week 2, non-negotiable given the timeline.** Before touching Phase 2:
- Does the hard-reset fail state feel fair rather than punishing, given there's no mid-level checkpoint? If it feels too punishing even with hazards telegraphed well, that's worth flagging rather than pushing into Phase 2 as-is.
- Does the passive energy-regen rate feel right as a pure ability-gating resource (not a fail resource) — is it tunable enough via the §11 config-module/dev-console convention to iterate quickly on?
- Validate the `SystemRegistry` pattern itself — if two systems are already fighting over the Scene file at this small scale, find that out now.
- Prototype the tractor/repulsor push/pull mechanic in Arcade specifically — this is the one confirmed decision with an agreed exit ramp: if it doesn't feel clean, de-emphasize or cut that ability rather than revisit the physics choice. Better to find this out in the week-2 gate than mid-Phase-2 content work.
- Confirm the `HazardZoneElement` parameterization actually produces four visually distinct-enough hazards using Arcade's overlap model, alongside resolving §9's Ion Storm/Nebula art-differentiation item and the new structure-vs-energy stakes-legibility item (§9), both with actual placeholder assets.

**Phase 2 — Weeks 3–5, core-contract-vs-content split.**

*Phase 2a (early week 3, still sequential-ish, still core work):* close out **all five** of §6's puzzle element types — `SequenceSpotElement` (Signal Array), `ScanInteractElement` (Scan Target), `MovingSpotDurationElement` (Comet), `PushPullObjectElement` (Cargo Pod), `TrailDrawElement` (Beacon Cluster). Phase 1 shipped none of these (§12 above), so this list is larger than originally planned — these are new classes, not content, and belong on the core track regardless. If the `HazardZoneElement` parameterization from §11.3 holds, no new hazard *classes* are needed here — Solar Flare, Ion Storm, Nebula Field, and Meteoroid become content-only work once their shared class exists, which is the main thing this split buys you. Also on this track, because it's system work rather than content: `BootScene`/`TitleScene`/`PauseScene`/`WinScene` (§11.8), the now-simplified `SaveManager` (§11.9, level-completion saves only), and completing the `HudOverlay` (ability icons, puzzle-site indicator). None of this blocks Phase 1's slice from being playable, which is why it's here rather than in Phase 1 — but it does need to close before Phase 2b, since Continue/save behavior and Scene transitions are exactly the kind of shared-file risk the core-vs-content split exists to keep out of the parallel track.

**Ability rework amendment (decided 2026-08-14, not yet implemented — full
rationale in `docs/ability-rework-brainstorm-2026-08-14.md`).** The
`AbilityComponent`/`ExplorationController`/`HudOverlay`/Scene-flow changes
in §7, §11.4, §11.4a, §11.5, §11.8, and §11.10 above reopen a slice of
Phase 2a's core work after it was already marked closed (2026-08-10/11).
This is **not** a full Phase 2a reopening — it's scoped specifically to
the ability-mechanics surface (scan/teleport/rocketBoost effects,
`tractorBeam` dereferencing, the ability-icon source list, the objective
marker's visibility rule, and the new `AbilityUnlockScene`) and doesn't
touch the five `PuzzleElementBase` subtypes, `SaveManager`, or
`BootScene`/`TitleScene`/`PauseScene`/`WinScene` beyond the one new Scene
noted above. Flagging this explicitly rather than letting "Phase 2a is
closed" read as still fully true: until this amendment is implemented,
Core-Contract Agent (§12.1) has open work here, and any session (agent or
otherwise) prioritizing what to build next should treat it as an open
Phase 2a gap, not Phase 2b content.

*Phase 2b (bulk of weeks 3–5, genuinely parallel):* content production against the now-closed contract — levels, hazard placements (config only, per 2a), per-level `probeLocation`/`relayBeaconLocation`/`entryWormholeLocation`/`exitWormholeLocation` placement (§11.7 — required in every level, unlike the rest of this list), and optional puzzle-site instances, one hand-authored TS/JSON config file per level. Content agents don't touch core files; the boundary is enforceable by what directory/context you hand them, not just convention. This is also where §6's "additive, not all-or-nothing" scope note becomes your lever if week 4 gets tight: fewer levels, or drop the execution/timing taxonomy rows first (§6 already frames those as minority seasoning) — cut content, not anything from Phase 1 or 2a, and not the required probe/beacon/wormhole-pair placements.

**Phase 3 — Final integration (last 2–3 days of week 5, carved out of Phase 2b's time, not additional time).** Every gate up to this point checks a component in isolation — one hazard, one puzzle type, one Scene transition. Nothing checks the assembled game, and content agents working in parallel per level don't automatically produce a coherent whole once strung together. This phase is scoped narrowly on purpose — no new content, no new systems — and closes out:
- Play every level in the real `levelOrder` sequence, start to finish, not each level in isolation the way earlier gates did.
- Confirm `Continue` resumes correctly at the right next level — simpler than originally planned, since `SaveManager` only has one save trigger now (level-completion, §11.9) with `CheckpointManager` deferred (§11.2).
- Confirm `WinScene` actually triggers after the true last level in `levelOrder`, not just in a shortened test sequence.
- Confirm the built/packaged game runs from wherever you're actually submitting it (a fresh browser profile or the actual host, not just your dev server) — "works in dev" and "works submitted" are different claims, and this is the only place in the plan that checks the second one.
- Fold in the outputs of the supporting roles below (§12.1) rather than treating their findings as new discoveries this late — if the Compliance Reviewer or Accessibility Reviewer have been running throughout, this phase is confirmation, not first-time triage.

### 12.1 Agent Roles

Every agent role in the plan, named in one place — build roles first (the sequential core track, then parallel content), then the supporting roles that fill gaps a pure build plan doesn't cover.

**Core-Contract Agent (Phase 1 & Phase 2a).** Builds and owns everything in §11 — `ShipSurvivalComponent`, `LevelObjectiveTracker`, `ProbeObject`, `RelayBeaconObject`, `EntryWormhole`/`ExitWormhole`/`ResupplyPoint`, `PuzzleElementBase` and its subtypes (all five now land in Phase 2a, §12 above), `AbilityComponent`, `ExplorationController` (§11.4a), `HazardZoneElement`, Scene flow (including the new `AbilityUnlockScene`, §11.8), `SaveManager`, `HudOverlay`. `CheckpointManager` is explicitly out of scope — deferred, §11.2. **Note (2026-08-14):** the ability rework amendment above (§12) is additional work inside this same existing role, not a reason to add a new agent — every file it touches (`AbilityComponent`, `ExplorationController`, `HudOverlay`, Scene flow) was already this agent's remit before the rework. Also owns setting up the per-subsystem tunable-config-module convention and the dev-mode `window`-exposed tuning hook (§11) from the start of Phase 1, since most of Phase 1 is feel-tuning (ship movement, energy regen). One contiguous track across Phase 1's sequential vertical slice and Phase 2a's remaining core work, not two separate roles — splitting "core" across simultaneous sessions is exactly the risk this plan's sequential-then-fan-out shape was chosen to avoid. Runs weeks 1 through early week 3, sequentially, each step gated on your review before the next starts. Rough cost: see §12.2's Phase 1 and Phase 2a rows.

**Content Agents (Phase 2b).** Produce game content against the closed core contract — level configs, required per-level probe/relay-beacon/entry-wormhole/exit-wormhole placement, hazard placements (config only, against Phase 2a's `HazardZoneElement`), and optional puzzle-site instances. Multiple agents can genuinely run in parallel here, one per level or content batch, since each works in its own config file and never touches core files — the boundary enforced by what directory/context you hand each one, not just convention. Runs the bulk of weeks 3–5. Rough cost: see §12.2's Phase 2b rows; total spend here is a scoping lever (§6's additive scope note) for the optional puzzle-site content specifically, not for the required probe/beacon/wormhole-pair placements, if time gets tight.

**Contract/Config Validation.** Checks Phase 2b's level-config files against §11's schemas — valid `movementPattern` values, required fields present on `HazardZoneElement`/`CostData` configs (as of 2026-08-14, `AbilityCostData` may also carry `durationSeconds`, §11.7 — not itself level-config content, but worth the validator's schema staying current with §11.7 as ability authoring evolves), every level config has a `probeLocation`/`relayBeaconLocation`/`entryWormholeLocation`/`exitWormholeLocation` (§11.7 — these are required, unlike optional puzzle-site content), every `levelOrder` entry resolving to a real level file. Runs continuously as content lands, cheapest to run often. Honest note: most of this is deterministic and could be a plain validation script with no LLM involved — framing it as an "agent role" matters more for demonstrating the workflow than for the checking itself, worth keeping in mind if the course wants agent roles demonstrated specifically. Rough cost: ~10K–30K tokens to build the validator once; near-zero marginal cost per run after that.

**Contract Compliance Reviewer.** Reviews diffs against §11's hard rules before merge — anything reaching for `localStorage` outside `SaveManager` (§11.9), anything writing to `currentEnergy`/`currentStructure` from outside `ShipSurvivalComponent` (§11.1), any content-track edit touching a core file instead of registering through `SystemRegistry`, and — new for this scope — any code path that treats energy depletion as a fail/restart condition (§11.1's flagged regression risk, since energy and structure used to be symmetric fail resources and old habits could reintroduce that). This formalizes the review habit already used throughout this plan; worth a named role specifically because it's the thing most likely to erode under time pressure in week 4–5. Runs on every merge from Phase 1 onward. Rough cost: ~5K–15K tokens per review pass, scaling with how many diffs land per week.

**Accessibility/Telegraphing Reviewer.** Tied directly to §9's still-open items: does Ion Storm actually read as distinct from Nebula Field in motion at normal play speed; is any hazard signaled by color alone; and — new for this scope — does a structure-draining hazard read as visibly higher-stakes than an energy-draining hazard, given only structure can end the level (§5, §9). **Caveat (2026-08-14):** the reworked `scan` ability (§7) gives players an active way to identify a hazard's type/threatened resource on demand — this does not narrow this role's mandate. Both §9 items explicitly stay open for the passive, no-ability case (early levels before `scan` unlocks, or a player who's out of energy/on cooldown), so this review should keep evaluating the visual language on its own, not credit `scan`'s existence as closing either gap. Runs once at the week-2 gate (already specified there) and again during Phase 3 across the full level set, once all hazard placements exist. Rough cost: ~10K–25K tokens total across both passes.

**Asset Integration.** A track of its own, not folded into Phase 2b's content work, because it has different failure modes than puzzle-site/hazard placement — broken file paths, mismatched resolution/palette across sourced packs, license terms worth a quick check per pack, and enforcing §11's asset/gameplay-size decoupling principle (sprites scaled to fit authored gameplay dimensions, never the reverse) so a later art pass — including resolution changes — never requires re-tuning collision/gameplay feel. Runs in parallel with Phase 2a/2b, feeding normalized assets into the loading manifest as content agents need them. Rough cost: ~20K–50K tokens, mostly front-loaded before Phase 2b content production ramps up.

**Deliberately not adding:** a PM/orchestrator role tracking what's next (adds meta-complexity on top of a schedule already tracked in this plan); a true automated-playtesting agent driving the game via browser automation (high setup effort for a timing-sensitive 2D game, weaker signal than playing it yourself at Phase 3); a git-hygiene role (low payoff for a solo project on this timeline).

### 12.2 Rough Token Budget (planning estimate, order-of-magnitude only)

**Epistemic status, stated plainly:** unlike the archived Unreal table, these numbers aren't even calibrated against a comparable body of agentic-coding experience for this exact stack — there's no established "agentic Phaser + TypeScript" track record the way there increasingly is for Unreal C++. These are extrapolated from general patterns in agentic coding work (iteration/debug cycles dominate over initial generation; integration across systems costs more than any single system in isolation) applied to a stack that should iterate faster than Unreal's compile-bound loop. Trust the relative ordering between rows more than the absolute figures. Numbers are total-project tokens (input+output across all sessions for that scope), not per-session.

| Track | Scope | Rough token range | Main source of variance |
|---|---|---|---|
| **Phase 1 — full vertical slice** (`ExplorationController`, `ShipSurvivalComponent`, one `HazardZoneElement` config, `ResupplyPoint`/AsteroidField, `ProbeObject`/`RelayBeaconObject`/`EntryWormhole`/`ExitWormhole`/`LevelObjectiveTracker`, minimal `HudOverlay`, end-to-end integration) | ~180K–450K | Lower than originally estimated — dropping `CheckpointManager` and energy's fail-state wiring removes real integration complexity, partially offset by the new (small) Probe/Beacon/ObjectiveTracker objects; the hard-reset-vs-in-place-reset decision (§12, Phase 1 step 4) is still a concrete place this can blow past the low end if the first approach tried turns out wrong |
| **Phase 2a — puzzle element types** (all five: `SequenceSpotElement`, `ScanInteractElement`, `MovingSpotDurationElement`, `PushPullObjectElement`, `TrailDrawElement`) | ~130K–320K total (~25–70K each) | Larger total than originally estimated since Phase 1 no longer proves out any puzzle element first — all five now land here instead of two; `PushPullObjectElement` carries the most variance since it's the one place the confirmed Arcade-over-Matter tradeoff (tweening vs. force) could need a few extra passes to feel right |
| **Phase 2a — scene flow, save/continue, full HUD** (`BootScene`, `TitleScene`, `PauseScene`, `WinScene`, `SaveManager`, completed `HudOverlay`) | ~100K–250K | `SaveManager`'s two call sites (mid-level checkpoint vs. level-completion save) are simple individually, but wiring them into both `CheckpointManager` and `GameScene`'s completion handler without violating the "single writer to localStorage" hard rule is the one place this could take longer than it looks; Scene-stacking for `PauseScene` (overlay vs. swap) is a smaller, Phaser-specific wrinkle worth budgeting a little slack for if you haven't done it before |
| **Phase 2b — hazard content** (Solar Flare, Ion Storm, Nebula Field, Meteoroid configs against the existing `HazardZoneElement`) | ~15K–50K total (~4–15K each) | Should be genuinely cheap if the parameterization confirmed in §11.3 holds as designed — config, not code; a blown-up number here is itself a signal the collapse didn't hold and one of these needed real new code |
| **Phase 2b — level content** (per additional level: puzzle-site placement, hazard placement, tuning) | ~30K–80K per level | Scales close to linearly per §6's additive scope note; total spend is a scoping choice (how many levels you build), which is exactly the lever to pull if week 4–5 gets tight |

**Total order-of-magnitude range for a modest scope (vertical slice + all core element types + scene flow/save/HUD + 3–4 additional levels):** roughly 500K–1.35M tokens across the project. I'd treat the low end as "things go smoothly and TS/Arcade's simplicity pays off as hoped," and the high end as "at least one integration surprise per phase," which given this is new territory for you is not an unreasonable thing to plan around rather than treat as a worst case. Figures in §12.1 above (validation, review, accessibility, asset integration) are separate from this total — they're lighter-weight review/validation passes, not build work, and sized accordingly.

---

## 13. Appendix: Resolved Design Decisions (Full Rationale)

*Full reasoning behind decisions summarized in the main body. Organized by the section each was originally in. The main body carries a short "Summary" line at each point and a pointer back here.*

### From §1 — Concept / Narrative Frame

Kept intentionally light-touch, consistent with the stated goal of non-pervasive narrative:
- **State the stakes once, not repeatedly.** Deliver this framing plainly at the start (loading screen or brief opening text) and largely leave it alone afterward — the weight comes from the premise existing, not from restating it.
- **Feeds §7's progression for free:** ability unlocks can be framed in-fiction as integrating recovered advanced-probe technology onto the older ship, rather than generic XP — no new system needed, just flavor on an existing one.
- **Feeds per-level cargo/data for free:** the data recovered at each level's end can double as both that system's habitability verdict and a one-line account of what happened to that particular probe — narrative payoff riding on a reward the game already produces mechanically, not a new content type.
- **Justifies §8's discrete level structure directly:** plural probes across plural systems means each level is naturally one system, one probe, with no separate invention required.

Deliberately left unresolved (not required for this frame to work, can be decided later or left ambiguous): the specific cause of the instability, and whether "Earth" and "the ship" get any more specific identity than that.

### From §3 — Core Loop

Energy/structure reset when a level is first entered. Chosen as the cleanest model for player understanding. **Revised:** a mid-level hard fail now fully re-triggers this same level-start reset rather than resuming from a checkpoint — checkpoints are deferred for the initial build (§5, §11.2). Stakes remain level-scoped rather than campaign-scoped — a deliberate departure, not an oversight.

**Loop restructure (probe → beacon → return):** the core loop now requires finding the probe, then reaching a new mandatory "Relay Beacon" waypoint, before return is possible (previously: solve puzzle site(s) → find probe → return, with no intermediate beacon step). This surfaced a naming collision — "Relay Beacon" already named the sequence-puzzle element (§6/§9) — resolved by renaming that puzzle element to **Signal Array**, freeing "Relay Beacon" for the new mandatory waypoint, consistent with §9's existing "one phenomenon name = one behavior" rule (previously used to resolve Comet vs. Meteoroid). The new waypoint is deliberately not a puzzle — a plain navigate-to trigger — since the map's puzzle-solving identity is meant to come from the combinatorial placement/movement of elements in open space, not discrete scripted puzzle sites (a bigger reframing of §6/§11.3 flagged as a future item, out of scope for this pass).

### From §5 — Survival Systems: Structure & Energy

**Current model for the initial build (structure/energy asymmetry, hard reset, passive energy regen):**

**Why energy stopped being a fail resource:** with `CheckpointManager` deferred (see below) and no secondary/endurance progression in this scope (§7), having two independent resources both able to end a level added failure-mode complexity without a proportional design payoff. Splitting them — structure as the sole fail resource, energy as a pure ability-gating resource — keeps the survival pillar legible with less to build. This is explicitly revisitable once maps grow and secondary progression (§7's endurance track) returns, at which point a symmetric or partially-symmetric model may earn its complexity back.

**Why no dedicated energy-resupply object:** passive regen at a fixed rate removes an entire object type (and its placement/pacing design burden) for no loss of design intent, since energy no longer needs "banking before a risky stretch" the way a fail resource would. Room is deliberately left (not built) for hazards/map objects to modify the regen rate itself, since that's a cheap way to reintroduce some of the pacing texture a resupply object would have provided, if playtesting shows it's wanted.

**Why hard reset instead of checkpoints:** checkpoints (detailed below) solve a real problem — losing a lot of progress to one late mistake — but that problem scales with map size and mid-level content density, neither of which is large in this 5-week, largely-exploration-driven scope (§1). A hard reset is simpler to build and to reason about, and is explicitly a temporary trade — expected to be revisited once bigger maps and secondary progression make losing a full attempt to one mistake feel bad again.

---

**Superseded for the initial build — retained as reference for when checkpoints return:**

**Ability cost model pointer:** ability cost model is a per-ability dual gate rather than a single system-wide choice; see §7 for the full model.

**Hazard damage during puzzle-solving:** Real macro-resource cost (now: structure only). Design intent: survival resources function as a shared buffer/margin-for-error across both travel and puzzle execution — running out means you didn't manage risk well enough, across either layer. This is a legitimate design model (comparable to FTL's hull/oxygen as shared risk currency), not an accidental collision.

**Hazard telegraphing:** Hazard costs are telegraphed by design — danger is collision-based (discrete objects or clearly dangerous areas), which is inherently visible to the player before contact. This becomes a visual/level-art legibility requirement during production (hazards must read as dangerous at a glance) — and, per §9's new open item, must also distinguish structure-stakes from energy-stakes hazards.

**Failure state & checkpoint model (deferred, §11.2):** Hard fail — zero structure — triggered a restart from the last checkpoint rather than a full level restart. Checkpoints triggered on both puzzle-site completion and resupply-point (star/asteroid) visit, whichever came first, so one late mistake didn't cost several solved puzzles' worth of progress.

**Resource state on resume (deferred, §11.2):** Guaranteed minimum floor, set as a fixed, level-authored value. Floor was a lower bound, not a reset value — resume at *max(actual resources at last checkpoint, floor)* — to prevent a strict-dominance exploit (intentionally failing to "refund" resources). Authored as a percentage of level capacity so it would stay meaningful once endurance upgrades grew max capacity over a campaign.

### From §6 — Puzzle Interaction Taxonomy

Execution/timing puzzles confirmed as intentional minority seasoning, used purposefully (e.g., staying near a moving comet to scan it, avoiding a moving asteroid mid-puzzle). Note: these are exactly the interaction types now carrying real macro-resource cost with hard-fail-restart (§5) — this pairing was the top playtesting priority at the time this was decided, not the taxonomy choice itself.

### From §7 — Abilities & Progression

**Ability cost model:** Each ability has two independently-authored gates — an energy cost and a cooldown — either of which can be set to 0. This generalizes the earlier cooldown-vs-energy either/or into a per-ability spectrum rather than a system-wide choice; pure-cooldown and pure-energy abilities are just the two special cases where one value is 0. Which abilities use which gate (or both) is a per-ability tuning decision made as abilities are implemented, not fixed here — but the general principle worth keeping: abilities the player needs for information/deduction (e.g. scan) are good candidates for 0 energy cost + cooldown, since gating information behind a survival resource risks blocking a puzzle for a reason that isn't about reasoning — the same fairness concern §2 raised about survival intruding on puzzle legibility. Abilities that are about spending a resource for capability (e.g. rocket boost) are good candidates for energy cost + 0 cooldown, since the resource cost is itself the balancing mechanism and an added cooldown would just be friction without a meaningful decision behind it.

**Puzzle-site costs:** Puzzle-site resource costs are fixed by level design, not derived from current player stats. This preserves the intended separation — endurance upgrades widen your macro-layer margin without softening any individual puzzle's designed difficulty.

---

### From §9 — Phenomenon-to-Taxonomy Reference Table

Resolves §9's former open item 1 (concrete obstacle/phenomenon-to-taxonomy mapping). Split into two kinds: open-world hazards (encountered while flying, drain resources per §5 — except Debris Field, re-scoped 2026-08-07 to block movement instead, see §9) and puzzle-site elements (local pieces inside a `PuzzleSite`, cost-neutral by default per §11.3 unless deliberately paired with a hazard). Naming rule enforced throughout: one phenomenon name = one behavior, always — the two ambiguous cases originally raised (comet, nebula) are resolved below rather than left open.

**Open-world hazards (candidates for §3's "signature hazard")**

| Phenomenon | §6 Category | Static/Dynamic | Resource Drained | Note |
|---|---|---|---|---|
| Debris Field | Avoid particular areas — Deduction | Static | **None — blocks movement (re-scoped 2026-08-07, see §9)** | Solid obstacle, not a drain zone: naturally-occurring rock/ice debris, not ship wreckage. Find-a-path-around rather than find-a-safe-path-through — the first hazard tied to the Meso/routing pillar rather than the Macro/survival one. Visually distinct from AsteroidField's single-large-ore-rock look via a many-small-fragments composition (`art-production-guidelines.md`). Implemented — `HazardZoneElement` supports `blocksMovement` via an immovable Arcade collider. |
| Solar Flare | Avoid particular areas — Execution | Dynamic (timed bursts) | Energy | Telegraphed by a visible pre-burst warning, per §5. |
| Ion Storm | Avoid particular areas — Execution | Dynamic (slow-moving/drifting zone) | Energy | Same visual family as Nebula Field; motion is the only behavioral difference. Art differentiation from Nebula Field is tracked as a new open item, see §9 above. |
| Nebula Field | Avoid particular areas — Deduction | Static | Energy | |
| Meteoroid | Avoid particular areas — Execution | Dynamic (moving hazard, collision) | Structure | Originally drafted as "Rogue Comet"; renamed to remove the name collision with the puzzle-element Comet below. |

**Puzzle-site elements** (optional/additive content, §6 — not required to complete a level, §3)

| Phenomenon | §6 Category | Static/Dynamic | Resource Drained | Note |
|---|---|---|---|---|
| Signal Array (sequence) | Move to spots in order — Deduction | Static | None by default | Maps to `SequenceSpotElement`. Renamed from "Relay Beacon" — that name was reassigned to the mandatory core-loop waypoint below to avoid a collision (§3). |
| Scan Target / Marker | Object interact / scan — Deduction | Static | None by default | Base interact case. |
| Comet (tracking) | Stay in a moving spot for duration — Execution | Dynamic | None by default | Name now belongs solely to this puzzle element, not to any hazard. |
| Cargo Pod / Wreckage (push/pull) | Move objects — Deduction | Static until moved | None by default | Gated behind Tractor/Repulsor per §7. |
| Beacon Cluster (trail/encircle) | Trail/draw or encircle — Deduction (Execution if timed) | Static | None by default; timer only for execution variant | |

**Core-loop objects** (required every level, §3 — distinct from both the hazards above and the optional puzzle-site elements above; not part of the additive taxonomy)

| Object | Role | Note |
|---|---|---|
| Probe | Find/recover — triggers the level's next required step | Maps to `ProbeObject`, §11.12. |
| Relay Beacon | Navigate-to waypoint, required after the probe, before return | Maps to `RelayBeaconObject`, §11.13. No puzzle-solving attached — plain arrival trigger. Not the same thing as Signal Array above. |
| Entry Wormhole | Launch position | Maps to `EntryWormhole`, §11.14. Reuses the former Home Marker placeholder sprite, tinted "active"; closes shortly after the level begins. |
| Exit Wormhole | Required return destination, distinct location from Entry Wormhole (2026-07-31 revision — was one shared `HomeMarker`) | Maps to `ExitWormhole`, §11.14. Same placeholder sprite as Entry Wormhole, tinted "inactive" until the Relay Beacon is reached. |

---

### From §9 — Asset Procurement

Resolves §9's former open item 2. Decision: **existing/licensed asset packs**, on the grounds that availability of Phaser-compatible 2D packs is strong enough to make this mostly an integration task rather than a production bottleneck. Practical implications for §12: no placeholder-asset convention is needed — Phase 1's vertical slice can use real assets from the start rather than building against stand-ins and swapping later, and no separate art/audio workstream needs to be carved out alongside the core-vs-content split.

### Archived — Original Technical Plan (Unreal Engine, superseded)

*Archived in full below. This was the technical/production plan when the project assumed Unreal Engine — it occupied sections 11 and 12 at the time. Superseded once the engine choice moved to Phaser.io; the current sections 11 and 12 (Technical Interface Contract, Development Plan) are the active Phaser-based replacements. Kept here for reference only. Internal `§11`/`§12` cross-references inside the archived text below refer to this archived plan's own subsections, not to the document's current section 11/12.*

#### 11. Technical Interface Contract (Unreal Engine, 2D/2.5D top-down, agentic build)

**Engineering principle:** Unreal's Blueprint graphs and level assets are binary/near-unmergeable, so anything intended to support parallel or agentic work should live in C++ as the mergeable, agent-legible layer. Blueprints are reserved for per-instance content configuration (placing elements in a level, setting authored values) — inherently low-collision since different levels/instances are different files. The components below are the contract: puzzle elements, hazards, and content never mutate survival/progression state directly — they only call these interfaces. That boundary is what keeps §2's macro/meso/micro layering real in code, not just on paper.

##### 11.1 `UShipSurvivalComponent` (on the player ship)
- **State:** `CurrentEnergy`, `MaxEnergy`, `CurrentStructure`, `MaxStructure` (Max* would be modified by `UProgressionManager` endurance upgrades if/when that track exists — deferred for the initial build, §7).
- **Functions:**
  - `ConsumeEnergy(float Amount, EHazardSource Source) -> bool`
  - `ConsumeStructure(float Amount, EHazardSource Source) -> bool`
  - `RechargeEnergy(float Amount)` — called by resupply-point actors only
  - `RepairStructure(float Amount)` — called by resupply-point actors only
  - `ApplyCheckpoint(FCheckpointData Data)` — resumes at `max(Data.ActualEnergy, LevelFloorEnergy)`, `max(Data.ActualStructure, LevelFloorStructure)` per §5's lower-bound rule (never a flat reset)
  - `GetCheckpointSnapshot() -> FCheckpointData`
- **Events:** `OnEnergyDepleted`, `OnStructureDepleted` (either triggers `UCheckpointManager::RestartFromCheckpoint`), `OnResourceChanged` (HUD binding only, no gameplay logic)
- **Hard rule:** this is the *only* class permitted to write to `CurrentEnergy`/`CurrentStructure`. No puzzle element, hazard, or ability may touch these fields directly.

##### 11.2 `UCheckpointManager` (per-level)
- **State:** `LastCheckpointLocation`, `LastCheckpointResourceSnapshot`, `PuzzleSitesSolvedSinceLevelStart` (persists across a restart within the same level attempt)
- **Functions:**
  - `RegisterCheckpoint(ECheckpointSource Source, FCheckpointData Data)` — called by both resupply-point actors and `PuzzleSite::OnSiteSolved` (§5, both triggers active)
  - `RestartFromCheckpoint()` — repositions player, calls `ShipSurvivalComponent::ApplyCheckpoint`, restores solved-puzzle state; does **not** restore in-progress-but-unsolved puzzle state

##### 11.3 `UPuzzleElementBase` (abstract; derived: `SequenceSpotElement`, `MovingSpotDurationElement`, `HazardZoneElement`, `PushPullObjectElement`, `TrailDrawElement` — mapping to §6's taxonomy)
- **Functions:** `OnPlayerInteract()`, `IsSolved() -> bool`, `OnHazardContact()`
- **Hard rule:** `OnHazardContact()` calls `ShipSurvivalComponent::ConsumeEnergy/ConsumeStructure` — it never modifies resource values itself. Collision volumes on hazard elements must be visually distinct per §5's telegraphing resolution (art/level-design requirement, not code).
- `UPuzzleSite` groups elements under one completion condition; `OnSiteSolved()` fires `UCheckpointManager::RegisterCheckpoint(EPuzzleCompletion, Snapshot)`.

##### 11.4 `UAbilityComponent` (on the player ship)
- **State:** `UnlockedAbilities` (set)
- **Functions:** `IsUnlocked(EAbilityType) -> bool`, `TryActivate(EAbilityType) -> bool` — checks both gates per §7's dual-gate model: cooldown remaining (if that ability's authored `CooldownSeconds` > 0) and, if `EnergyCost` > 0, a call to `UShipSurvivalComponent::ConsumeEnergy`. Either gate is a no-op when authored as 0, so this one function covers cooldown-only, energy-only, and dual-gated abilities without separate call paths.
- Puzzle elements query `IsUnlocked()` before allowing an interaction (e.g. `PushPullObjectElement` checks `TractorBeam`) — this is the concrete link between §7's ability-gating and §6's puzzle grammar.

##### 11.5 `UProgressionManager`
- Owns `UnlockedAbilities`. Endurance multipliers (efficiency, recharge/repair rate, `MaxEnergy`/`MaxStructure`) are **deferred for the initial build** (§7) — the component's interface can reserve the hooks for these without implementing them, so reintroducing this track later doesn't require reworking the ability-gating half.
- **Hard rule:** never modifies fixed per-hazard costs, fixed per-puzzle costs, or the level-authored checkpoint floor (§5, §7 — these stay fixed by design). If/when endurance multipliers are added, they apply only inside `ConsumeEnergy`/`ConsumeStructure` as a scaling factor on the incoming (fixed) cost — the base cost numbers themselves are never touched.

##### 11.6 `AResupplyPoint` (Star | AsteroidField)
- `OnPlayerArrival()` → calls `RechargeEnergy`/`RepairStructure`, then `UCheckpointManager::RegisterCheckpoint(EResupply, Snapshot)`.

##### 11.7 Authored data (never computed from player state — see §5, §7)
- Per-hazard `FCostData { EnergyCost, StructureCost }`, set in the editor per instance.
- Per-level `LevelFloorEnergy`/`LevelFloorStructure`, authored as a percentage of that level's `MaxEnergy`/`MaxStructure` (§5's authoring note), not a flat constant reused across levels.
- Per-ability `FAbilityCostData { EnergyCost, CooldownSeconds }`, authored per ability type (§7) — either field may be 0.

---

#### 12. Development Plan — Phased (Option 3, transitioning to Option 1)

**Phase 0 — Contract lock.** Section 11 above is the contract. Any agent session should be given it as context and should flag, not silently resolve, any case where a task seems to require breaking one of the "hard rule" boundaries.

**Phase 1 — Vertical slice (single agent/session, sequential, not parallelized).**
1. `ExplorationController` (non-Newtonian click-to-move) + one small test region.
2. `UShipSurvivalComponent` wired to one hazard type (e.g., a debris field draining structure) and one `AResupplyPoint` (star).
3. One `UPuzzleElementBase` subtype (simplest option: `SequenceSpotElement`) plus one `UPuzzleSite` wired to `UCheckpointManager`.
4. `UCheckpointManager` with both triggers active (resupply + puzzle-completion) and the hard-fail/restart flow functional end-to-end.
5. Result: a small, fully playable loop — explore, risk a hazard, solve one puzzle, checkpoint twice, fail and restart at least once, reach the probe, return home.

**Gate before Phase 2 — this is the actual point of doing it this way, not a formality.** Play the slice. This is specifically where the checkpoint/floor/hazard-cost combination resolved in §5 should get validated empirically rather than argued further on paper: does it actually *feel* like fair risk rather than punishment? (The ability cost model itself — per-ability energy + cooldown dual gate — is already decided, §7; what Phase 1 can still usefully inform is the specific per-ability values, e.g. whether scan's cooldown length feels right, not which gating system to use.) If the slice reveals the interface contract itself needs to change, that's one agent's work to redo, not three.

**Phase 2 — Fan out to Option 1 (parallel agents by layer), now working from a validated contract instead of a speculative one.**
- **Agent A — Survival & Progression:** remaining hazard types, ability-gating logic (owns `UAbilityComponent`'s internals). `UProgressionManager`'s endurance-upgrade half is deferred for the initial build (§7) — reduces this agent's scope to ability-gating and hazard content only.
- **Agent B — Exploration:** additional resupply-point variants, camera/scan feel, level-layout tooling.
- **Agent C — Puzzle framework:** taxonomy elements (§6) beyond whatever Phase 1 shipped with, plus additional `UPuzzleSite` content. Additive by design (§6's scope note) — treat this as a backlog to work through as time allows, not a fixed target that blocks completion.
- **Cross-cutting note:** abilities/progression cut across layers by nature (flagged when Option 1 was first proposed). Agent A owns the gating logic; Agent C is the *consumer* of `IsUnlocked()` checks. Naming this explicitly now is what prevents the integration drift that a looser "everyone touches abilities a bit" split would produce.
- Each agent's new work is primarily new files (new element subclasses, new levels, new content) rather than edits to shared files, which is what keeps this phase compatible with Unreal's merge limitations — the shared surface between agents is the Section 11 contract itself, not shared assets.

##### 12.1 Rough Token Budget (planning estimate — order of magnitude, not a hard budget)

**Caveats that matter more than the numbers themselves:**
- Iteration/debug cycles dominate token spend far more than initial code generation does — a component might compile clean in one pass or eat five rounds of error-log-read-and-fix. Treat these as planning ranges, not commitments.
- These figures cover the C++ layer (Section 11) only. Blueprint graph construction inside the Unreal Editor is a much less mature target for coding agents; depending on current tooling, that work may end up being manual rather than token-metered at all — worth verifying current Unreal-agent tooling before assuming it's covered by these numbers.
- Content volume (additional levels, hazard types, puzzle sites) is the main lever under your control and scales close to linearly once each base class exists — the ranges below assume the Phase 1 scope as defined in §12 exactly, not a larger content pass.
- Section 11's contract being reasonably unambiguous is a real cost-reducer, not incidental — most token blowouts in agentic coding come from an agent guessing at an underspecified interface and redoing work once the real requirement surfaces.

| Scope | Rough token range | Main source of variance |
|---|---|---|
| **Phase 1 — full vertical slice** (ExplorationController, ShipSurvivalComponent, one hazard, one resupply point, one puzzle element type + site, CheckpointManager, integration) | ~300K–900K | Integration debugging across 5+ new systems; in practice this is several distinct agent sessions, not one continuous run |
| **Phase 2, Agent A — Survival & Progression** | ~100K–250K | Additional hazard types (~30–80K each once the base class exists); endurance upgrades deferred (§7) removes what had been the largest single item in this estimate |
| **Phase 2, Agent B — Exploration** | ~150K–400K | Wide range mainly because level-layout tooling is elastic — a couple of resupply variants is cheap, custom editor tooling is not |
| **Phase 2, Agent C — Puzzle framework** | ~50–150K per additional taxonomy element | Additive, not a fixed total (§6) — each remaining element type is roughly independent; total spend is a scoping choice (how many of the taxonomy's rows you implement), not a fixed requirement |

---

