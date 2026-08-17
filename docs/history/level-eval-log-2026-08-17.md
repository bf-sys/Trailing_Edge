# Level Evaluation Log — 2026-08-17

## src/levels/level-005.ts (level-005) — VERDICT: pass

Round 1 of at most 3 (checked `docs/history/level-eval-log-*.md` for prior
entries under this candidate's path/identity before starting — none found,
circuit breaker not triggered).

### Structural: pass
- `npx tsc --noEmit -p .` — clean, no errors.
- `entryWormholeLocation`/`exitWormholeLocation`/`probeLocation`/
  `relayBeaconLocation` all present.
- All 48 hazard placements (35 debris-wall segments + 4 Nebula Field + 5 Ion
  Storm + 4 Meteoroid) and the one resupply point fall within
  `[0, 6000] x [0, 3375]`.
- Not registered in `src/levels/index.ts`'s `LEVELS` map or
  `src/config/levelOrder.ts`'s `LEVEL_ORDER` — expected and correct per the
  file's own header comment: registration is the Refine stage's job, done
  once this candidate and its sibling (`level-006`) are both evaluated.

### Reachability/safety: pass
Driven via a scratch Playwright script (deleted after the run; dev server
on port 5199 stopped after the run) that patched the Vite dev server's
in-memory HTTP response for `src/levels/index.ts` to register `level-005`
*only within that one browser session* — no file on disk was edited to run
this check.

- Zero console errors across load, forced-ability-grant, all objective
  arrivals, the Wall A collision test, and the forced moving-hazard
  respawn.
- `getLevelConfig('level-005')` loaded correctly: 48 hazards, 9 moving
  hazards (5 Ion Storm + 4 Meteoroid), ship spawned at the authored Entry
  (550, 550).
- Probe reachable: jumping the ship to (5400, 600), 50px short of the
  authored (5450, 600), triggered `probeFound` via normal Arcade overlap.
  Screenshot: `02-near-probe.png` (also shows the off-screen-objective
  arrow correctly pointing toward the Beacon next).
- Relay Beacon reachable: overlap fires reliably at the exact authored
  point (600, 2800) — confirmed both via a dedicated diagnostic and the
  full-loop run (`12-beacon-reached.png`, `probe: yes beacon: yes`). Note:
  an artificial "50px off" jump toward the Beacon (as opposed to the exact
  point) did *not* reliably trigger overlap within the same wait window
  that worked fine for the Probe's identical 50px-off test — likely a
  narrower effective hit-radius than the Probe's, given
  `RelayBeaconObject`'s non-square-sprite `setCircleFromWorldRadius` scale
  math (`src/objects/arcadeBodyHelpers.ts`, which already carries a
  code-comment flagging this exact class of past bug). This is core
  `RelayBeaconObject`/`arcadeBodyHelpers.ts` behavior identical across
  every real level (001–004 construct the same config shape), not
  something level-005's placement data can change — noting it as an
  observation for whoever eventually revisits that shared code, not a
  level-005 defect. The Beacon **is** confirmed reachable via normal
  click-to-move (players click on the visible sprite, landing at/near its
  exact center, not at an arbitrary 50px offset).
- Exit Wormhole correctly gated: jumping to (5050, 1500) before the Beacon
  was reached left `GameScene` active (level not completed) —
  `LevelObjectiveTracker.canReturn()` correctly blocked early return
  (`04-near-exit.png`). After Probe → Beacon (exact points) → jumping to
  (5099, 1500), `handleLevelComplete()` fired correctly (scene transitioned
  away) — confirms the full mandatory loop is genuinely completable, not
  soft-locked. (The transition target was `level-001`, not `WinScene` —
  an artifact of `LEVEL_ORDER.indexOf('level-005')` returning -1 for an
  unregistered candidate, `LEVEL_ORDER[-1+1] === LEVEL_ORDER[0]`. Expected
  and harmless for this standalone evaluation; resolves once the Refine
  stage appends `level-005` to `LEVEL_ORDER` in order.)
