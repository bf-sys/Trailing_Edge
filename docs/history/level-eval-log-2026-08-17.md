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

## src/levels/level-007.ts (level-007) — VERDICT: flagged

Round 1 of at most 3 (checked `docs/history/level-eval-log-*.md` for prior
entries under this candidate's path/identity before starting — none found.
Circuit breaker not triggered).

### Structural: pass
- `npx tsc --noEmit -p .` — clean, no errors.
- `entryWormholeLocation`/`exitWormholeLocation`/`probeLocation`/
  `relayBeaconLocation` all present.
- Independently regenerated `debrisWall()` (Wall A/B/C, 11+13+10 = 34
  placements) and `debrisRing()` (3 rings x 9 = 27 placements) plus 4
  Nebula Field / 2 Ion Storm / 1 Meteoroid / 1 resupply-point placements
  (68 hazard placements total) and confirmed every coordinate falls within
  `[0, 7020] x [0, 3949]` — no out-of-bounds placements. Ring chord spacing
  independently recomputed: `2 x 150 x sin(pi/9) ~= 102.6px`, matching the
  file's claimed "~103px," comfortably under the 120px (2x60 debris
  radius) overlap threshold — all three rings are genuinely gap-free.
- Not registered in `src/levels/index.ts`'s `LEVELS` map or
  `src/config/levelOrder.ts`'s `LEVEL_ORDER` — expected and correct per the
  file's own header comment: GER mode, registration is the Refine stage's
  job once this candidate and its sibling (`level-008`) are both evaluated.

### Reachability/safety: pass
Driven via a scratch Playwright script (deleted after the run; scratch
screenshot directory also deleted, not persisted) that patched a
dedicated dev server instance's (port 5220, separate from any other
concurrent evaluation's dev server) in-memory HTTP response for
`src/levels/index.ts` to register `level-007` *only within that one
browser session* — no file on disk was edited to run this check.

- Zero console errors across every run: initial load, the moving-hazard
  force-out-of-bounds test, the early (pre-beacon) Exit-gate check, the
  Wall A collision test, all three sealed-ring blocked-approach +
  teleport-in tests, and the final post-beacon Exit completion.
- `getLevelConfig('level-007')` loaded correctly: 68 hazards, 3 moving
  hazards (2 Ion Storm + 1 Meteoroid, matching the config), ship spawned
  at the authored Entry (500, 3550).
