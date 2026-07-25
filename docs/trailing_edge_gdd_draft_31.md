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
| Macro | Survival | Energy & structure totals; overall expedition risk/buffer |
| Meso | Exploration | Where you go, what you investigate, routing decisions |
| Micro | Puzzle-solving | Discrete challenge sites; deterministic, solvable problems |

**Design Notes (why this matters):** Survival design wants scarcity and consequence; puzzle design wants legibility (a player should be able to trace failure to their own reasoning). Blending them at the same moment — e.g., random resource attrition interrupting an in-progress puzzle — reads as unfair rather than tense. Keeping survival as the layer that sets the *budget* going into a puzzle (rather than a live threat during it) avoids this. See §5 for the one nuance that still needs deciding.

---

## 3. Core Loop (per level)

1. Launch from home base.
2. Explore level region; scan asteroids (structure material) and locate stars (energy recharge) as you go.
3. Encounter the level's signature hazard — a specific, learnable environmental threat that primarily drains **either** energy **or** structure (not both, not ambient/random — see §5).
4. Reach and solve the challenge/puzzle site(s) using current ability set.
5. Locate the probe, recover cargo/data.
6. Return home.
7. Spend recovered data/cargo on new ability unlocks (survival endurance upgrades deferred for the initial build, §7).
8. Proceed to next level.

This is structurally similar to an ARPG hub-and-return loop (town → dungeon → town).

**Summary:** Energy/structure reset when a level is first entered; a mid-level hard-fail restart resumes from the last checkpoint (§5) rather than re-triggering this reset. Stakes are level-scoped, not campaign-scoped (see Appendix, §3 for full rationale).

---

## 4. Controls