- Wall A (the vertical debris wall at x=2000, y∈[300,1500]) confirmed as a
  real, solid collider: forced `ExplorationController`'s private `target`
  toward a point on its far side; the ship stopped at x≈1917, well short of
  x=2000, instead of passing through (`05-wallA-block-test.png`).
- Forced a linear moving hazard (`scene['movingHazards'][0]`, an Ion Storm)
  to (-99999, -99999); `MovingHazardManager` correctly respawned it onto
  the level perimeter (a fresh point near y≈0, within `[0,6000]x[0,3375]`)
  within one update cycle rather than leaving it floating or stuck
  (`06-moving-hazard-respawn.png`).
- Screenshots taken at spawn, each debris-wall cluster (A/B/C), the
  resupply point, a Nebula Field bypass-toll instance, and both the Beacon
  and Exit arrival states — all under
  `<scratch>/level-005-shots/01..13*.png` (scratch directory, not
  persisted in the repo).

### Convention alignment: notes
Independently recomputed every clearance/spacing number the candidate's own
comments claim, rather than trusting them — all checked out exactly:
- Objective spacing (diagonal ≈ 6884px): Probe↔Beacon ≈ 5325.6px (77.4%),
  Beacon↔Exit ≈ 4684.0px (68.0%), Probe↔Exit (non-consecutive) ≈ 965.7px
  (14.0%). Beacon↔Exit and the non-consecutive pair land inside/near the
  guide's precedent bands (65–76%, 12–13%); Probe↔Beacon is ~1.4 points
  above the 76% precedent ceiling. Guide §3 explicitly frames these numbers
  as "not a hard target," so this isn't a fail, just worth a second look if
  a future conforming pass tightens the range.