- **Sealed-ring range math independently recomputed against
  `abilityConfig.teleport.maxRange` (350px, confirmed by reading
  `src/config/abilityConfig.ts` directly, not trusting the candidate's
  comment):** `approach_distance = SEALED_RING_RADIUS(150) + 60 (debris
  radius, hazardConfig.ts) + 28 (ship half-size) = 238px`, comfortably
  under 350px with 112px of slack — matches the candidate's own claimed
  figures exactly. **Confirmed live, not just on paper, for all three
  rings:**
  - Probe pocket (1000,700): normal click-to-move approach from 350px
    south stopped at 235.7px from center (consistent with the ~238px
    collision-edge math plus the ship's stop radius) — genuinely blocked.
    `confirmTeleport` called directly (bracket-accessed private method,
    same pattern this guide's own verification checklist endorses) from
    that blocked position landed exactly on (1000,700); the on-screen
    debug readout flipped from `probe: no beacon: no` to `probe: yes
    beacon: no` immediately after.
  - Resupply pocket (3800,2000): same result — blocked at 235.7px from
    center, teleport-in landed exactly on (3800,2000).
  - Relay Beacon pocket (6300,3400): same result — blocked at 235.7px
    from center, teleport-in landed exactly on (6300,3400); debug readout
    flipped to `probe: yes beacon: yes`.
  - All three rings' blocked/teleport-in tests were spaced 8.5s+ apart to
    clear `teleport`'s 8s cooldown between uses (an early combined-run
    attempt without this spacing produced one false "teleport did nothing"
    result at the Resupply ring purely from testing too fast, not a level
    defect — re-verified cleanly once spaced out).
- Exit Wormhole correctly gated: jumping directly onto Exit's coordinates
  before the Beacon was reached left the scene on `GameScene`'s
  `level-007` state (level not completed) — `LevelObjectiveTracker.canReturn()`
  correctly blocked early return. After Probe -> Beacon (both reached via
  teleport as above) -> normal click-to-move toward Exit (1850,1150),
  `handleLevelComplete()` fired correctly: the scene (still keyed
  `GameScene`, since the Scene class is reused across levels) reloaded
  with `levelId: level-001` and the ship at level-001's authored Entry
  (300,300) — confirms the full mandatory loop is genuinely completable,
  not soft-locked. (The transition target was `level-001`, not `WinScene`
  — an artifact of `LEVEL_ORDER.indexOf('level-007')` returning -1 for an
  unregistered candidate, `LEVEL_ORDER[-1+1] === LEVEL_ORDER[0]`. Expected
  and harmless for this standalone evaluation, same as level-005/006's
  prior entries in this log; resolves once the Refine stage appends
  `level-007` to `LEVEL_ORDER` in order.)
- Wall A (the vertical debris wall at x=2400, y in [2200,3400]) confirmed
  as a real, solid collider: forced `ExplorationController`'s private
  `target` toward a point well past it (2900,2800); the ship stopped at
  x~2317, short of x=2400, instead of passing through.
- Forced a linear moving hazard (`scene['movingHazards'][0]`, an Ion
  Storm, via its private `zone` field bracket-accessed directly) to
  (-99999,-99999); `MovingHazardManager` correctly respawned it to
  (6997.5, 1059.7) — on the level's right-edge perimeter, within
  `[0,7020]x[0,3949]` — within one update cycle, not left floating or
  stuck.
- Screenshots taken at spawn, the moving-hazard force/respawn pair, the
  early-Exit-gate check, the Wall A block test, each of the three rings'
  blocked-approach and teleported-inside states, and the final
  level-complete transition — all under `<scratch>/level-007-shots/*.png`
  (scratch directory, deleted after the run per this role's cleanup rule).

### Convention alignment: notes
Independently recomputed every clearance/spacing number the candidate's
own comments claim, rather than trusting them:
- Objective spacing (diagonal ~= 8054.5px, recomputed from
  `sqrt(7020^2+3949^2)`): Probe<->Beacon ~= 5948.1px (73.8%), Beacon<->Exit
  ~= 4986.5px (61.9%), Probe<->Exit (non-consecutive) ~= 961.8px (11.9%) —
  all three match the file's own claimed figures to one decimal place.
  Beacon<->Exit sits a bit under the guide's 65-76% precedent band, which
  the file's own comment already acknowledges and explains (Exit is
  geometrically constrained by needing to sit close to both Probe and the
  far corner Probe was pushed into) — §3 states the band is "not a hard
  target," and level-005 already landed outside it on the high side, so
  this isn't a fail.
- All three Debris Field walls independently reverified 250px+ clear of
  every objective/resupply point and every *other* ring (closest:
  Wall C<->Exit at ~790px, Wall B<->Resupply-ring-outer-edge at ~730-790px
  depending on measurement convention — see note below); none spans a
  full map dimension (Wall A: 1200/3949 height; Wall B: 1400/3949 height;
  Wall C: 1000/7020 width).
- **Minor measurement-convention note (doesn't affect the verdict):** the
  file's own ring-to-wall clearance comments (e.g. "Wall B: closest point
  to the Resupply ring's outer edge is ~790px") measure to the wall's
  *centerline*, not accounting for the wall's own 60px debris collision
  radius. True edge-to-edge collision-body distance for that pairing is
  ~730px, not 790px. Every such pairing stays far above any relevant
  threshold either way, so this doesn't change any pass/fail outcome —
  flagging only because this evaluation's job is to recompute rather than
  trust the candidate's own math, and this is the one place the two
  didn't match exactly.
- Nebula Field placements match their stated intent (bypass toll at Wall
  A's south/open end, early-route toll near Entry, bridging toll on the
  close Probe<->Exit hop, toll on the Resupply/Wall-B-to-Beacon route) and
  stay 250px+ clear of every objective/resupply point — closest is the
  Probe<->Exit bridging instance (1500,1000) to Exit at ~280.8px,
  comfortably over the floor though the tightest of the four.
- Post-`level-006` placement: this candidate genuinely uses §8's license
  for a different axis than either sibling — three simultaneous
  `debrisRing()`-sealed pockets (Probe, Resupply, *and* the mandatory
  Relay Beacon, the latter two never attempted by level-003 or any prior
  level) is a structurally different device from level-005's
  moving-hazard-density push and level-006's single serpentine maze.
  Moving-hazard count is deliberately held at the pre-§8 baseline (2 Ion
  Storm + 1 Meteoroid) so this candidate reads as a single-axis experiment
  (sealed-section density) rather than escalating everything at once.

**One placement issue found, not caught by the file's own "verified by
distance" claim:**
- Ion Storm 2's initial placement (5200,1800) sits **essentially exactly
  at the 250px floor** from Wall B, not comfortably clear of it like
  every other measured clearance in this file. Wall B is a vertical
  segment at x=4800, y in [1200,2600]; y=1800 falls within that range, so
  the true continuous point-to-line distance is exactly `400 (horizontal
  gap) - 90 (ionStorm radius, hazardConfig.ts) - 60 (debris radius) =
  250.0px`. Measured against the actual discretized debris-ball nearest to
  y=1800 (at y~1783.3), it's 250.35px. Both are technically "250px+," but
  this is the tightest clearance anywhere in the file by a wide margin —
  every other measured pairing is 275px or more, most are in the
  700-4000px range. Ion Storm's authored `headingRadians: Math.PI`
  (hazardConfig.ts) also means it drifts in the -x direction from spawn,
  i.e. directly toward Wall B on its first leg. Not a functional defect
  (Ion Storm doesn't `blocksMovement`, so passing through/near the wall
  visually is the already-flagged, accepted §7 non-issue, not new to this
  candidate), but this reads as a coincidence of the two authored values
  rather than a deliberate margin, and it's easy to fix.

### Telegraphing: notes
- All three sealed rings read unambiguously as solid, gap-free barriers
  in every screenshot — the Debris Field texture/rotation cycling makes
  each ring look like one continuous obstacle, not separate dodgeable
  rocks, and the enclosed object (Probe / AsteroidField / Relay Beacon
  sprite) is clearly visible sitting inside once teleported in. `[placement]`
  — none, this reads well; three rings in one level doesn't feel
  repetitive on screen because each encloses a different, visually
  distinct object.
- Wall A reads clearly as a solid, visually varied barrier against the
  starfield background.
- The Nebula Field instance visible near spawn is clearly distinct from
  the Debris Field texture family (soft purple circle vs. rock-fragment
  cluster) — no confusion risk in the screenshots taken.
- `[identity]` — Ion Storm and Nebula Field remain visually close to each
  other in isolation (same soft-circle placeholder-texture family, color
  the only differentiator without `scan` active) — this is the GDD §9
  open item already tracked (particle trail / border-outline / two-
  phenomena fallback still unresolved), not something this candidate's
  placement introduced. Checked every Ion Storm<->Nebula Field pair's
  placement distance: closest is ~1360px apart, so this candidate doesn't
  compound the existing identity-level ambiguity beyond its baseline.
  Informational only — doesn't affect the verdict or the fix list.
- `[identity]` — Meteoroid (the sole structure-draining hazard) vs. the
  three energy-draining hazard types still rely on the same open
  structure-vs-energy stakes-legibility question flagged in
  `CLAUDE.md`/GDD §9. Not level-007-specific.

### Fix list (the only thing blocking `pass`)
- **[placement]** Ion Storm 2's initial position (5200,1800) is
  essentially exactly 250px from Wall B's collision edge (250.0px by
  continuous point-to-line measurement, 250.35px against the nearest
  actual debris placement) — the tightest clearance anywhere in this file
  by a wide margin, and its authored `headingRadians` drifts it toward
  that wall from spawn. Move it at least 50-100px further from Wall B
  (e.g. to (5300,1800) or (5250,1900)) to give it genuine margin
  consistent with every other clearance in the level, rather than sitting
  right at the guide's stated floor.

### Comparison note (batch context)
See `level-008`'s own entry in this log for its axis, once evaluated in
this same run (concurrent evaluation — check this file for that entry
before assuming it isn't there yet).

## src/levels/level-007.ts (level-007) — VERDICT: pass (Round 2 of at most 3)

Round 2 of at most 3 (checked `docs/history/level-eval-log-*.md` for prior
entries under this candidate's path/identity before starting — found
exactly one, this same file's Round 1 entry above, VERDICT flagged.
Circuit breaker not triggered: 2 rounds used, cap is 3).

**What changed since Round 1:** the file's only edit is Ion Storm 2's
initial placement, moved from `(5200, 1800)` to `(5300, 1800)` — the fix
Round 1's single `[placement]` finding asked for — plus a new inline
comment at that line documenting the change and pointing back at this log.
Everything else (objective locations, all three `debrisWall()` calls, all
three `debrisRing()` pockets, Nebula Field placements, Meteoroid, sizing)
is byte-for-byte the same content Round 1 already verified.

### Structural: pass
- `npx tsc --noEmit -p .` — clean, no errors (re-run fresh this round).
- All four required objective fields present; every placement's coordinates
  independently re-confirmed within `[0, 7020] x [0, 3949]`.
- Still correctly unregistered in `src/levels/index.ts`/`LEVEL_ORDER` — GER
  mode, expected.

### Reachability/safety: pass
Re-driven end-to-end via a fresh scratch Playwright script (Node +
`playwright`, written to `%TEMP%\level007-eval-scratch\`, deleted after the
run along with its screenshots) against a dedicated dev server instance on
port 5233 (confirmed free before starting; killed after). Same in-memory
`src/levels/index.ts`-module patch technique as Round 1 (fetched the real
Vite-transformed module, patched its JS text in a `page.route` intercept to
register `level-007`, no file on disk touched) — Continue-clicked from
`TitleScene` after seeding `trailing_edge_save` with `levelId: 'level-007'`.

- Zero console errors across the full run (load, moving-hazard force-
  out-of-bounds test, Wall A collision test, all three sealed-ring
  blocked-approach + teleport-in tests, exit completion).
- `getLevelConfig('level-007')` loaded correctly: `levelId` reads
  `level-007`, 68 hazards, 3 moving hazards, ship spawned at authored Entry
  (500, 3550).
- **One correction to how this round drove the ring tests, noted for
  future evaluators of this candidate or its siblings:** entering
  `level-007` directly (GER mode, no prior `LEVEL_ORDER` levels completed
  this session) starts with **zero** unlocked abilities —
  `AbilityComponent.tryActivate('teleport', ...)` fails closed
  (`isUnlocked` gate) until `ProgressionManager.grantNextAbility()` is
  called. Round 1's log doesn't mention this explicitly; this round
  force-granted all three abilities via
  `window.getProgressionManager().grantNextAbility()` x3 (same dev-only
  handle `TEST_LEVEL_ID` uses) before attempting any teleport, and also
  found that a stale `ExplorationController` click-to-move target left
  over from an earlier test step (bracket-accessed `target` field) keeps
  driving the ship after a direct `setPosition()` reposition unless
  explicitly cleared (`ec['target'] = null`) — both are test-harness
  details, not level defects, but worth recording so a Round 3 (if ever
  needed) doesn't waste a cycle rediscovering them.
- **Sealed-ring range math independently recomputed against
  `abilityConfig.teleport.maxRange`** (350px, read directly from
  `src/config/abilityConfig.ts`, not trusted from the candidate's comment):
  `SEALED_RING_RADIUS(150) + 60 (debris radius, hazardConfig.ts) + 28 (ship
  half-size) = 238px`, comfortably under 350px. **Confirmed live for all
  three rings, unchanged from Round 1:**
  - Probe pocket (1000,700): blocked approach at 235.72px from center;
    `confirmTeleport` landed exactly on (1000,700) (0.0px error); objective
    readout flipped `probe: no -> probe: yes`.
  - Resupply pocket (3800,2000): blocked at 235.72px; teleport-in landed
    exactly on (3800,2000).
  - Relay Beacon pocket (6300,3400): blocked at 235.72px; teleport-in
    landed exactly on (6300,3400); readout flipped to
    `probe: yes  beacon: yes`.
  - Rings spaced 8.5s+ apart to clear teleport's cooldown between uses.
- Exit Wormhole: normal click-to-move from open ground near (1850,1150)
  (unsealed, per the file's own design) completed the level —
  `handleLevelComplete()` fired, scene reloaded with `levelId: level-001`
  and ship at level-001's Entry (300,300). Same `LEVEL_ORDER.indexOf(-1)`
  artifact Round 1 and level-005/006 already produced for unregistered GER
  candidates — expected, not a defect.
- Wall A (vertical debris wall, x=2400, y in [2200,3400]) re-confirmed solid:
  ship forced to (2000,2800), click-to-move target set to (2600,2800)
  (past the wall, corrected this round to land inside the visible camera
  viewport — Round 1's equivalent test used a target that happened to fall
  in-frame already), ship stopped at x=2317, short of x=2400.
- Forced a linear moving hazard (`scene['movingHazards'][0]`'s private
  `zone` field, bracket-accessed) to (-99999,-99999); `MovingHazardManager`
  respawned it to (3213.3, 1.8) — on the level's top-edge perimeter, within
  `[0,7020]x[0,3949]`, within one update cycle.
- Screenshots taken at spawn, the moving-hazard force/respawn pair, the
  Wall A block test, each of the three rings' blocked-approach/teleported-
  in states, and the final exit-completion transition — all under
  `%TEMP%\level007-eval-scratch\shots\*.png` (deleted after the run).
  Visually re-confirmed: all three rings still read as solid, gap-free
  barriers; Wall A reads as a clear rock-fragment wall; the Nebula Field
  instance near spawn is visually distinct (soft purple circle) from the
  Debris Field texture family.

### Convention alignment: notes
- Objective spacing independently recomputed fresh this round (unchanged,
  since none of the four core-loop object coordinates changed):
  diagonal = 8054.5px; Probe<->Beacon = 5948.1px (73.8%, in the 65-76% band);
  Beacon<->Exit = 4986.5px (61.9%, a bit under the band, same
  geometrically-explained/accepted gap Round 1 noted — not a hard target
  per section 3); Probe<->Exit (non-consecutive) = 961.8px (11.9%, matches the
  12-13% band). All match Round 1's figures exactly.
- **Ion Storm 2's fix verified directly, not just read from the comment:**
  live position at spawn read as (5287.75, 1800) — the ~12px difference
  from the authored (5300,1800) is the hazard's own drift during the ~0.8s
  between scene creation and this check (speed 15px/s x 0.8s ~= 12px,
  heading `Math.PI` i.e. -x, matching `hazardConfig.ts`). Clearance from
  Wall B (vertical segment at x=4800) recomputed at the authored spawn
  point: `500 (horizontal gap) - 90 (ionStorm radius) - 60 (debris radius)
  = 350px` — up from Round 1's 250.0px-exactly measurement, comfortably
  clear and now in line with every other measured pairing in this file.
  This was the only outstanding issue from Round 1 and it's resolved.
- All three Debris Field walls, all three rings, and all four Nebula Field
  placements are unchanged from Round 1's independently-verified figures
  (re-spot-checked Wall B<->Resupply-ring and Probe<->Exit-bridging-Nebula
  distances this round; both matched Round 1's numbers to within rounding).
- No new convention-alignment issues found.

### Telegraphing: notes
- All three sealed rings, Wall A, and the Nebula Field instances read the
  same as Round 1 described — no regression, no new finding. `[placement]`
  — none.
- `[identity]` — Ion Storm vs. Nebula Field color-only differentiation
  remains the open GDD section 9 item (particle trail / border-outline / two-
  phenomena fallback still unresolved) — not introduced or worsened by
  this candidate. Unchanged from Round 1.
- `[identity]` — Meteoroid (sole structure-draining hazard) vs. the three
  energy-draining hazard types still relies on the open structure-vs-
  energy stakes-legibility question (CLAUDE.md/GDD section 9). Not
  level-007-specific. Unchanged from Round 1.

### Fix list
None. The one Round 1 `[placement]` finding (Ion Storm 2's clearance from
Wall B) is fixed and independently re-verified live. No new issues found
this round. Clear to register (`src/levels/index.ts` +
`src/config/levelOrder.ts`), alongside its sibling `level-008` once that
candidate's own evaluation is settled.

### Comparison note (batch context)
Unchanged from Round 1: `level-007`'s axis (three simultaneous
`debrisRing()`-sealed pockets — Probe, Resupply, and the mandatory Relay
Beacon) remains structurally distinct from `level-005` (moving-hazard
density) and `level-006` (a single serpentine maze, no sealed sections).
See `level-008`'s own entry in this log for its axis, if evaluated in this
same run (concurrent evaluation — check this file for that entry before
assuming it isn't there yet).

## src/levels/level-008.ts (level-008) — VERDICT: flagged

Round 1 of at most 3. Note on this run's provenance: a prior evaluation
attempt for this exact candidate was started and dropped mid-run due to an
infrastructure failure (a dropped API connection), not anything about the
candidate. Checked `docs/history/level-eval-log-*.md` for any existing
`level-008` entry before starting (including a possible partial one from
that interrupted attempt) — found none (only forward references to it from
`level-007`'s entries above, written before `level-008` had been
evaluated). Circuit breaker not triggered; this is a clean Round 1.

### Structural: pass
- `npx tsc --noEmit -p .` — clean, no errors.
- `entryWormholeLocation`/`exitWormholeLocation`/`probeLocation`/
  `relayBeaconLocation` all present.
- Independently regenerated both `debrisWall()` calls (19 placements) and
  all eight `nebulaWall()` calls (88 placements) plus the 2 Ion Storm/1
  Meteoroid/1 resupply-point placements (110 hazard placements total) and
  confirmed every coordinate falls within `[0, 6750] x [0, 3798]` — no
  out-of-bounds placements.
- Not registered in `src/levels/index.ts`'s `LEVELS` map or
  `src/config/levelOrder.ts`'s `LEVEL_ORDER` — expected and correct per the
  file's own header comment (GER mode; registration is the Refine stage's
  job). Note: unlike the header's description of the level-007/008 pairing
  as a "batched" registration pass, `level-007` has since been registered
  on its own (confirmed in both files) — a Refine-stage/project-owner
  sequencing choice that doesn't affect this evaluation.

### Reachability/safety: pass
Driven via two scratch Playwright scripts (deleted after the run, along
with their screenshot output) against a dedicated dev server instance on
port 5250 (confirmed free before starting; killed after). Same in-memory
`src/levels/index.ts`-module patch technique as level-005/006/007's
evaluations (fetched the real Vite-transformed module, patched its JS text
in a `page.route` intercept to register `level-008`, no file on disk
touched) — Continue-clicked from `TitleScene` after seeding
`trailing_edge_save` with `levelId: 'level-008'`. (One harness fix worth
recording for a future evaluator of this candidate or a sibling: a fixed
pixel guess for the Continue button's screen position isn't reliable
across viewport sizes — the `#game` flex container's vertical centering
shifts the canvas's on-page offset. Locating the button via the live Phaser
`Text` object's `getBounds()` + the canvas's `getBoundingClientRect()`,
then clicking that computed point, is robust regardless of viewport.)

- Zero console errors across every run: initial load + full forward
  traversal, the early (pre-beacon) Exit-gate check, the Wall A collision
  test, and the moving-hazard force-out-of-bounds test.
- `getLevelConfig('level-008')` loaded correctly: 110 hazards, 3 moving
  hazards (2 Ion Storm + 1 Meteoroid, matching the config), ship spawned at
  the authored Entry (300, 3600).
- Probe reachable via normal click-to-move (set directly via
  `getExplorationController()['target']`, the documented bracket-access
  equivalent of a click, per this guide's own §11 verification checklist):
  ship arrived at (747.3, 913.5), 13.8px from the authored (750, 900).
  On-screen debug readout flipped `probe: no beacon: no` → `probe: yes
  beacon: no` (`02-at-probe.png`).
- Relay Beacon reachable via normal click-to-move **straight through the
  Drift Expanse's three parallel Nebula Field walls** (the level's actual
  axis, no detour taken) — confirming Nebula Field's `blocksMovement:
  false` holds in practice, not just in config: ship arrived at (6087.6,
  3393.4), 14.0px from the authored (6100, 3400). Readout flipped to
  `probe: yes  beacon: yes` (`03-at-beacon.png`).
- Exit Wormhole correctly gated: teleporting the ship directly onto Exit's
  exact coordinate (1650, 1400) **before** the Beacon was reached (isolated
  retest, fresh session) left `GameScene` active on `level-008`
  (`{"gameSceneActive":true,"levelId":"level-008"}`) — confirms
  `LevelObjectiveTracker.canReturn()` genuinely blocks early return, not
  just by construction.
- Exit Wormhole correctly opens and completes the level once earned: in the
  full forward-traversal run, moving toward Exit after Probe→Beacon caused
  `handleLevelComplete()` to fire automatically via normal Arcade overlap
  (no manual nudge needed) partway through the move — the scene transitioned
  away before the movement-completion poll even finished, landing on
  `level-001`'s Entry (300, 300). Same `LEVEL_ORDER.indexOf(-1)` artifact
  level-005/006/007 already produced for unregistered GER candidates
  (`LEVEL_ORDER[-1+1] === LEVEL_ORDER[0]`) — expected, not a defect.
- Wall A (vertical debris wall, x=1000, y∈[1800,2800]) confirmed as a real,
  solid collider: ship placed at (900, 2300), target set to (1400, 2300)
  (aimed well past the wall); ship stopped at x≈923.5, short of x=1000,
  instead of passing through (`11-wallA-block-test.png`).
- Forced a linear moving hazard (`scene['movingHazards'][0]`'s private
  `zone` field, bracket-accessed, via `HazardZoneElement`'s own
  `getPosition()` for before/after reads) from its live position (4909,
  700) to (-99999, -99999); `MovingHazardManager` correctly respawned it to
  (480.1, 3780.1) — on the level's bottom-edge perimeter, within
  `[0,6750]x[0,3798]` — within one update cycle, not left floating or stuck
  (`12-hazard-respawn.png`).
- Screenshots taken at spawn, Probe, the Beacon, the early-Exit-gate check,
  the Wall A block test, the moving-hazard respawn, and each named
  formation (Early-route toll, First Veil, Drift Expanse center, Drift
  Expanse north gap, Approach Veil, Bridging toll, Resupply, Wall A, Wall
  B, Meteoroid's initial position) — all under
  `%TEMP%\level008-eval-scratch\shots\*.png` (scratch directory, deleted
  after the run).

### Convention alignment: notes
Independently recomputed every clearance/spacing number via a standalone
script that regenerated `debrisWall()`/`nebulaWall()`'s exact output,
rather than trusting the candidate's own comments:
- Objective spacing (diagonal = 7745.1px): Probe↔Beacon = 5905.3px (76.2%,
  matches the file's claimed 76.3% to within rounding, at the top of the
  65–76% precedent band), Beacon↔Exit = 4878.8px (63.0%, a touch under the
  band — same geometrically-explained situation level-007 hit, not a hard
  target per §3), Probe↔Exit (non-consecutive) = 1029.6px (13.3%, inside
  the 12–13% band). All match the file's own claimed figures.
- Both Debris Field walls independently reverified: neither spans a full
  map dimension (Wall A: 1000px of 3798px height; Wall B: 900px of 3798px
  height), both open at both ends as claimed. Clearances from every
  objective/resupply point recomputed and all comfortably clear (closest:
  Wall A↔Exit at 703.2px).
- The Drift Expanse's asymmetric-gap design (N1/N3 have a gap at
  y:100–700, N2 doesn't) verified exactly as claimed: N1 y-range
  [700,3700] (17 instances), N2 y-range [100,3700] (20 instances, full
  height), N3 y-range [700,3700] (17 instances). The claimed ~800px/~3s
  north-gap detour cost also checked out (direct Probe↔Beacon = 5905.3px;
  via (3300,400) = 2598.6 + 4104.8 = 6703.4px, a 798.1px difference,
  matching the file's "~800px" claim).
- Post-`level-007` placement: this candidate genuinely uses §8's license
  for a different axis than either prior sibling — Nebula Field pushed to
  wall-scale density (88 instances across six formations, three of them a
  genuine 500px-apart parallel gauntlet) while Debris Field is
  deliberately held minimal (19 instances, two short conventional walls) —
  distinct from level-005 (moving-hazard density), level-006 (a Debris
  Field maze), and level-007 (three sealed rings). Moving-hazard count
  held at the pre-§8 baseline (2 Ion Storm + 1 Meteoroid), consistent with
  every prior single-axis candidate's practice of not escalating every
  dimension at once.

**Two placement issues found, not caught by the file's own "verified by
distance" claims:**
- The Bridging toll's nearest instance (1050, 1000) sits only 216.2px from
  Probe (750, 900) — measuring Probe's center point to the Nebula Field
  instance's collision edge (100px radius), the same convention this
  project's prior evaluations (level-005/006/007) have used throughout.
  Accounting for `ProbeObject`'s own 27px collision radius
  (`GameScene.ts`'s `new ProbeObject(..., radius: 27, ...)`) tightens this
  further, to ~189.2px true edge-to-edge. Both are well under the 250px+
  floor. The file's own comment ("~316–427px clear of both [Probe and
  Exit]") appears to have measured raw center-to-center distance (316.23px
  matches exactly) rather than clearance net of the Nebula Field's own
  100px radius — the same measurement-convention slip flagged (but
  harmless there, since it stayed far above any floor) in level-007's
  Round 1 evaluation; here the corrected number actually crosses the
  floor. Confirmed visually too (`18-bridging-toll.png`, `02-at-probe.png`)
  — the Probe sprite and the toll's nearest instance sit close enough to
  read as touching.
- Ion Storm 2's initial placement (1400, 2600) sits at essentially exactly
  the 250px floor from Debris Field Wall A's collision edge: continuous
  point-to-line clearance = `|1400-1000| (400px horizontal gap) - 90
  (ionStorm radius, hazardConfig.ts) - 60 (debris radius) = 250.0px`
  exactly (250.62px against the nearest actual placed debris ball). This
  is the identical pattern, down to the same 250.0px continuous figure,
  already found and fixed in `level-007`'s own evaluation for its Ion
  Storm 2 (there: (5200,1800) against Wall B, fixed by moving to
  (5300,1800), see that entry above). `hazardConfig.ts`'s Ion Storm default
  heading (`Math.PI`, i.e. -x) drifts it directly toward Wall A from spawn
  — the same aggravating detail the level-007 case had. Not a functional
  defect (Ion Storm doesn't `blocksMovement`), but the tightest clearance
  anywhere in this file by a wide margin (every other hazard-to-wall
  pairing checked is 650px+) and a coincidence of two authored values
  rather than a deliberate margin, exactly as level-007's equivalent
  finding described.

### Telegraphing: notes
- Debris Field (Wall A/B) and Nebula Field remain visually distinct from
  each other in every screenshot checked — opaque, detailed rock-fragment
  texture with per-instance rotation/texture variety vs. translucent
  purple circles that let the starfield show through (`13-early-route-
  toll.png`, `20-wallA.png`, `21-wallB.png` all show both in the same
  frame). Not a color-only distinction — shape/texture/opacity differ too.
  `[placement]` — none, this reads well.
- The Drift Expanse's three parallel Nebula walls (190px spacing against a
  100px radius, so adjacent circles overlap substantially) compose into a
  screen-filling continuous mass at normal zoom (`15-drift-expanse-
  center.png`, `17-approach-veil.png`) — this is the deliberate "no gap"
  design the file's comments describe, and it reads clearly as *a*
  continuous hazard field, not as separate dodgeable bubbles. `[placement]`
  — none; the density is intentional and doesn't harm within-formation
  legibility.
- `[identity]`-adjacent observation, informational only, not blocking: this
  is the first level to scale Nebula Field up to genuine wall scale (three
  ~3000px-long parallel formations) rather than the handful of short/
  scattered "toll" instances every prior level used. The color/texture
  signal that distinguishes it from Debris Field is unchanged and stays
  legible in every screenshot checked (translucent purple vs. opaque rock,
  confirmed side-by-side), so this isn't a new identity problem — but a
  screen-filling continuous purple mass, at this scale, visually resembles
  the *composition* of a Debris Field wall closely enough that a player who
  hasn't yet learned Nebula Field doesn't block movement could reasonably
  misjudge it as equally serious on first encounter. This sharpens, rather
  than introduces, the already-open structure-vs-energy stakes-legibility
  question (`CLAUDE.md`/GDD §9) — recording it because this candidate is
  the first to exercise Nebula Field at a scale where that question
  becomes visually salient, not because there's a candidate-level fix
  available (the color/texture are `hazardConfig.ts` identity properties,
  same as every other level).
- `[identity]` — Ion Storm and Nebula Field remain visually close to each
  other in isolation (same soft-circle placeholder-texture family, color
  the only differentiator without `scan` active) — the existing, already-
  tracked GDD §9 open item, not something this candidate's placement
  introduced. Checked every Ion Storm↔Nebula Field pair's placement
  distance: closest is 710.0px apart, so this candidate doesn't compound
  the existing identity-level ambiguity beyond its baseline. Confirmed
  visually too — Ion Storm reads as a distinct blue circle, comfortably
  separated from any Nebula Field instance in every screenshot it appears
  in (`19-resupply.png`, `20-wallA.png`, `21-wallB.png`). Informational
  only — doesn't affect the verdict or the fix list.
- `[identity]` — Meteoroid (the sole structure-draining hazard) vs. the
  three energy-draining hazard types still relies on the same open
  structure-vs-energy stakes-legibility question flagged in
  `CLAUDE.md`/GDD §9. Not level-008-specific.

### Fix list (the only things blocking `pass`)
- **[placement]** The Bridging toll's nearest instance (1050, 1000) is
  216.2px from Probe (750, 900) by this project's standard edge-clearance
  convention (189.2px if also netting out Probe's own 27px collision
  radius) — under the 250px+ floor, despite the file's own comment
  claiming "~316–427px clear of both," which measured raw center-to-center
  distance instead. Move the toll's near end outward by 100–150px — e.g.
  shift the chain's endpoints from `(1050,1000)-(1250,1250)` to roughly
  `(1150,1080)-(1330,1300)` or similar — to restore genuine 250px+
  clearance from Probe without disturbing its close-Probe↔Exit-hop role or
  its already-comfortable (327px) clearance from Exit.
- **[placement]** Ion Storm 2's initial position (1400, 2600) is exactly
  250.0px (continuous point-to-line measurement) from Debris Field Wall
  A's collision edge — the tightest clearance anywhere in this file by a
  wide margin, and its hazardConfig-default heading drifts it toward that
  wall from spawn. Move it at least 50–100px further from Wall A — e.g. to
  (1500, 2600) or (1450, 2700) — to give it genuine margin consistent with
  every other clearance in the level (all 650px+ once this one is
  excluded), the same fix level-007's identical-pattern finding used.

### Comparison note (batch context)
`level-007` (three simultaneous `debrisRing()`-sealed pockets) and
`level-008` (Nebula-Field-heavy dense energy-drain routing, an 88-instance
six-formation Nebula gauntlet crossed twice on a full run) are genuinely
different single-axis experiments, not variations on one theme — the
former pushes Debris Field sealed-section density, the latter pushes
Nebula Field density/routing pressure while deliberately keeping Debris
Field conventional. Both hold moving-hazard count at the pre-§8 baseline
(2 Ion Storm + 1 Meteoroid) so neither escalates every dimension at once.
`level-008`'s strength is testing sustained energy-management pressure
across a long, twice-crossed gauntlet with a real distance-vs-tolls
tradeoff (the Drift Expanse's asymmetric north gap) — a different kind of
pressure than level-007's ability-gated-pocket puzzle-adjacent design.

## src/levels/level-008.ts (level-008) — VERDICT: pass (Round 2 of at most 3)

Round 2 of at most 3 (checked `docs/history/level-eval-log-*.md` for prior
entries under this candidate's path/identity before starting — found exactly
one, this same file's Round 1 entry above, VERDICT flagged. Circuit breaker
not triggered: 2 rounds used, cap is 3).

**What changed since Round 1, per the Refine stage's own summary (re-verified
independently below, not trusted at face value):** the Bridging toll's near
end moved from `(1050, 1000)` to `(1150, 1080)`; the far end `(1250, 1250)`
is unchanged. Ion Storm 2's initial placement moved from `(1400, 2600)` to
`(1500, 2600)`. Both changes carry inline comments pointing back at Round 1's
findings. Everything else in the file — objective locations, both
`debrisWall()` calls, the other five Nebula Field formations, the other two
moving-hazard initial placements, sizing — is unchanged from Round 1.

### Structural: pass
- `npx tsc --noEmit -p .` — clean, no errors (re-run fresh this round).
- All four required objective fields present.
- Independently regenerated both `debrisWall()` calls (19 placements) and
  all eight `nebulaWall()` calls — 87 Nebula Field placements this round,
  down from Round 1's 110-hazard-total's 88, since the Bridging toll's
  fix shortened its 3-instance chain to 2 (confirmed by direct computation
  of every `nebulaWall()` call's `count = max(2, round(length/spacing)+1)`
  formula, not by trusting the file's own count claim — see Convention
  alignment below for the one place this matters). Total hazard placements
  this round: 19 debris + 87 nebula + 2 Ion Storm + 1 Meteoroid = 109. Every
  placement (including both changed ones) independently re-confirmed within
  `[0, 6750] x [0, 3798]`.
- Still correctly unregistered in `src/levels/index.ts`/`LEVEL_ORDER` — GER
  mode, expected (same as level-007's Round 1/2, which is registered
  separately by the Refine stage/project owner once settled).

### Reachability/safety: pass
Driven via scratch Playwright scripts (Node + `playwright`, written to a
temp scratch directory, deleted after the run along with all screenshots)
against a dedicated dev server instance on port 5261 (confirmed free before
starting; killed after). Same in-memory `src/levels/index.ts`-module patch
technique as every prior evaluation in this log (fetched the real
Vite-transformed module — which strips `export` from the `LEVELS` const and
rewrites imports to absolute `/src/...` paths, a detail worth recording
since a naive regex targeting the pre-transform `export const LEVELS`
source silently no-ops against the actual served module — patched its JS
text in a `page.route` intercept to register `level-008`, no file on disk
touched) — Continue-clicked from `TitleScene` after seeding
`trailing_edge_save` with `levelId: 'level-008'`.

- Zero console errors across every run this round: the full forward
  traversal (load through Exit completion), two isolated moving-hazard
  force-out-of-bounds + respawn tests, and an isolated early-Exit-gate
  check.
- `getLevelConfig('level-008')` loaded correctly: 109 hazards (down from
  Round 1's 110, per the Bridging-toll instance-count change above), 3
  moving hazards (2 Ion Storm + 1 Meteoroid), ship spawned at authored
  Entry (300, 3600).
- Probe reachable via normal click-to-move (`getExplorationController()['target']`,
  the documented bracket-access equivalent of a click): ship arrived at
  (747.8, 909.8), 9.9px from the authored (750, 900). Debug readout flipped
  `probe: no beacon: no` to `probe: yes beacon: no`.
- **Bridging toll's fixed near end, live-traversed, not just measured on
  paper:** moved the ship on toward (1250, 1250) (the toll's unchanged far
  end) immediately after the Probe; arrived at (1240.8, 1243.2), confirming
  the ship passes cleanly through/near the toll's new near-end position
  with no stuck/blocked behavior (expected, since Nebula Field isn't
  `blocksMovement`) — screenshot shows the ship sitting between the two
  toll instances, reading as a continuous two-bubble toll, not two
  separately-dodgeable circles.
- Relay Beacon reachable via normal click-to-move straight through the
  Drift Expanse's three parallel Nebula Field walls (this level's actual
  axis, no detour): ship arrived at (6088.5, 3394.0), 14.0px from the
  authored (6100, 3400) — matches Round 1's independently-measured 14.0px
  figure almost exactly. Debug readout flipped to `probe: yes beacon: yes`.
- Exit Wormhole correctly gated: in an isolated fresh session, teleporting
  the ship directly onto Exit's exact coordinate (1650, 1400) before
  Probe/Beacon were reached left `GameScene` active on `level-008`
  (`{"levelId":"level-008","active":true}`) — `LevelObjectiveTracker.canReturn()`
  genuinely blocks early return. Zero console errors in this isolated check.
- Exit Wormhole correctly opens and completes the level once earned: in the
  full forward-traversal run, moving toward Exit after Probe then Beacon
  caused `handleLevelComplete()` to fire via normal Arcade overlap partway
  through the move, landing on `level-001`'s Entry (300, 300) — same
  `LEVEL_ORDER.indexOf(-1)` artifact every unregistered GER candidate in
  this log produces, expected and harmless.
- Wall A (vertical debris wall, x=1000, y in [1800,2800]) re-confirmed as a
  real, solid collider: ship placed at (900, 2300) via
  `getPlayerShip().image.setPosition()`, target set to (1400, 2300) (past
  the wall); ship stopped at x approx 923.4, short of x=1000, in the
  combined full-traversal run.
- **Ion Storm 2's fix verified live, not just from its comment:** a fresh-
  session read (before any drift-induced movement) showed its live position
  at (1470-1472, 2600) — the approx 28-30px difference from the authored
  (1500,2600) is the hazard's own drift during the approx 2s between scene
  creation and the check (speed 15px/s times approx 2s is approx 30px,
  heading `Math.PI` per `hazardConfig.ts`, matching exactly). In the
  full-traversal run (a much longer session), the same hazard had drifted
  much further west by the time of a later screenshot — visually appearing
  near the Early-route toll (x=500) rather than its authored (1500,2600) —
  confirmed by position read, not assumed from the screenshot alone: this
  is Ion Storm correctly continuing to drift through Debris Field Wall A
  (not `blocksMovement`, already an accepted section 7 non-issue) over
  elapsed session time, not a defect.
- Forced a linear moving hazard (`scene['movingHazards'][0]`'s private
  `zone` field, bracket-accessed) from its live position to (-99999,-99999)
  in an isolated fresh session (ship never moved from Entry, ruling out any
  ship-position confound): `MovingHazardManager` respawned it to
  (6729.1, 3538.4) — on the level's right-edge perimeter, within
  [0,6750]x[0,3798] — within one update cycle, not left floating or stuck.
  Repeated in a second isolated run for cross-check: respawned to
  (6728.2, 2958.2), also a valid right-edge perimeter point. Both zero
  console errors.
- **One test-harness artifact worth recording for a future evaluator of
  this candidate or a sibling:** an early combined run's hazard-respawn
  screenshot appeared to show the respawned hazard sitting directly on top
  of the ship — this was not a level defect. `GameScene`'s camera uses
  `setBounds()` + `startFollow()`, and the ship's authored Entry (300, 3600)
  sits close enough to two level edges (width=6750, height=3798) that the
  camera's follow gets bounds-clamped well away from the ship's literal
  position; the object actually on-screen in that shot was the Entry
  Wormhole sprite (which the ship spawns on top of), not the hazard, which
  was genuinely 6000+px away at its respawn point the whole time (confirmed
  by direct position reads in two follow-up isolated checks, both showing
  the ship stationary at (300,3600) throughout). Take any single
  screenshot's apparent object identity with a grain of salt against this
  camera's bounds-clamped follow near a level's edges; the numeric position
  reads are the ground truth, not the framing.
- Screenshots taken at spawn, Probe, the fixed Bridging toll, the Beacon,
  the Ion Storm 2/Wall A area, the Wall A block test, post-Exit-completion,
  and the moving-hazard respawn point (camera manually re-centered there,
  itself also bounds-clamped near the map's east edge) — all in a temp
  scratch directory (deleted after the run).

### Convention alignment: notes
- Objective spacing independently recomputed fresh this round (unchanged,
  since none of the four core-loop object coordinates changed): diagonal =
  7745.1px; Probe to Beacon = 5905.3px (76.2%); Beacon to Exit = 4878.8px
  (63.0%, same geometrically-explained/accepted gap Round 1 noted); Probe
  to Exit (non-consecutive) = 1029.6px (13.3%). All match Round 1's figures
  exactly.
- **Both Round 1 fixes verified by independent recomputation, not by
  reading the file's own comment:**
  - Bridging toll near end (1150, 1080) to Probe (750, 900): center-to-center
    distance = 438.63px; net of Nebula's 100px radius and Probe's 27px
    collision radius (`GameScene.ts`, `new ProbeObject(..., radius: 27, ...)`)
    = 311.63px — matches the file's claimed approx 311.6px exactly,
    comfortably clear of the 250px floor. Far end (1250, 1250) to Exit
    (radius 40, `GameScene.ts`) also independently recomputed: 427.20px
    center-to-center, 287.20px net — matches the file's claimed approx
    287.2px exactly, still comfortably clear (this endpoint didn't move and
    didn't need to). Near/far endpoint spacing recomputed at 197.23px,
    under Nebula's 200px no-gap threshold — still reads as one continuous
    toll, not two separate dodgeable circles (confirmed visually, see
    Telegraphing below).
  - Ion Storm 2 (1500, 2600) to Debris Field Wall A's collision edge
    (vertical segment at x=1000, y in [1800,2800], y=2600 within range):
    continuous point-to-line clearance = |1500-1000| - 90 (ionStorm radius)
    - 60 (debris radius) = 350.0px — matches the file's claimed approx
    350px exactly, up from Round 1's 250.0px-exactly measurement and now
    in line with every other measured pairing in the file (all 650px+
    excluding this one).
  - Both fixes resolve Round 1's only two `[placement]` findings; no new
    clearance issue introduced by either move (independently re-checked
    each moved point against every nearby wall/formation/objective — see
    Reachability section above for the live confirmation of the same).
- All other Debris Field walls, Nebula Field formations, and moving-hazard
  clearances are unchanged from Round 1's independently-verified figures.
- Post-level-007 placement: this candidate's axis (Nebula-Field-heavy
  dense energy-drain routing, deliberately minimal Debris Field) is
  unchanged from Round 1's assessment — still genuinely distinct from
  level-005/006/007, still not a reskin.
- **Informational only, not blocking, not part of the fix list (per this
  round's task instructions):** the file's header comment still reads "86
  instances total" for the six Nebula Field formations. The actual count,
  independently recomputed via each `nebulaWall()` call's exact
  `count = max(2, round(length/spacing)+1)` formula, is 87 — one more than
  the comment claims, and (not coincidentally) one less than Round 1's
  actual pre-fix total of 88, since the Bridging toll's fix shortened its
  chain from 3 instances to 2. This is a comment-accuracy slip the file's
  header apparently never updated to reflect its own Bridging-toll numbers,
  separate from the fix itself (which is otherwise correct and
  independently verified above) — not a reachability, safety, or
  convention-alignment defect, and not something either of Round 1's
  `[placement]` findings asked for. Flagging only per this round's explicit
  instruction to use judgment on whether it belongs here; not counted
  toward the verdict.

### Telegraphing: notes
- The fixed Bridging toll reads clearly as a continuous two-bubble
  translucent-purple toll in its screenshot — no change in kind from
  Round 1's assessment of the Nebula Field family's legibility, just moved
  approx 128px further from Probe. `[placement]` — none, reads well.
- Debris Field (Wall A) and Nebula Field remain visually distinct in every
  screenshot checked this round (opaque rock-fragment texture vs.
  translucent purple circles) — unchanged from Round 1.
- `[identity]` — Ion Storm and Nebula Field remain visually close to each
  other in isolation (same soft-circle placeholder-texture family, color
  the only differentiator without `scan` active) — the open GDD section 9
  item, unchanged by this round's fix (neither moved instance is an
  Ion Storm to Nebula Field pairing). Not introduced or worsened by this
  candidate. Informational only — doesn't affect the verdict or the fix
  list.
- `[identity]` — the Round 1 observation about Nebula Field's screen-filling
  scale in the Drift Expanse sharpening the structure-vs-energy
  stakes-legibility question (CLAUDE.md/GDD section 9) is unchanged this
  round — neither fix touched the Drift Expanse.
- `[identity]` — Meteoroid (sole structure-draining hazard) vs. the three
  energy-draining hazard types still relies on the same open GDD section 9
  item. Not level-008-specific.

### Fix list
None. Both Round 1 `[placement]` findings (Bridging toll's clearance from
Probe; Ion Storm 2's clearance from Wall A) are fixed and independently
re-verified this round via fresh distance recomputation, a live traversal
through the fixed Bridging toll's exact position, and a live position read
of the fixed Ion Storm 2. No new `[placement]` issues found. Clear to
register (`src/levels/index.ts` + `src/config/levelOrder.ts`), alongside
its sibling `level-007` (already registered per Round 1's structural note)
once the project owner settles ordering.

### Comparison note (batch context)
Unchanged from Round 1: `level-008`'s axis (Nebula-Field-heavy dense
energy-drain routing, an 87-instance six-formation gauntlet crossed twice
on a full run — instance count corrected from Round 1's 88 per the
Bridging-toll fix) remains structurally distinct from `level-005`
(moving-hazard density), `level-006` (a Debris Field maze), and `level-007`
(three sealed rings).