- Click-to-move, explicitly non-Newtonian (accessibility over flight-sim realism).
- Abilities on number-key hotkeys.
- No control remapping in initial build (deferred — don't forget it needs revisiting before wider release/testing with other players).
- Overall control feel: comparable to Diablo.

---

## 5. Survival Systems: Energy & Structure

**Player-facing summary:** Your ship runs on two resources, energy and structure. Every level has a signature hazard that threatens one or the other — and hazards are always visible before they hit you, so a loss is on you, not a surprise. Energy recharges at stars; structure gets repaired with material scanned from asteroids. Run either resource to zero and the level fails — but you don't lose everything: you resume from your last checkpoint (earned by solving a puzzle site or visiting a resupply point) with enough banked to give you a real shot at trying again.

- **Energy:** replenished at stars. Drained by the level's signature hazard, movement/hazard exposure, and — per-ability — abilities with a nonzero energy cost (per-ability dual gate model; see §7).
- **Structure:** repaired using material gathered by scanning asteroids. Drained by structural hazards (debris fields, collisions).
- **Layering rule:** hazards are discrete, telegraphed, and tied to specific level content — not ambient ticking depletion. This keeps survival legible: a hazard is something to learn and route around, similar in character to a puzzle element, rather than a random tax on the player.

**Clarifying details (may not be obvious from the player-facing summary above):** Hazard contact during puzzle-solving draws on the same energy/structure buffer as hazards encountered while flying — there's no separate "puzzle health." On resuming, you're restored to *at least* a fixed, level-authored floor — never less, and never reset down to exactly that value if you had more banked already (this also closes an exploit where deliberately failing could refund resources). That floor is authored as a percentage of each level's capacity rather than a flat number, so it stays meaningful as later levels raise overall capacity — though note this only matters once endurance/capacity upgrades exist; those are deferred for the initial build (§7, §12), so a flat floor value is equivalent for now. (Full rationale for all of the above in Appendix, §5.)

---

## 6. Puzzle Interaction Taxonomy

| Interaction | Type | Example Phenomena | Notes |
|---|---|---|---|
| Object interact / scan | Deduction | Scan Target / Marker | Core information-gathering primitive |
| Move to a spot | Deduction | *(no phenomenon named yet — only the sequenced and moving-target variants below were given names; this is the same primitive without either)* | Basic traversal/placement |
| Move to spots in a particular order | Deduction | Relay Beacon | Sequencing puzzle |
| Stay in a moving spot for a duration | **Execution/timing** | Comet (tracking) | Reintroduces twitch-skill demand — flag intentionally if kept |
| Avoid particular spots/areas | Deduction *or* execution, depending on whether hazards are static (deduction: find the safe path) or dynamic/timed (execution: react in real time) | Debris Field, Nebula Field (static/deduction); Solar Flare, Ion Storm, Meteoroid (dynamic/execution) | Worth tagging each instance explicitly during level design |
| Move objects near/far or in particular order (push/pull) | Deduction | Cargo Pod / Wreckage | Maps directly to tractor/repulsor abilities |
| Trail/draw a path, or encircle objects | Deduction (or execution if time-limited) | Beacon Cluster | |

**Summary:** Execution/timing puzzles are intentional minority seasoning (e.g., staying near a moving comet to scan it, avoiding a moving asteroid mid-puzzle), not the taxonomy's core (full rationale in Appendix, §6).

**Scope note:** This taxonomy is additive, not all-or-nothing — each row is an independent element type once the `PuzzleElementBase` pattern (§11.3) exists, so the initial build can ship with a subset (e.g. just the deduction-type rows) and add the remainder as time permits, rather than needing all seven implemented before anything is playable. See §12 for how this affects the Content Agents' scope.

---

## 7. Abilities & Progression

Two progression tracks, intentionally serving different layers:

**Ability unlocks (micro layer — new puzzle grammar):**
- Scan → object-interact puzzles
- Tractor/repulsor beam → push/pull puzzles
- Teleport → reach/bypass puzzles
- Rocket boost → timing/reach puzzles

**Summary — ability cost model:** Each ability has two independently-authored gates — an energy cost and a cooldown — either settable to 0 (pure-cooldown and pure-energy abilities are the special cases where one is 0). Which gates apply to which ability is decided per-ability during implementation; information/deduction abilities (e.g. scan) are good candidates for 0 energy cost + cooldown, capability-spending abilities (e.g. rocket boost) for energy cost + 0 cooldown (full rationale in Appendix, §7).

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

1. Ion Storm vs. Nebula Field art differentiation — the phenomenon-to-taxonomy mapping (formerly this item; resolved via reference table, see Appendix) settled Ion Storm and Nebula Field as the same visual family (drifting cloud) with motion as the *only* behavioral difference: Ion Storm is a slow-moving hazard area, Nebula Field is static. Current assumption is that color plus simple animation is sufficient to tell them apart at a glance. Worth treating as genuinely open rather than settled: color alone is a weak signal for colorblind players, and "slow-moving" is the kind of difference that's easy to under-read in a still image or a quick glance mid-flight — the actual test is whether a player can tell, in motion, at normal play speed, that one is drifting before they're already in its path, since misreading Ion Storm as static would violate §5's telegraphing rule the same way the original name-collision would have. Recommend validating with an actual placeholder asset during the week 1–2 vertical slice (§12, archived Unreal plan's sequencing logic still applies) rather than deciding this on paper — if color + animation doesn't read clearly, the fallback options (distinct particle trail, a border/outline treatment, or accepting a name change back to two visually distinct phenomena) are worth having in reserve rather than discovering the need for them after several levels already use both.

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

### 11.1 `ShipSurvivalComponent` (composed onto the player Ship object)
*Tracks your ship's energy and structure, and decides what happens when either one runs out.*
- **State (private):** `currentEnergy`, `maxEnergy`, `currentStructure`, `maxStructure` (`max*` modified by `ProgressionManager` endurance upgrades if/when that track exists — deferred, §7).
- **Functions:** `consumeEnergy(amount, source): boolean`, `consumeStructure(amount, source): boolean`, `rechargeEnergy(amount): void` (resupply-point objects only), `repairStructure(amount): void` (resupply-point objects only), `applyCheckpoint(data): void` — resumes at `max(data.actual, levelFloor)` per §5's lower-bound rule, `getCheckpointSnapshot(): CheckpointData`.
- **Events:** Phaser's built-in `EventEmitter` — `onEnergyDepleted`, `onStructureDepleted` (either triggers `CheckpointManager.restartFromCheckpoint()`), `onResourceChanged` (HUD binding only).
- **Hard rule (TS-enforced):** `currentEnergy`/`currentStructure` are `private`. No puzzle element, hazard, or ability may reference them directly.

### 11.2 `CheckpointManager` (per-level)
*Remembers where you last made real progress, so a failure sends you back there instead of to the very start of the level.*
- **State:** `lastCheckpointLocation`, `lastCheckpointResourceSnapshot`, `puzzleSitesSolvedSinceLevelStart` (held in a plain object, not Phaser's Scene `data` manager, so a Scene restart can't accidentally clear it before intended).
- **Functions:** `registerCheckpoint(source, data): void` (called by resupply-point objects and `PuzzleSite.onSiteSolved()`, §5), `restartFromCheckpoint(): void` — repositions player, calls `ShipSurvivalComponent.applyCheckpoint()`, restores solved-puzzle state; does **not** restore in-progress-unsolved puzzle state.

