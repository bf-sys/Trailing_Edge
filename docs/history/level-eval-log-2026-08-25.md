# Level Evaluation Log — 2026-08-25

## level-009.ts (LEVEL_009) — VERDICT: flagged

Round 1 of at most 3 (no prior evaluation of this candidate found in
`docs/history/level-eval-log-*.md` — Round 0's circuit-breaker check does
not apply).

### Structural: pass
- `npx tsc --noEmit -p .` passes cleanly with the candidate present.
- All four required objective fields present (`probeLocation`,
  `relayBeaconLocation`, `entryWormholeLocation`, `exitWormholeLocation`).
- `HazardZoneElement`/`HazardPlacement` shapes are all standard
  (`type`/`x`/`y`/optional `textureKey`/`rotationRadians`) — no malformed
  overrides.
- Every placement's coordinates fall within `[0, 7290] x [0, 4101]`
  (checked entry/exit/probe/beacon, resupply, all 4 Nebula, all 7 Ion
  Storm, all 5 Meteoroid, both Solar Flare, and all 42 Debris Field wall
  instances — max/min extents are well inside bounds even accounting for
  wall undulation's ±28-32px offset).
- Correctly **not** registered in `src/levels/index.ts` or
  `src/config/levelOrder.ts` prior to this evaluation, as expected for an
  unevaluated candidate. Temporarily registered in `src/levels/index.ts`
  only (never `levelOrder.ts`) to drive the in-browser playtest below, then
  reverted — confirmed via `git diff src/levels/index.ts` showing no
  residual change after revert.

### Reachability/safety: pass, with one significant caveat (see fix list)
Playwright driver (`window.game`/`window.getPlayerShip()`/
`window.getExplorationController()`/`window.getProgressionManager()`
console hooks, dev server on `localhost:5199`, screenshots at
`C:\Users\bryan\AppData\Local\Temp\claude\C--Users-bryan-documents-claude-projects-trailing-edge\0329e8e4-fb03-412d-b974-81dc79c28677\scratchpad\screenshots\`):

- **Zero console errors** across: level load, force-granting all three
  abilities, click-to-move navigation (Entry → toward Probe, confirmed
  ship position advancing from `(400,3800)` to `(731,1828)` over 8s, no
  invisible blocking), a full hard-fail restart (triggered incidentally by
  the Solar Flare test below — structure hit 0, scene restarted cleanly,
  resources/position reset per the Phase 1 contract), and forcing all 12
  moving hazards to `(-50000,-50000)` and confirming `MovingHazardManager`
  wrapped every one of them back onto/near the level perimeter within
  ~700ms (spot-checked resulting positions all land within or right at the
  `[0,7290]x[0,4101]` bounds, none left floating in open space or stuck —
  screenshot `06-after-wrap.png`).
- **Solar Flare's pulsed activation reads clearly on the structure side,
  in browser** — first-ever placement of this hazard, verified directly:
  parked the ship inside Solar Flare #1 `(3900,2900)`, structure dropped
  100→65→30 in two clean, distinct 35-point lumps exactly on the
  2.5s `pulseIntervalSeconds` schedule (`hazardConfig.ts`'s
  `resourceCost.structure: 35`), not a smooth/continuous drain —
  quantized and visible via `ShipStatusArcs`' structure bar
  (`02-solar-flare-1.png`).
- **Solar Flare's energy cost (28/pulse) never actually applies in this
  test**, and likely won't for most of a real playthrough either:
  `consumeEnergy()` is an all-or-nothing gate — since a level starts at 0
  energy and passive regen is only 2/s (`survivalConfig.ts`,
  2026-08-24), a player is very unlikely to have 28+ energy banked in the
  first seconds of encountering this level's *first-ever* Solar Flare
  placement, so the energy portion of its cost silently no-ops while the
  structure portion (which has no such gate) always lands. Not unique to
  Solar Flare — the same gate applies to Ion Storm/Nebula Field's energy
  component — but worth flagging since it's this hazard's debut and its
  own `hazardConfig.ts` comment describes an "11.2/s avg energy" figure a
  player will rarely actually feel.
- No `debrisRing()`/ability-gated section exists in this level, so no
  approach-range math applies.
- No reachability tracing needed for the three Debris Field walls (none
  spans a full map dimension — max wall length ~1400px vs. a 7290x4101
  map) — confirmed by direct inspection of each wall's generated instance
  array, not just trusting the file's comment.

**Significant caveat, found only by simulating full hazard trajectories,
not just checking initial placement points (see "Convention alignment"
below for detail): 5 of 7 Ion Storm and 2 of 5 Meteoroid placements sweep
directly through a wall, the Entry Wormhole, the Resupply point, or the
Relay Beacon during their deterministic first leg**, well before either
hazard type would naturally wrap. This doesn't produce console errors or
a soft-lock (no hazard-vs-hazard Arcade collider exists in this codebase,
so a Meteoroid overlapping a Debris Field wall is silent, not a crash),
which is why it passed a live zero-console-errors check — but it's a real,
verified violation of the 250px clearance floor, in some cases by more
than 150px of actual physical overlap. See the fix list.

### Convention alignment: notes
Independently re-derived every quantitative claim in the candidate's own
comments via a standalone script (not just reading them) — all of the
following match:

- **Objective spacing** (diagonal = 8364.3px): Probe↔Beacon 6307.1px
  (75.4%, top of the 65-76% precedent band), Beacon↔Exit 5277.5px (63.1%,
  a touch under the band for the same "Exit has to sit close to Probe"
  geometric reason level-007/008 hit), Probe↔Exit 1030.8px (12.3%, inside
  the 12-13% band). All match the file's stated figures exactly.
- **Debris Field wall no-gap safety margin, independently re-verified**:
  regenerated all three walls' actual instance arrays and measured
  worst-case neighbor distance directly (not trusting the file's
  self-report): Wall A/B 101.61px, Wall C 99.93px — matches the file's
  claimed "~99.9-101.6px" exactly, comfortably under the 120px
  (2×60px debris radius) no-gap threshold. All three walls correctly land
  in `'sweep'` mode (counts 15/15/12, all ≥ `MIN_UNDULATE_COUNT` 8).
- **Wall/objective/resupply clearance** (net = raw distance − debris
  radius 60 − feature's own radius): independently recomputed every
  reported figure — e.g. Wall C↔Beacon 449.9px net, Wall B↔Resupply
  369.0px net, Wall A↔Exit 711.6px net — all match the file's comments to
  within rounding. No wall spans a full map dimension; none is a
  `debrisRing()` seal (correctly deliberate — see below).
- **Sizing**: 7290×4101 = level-003/004's 5400×3038 × 1.35, confirmed a
  genuine uniform scale (both dimensions share the 1.35 factor:
  7290/5400 = 4101/3038 ≈ 1.35006, matches the file's own math), growing
  beyond level-007's prior-largest 7020×3949 — satisfies §2's "holding
  steady or growing" floor.
- **§8 alignment — this candidate correctly uses the experimentation
  license, and correctly avoids converging on a prior level's shape**: its
  axis (highest-yet combined Ion Storm+Meteoroid count, first real Solar
  Flare placement, `'trochoid'` Ion Storm) is genuinely distinct from
  level-005 (moving-hazard density but no Solar Flare, no trochoid,
  `'linear'` only), level-006 (single maze), level-007 (triple
  `debrisRing()` seals), and level-008 (Nebula Field density gauntlet).
  Debris Field is deliberately kept modest (3 short conventional walls,
  no seal) specifically so the moving-hazard axis stays the clear focal
  device — this is the right read of §8's "variety, not convergence"
  principle, not an under-use of the license.
- **Nebula Field**: 4 instances, each with a stated role matching §6's
  categories (early-route toll, bypass toll at Wall A's open end,
  bridging toll on the close Probe↔Exit hop, approach toll near Beacon) —
  two are deliberately allowed to overlap a wall's edge per §6's explicit
  exception, correctly identified as such in the file's own comments.

**One drift worth flagging explicitly (not a defect in this candidate,
but the check methodology it followed):** level-design-guide.md §7 states
a moving hazard's "authored x/y only governs the first leg" and "you
don't need to design around it beyond the initial placement," and
separately says a moving hazard visually overlapping a Debris Field wall
during travel is "not yet an explicitly designed interaction... not
identified as a problem." Combined with `hazardConfig.ts`'s
`headingRadians` being a fixed **per-hazard-type** default (not
per-placement — `HazardPlacement` has no heading field), this guide
language reads as "only the initial point needs 250px clearance," which
level-009's own candidate-generation process followed faithfully and
accurately. That was a reasonable reading before this level, but as
verified below it's no longer sufficient once (a) Ion Storm's brand-new
`'trochoid'` pattern effectively triples its clearance-relevant radius
(110→330 cautious) and (b) a level places this many movers (12) across a
map this wide, with static features directly on several of their fixed
travel lines. Recommend the guide's §7 be revisited to require modeling
the full first-leg path (straight line for Meteoroid, orbit-swept band for
Ion Storm), not just the initial point — this is a process gap the
candidate inherited, not something the content-agent got wrong given the
guide as currently written.

### Telegraphing: notes
- `[identity]` Solar Flare's placeholder texture (a flat, non-animated
  translucent orange-red circle, `placeholderTexture` in
  `hazardConfig.ts` — no final art sourced yet, `docs/STATUS.md`) has no
  pulse-synced visual cue. Confirmed by reading `HazardZoneElement.ts`'s
  `'pulsed'` activation code path (`applyResourceCost()`) — it applies
  the cost on schedule but contains no flash/tween/particle logic tied to
  the pulse moment. In-browser, this means a player gets **zero advance
  warning** of exactly when the next 35-structure lump lands; the only
  feedback is retroactive (the structure bar dropping after the fact).
  This reads as meaningfully less legible than Ion Storm/Nebula Field's
  `'continuous'` drain, where ongoing overlap is itself an ongoing signal.
  Since this is Solar Flare's first-ever placement, there's no existing
  precedent either way. This is a hazard-type/config-and-art property, not
  something level-009's placement choices caused or can fix — informational
  only, doesn't affect the verdict or the fix list below. Worth surfacing
  to CLAUDE.md's Open design questions alongside the existing Ion
  Storm/Nebula Field item, since it's the same shape of problem (an
  activation model that doesn't read clearly without an ability).
- `[identity]` Ion Storm vs. Nebula Field legibility (the long-open GDD
  item) — incidentally, this candidate's screenshots show the two
  currently-sourced textures reading as genuinely distinct silhouettes,
  not just different colors: Ion Storm renders as a gray swirl with
  visible blue lightning-arc detail (`spot-wallA.png`,
  `spot-beacon-approach.png`), Nebula Field as a softer cloud with a
  magenta/pink glowing core (`spot-nebula-bypass-wallA-south-end.png`,
  `spot-beacon-approach.png` — both hazards visible together in the same
  frame). A positive data point for the still-open GDD item, not a
  resolution of it (this was two hazards incidentally visible together in
  one level, not an exhaustive review) — noted for whoever picks that item
  up. Art property, not this level's doing either way.
- `[placement]` The moving-hazard sweep-clearance issue below has a
  telegraphing dimension worth calling out on top of the raw clearance
  number: several instances end up incidentally overlapping the Entry
  Wormhole and the Resupply point — two locations this project's
  convention otherwise treats as reliably safe pockets. A player who's
  learned that convention from earlier levels has no in-level signal that
  it can periodically stop being true here. This reinforces the fix-list
  entry below rather than being a separate item.
- Debris Field walls read as solid, contiguous, ship-blocking barriers
  with no visible gaps at normal zoom in every screenshot
  (`spot-wallA.png`, `spot-wallB.png`, `spot-wallC.png`,
  `08-central-corridor-wide.png`); the 3-texture/rotation cycling avoids
  any "repeated sprite" artifact.
- No hazard's danger is communicated by color alone with zero shape/
  motion/border backing — Debris Field (solid rock texture, inherently
  legible as terrain), Nebula Field (cloud shape + magenta core),
  Ion Storm (swirl shape + lightning detail + drift/loop motion),
  Meteoroid (rock+ember-trail shape + fast linear motion + physical
  knockback on contact). Solar Flare is the closest to color-only (a flat
  circle with no shape distinctiveness beyond its color/size), but this
  is consistent with every other hazard lacking final art
  (`docs/STATUS.md`) — an `[identity]` note, not specific to this level.

### Fix list (actionable, `[placement]` only)

**Root cause, so the Refine stage doesn't spend a round on an approach
that can't work:** `hazardConfig.ts` fixes `headingRadians` per hazard
*type*, not per placement — every Ion Storm travels due west
(`Math.PI`) and every Meteoroid due east (`0`) on its first leg,
staying at exactly its placement's y-coordinate the whole time (Ion
Storm's trochoid loop adds an orbiting offset around that fixed-y line,
not a change to the line itself). A level file cannot change a hazard's
direction — the only lever available is **choosing a y-coordinate that
doesn't put a wall/objective/resupply point directly in that hazard's
path**, or an x-coordinate already on the far side of a feature it would
otherwise cross before wrapping.

Verified by simulating each hazard's actual first-leg trajectory (20ms
steps) from its authored placement using the same physics
`MovingHazardManager`/`HazardZoneElement` use (trochoid carrier + orbit
for Ion Storm, straight line for Meteoroid; wrap condition matches
`MovingHazardManager.isOutOfBounds()` — physical shape radius only, no
cautious inflation — confirming none of these violations get preempted by
an early wrap):

1. **Ion Storm #1, placed `(3400, 950)`** — its westward sweep passes
   directly through **Wall A** (x≈2600, y 300-1700) at t≈1.9s into its
   first leg: minimum net clearance **-162px** (physical overlap, not
   just a close pass). Needs a y outside Wall A's y-range ± the required
   ~640px cautious margin (330 orbit-aware radius + 60 debris radius +
   250 floor) — e.g. y ≥ ~2340, or reposition west of Wall A entirely if
   that still serves its "north" role.
2. **Ion Storm #2, placed `(5000, 1200)`** — same issue, same wall:
   minimum net clearance **-155px** at t≈11.1s. Same fix approach — needs
   y ≥ ~2340 or ≤ a value clearing Wall A's band with the same ~640px
   margin.
3. **Ion Storm #3, placed `(2000, 3600)`** — sweeps directly over the
   **Entry Wormhole** `(400, 3800)` at t≈6.5s: minimum net clearance
   **-102px**. Needs y adjusted north by at least ~380-400px (target
   ≤~3220) to clear Entry by the required ~580px margin (330 + 250).
4. **Ion Storm #4, placed `(4200, 3300)`** — also passes close to Entry,
   borderline: minimum net clearance **+227px** at t≈16.7s, 23px under
   the 250px floor. Small nudge recommended (e.g. y → ~3000 or lower).
5. **Ion Storm #5, placed `(6300, 1800)`** — sweeps directly over the
   **Resupply point** `(3600, 1950)` at t≈11.8s: minimum net clearance
   **-124px**. Needs y adjusted by ~620px margin (330 + 250 + Resupply's
   own 40px radius) — e.g. y ≤ ~1330 or y ≥ ~2570.
6. **Meteoroid #0, placed `(1700, 3200)`** — its eastward path passes
   directly through **Wall C** (y 2800-3400 in that x range) at t≈14.9s:
   minimum net clearance **-94.8px** (a `blocksMovement` rock ending up
   physically embedded in a `blocksMovement` Debris Field instance — no
   crash, since no hazard-vs-hazard collider exists in this codebase, but
   a visible, undesigned overlap). Needs y outside Wall C's band by
   ~366px margin (250 + 60 + 56) — e.g. y ≤ ~2434 or y ≥ ~3766.
7. **Meteoroid #3, placed `(2900, 3600)`** — its eastward path comes
   within ~100px raw distance of the **Relay Beacon** `(6600, 3500)` at
   t≈13.2s: minimum net clearance **+44px**, well under the 250px floor —
   a fast, solid hazard nearly coinciding with the mandatory waypoint a
   player is actively trying to reach at that point in the loop. Needs y
   adjusted by ~306px margin (250 + 56) — e.g. y ≤ ~3194.

Not flagged (clean throughout their full first leg): Ion Storm #0 `(1200,
2600)`, Ion Storm #6 `(900, 1700)`, Meteoroid #1 `(3900, 1600)`, Meteoroid
#2 `(5700, 2400)`, Meteoroid #4 `(6800, 1500)`.

Re-verify with the same full-trajectory simulation approach (not just an
initial-point check) after any coordinate changes — this class of issue
is invisible to the initial-point-only method this candidate's own
comments used.

### Comparison note
Not applicable — single candidate targeting the level-009 slot, not a
divergent batch.

---

**Process notes for this run:**
- Playtest driver (`playtest-level-009*.js`, Playwright) was written to
  and run from the scratch directory
  (`C:\Users\bryan\AppData\Local\Temp\claude\C--Users-bryan-documents-claude-projects-trailing-edge\0329e8e4-fb03-412d-b974-81dc79c28677\scratchpad\`),
  never `src/`/`docs/`/any level file — deleted after use.
- Dev server run on port 5199 (5173 was already occupied by another
  process) via `npm run dev -- --port 5199 --strictPort`; stopped after
  the run.
- `src/levels/index.ts` was temporarily edited to import/register
  `LEVEL_009` so `getLevelConfig('level-009')` would resolve for the
  driver script; **never added to `src/config/levelOrder.ts`**. Reverted
  to its original content before finishing — confirmed via `git diff`
  showing no residual change (only a line-ending normalization warning,
  no content diff).
- Screenshots and the standalone clearance-verification scripts
  (`verify-level-009.js`, `verify-trochoid-sweep.js`,
  `verify-meteoroid-sweep.js`) remain in the scratch directory above for
  reference; they are not part of the repository.

## src/levels/level-010.ts (LEVEL_010) — VERDICT: flagged

Round 1 of at most 3 (checked `docs/history/level-eval-log-*.md` for prior
entries under this candidate's path/identity before starting — none found.
Circuit breaker not triggered).

### Structural: pass
- `npx tsc --noEmit -p .` — clean, no errors.
- `entryWormholeLocation`/`exitWormholeLocation`/`probeLocation`/
  `relayBeaconLocation` all present.
- Independently regenerated all four maze `debrisWall()` calls (30+31+30+31
  = 122 placements) and all four vault-box `debrisWall()` calls (7 each =
  28 placements) plus the 4 Nebula Field / 4 Ion Storm / 3 Meteoroid / 1
  resupply-point placements (161 hazard placements total — matches the
  live scene's `hazards.length` exactly, see below) and confirmed every
  coordinate, including sweep/bow undulation extremes, falls within
  `[0, 7290] x [0, 4101]`.
- Not registered in `src/levels/index.ts`'s `LEVELS` map or
  `src/config/levelOrder.ts`'s `LEVEL_ORDER` — expected and correct per the
  file's own header comment: GER mode, registration is the Refine stage's
  job. Confirmed via `git status`/`git diff` after the run: no residual
  content change to either file (the `git status` "M" on `index.ts` is a
  pre-existing line-ending-only artifact — `git diff` shows zero content
  hunks — not something this evaluation or the concurrent level-009
  evaluation introduced; same thing that sibling run's own log entry
  above independently reports after its own revert).

### Reachability/safety: pass for the maze+vault structure itself; a
separate, severe issue found in the moving-hazard roster (see below and
the fix list)
Driven via a scratch Playwright script (deleted after the run; dev server
on port 5261 stopped after the run) that patched the Vite dev server's
in-memory response for `src/levels/index.ts` to register `level-010`
*only within that one browser session* — no file on disk was edited to
run this check. Two full attempts were needed: the concurrent level-009
evaluation's own disk-based register/revert cycle (confirmed via that
run's process notes above) triggered Vite's file watcher to push a
full-page HMR reload to this session too partway through the first
attempt, wiping `window.*` handles — the driver was made resilient with a
retry-the-whole-session wrapper (a reload also resets in-scene state
either way) and a route-handler retry for the same underlying race. The
first attempt's apparent "crash" at the very last waypoint (`levelId`
flipped to `level-001` mid-check) was actually the *correct* completion
transition, not a real failure — see Exit Wormhole below.

- **Zero console errors** across both full attempts (load, ability
  force-grant, the full forward maze traversal, the vault
  blocked-approach + teleport-in, two separate wall-collision force-tests,
  a moving-hazard force-out-of-bounds test, and the full return traversal
  to Exit). One attempt logged benign WebGL driver warnings ("GPU stall
  due to ReadPixels", "texImage2D: width or height out of range") that
  correlate with `page.screenshot()` calls under headless Chromium, not
  with any level-010-specific texture/content — `generateTexture()` call
  sites project-wide all use small fixed pixel dimensions, none derived
  from this level's (largest-yet) 7290x4101 footprint. Treated as
  environment/harness noise, not a defect.
- `getLevelConfig('level-010')` loaded correctly both attempts: 161
  hazards, 7 moving hazards (4 Ion Storm + 3 Meteoroid, matching the
  config), ship spawned at the authored Entry (400, 3950).
- **Full forward traversal confirmed via real click-to-move, not
  trusted from the file's own trace comment:** Entry → Resupply (stopped
  just outside its `blocksMovement` collision radius, per the 2026-08-24
  rework — expected) → wallM0's bottom gap → lane1 (south of the vault) →
  [vault teleport, see below] → shifted into the vault's **east**-side
  350px corridor (not the west-side 220px one, arbitrarily) → north
  through that corridor → wallM1's top gap → lane2 → wallM2's bottom gap →
  lane3 → wallM3's top gap → Relay Beacon (arrived within 60px both
  attempts; objective readout flipped to `probe: yes  beacon: yes`
  immediately). A few individual legs reported a transient `STALLED`
  result (zero velocity, no progress) mid-transit — in every case,
  cross-referencing the ship's structure value at that moment (dropping in
  exact 25-point Meteoroid-impact increments, e.g. 100→75) confirms these
  are incidental hits from a drifting Meteoroid's `cancelTargetOnContact`
  clearing the click target, not the maze itself blocking passage — the
  very next waypoint's click always resumed normal movement. This is
  expected moving-hazard routing pressure, not a reachability defect.
- **Vault teleport range math, verified live, not just derived — and a
  real discrepancy found in the file's own self-reported slack:**
  organic click-to-move straight at the Probe center (2150, 1550) from
  open ground south of the vault, run twice independently, stopped the
  ship at **298.0px / 298.8px** from the Probe's center both times — not
  the file's claimed 268px. Root cause, confirmed by re-deriving from the
  actual generated wall geometry: the vault's south wall is in `'bow'`
  undulation mode (`BOW_AMPLITUDE = 30`), and its bow bulges *outward*
  (away from the box's center, toward a south-approaching ship) at the
  wall's midpoint — which is exactly `x = 2150`, the same x as the Probe
  and the natural, most-direct approach vector, not an edge case. The
  file's dev-time sanity check (`vaultApproachDistance = BOX_HALF + 60 +
  28 = 268`) never accounts for this ±30px undulation term, so it
  understates the true worst-case approach distance by exactly the bow's
  amplitude. **This does not flip the verdict on its own** — actual
  measured real margin under `abilityConfig.teleport.maxRange` (350px) is
  **~52px, not the claimed 82px**, still a genuine, comfortable (not
  hair's-breadth, unlike a past `level-007` finding that sat at exactly
  0px margin) safety margin — but the file's own claimed number is wrong
  and should be corrected. (By the same geometric analysis, the vault's
  west wall bulges outward identically, so it shares this same ~298px/52px
  figure; the north and east walls' bow bulges *inward* instead — a
  side effect of `debrisWall()`'s consistent per-wall endpoint ordering —
  so approaching from those two sides has *more* slack than claimed, not
  less. Not independently re-driven live for all four sides since the
  worst case is what matters for a pass/fail call, and it's covered.)
  Following the blocked-approach stop, `confirmTeleport({worldX: 2150,
  worldY: 1550}, ...)` was called directly (bracket-accessed private
  method, this guide's own established verification pattern) and landed
  the ship at the *exact* Probe coordinate (0.0px error) both times, with
  the objective readout flipping `probe: no` → `probe: yes` immediately —
  genuine, reproducible confirmation the vault is reachable exactly as
  designed. Screenshot: vault interior post-teleport, ship + Probe clearly
  inside a fully enclosed rock-fragment box.
- **Vault wall collision confirmed as a real, solid collider**
  (west wall): forced the ship to a point outside it and set a
  click-to-move target back toward the Probe; the ship stopped short of
  the wall both times, never crossing it via normal movement — matches
  the screenshot evidence below (ship visibly stopped between wallM0 and
  the vault's west wall, in the corridor between them).
- **Maze wall collision confirmed as a real, solid collider** (wallM1,
  x=2800): forced the ship to a point just west of it and set a
  click-to-move target well past it; the ship stopped at x≈2736 both
  attempts (identical to two decimal places), well short of x=2800,
  instead of passing through.
- **Moving hazard respawn confirmed:** forced a live Ion Storm's position
  to (-99999,-99999) via its private `zone` field; `MovingHazardManager`
  correctly repositioned it onto the level's perimeter within one update
  cycle, not left floating or stuck, both attempts.
- **Exit Wormhole and full-loop completion confirmed:** the return trip
  retraced the same maze (same east-side vault corridor, same four wall
  gaps) via real click-to-move. In the first attempt, arriving at Exit's
  coordinates triggered `handleLevelComplete()` exactly as designed — the
  scene transitioned to `level-001` (the same
  `LEVEL_ORDER.indexOf('level-010') === -1` → `LEVEL_ORDER[0]` artifact
  every unregistered GER candidate's evaluation has produced going back to
  `level-005`, not a defect). This is direct, live proof the full
  mandatory loop (Entry → Probe → Beacon → Exit) is genuinely completable,
  not soft-locked. (This was initially misread as a driver crash by an
  overly strict assertion in the script and is corrected here — the
  transition itself is the intended, successful outcome.) The second
  attempt's Exit approach was incidentally interrupted by another
  Meteoroid graze near the end of the return leg (same
  `cancelTargetOnContact` signature as the mid-route stalls above) and
  didn't re-attempt reaching Exit after that — not needed, since the first
  attempt already provided direct proof of completion.
- Screenshots (scratch directory, not persisted in the repo,
  `<scratch>/level010-shots/`): spawn (Entry + a Nebula Field toll,
  off-screen objective arrow visible), the vault interior immediately
  post-teleport (Ion Storm + Meteoroid both visible nearby, see
  Telegraphing below), the vault's west-wall block test (clearly shows
  wallM0 and the vault as two distinct parallel walls with the 220px
  corridor between them), the Relay Beacon area, the wallM1 block test,
  the moving-hazard respawn, and a late-game shot showing Meteoroid, Ion
  Storm, a Debris Field wall, and two Energy Node pickups all legible
  together in one frame.

### Convention alignment: notes
Independently recomputed every clearance/spacing/geometry number the
candidate's own comments claim, via a standalone script that regenerated
the actual `debrisWall()` output (not trusting the file's self-report):

- **Objective spacing** (diagonal = 8364.3px): Probe↔Beacon = 5523.1px
  (66.0%), Beacon↔Exit = 6425.7px (76.8%, right at the top of the 65-76%
  precedent band, same as `level-005`'s own 77% landing), Probe↔Exit
  (non-consecutive) = 1060.7px (12.7%). All match the file's own claimed
  figures exactly.
- **Maze wall no-gap safety margin, independently re-verified**: all four
  maze walls land in `'sweep'` mode (counts 30/31/30/31, all ≥
  `MIN_UNDULATE_COUNT` 8) with worst-case neighbor distance ~100.9px —
  matches the file's claimed "~19px margin" under the 120px threshold
  exactly.
- **Vault wall no-gap safety margin, independently re-verified**: all four
  vault walls land in `'bow'` mode at the non-standard `spacing=60` (count
  7 each, matching the file's claim), worst-case neighbor distance
  61.85px — a 58.15px margin, matching the file's claim exactly. All four
  corner joins measured at exactly 0.00px gap — genuinely sealed, matching
  the file's claim.
- **Vault interior net of energy-node keep-out**: 128x128px, matching the
  file's claimed figure exactly (comfortably above the 100px floor
  `level-007` established).
- **Vault teleport approach math**: see the discrepancy under
  Reachability/safety above (claimed 268px/82px slack; live-verified
  worst-case is 298px/52px slack, real but overstated in the file's own
  comment — the bow undulation's ±30px term was omitted from the dev-time
  sanity check's formula).
- Nebula Field placements match their stated intent (early-route toll,
  two bypass tolls at the maze's west/east gap thresholds — both
  deliberately overlapping a wall's edge per §6's explicit exception — and
  a bridging toll on the close Probe↔Exit hop) and stay 250px+ clear of
  every objective/resupply point where the exception doesn't apply
  (closest non-exempt pairing checked: N1↔Entry at ~290.5px net).
- Resupply's clearance from wallM0 initially looked concerning by a naive
  measurement (Resupply sits at y=3600, and wallM0's undulating bbox
  spans y up to 2900) but resolves cleanly on closer inspection: y=3600
  falls inside wallM0's own *gap* range (2900-4081), so no wall instance
  actually exists near that y — true nearest-wall distance is to the
  wall's pinned southern endpoint (1600, 2900), ~682.6px net, comfortably
  matching the file's claimed "~746px" (small difference is measurement
  convention, immaterial either way).
- Post-`level-008` placement: this candidate genuinely uses §8's license
  for a structurally new axis no prior level has attempted — a serpentine
  maze (`level-006`'s device) with a fully-enclosed sealed box (a new
  shape, not `level-003`/`007`'s `debrisRing()`) embedded directly inside
  one of the maze's own lanes, load-bearing on the maze's geometry rather
  than a separate corner pocket. This is a real combination, not a reskin
  of `level-006` or `level-007`.
- **Root-cause methodology gap, shared with the concurrent level-009
  evaluation above — see that entry's write-up for the full diagnosis,
  summarized here since it independently reproduces in this file too:**
  `hazardConfig.ts` fixes `headingRadians` per hazard *type*
  (`Math.PI`/west for Ion Storm, `0`/east for Meteoroid), not per
  placement, and the file's own clearance claims ("All seven initial
  placements keep 250px+ clearance... verified by distance") only checked
  each hazard's *starting point*, not its full first-leg path before
  `MovingHazardManager` would first wrap it. That method is insufficient
  here for the same reason it was insufficient for `level-009`, and
  arguably more severely so — see the dedicated finding below.

### Moving-hazard trajectory violations (severe, verified live via
full-path simulation — this is the actual `[placement]`-blocking issue)
Simulated each Ion Storm/Meteoroid placement's complete deterministic
first leg (trochoid carrier+orbit math for Ion Storm, straight line for
Meteoroid, 20ms steps, wrap condition matching
`MovingHazardManager.isOutOfBounds()` exactly — physical shape radius
only, no cautious inflation) against every actual generated Debris Field
wall/vault instance and every objective/resupply point. Given the maze's
four parallel full-height walls have gaps that **alternate between two
disjoint y-bands** (wallM0/wallM2's gap is y:2900-4081; wallM1/wallM3's is
y:20-1100), and Ion Storm/Meteoroid can only move in a straight
horizontal line (fixed heading, no y-drift), **no y-value lets a mover
threaded through one wall's gap also clear the next wall's gap** — a
horizontally-moving hazard starting anywhere between two walls is
essentially guaranteed to physically embed itself in one or more of them
before it would naturally wrap out of the map. The only genuinely safe
placements are ones already on the far side of *every* wall the hazard
would otherwise travel toward (west of `wallM0` for an always-west-moving
Ion Storm; east of `wallM3` for an always-east-moving Meteoroid) — this
matches exactly which placements came back clean below.

- **Ion Storm 1 (3400, 2200), lane2:** physically overlaps **wallM1**
  (-158.1px net clearance, i.e. embedded, at t=1.56s) and **wallM0**
  (-143.8px, t=7.02s) during its westward sweep. Also passes within
  98.1px of the vault's east/south walls at t=3.66s (a near-miss, not an
  overlap, but well under the 250px floor) — this is the deterministic
  cause of the vault-adjacency seen in the post-teleport screenshot, not
  coincidental drift.
- **Ion Storm 2 (4600, 1900), lane3:** overlaps **wallM2** (-163.9px,
  t=1.48s), **wallM1** (-130.9px, t=7.00s), and **wallM0** (-159.2px,
  t=12.86s) — three separate wall embeddings on one first leg. Also
  passes within 99.5px of the vault (east/south) and 130.2px (west).
- **Ion Storm 3 (6200, 2200), east region:** overlaps **wallM3**
  (-162.0px, t=3.52s), **wallM2** (-130.7px, t=10.68s), and **wallM1**
  (-143.9px, t=16.14s) and **wallM0** (-165.1px, t=21.52s) — all four
  maze walls on a single first leg. Also passes within 54.9px of the
  vault's south wall (the tightest near-miss found in this file) and
  157.2px of the Exit Wormhole.
- **Ion Storm 4 (900, 1000), west region:** clean — already west of every
  maze wall, heading further west, wraps before reaching anything.
- **Meteoroid 1 (2200, 3400), lane1:** overlaps **wallM1** (-101.3px,
  t=2.18s) and **wallM3** (-101.4px, t=10.76s) during its eastward run
  (passes safely through wallM2's gap, since y=3400 happens to sit inside
  it). Meteoroid is `blocksMovement: true`, so this is a solid rock
  ending up physically inside a solid debris wall — no crash (no
  hazard-vs-hazard collider exists anywhere in this codebase, matching
  the concurrent level-009 finding), but a plainly visible "rock phasing
  through rock" moment given Meteoroid renders at depth 8, above Debris
  Field's default depth 0.
- **Meteoroid 2 (3400, 900), lane2:** overlaps **wallM2** (-102.1px,
  t=2.22s); passes within 84.0px of wallM3 (a near-miss, not an overlap —
  y=900 sits inside wallM3's own gap band).
- **Meteoroid 3 (6500, 900), east region:** clean — already east of every
  maze wall, heading further east, nothing left to hit before it would
  wrap.

**Net result: 5 of 7 moving-hazard placements (3 of 4 Ion Storm, 2 of 3
Meteoroid) produce a genuine, deterministic physical overlap with the
maze's own walls — this level's core structural device — within the
first ~1.5-22 seconds of that hazard's very first leg, not as a rare
edge case.** Given `MovingHazardManager` only re-randomizes a hazard's
heading once it first drifts fully out of the map bounds (which, per the
simulation, several of these never even reach before hitting a wall
first), a player exploring this level's opening minutes will very likely
witness this directly. This is the same underlying root cause the
concurrent level-009 evaluation identified (a config-level gap, not a
content-agent mistake given how `level-design-guide.md` §7 currently
reads) — but it manifests far more severely here, because this
candidate's own defining axis (four parallel full-height serpentine walls
with alternating, disjoint-band gaps) is close to a worst case for a
fixed-single-axis-heading mover: nearly every interior-lane or "wrong
side" placement is mathematically guaranteed to cross at least one wall,
not just occasionally close to one.

### Telegraphing: notes
- The vault reads unambiguously as a solid, recognizable obstacle in
  every screenshot — same rock-fragment Debris Field texture/rotation
  cycling as every other wall in the level, not a different or
  special-looking texture. The west-wall-block-test screenshot in
  particular shows the vault and `wallM0` as two clearly distinct,
  equally "solid-looking" parallel walls with an open corridor between
  them — a player reading this scene has no reason to think the vault is
  more (or less) passable than any other wall here. **This directly
  answers this evaluation's specific brief on point (3):** embedding the
  vault inside a maze lane, rather than an open corner, does **not** by
  itself create an ambiguous "is this reachable" read — the vault's own
  telegraphing is exactly as clear as `level-003`/`007`'s corner pockets.
  `[placement]` — none on this specific question.
- The compound crowding visible in the post-teleport screenshot (Ion
  Storm + Meteoroid both near the vault) is **not** an independent
  telegraphing observation — it's a direct, explained consequence of the
  moving-hazard trajectory issue above (Ion Storm 1's sweep passes within
  98px of the vault on its very first leg). Fixing that issue (see fix
  list) will also resolve this.
- Ion Storm, Nebula Field, Meteoroid, and Debris Field all read as
  visually distinct from one another in every screenshot checked — none
  of the four is identifiable by color alone. `[identity]` — Ion Storm's
  currently-sourced texture (a gray swirl with distinct blue lightning-arc
  detail) reads as clearly more distinct from Nebula Field's plain soft
  purple/magenta cloud than the long-open GDD item describes — a positive
  data point for that still-open item, not a resolution of it (informal,
  incidental observation from this level's screenshots, not an exhaustive
  review). Doesn't affect the verdict.
- `[identity]` — the structure-vs-energy stakes-legibility question
  (`CLAUDE.md`/GDD §9) is now shared by three hazard types (Nebula Field,
  Ion Storm, Meteoroid all drain structure as of 2026-08-25) rather than
  Meteoroid alone, and nothing about any hazard's visual language marks
  which ones carry that stake — unchanged open item, not introduced or
  worsened by this candidate's placement choices specifically (this is a
  global hazardConfig property). Doesn't affect the verdict.

### Fix list (the only thing blocking `pass`)
All items below are `[placement]` — fixable by choosing different
coordinates in this level file, per `level-design-guide.md` §7's own
statement that a level author's only lever over a moving hazard is its
initial position (heading is fixed per-type in `hazardConfig.ts`, not
something this file can change).

1. **Ion Storm 1 (3400, 2200)** — physically overlaps wallM1 and wallM0
   during its first leg (see above). Move into the west region (x <
   ~1400, matching Ion Storm 4's already-clean placement) — no y-value in
   lane2 avoids crossing both walls, since their gaps sit in disjoint
   y-bands.
2. **Ion Storm 2 (4600, 1900)** — overlaps wallM2, wallM1, and wallM0.
   Same fix: relocate to the west region.
3. **Ion Storm 3 (6200, 2200)** — overlaps all four maze walls and passes
   within 54.9px of the vault. Same fix: relocate to the west region (the
   east region does not work for a west-heading hazard placed this far
   from the map's west edge, since it will cross every wall before ever
   reaching bounds).
4. **Meteoroid 1 (2200, 3400)** — overlaps wallM1 and wallM3. Relocate
   into the east region (x > ~5450, matching Meteoroid 3's already-clean
   placement) — no y-value in lane1 avoids crossing both walls to its
   east, for the same disjoint-gap-band reason as the Ion Storm cases.
5. **Meteoroid 2 (3400, 900)** — overlaps wallM2. Same fix: relocate to
   the east region.

**A caveat for the Refine stage:** relocating all five into their
respective single safe region (west for Ion Storm, east for Meteoroid)
will resolve the physical-overlap defect, but will also concentrate 3 of
4 Ion Storm and leave only 1 of 3 Meteoroid outside a "safe zone" — a
real change to this candidate's moving-hazard distribution/pacing across
the map, not a pure bugfix with zero design side effects. Re-verify
clearances (both static 250px-floor and the same full-first-leg
simulation used here) after any reposition, since this class of issue is
invisible to an initial-point-only check. Whether `level-design-guide.md`
§7 should be updated to document this heading-direction-vs-maze-wall
constraint explicitly (as the concurrent level-009 evaluation also
recommends for the general full-trajectory-check gap) is a call for
whoever picks up that cross-cutting item — both evaluations landing on
the same underlying root cause the same day is a strong signal it's
worth doing once, not per-level.

### Comparison note
Not applicable — single candidate targeting the level-010 slot, not a
divergent batch. (See level-009's own entry above for its axis; per this
run's brief, the two are meant to sit adjacently in `LEVEL_ORDER` with
deliberately distinct axes — level-009 pushes moving-hazard density and
variety, level-010 pushes Debris Field structural complexity — and that
distinction holds regardless of this evaluation's finding, which is about
a shared config-level root cause both files inherited, not about the two
candidates converging on the same design.)

---

**Process notes for this run:**
- Playtest driver (`level010-eval.js`, Playwright) and the standalone
  clearance/trajectory-verification scripts (`verify_level010.js`,
  `verify-moving-hazard-sweep-010.js`) were written to and run from the
  scratch directory
  (`C:\Users\bryan\AppData\Local\Temp\claude\C--Users-bryan-documents-claude-projects-trailing-edge\0329e8e4-fb03-412d-b974-81dc79c28677\scratchpad\`),
  never `src/`/`docs/`/any level file — all deleted after use.
- Dev server run on port 5261 (confirmed free before starting) via
  `npm run dev -- --port 5261 --strictPort`; stopped after the run.
- `src/levels/index.ts` was **never edited on disk** by this evaluation —
  registration for the playtest was done entirely via a Playwright
  `page.route()` interception patching the dev server's in-memory
  response for that one browser session, per this guide's established
  precedent (`level-005` through `level-008`'s entries in
  `docs/history/level-eval-log-2026-08-17.md`). The concurrent level-009
  evaluation's own disk-based register/revert cycle (see its process
  notes above) did trigger a full-page HMR reload of this session
  partway through, handled via a retry wrapper rather than a file-lock/
  coordination scheme.
- Screenshots remain in the scratch directory
  (`<scratch>\level010-shots\`) for reference; not part of the repository.