- All three Debris Field walls independently reverified 250px+ clear of
  every objective/resupply point (closest was Wall C to Exit at ~1269px —
  comfortably clear); none spans a full map dimension (Wall A: 1200px of
  3375px height; Wall B: 1400px of 6000px width; Wall C: diagonal, neither
  dimension). No sealed ring used this candidate, consistent with its
  stated axis (moving-hazard density, not a maze — that's the sibling
  candidate's territory per §8).
- Every one of the 5 Ion Storm and 4 Meteoroid per-instance clearance
  claims in the file's comments (e.g. "707px+ clear of Wall A," "390px+
  clear of the Probe") were recomputed from `hazardConfig.ts`'s actual
  radii and matched the stated figures exactly in every case checked.
- Nebula Field placements match their stated intent (bypass tolls at Wall
  A's south/open end and Wall B's east/open end, an early-route toll near
  Entry, a bridging toll on the close Probe↔Exit hop) and stay 250px+ clear
  of every objective/resupply point; one instance intentionally overlaps
  Wall C's edge, which §6 explicitly endorses as a "compound obstacle"
  reading, confirmed in `11-nebulaA-area.png`.
- Post-`level-003` placement: this candidate genuinely uses §8's license
  rather than reskinning an earlier level's shape — 9 total moving hazards
  (5 Ion Storm + 4 Meteoroid) vs. level-003/004's 3, on a uniformly-scaled
  larger map (6000×3375, a clean 1.1111× of level-003/004's 5400×3038,
  both dimensions sharing that one factor per §2's convention) specifically
  to give the added moving hazards more room. Debris/Nebula counts stay
  deliberately modest, which the file's own header explains is intentional
  (single-axis divergence from its sibling, not an oversight).

### Telegraphing: notes
- Debris Field walls (all three) read clearly as solid, distinct barriers
  against the starfield background in every screenshot — texture/rotation
  variety (`DEBRIS_TEXTURES` cycling, `debrisWall()`'s per-index rotation)
  keeps a long chain from reading as one copy-pasted sprite.
  `[placement]` — none, this reads well.
- The AsteroidField resupply point (a single large ore-rich rock) stays
  visually distinct from Debris Field's many-small-fragments look in every
  shot it appears in (`10-resupply-area.png`) — no confusion risk.
- Nebula Field's overlap with Wall C's edge (the deliberate "bypass toll"
  design) reads as intended — a compound obstacle, not a rendering
  accident (`09-wallC-area.png`/`11-nebulaA-area.png` region).
- `[identity]` — Ion Storm and Nebula Field remain visually close to each
  other in isolation (same soft-circle placeholder-texture family, color
  the only differentiator without `scan` active) — this is the GDD §9
  open item already tracked (particle trail / border-outline / two-
  phenomena fallback still unresolved), not something level-005's
  placement introduced or could fix. No instance in this candidate places
  the two hazard types close enough to each other to compound the
  existing identity-level ambiguity beyond its baseline (Ion Storm/Nebula
  Field pairs checked above are all 350px+ apart at authoring time).
  Informational only — doesn't affect the verdict or the fix list.
- `[identity]` — Meteoroid (the sole structure-draining hazard) and Ion
  Storm/Nebula Field (energy-draining) still rely on the same open
  structure-vs-energy stakes-legibility question flagged in
  `CLAUDE.md`/GDD §9. Not level-005-specific.

### Fix list: none — no `[placement]` findings.

### Comparison note (batch context)
See `level-006`'s own entry in this log for its axis and a direct
comparison paragraph, once evaluated in this same run.

## src/levels/level-006.ts (level-006) — VERDICT: pass

Round 1 of at most 3 (checked `docs/history/level-eval-log-*.md` for prior
entries under this candidate's path/identity before starting — none found;
`docs/history/level-eval-log-2026-08-17.md` didn't exist yet at the start
of this run for this candidate, and now contains only `level-005`'s entry
from a concurrent evaluation. Circuit breaker not triggered).

### Structural: pass
- `npx tsc --noEmit -p .` — clean, no errors.
- `entryWormholeLocation`/`exitWormholeLocation`/`probeLocation`/
  `relayBeaconLocation` all present.
- Independently regenerated every `debrisWall()` call (6 maze walls + 2
  spurs, 148 debris placements total) plus the 4 Nebula Field/2 Ion Storm/1
  Meteoroid/1 resupply-point placements and confirmed every coordinate
  falls within `[0, 6480] x [0, 3646]` — no out-of-bounds placements.
- Not registered in `src/levels/index.ts`'s `LEVELS` map or
  `src/config/levelOrder.ts`'s `LEVEL_ORDER` — expected and correct per the
  file's own header/footer comments: GER mode, registration is the Refine
  stage's job once this candidate and its sibling (`level-005`) are both
  evaluated.

### Reachability/safety: pass
Driven via a scratch Playwright script (deleted after the run; dev server
on port 5184 stopped after the run) that patched the Vite dev server's
in-memory HTTP response for `src/levels/index.ts` to register `level-006`
*only within that one browser session* — no file on disk was edited to run
this check.

- Zero console errors across every run: the full forward+return traversal,
  the isolated exit-approach retest, and the isolated moving-hazard
  respawn retest.
- Entry → Probe reachable via plain click-to-move (west region, open):
  ship reached (750, 726), 26px from the authored (750, 700). Screenshot:
  `006-02-at-probe.png`, debug readout confirms `probe: yes beacon: no`.
- Probe → Relay Beacon reachable via plain click-to-move through the full
  six-wall serpentine maze, following the file's own claimed trace
  (wall0 gap → lane1 → wall1 gap → ... → wall5 gap → Beacon), 13 waypoints,
  all reached within 100px. Ship arrived at (5700, 2817), 83px from the
  authored (5700, 2900). Screenshot: `006-03-at-beacon.png`, debug readout
  confirms `probe: yes beacon: yes`.
- Relay Beacon → Exit reachable via the same maze in reverse (12
  waypoints, all reached). One waypoint directly beneath spur A's western
  debris piece (a straight-line click from the prior waypoint happened to
  aim right at that piece's collision circle) reported `[STUCK]` on **both**
  the forward and return legs at the identical position (2200, 3112) —
  but the very next click from that exact stuck position, aimed at the
  next waypoint, succeeded cleanly both times. This means the region is
  genuinely reachable (matches the file's own "confirmed reachable by
  construction" claim about spur A) and the repeated STUCK result was a
  test-harness waypoint-choice artifact (my script's greedy straight-line
  click landed on the spur's collision shadow), not a level defect —
  reproducing identically on both legs rules out a random flake and
  confirms it's specifically that one coordinate, not the level's
  reachability.
- The final "near Exit" leg of the full run also reported `[STUCK]`
  (timeout at (750, 862), 638px short) — re-tested in isolation
  (teleporting the ship to the same starting point via the dev ship
  handle, bypassing the long full-run session) and reached the target
  cleanly in 8.1s with a smooth, unobstructed position trace
  (`006-06-exit-retest.png`) — confirms this was a long-session
  timing/harness artifact (likely accumulated click-timing drift after
  ~25 waypoints), not a reachability problem. Deliberately stopped ~150px
  short of the exact Exit Wormhole coordinate (radius 40) throughout to
  avoid tripping `handleLevelComplete()`, which would misbehave for an
  intentionally-unregistered GER candidate (`LEVEL_ORDER.indexOf()` = -1)
  — a test-harness precaution, not something being reported as a defect.
- Forced a linear moving hazard (`scene['movingHazards'][0]`, an Ion
  Storm) to (-99999, -99999) in an isolated retest; `MovingHazardManager`
  correctly respawned it to (1411, 3631) — on the level's bottom
  perimeter, within `[0, 6480] x [0, 3646]` — within one update cycle,
  not left floating or stuck (`006-07-hazard-respawn.png`).
  `scene['movingHazards'].length` was confirmed as 3 (2 Ion Storm + 1
  Meteoroid, matching the config) at scene creation.
- Screenshots taken at spawn, Probe, Beacon, the Exit approach, wall0's
  gap + Nebula Field + spur A together, wall3's gap + spur B (also showing
  wall2/wall4 partially at the screen edges), an Ion Storm instance, and
  the resupply point — all under `<scratch>/006-*.png` (scratch directory,
  not persisted in the repo).

### Convention alignment: notes
Independently recomputed every clearance/spacing number the candidate's
own comments claim, rather than trusting them — all checked out exactly:
- Objective spacing (diagonal ≈ 7435.3px): Probe↔Beacon ≈ 5416.9px
  (72.9%), Beacon↔Exit ≈ 5105.4px (68.7%), Probe↔Exit (non-consecutive) ≈
  950px (12.8%) — all three land inside the guide's precedent bands
  (65–76% consecutive, 12–13% non-consecutive), matching the file's own
  claimed figures to one decimal place.
- All six maze walls independently regenerated and reverified: none spans
  a full map dimension (each covers ~2680px of the 3646px height, leaving
  a ~926–946px gap at its open end — comfortably more than the ~120px
  two-debris-radius minimum). Every wall segment sits 250px+ from every
  objective/resupply point (closest was the Beacon to wall5 at 501px; west
  cluster objects sit ~1450–1900px from wall0). No sealed `debrisRing()`
  used, consistent with the file's stated rationale (a maze is a different
  device than a ring; mixing them would blur the axis).
- Every Nebula Field/Ion Storm/Meteoroid initial-placement clearance claim
  recomputed from `hazardConfig.ts`'s actual radii: all comfortably clear
  of both objectives (nearest was Nebula4 to Exit at 475px) and walls
  (nearest was Ion Storm2 to wall1 at 302px) — no instance falls under the
  250px floor.
- Nebula Field placements match their stated intent (tolling wall0's and
  wall5's primary gaps — the maze's west/east thresholds — plus an
  early-route toll near Entry and a bridging toll on the close Probe↔Exit
  hop); Nebula1's 150px distance to wall0's nearest debris piece is a
  deliberate near-overlap (§6's "compound obstacle" pattern), confirmed
  reading correctly in `006-08-wall0-nebula-spur.png`.
- Post-`level-004` placement: this candidate genuinely uses §8's license
  for a different axis than a reskin — a six-wall, alternating-gap
  serpentine maze with two interlocking spurs is a structurally different
  device from every wall pattern used in level-001–004 (simple
  both-ends-open straight dividers) and from level-003's single sealed
  ring. It's also genuinely different from its sibling `level-005`
  (moving-hazard density, simple walls, no maze) — see the comparison
  below. Moving-hazard count is deliberately held at the pre-§8 baseline
  (2 Ion Storm + 1 Meteoroid) specifically so the two sibling candidates
  read as distinct single-axis pushes rather than both drifting toward
  "harder everywhere."

### Telegraphing: notes
- All six Debris Field walls plus both spurs read clearly as solid,
  visually varied barriers against the starfield background —
  texture/rotation cycling keeps the long chains and the L-shaped
  spur/wall junctions from reading as copy-pasted (`006-08`, `006-10`).
  `[placement]` — none, this reads well; the spur/wall junctions add real
  visual complexity without becoming an unreadable blob at normal zoom.
- The AsteroidField resupply point stays visually distinct from Debris
  Field's many-small-fragments look (`006-11-resupply.png`, wall4 visible
  at a comfortable distance in the same shot).
- Nebula Field's near-overlap with wall0's gap reads as a deliberate
  compound obstacle, not a rendering accident (`006-08`).
- `[identity]` — Ion Storm (`006-09-ionstorm1.png`) and Nebula Field
  remain visually close to each other in isolation (same soft-circle
  placeholder-texture family, color the only differentiator without
  `scan` active) — this is the GDD §9 open item already tracked (particle
  trail / border-outline / two-phenomena fallback still unresolved), not
  something this candidate's placement introduced or could fix.
  Rechecked every Ion Storm↔Nebula Field pair's placement distance: the
  closest is ~966px apart, so this candidate doesn't compound the
  existing identity-level ambiguity beyond its baseline. Informational
  only — doesn't affect the verdict or the fix list.
- `[identity]` — Meteoroid (the sole structure-draining hazard) vs. the
  three energy-draining hazard types still rely on the same open
  structure-vs-energy stakes-legibility question flagged in
  `CLAUDE.md`/GDD §9. Not level-006-specific.

### Fix list: none — no `[placement]` findings.

### Comparison note (batch context)
`level-005` and `level-006` are genuinely different candidates for the
same post-`level-004` slot, not cosmetic variants of each other:

- **level-005** pushes moving-hazard *density* — 9 total (5 Ion Storm + 4
  Meteoroid) vs. the pre-§8 baseline of 2–3 — on a map scaled 1.111× from
  level-003/004, using simple straight/diagonal Debris Field walls (no
  maze, no sealed section). Its strength is testing sustained
  multi-hazard-avoidance pressure while navigating.
- **level-006** pushes Debris Field *routing complexity* — a six-wall,
  alternating-gap serpentine maze with two interlocking spurs forcing a
  genuine zigzag between Probe and Beacon — on a map scaled 1.2× from
  level-004, while deliberately holding moving-hazard count at baseline
  (2 Ion Storm + 1 Meteoroid). Its strength is testing sustained
  multi-step spatial routing/pathfinding under a normal-movement-only
  constraint (no sealed/ability-gated section here).
- Both passed verification with zero `[placement]` fixes needed and no
  reskin concerns. If a future level wants to combine both axes (a maze
  patrolled by drifting hazards), that's a natural next experiment once
  each axis is independently validated — a call for the Refine stage/
  project owner, not this evaluation.