### 11.3 `PuzzleElementBase` (abstract) and hazard/puzzle element mapping

*This is every puzzle piece and hazard the player actually encounters — scan targets, sequences, moving-object hazards, push/pull objects — plus the rule that most hazards are variations on the same underlying thing.*

**Puzzle-site elements** (derived from `PuzzleElementBase`; cost-neutral by default per §5's "hazard contact" clause, mapped to §9's reference table):
- `SequenceSpotElement` — Relay Beacon
- `ScanInteractElement` — Scan Target / Marker (the base interact case; may not need a distinct subclass beyond `PuzzleElementBase` itself)
- `MovingSpotDurationElement` — Comet (tracking)
- `PushPullObjectElement` — Cargo Pod / Wreckage; queries `AbilityComponent.isUnlocked(TractorBeam)` before allowing interaction (§7's ability-gating link)
- `TrailDrawElement` — Beacon Cluster

**Open-world hazards — one parameterized class, not five:** all four "zone" hazards from §9's table (Debris Field, Solar Flare, Ion Storm, Nebula Field) differ only in authored parameters, not in code. Recommend a single `HazardZoneElement` taking: `shape`, `movementPattern: 'static' | 'linear' | 'patrol'`, `speed`, `activation: 'continuous' | 'pulsed'`, `pulseIntervalSeconds`, `resourceCost: { energy, structure }`. Meteoroid also fits this class (`movementPattern: 'linear'`, structure cost) rather than needing a separate moving-hazard-object type, since Arcade's overlap callbacks handle "zone overlap" and "moving hazard contact" identically at the interface level — a moving `HazardZoneElement` and a stationary one differ only in whether `speed` is nonzero. **This collapses what could have been five hazard classes into one class + five content configs — confirmed as the approach going into Phase 1, since it changes what counts as "core" vs. "content" in §12 below.**
- **Hard rule:** `onHazardContact()` calls `ShipSurvivalComponent.consumeEnergy/consumeStructure` — never modifies resource values itself; enforce via the same private-field discipline as 11.1.
- `PuzzleSite` groups elements under one completion condition; `onSiteSolved()` fires `CheckpointManager.registerCheckpoint(PuzzleCompletion, snapshot)`.

### 11.4 `AbilityComponent` (composed onto the player Ship object)
*Tracks which special abilities you've unlocked, and whether you're currently allowed to use them.*
- **State:** `unlockedAbilities: Set<AbilityType>`.
- **Functions:** `isUnlocked(type): boolean`, `tryActivate(type): boolean` — checks cooldown (if authored `cooldownSeconds` > 0) and energy cost (if authored `energyCost` > 0) via `ShipSurvivalComponent.consumeEnergy`; either gate no-ops at 0, per §7's dual-gate model.
- Cooldowns via Phaser's `Time.addEvent` or a timestamp comparison against `scene.time.now` — don't build a second timer system.

### 11.5 `ProgressionManager`
*Keeps track of which abilities you've earned across the whole game.*
- Owns `unlockedAbilities`. Endurance multipliers deferred for the initial build (§7) — interface reserves the hooks without implementing them.
- **Hard rule:** never modifies fixed per-hazard costs, fixed per-puzzle costs, or the level-authored checkpoint floor (§5, §7).

### 11.6 `ResupplyPoint` (Star | AsteroidField)
*The stars and asteroids you visit to refill energy or repair structure — and a checkpoint gets banked the moment you reach one.*
- An Arcade-physics-enabled `Phaser.GameObjects.Container`. `onPlayerArrival()` wired via Arcade overlap callback (not a manual per-frame distance check) → `rechargeEnergy`/`repairStructure`, then `CheckpointManager.registerCheckpoint(Resupply, snapshot)`.

### 11.7 Authored data
*The numbers and settings a level designer sets by hand — hazard costs, how forgiving a level's checkpoint floor is, ability costs, and what order the levels play in.*
- Per-hazard `CostData { energyCost, structureCost }` plus the `HazardZoneElement` parameters above — authored as typed TS/JSON level-config objects (one file per level, preserving low agent-collision), not via an external editor.
- Per-level `levelFloorEnergy`/`levelFloorStructure`, authored as a percentage of that level's capacity (§5).
- Per-ability `AbilityCostData { energyCost, cooldownSeconds }` — either field may be 0.
- Level sequence: an ordered array of level-config identifiers (`levelOrder: string[]`), owned by whichever module resolves "next level" on completion (11.8). Linear progression (§8: no level-select) means this ordering is the only place "what comes next" is decided — content agents adding a level append to this array, they don't hardcode a "next level" pointer inside the level they're authoring.

### 11.8 Scene flow

*The screens the player actually moves through — title, playing a level, pausing, and the win screen at the end — and how they connect.*

Four Scenes, no level-select — progression is linear, the next level loads automatically on completion:
- **`BootScene`** — loads assets/asset-pack manifests, then starts `TitleScene`.
- **`TitleScene`** — "Start" and "Continue" buttons. `Continue` is only shown/enabled if `SaveManager.hasSaveData()` (11.9) returns true. `Start` always begins at `levelOrder[0]` with default (full) resources, and **overwrites** any existing save the first time progress is made (not on button press — see 11.9's hard rule) so an old save can't linger and desync from a fresh run.
- **`GameScene`** — parameterized by which level config to load (`levelId`) and, optionally, a `CheckpointData` to resume from (present when arriving via Continue or a mid-level restart; absent when arriving fresh from `TitleScene` or advancing from a prior level). On reaching that level's exfil/probe condition, resolves the next `levelId` from `levelOrder` (11.7) and either restarts `GameScene` with the next level, or — if `levelOrder` is exhausted — transitions to `WinScene`.
- **`WinScene`** — reached when `levelOrder` is exhausted. No decided content beyond "the game is won" at this point (a message, maybe a return-to-title option) — fine to keep minimal, since nothing else in the contract depends on what it shows, only on the fact that something distinct from looping back into `GameScene` exists for this case.
- **`PauseScene`** — launched as an overlay on top of a paused `GameScene` (Phaser's scene-stacking, not a scene swap, so `GameScene`'s state isn't torn down). One option: return to `TitleScene`. This is a hard cut, not a save point — whatever progress exists is only as current as the last checkpoint/level-completion save (11.9); there's no separate "save on pause" behavior, so pausing and returning to title never loses more than a checkpoint restart already would.

### 11.9 `SaveManager` (persistence for Continue)

*Remembers your progress between play sessions, so "Continue" on the title screen picks up where you left off.*

- **State:** none held in memory beyond what's needed per call — this is a thin wrapper around `localStorage`, not a live game-state cache.
- **Storage shape:** a single `localStorage` key holding `{ levelId: string, checkpointSnapshot: CheckpointData | null }`. `checkpointSnapshot: null` means "resume at the start of `levelId` with default resources" (a level-completion save); a populated snapshot means "resume mid-level from this checkpoint" (a mid-level checkpoint save) — same distinction §5 already draws between a level-start reset and a checkpoint restart, just persisted across page reloads instead of only within a session.
- **Functions:** `saveProgress(levelId, checkpointSnapshot: CheckpointData | null): void`, `loadProgress(): SaveData | null`, `hasSaveData(): boolean`.
- **Hard rule (TS-enforced via module encapsulation, not a class-private field, since this is a singleton-style module rather than an instance):** `SaveManager` is the only code that touches `localStorage` directly. Two call sites, both already-existing triggers, not a new one: `CheckpointManager.registerCheckpoint()` calls `saveProgress(currentLevelId, snapshot)` after registering a mid-level checkpoint, and `GameScene`'s level-completion handler (11.8) calls `saveProgress(nextLevelId, null)` when advancing. No other code should reach for `localStorage` — if a future feature seems to need to, that's a sign it should go through `SaveManager`, not around it.

### 11.10 `HudOverlay`

*The on-screen display during play — energy/structure bars, ability icons, and a signal that a puzzle site is active.*

- Bound to `ShipSurvivalComponent.onResourceChanged` for energy/structure bars — display-only, per 11.1's existing event contract; no gameplay logic lives here.
- Ability icons reflect `AbilityComponent.isUnlocked()`/cooldown state (11.4) — again read-only from the HUD's side; it queries, it doesn't gate.
- A minimal "puzzle site active" indicator (even just a highlight or icon) so §5's telegraphing has an in-the-moment on-screen signal, not just a design-doc guarantee.
- Not Scene-specific: instantiated once per `GameScene` session, torn down on Scene transition, not persisted across levels (there's nothing in it that needs to persist — `SaveManager` already owns everything that does).

---

## 12. Development Plan — Phased

**Shape, not a re-derivation:** sequential vertical slice first, then fan out — but the fan-out is a **core-contract-vs-content split**, where all reusable core systems are built and closed out before content production begins.

**Phase 0 — Contract lock.** Section 11 is the contract, including the `SystemRegistry` wiring pattern. Any agent session gets it as context and must flag — not silently resolve — any task that seems to require breaking a hard rule or hand-editing a shared wiring file instead of registering additively.

**Phase 1 — Weeks 1–2, sequential, single agent session at a time, each step gated on your review before the next starts.**
1. `ExplorationController` (click-to-move, non-Newtonian, §4) + one small test scene.
2. `ShipSurvivalComponent` wired to one hazard (`HazardZoneElement` configured as Debris Field — the simplest case: static, continuous, structure-cost) and one `ResupplyPoint` (Star).
3. `SequenceSpotElement` (Relay Beacon) + one `PuzzleSite` wired to `CheckpointManager`.
4. `CheckpointManager` with both triggers active (resupply + puzzle-completion) and the hard-fail/restart flow working end-to-end. Decide explicitly here whether "restart from checkpoint" means `scene.restart()` (simpler, re-runs `create()`, risk of clobbering state you meant to persist) or in-place state reset within a live Scene (more control, more code) — this is a real fork Unreal's version never had to resolve.
5. A bare-minimum `HudOverlay` (11.10) — energy/structure bars only, no ability icons or puzzle-site indicator yet. You need *some* way to see the resource state to playtest steps 2–4 at all; full HUD polish is Phase 2a, not Phase 1.
6. **Result:** the same playable loop §3 describes — explore, risk a hazard, solve one puzzle, checkpoint twice, fail and restart at least once, reach the probe, return home.

**Gate — end of week 2, non-negotiable given the timeline.** Before touching Phase 2:
- Does §5's checkpoint/floor/hazard interaction hold up in practice, or does something need rework? If rework, that's more Phase 1, not a reason to start parallelizing on a shaky base.
- Validate the `SystemRegistry` pattern itself — if two systems are already fighting over the Scene file at this small scale, find that out now.
- Prototype the tractor/repulsor push/pull mechanic in Arcade specifically — this is the one confirmed decision with an agreed exit ramp: if it doesn't feel clean, de-emphasize or cut that ability rather than revisit the physics choice. Better to find this out in the week-2 gate than mid-Phase-2 content work.
- Confirm the `HazardZoneElement` parameterization actually produces four visually distinct-enough hazards using Arcade's overlap model, alongside resolving §9's Ion Storm/Nebula art-differentiation item with an actual placeholder asset.

**Phase 2 — Weeks 3–5, core-contract-vs-content split.**

*Phase 2a (early week 3, still sequential-ish, still core work):* close out the remaining puzzle element **types** Phase 1 didn't build — `MovingSpotDurationElement` (Comet), `PushPullObjectElement` (Cargo Pod), `TrailDrawElement` (Beacon Cluster). These are new classes, not content, and belong on the core track regardless of how close to "week 3" they land. If the `HazardZoneElement` parameterization from §11.3 holds, no new hazard *classes* are needed here — Solar Flare, Ion Storm, Nebula Field, and Meteoroid become content-only work once their shared class exists, which is the main thing this split buys you. Also on this track, because it's system work rather than content: `BootScene`/`TitleScene`/`PauseScene`/`WinScene` (§11.8), `SaveManager` (§11.9), and completing the `HudOverlay` (ability icons, puzzle-site indicator). None of this blocks Phase 1's slice from being playable, which is why it's here rather than in Phase 1 — but it does need to close before Phase 2b, since Continue/save behavior and Scene transitions are exactly the kind of shared-file risk the core-vs-content split exists to keep out of the parallel track.

*Phase 2b (bulk of weeks 3–5, genuinely parallel):* content production against the now-closed contract — levels, hazard placements (config only, per 2a), puzzle-site instances, one hand-authored TS/JSON config file per level. Content agents don't touch core files; the boundary is enforceable by what directory/context you hand them, not just convention. This is also where §6's "additive, not all-or-nothing" scope note becomes your lever if week 4 gets tight: fewer levels, or drop the execution/timing taxonomy rows first (§6 already frames those as minority seasoning) — cut content, not anything from Phase 1 or 2a.

**Phase 3 — Final integration (last 2–3 days of week 5, carved out of Phase 2b's time, not additional time).** Every gate up to this point checks a component in isolation — one hazard, one puzzle type, one Scene transition. Nothing checks the assembled game, and content agents working in parallel per level don't automatically produce a coherent whole once strung together. This phase is scoped narrowly on purpose — no new content, no new systems — and closes out:
- Play every level in the real `levelOrder` sequence, start to finish, not each level in isolation the way earlier gates did.
- Confirm `Continue` resumes correctly from a save made at each kind of trigger (mid-level checkpoint, level-completion) — not just one of them, since they exercise different `SaveManager` call sites (§11.9).
- Confirm `WinScene` actually triggers after the true last level in `levelOrder`, not just in a shortened test sequence.
- Confirm the built/packaged game runs from wherever you're actually submitting it (a fresh browser profile or the actual host, not just your dev server) — "works in dev" and "works submitted" are different claims, and this is the only place in the plan that checks the second one.
- Fold in the outputs of the supporting roles below (§12.1) rather than treating their findings as new discoveries this late — if the Compliance Reviewer or Accessibility Reviewer have been running throughout, this phase is confirmation, not first-time triage.

### 12.1 Agent Roles

Every agent role in the plan, named in one place — build roles first (the sequential core track, then parallel content), then the supporting roles that fill gaps a pure build plan doesn't cover.

**Core-Contract Agent (Phase 1 & Phase 2a).** Builds and owns everything in §11 — `ShipSurvivalComponent`, `CheckpointManager`, `PuzzleElementBase` and its subtypes, `AbilityComponent`, `HazardZoneElement`, Scene flow, `SaveManager`, `HudOverlay`. One contiguous track across Phase 1's sequential vertical slice and Phase 2a's remaining core work, not two separate roles — splitting "core" across simultaneous sessions is exactly the risk this plan's sequential-then-fan-out shape was chosen to avoid. Runs weeks 1 through early week 3, sequentially, each step gated on your review before the next starts. Rough cost: see §12.2's Phase 1 and Phase 2a rows.

**Content Agents (Phase 2b).** Produce game content against the closed core contract — level configs, hazard placements (config only, against Phase 2a's `HazardZoneElement`), puzzle-site instances. Multiple agents can genuinely run in parallel here, one per level or content batch, since each works in its own config file and never touches core files — the boundary enforced by what directory/context you hand each one, not just convention. Runs the bulk of weeks 3–5. Rough cost: see §12.2's Phase 2b rows; total spend here is a scoping lever (§6's additive scope note) if time gets tight.

**Contract/Config Validation.** Checks Phase 2b's level-config files against §11's schemas — valid `movementPattern` values, required fields present on `HazardZoneElement`/`CostData` configs, every `levelOrder` entry resolving to a real level file. Runs continuously as content lands, cheapest to run often. Honest note: most of this is deterministic and could be a plain validation script with no LLM involved — framing it as an "agent role" matters more for demonstrating the workflow than for the checking itself, worth keeping in mind if the course wants agent roles demonstrated specifically. Rough cost: ~10K–30K tokens to build the validator once; near-zero marginal cost per run after that.

**Contract Compliance Reviewer.** Reviews diffs against §11's hard rules before merge — anything reaching for `localStorage` outside `SaveManager` (§11.9), anything writing to `currentEnergy`/`currentStructure` from outside `ShipSurvivalComponent` (§11.1), any content-track edit touching a core file instead of registering through `SystemRegistry`. This formalizes the review habit already used throughout this plan; worth a named role specifically because it's the thing most likely to erode under time pressure in week 4–5. Runs on every merge from Phase 1 onward. Rough cost: ~5K–15K tokens per review pass, scaling with how many diffs land per week.

**Accessibility/Telegraphing Reviewer.** Narrow scope, tied directly to §9's still-open item: does Ion Storm actually read as distinct from Nebula Field in motion at normal play speed, is any hazard signaled by color alone. Runs once at the week-2 gate (already specified there) and again during Phase 3 across the full level set, once all hazard placements exist. Rough cost: ~10K–25K tokens total across both passes.

**Asset Integration.** A track of its own, not folded into Phase 2b's content work, because it has different failure modes than puzzle-site/hazard placement — broken file paths, mismatched resolution/palette across sourced packs, license terms worth a quick check per pack. Runs in parallel with Phase 2a/2b, feeding normalized assets into the loading manifest as content agents need them. Rough cost: ~20K–50K tokens, mostly front-loaded before Phase 2b content production ramps up.

**Deliberately not adding:** a PM/orchestrator role tracking what's next (adds meta-complexity on top of a schedule already tracked in this plan); a true automated-playtesting agent driving the game via browser automation (high setup effort for a timing-sensitive 2D game, weaker signal than playing it yourself at Phase 3); a git-hygiene role (low payoff for a solo project on this timeline).

### 12.2 Rough Token Budget (planning estimate, order-of-magnitude only)

**Epistemic status, stated plainly:** unlike the archived Unreal table, these numbers aren't even calibrated against a comparable body of agentic-coding experience for this exact stack — there's no established "agentic Phaser + TypeScript" track record the way there increasingly is for Unreal C++. These are extrapolated from general patterns in agentic coding work (iteration/debug cycles dominate over initial generation; integration across systems costs more than any single system in isolation) applied to a stack that should iterate faster than Unreal's compile-bound loop. Trust the relative ordering between rows more than the absolute figures. Numbers are total-project tokens (input+output across all sessions for that scope), not per-session.

| Track | Scope | Rough token range | Main source of variance |
|---|---|---|---|
| **Phase 1 — full vertical slice** (`ExplorationController`, `ShipSurvivalComponent`, one `HazardZoneElement` config, one `ResupplyPoint`, `SequenceSpotElement` + `PuzzleSite`, `CheckpointManager`, minimal `HudOverlay`, end-to-end integration) | ~220K–520K | Integration debugging across 5+ new systems dominates; the Scene-restart-vs-in-place-reset decision (§12, Phase 1 step 4) is a concrete place this can blow past the low end if the first approach tried turns out wrong |
| **Phase 2a — remaining puzzle element types** (`MovingSpotDurationElement`, `PushPullObjectElement`, `TrailDrawElement`) | ~80K–200K total (~25–70K each) | Cheaper than Phase 1's components since the `PuzzleElementBase` pattern and wiring convention already exist; `PushPullObjectElement` carries the most variance since it's the one place the confirmed Arcade-over-Matter tradeoff (tweening vs. force) could need a few extra passes to feel right |
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

Energy/structure reset when a level is first entered. Chosen as the cleanest model for player understanding. Note: this is distinct from a mid-level hard-fail restart, which resumes from the last checkpoint (§5) rather than re-triggering this level-start reset. This does mean stakes are level-scoped rather than campaign-scoped — a deliberate departure, not an oversight.

### From §5 — Survival Systems: Energy & Structure

**Ability cost model pointer:** ability cost model is a per-ability dual gate rather than a single system-wide choice; see §7 for the full model.

**Hazard damage during puzzle-solving:** Real macro-resource cost. Design intent: survival resources function as a shared buffer/margin-for-error across both travel and puzzle execution — running out means you didn't manage risk well enough, across either layer. This is a legitimate design model (comparable to FTL's hull/oxygen as shared risk currency), not an accidental collision — provided the two conditions below hold.

**Hazard telegraphing:** Hazard costs are telegraphed by design — danger is collision-based (discrete objects or clearly dangerous areas), which is inherently visible to the player before contact. No further systems-design work needed here; this becomes a visual/level-art legibility requirement during production (hazards must read as dangerous at a glance).

**Failure state & checkpoint model:** Hard fail — zero energy or zero structure triggers a restart from the last checkpoint (not a full level restart; superseded by the checkpoint model below). Checkpoints trigger on both puzzle-site completion and resupply-point (star/asteroid) visit, whichever comes first. This resolves the earlier risk of losing several solved puzzles to one late mistake, since puzzle completion now banks that work independently of resupply spacing. Remaining implication for level design (not an open question, just a thing to keep in mind): checkpoint density is now the union of two independently-placed systems, so the case that still needs deliberate spacing attention is a long puzzle-free exploration/travel stretch, which is still bounded only by resupply-point placement.

**Resource state on resume:** Guaranteed minimum floor, set as a fixed, level-authored value (not a player-progression stat — removed for complexity reasons). Two things still apply from before:

  1. Floor must be a lower bound, not a reset value — resume at *max(actual resources at last checkpoint, floor)*, never a flat reset. This is what prevents the strict-dominance exploit (intentionally failing to "refund" resources) regardless of how the floor's value is set.
  2. Authoring note: since endurance upgrades (unchanged, still a separate progression track) grow max capacity over the campaign, floor should be authored as a percentage of that level's expected capacity rather than one flat constant reused everywhere — otherwise an early-authored floor becomes negligible by late-game. This is a content-authoring reminder, not a system to design.

Removing floor-from-progression also fully resolves the difficulty-curve-coordination concern raised previously — that dependency only existed because a player-upgradeable floor needed tuning against level-authored density across the whole campaign. With floor fixed per level, there's no longer a moving player-side variable to coordinate against.

### From §6 — Puzzle Interaction Taxonomy

Execution/timing puzzles confirmed as intentional minority seasoning, used purposefully (e.g., staying near a moving comet to scan it, avoiding a moving asteroid mid-puzzle). Note: these are exactly the interaction types now carrying real macro-resource cost with hard-fail-restart (§5) — this pairing was the top playtesting priority at the time this was decided, not the taxonomy choice itself.

### From §7 — Abilities & Progression

**Ability cost model:** Each ability has two independently-authored gates — an energy cost and a cooldown — either of which can be set to 0. This generalizes the earlier cooldown-vs-energy either/or into a per-ability spectrum rather than a system-wide choice; pure-cooldown and pure-energy abilities are just the two special cases where one value is 0. Which abilities use which gate (or both) is a per-ability tuning decision made as abilities are implemented, not fixed here — but the general principle worth keeping: abilities the player needs for information/deduction (e.g. scan) are good candidates for 0 energy cost + cooldown, since gating information behind a survival resource risks blocking a puzzle for a reason that isn't about reasoning — the same fairness concern §2 raised about survival intruding on puzzle legibility. Abilities that are about spending a resource for capability (e.g. rocket boost) are good candidates for energy cost + 0 cooldown, since the resource cost is itself the balancing mechanism and an added cooldown would just be friction without a meaningful decision behind it.

**Puzzle-site costs:** Puzzle-site resource costs are fixed by level design, not derived from current player stats. This preserves the intended separation — endurance upgrades widen your macro-layer margin without softening any individual puzzle's designed difficulty.

---

### From §9 — Phenomenon-to-Taxonomy Reference Table

Resolves §9's former open item 1 (concrete obstacle/phenomenon-to-taxonomy mapping). Split into two kinds: open-world hazards (encountered while flying, drain resources per §5) and puzzle-site elements (local pieces inside a `PuzzleSite`, cost-neutral by default per §11.3 unless deliberately paired with a hazard). Naming rule enforced throughout: one phenomenon name = one behavior, always — the two ambiguous cases originally raised (comet, nebula) are resolved below rather than left open.

**Open-world hazards (candidates for §3's "signature hazard")**

| Phenomenon | §6 Category | Static/Dynamic | Resource Drained | Note |
|---|---|---|---|---|
| Debris Field | Avoid particular areas — Deduction | Static | Structure | Fixed boundary, learnable, find-the-safe-path. |
| Solar Flare | Avoid particular areas — Execution | Dynamic (timed bursts) | Energy | Telegraphed by a visible pre-burst warning, per §5. |
| Ion Storm | Avoid particular areas — Execution | Dynamic (slow-moving/drifting zone) | Energy | Same visual family as Nebula Field; motion is the only behavioral difference. Art differentiation from Nebula Field is tracked as a new open item, see §9 above. |
| Nebula Field | Avoid particular areas — Deduction | Static | Energy | |
| Meteoroid | Avoid particular areas — Execution | Dynamic (moving hazard, collision) | Structure | Originally drafted as "Rogue Comet"; renamed to remove the name collision with the puzzle-element Comet below. |

**Puzzle-site elements**

| Phenomenon | §6 Category | Static/Dynamic | Resource Drained | Note |
|---|---|---|---|---|
| Relay Beacon (sequence) | Move to spots in order — Deduction | Static | None by default | Maps to `SequenceSpotElement`. |
| Scan Target / Marker | Object interact / scan — Deduction | Static | None by default | Base interact case. |
| Comet (tracking) | Stay in a moving spot for duration — Execution | Dynamic | None by default | Name now belongs solely to this puzzle element, not to any hazard. |
| Cargo Pod / Wreckage (push/pull) | Move objects — Deduction | Static until moved | None by default | Gated behind Tractor/Repulsor per §7. |
| Beacon Cluster (trail/encircle) | Trail/draw or encircle — Deduction (Execution if timed) | Static | None by default; timer only for execution variant | |

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

