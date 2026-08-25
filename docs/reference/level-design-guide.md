# Level Design Guide

Conventions distilled from designing `level-001` through `level-004`
(2026-08-15 through 2026-08-17), written down explicitly ahead of a phase
where multiple agents may be authoring new levels in parallel. This is a
**living reference for how to design a level in this codebase**, not a
record of what any specific level currently contains — read the level file
itself for that. If this guide and a level file disagree, the level file
is right and this guide is stale; update it.

**If you're building one of the new parallel-agent levels specifically,
read §8 first** — every level from `level-004` onward starts with the
player's full ability set already unlocked, and §8 is the explicit policy
for that: push complexity/variety rather than staying conservative,
verification discipline (§11) permitting.

Companion docs: `CLAUDE.md`'s Architecture contract (`HazardZoneElement`,
`MovingHazardManager`, `LevelObjectiveTracker`, etc. — the code contract
this guide's conventions sit on top of) and the GDD (`docs/trailing_edge_gdd_draft_31.md`,
§9's hazard/puzzle taxonomy and open questions this guide doesn't
re-litigate).

---

## 1. File & registration conventions

- One hand-authored file per level: `src/levels/level-NNN.ts`, exporting
  `LEVEL_NNN: LevelConfig` (shape defined in `src/levels/levelTypes.ts`).
- Register it in two places, in order:
  1. `src/levels/index.ts` — import it and add it to the `LEVELS` map.
  2. `src/config/levelOrder.ts` — append its id to `LEVEL_ORDER`. **Append
     only.** Never insert out of sequence — `ProgressionManager` grants the
     next ability in `abilityUnlockOrder` on every level completion, so a
     level's position in this array determines which abilities the player
     already has by the time they reach it (see §4 and §7 below).
- `HazardPlacement` (in `levelTypes.ts`) supports optional per-instance
  `textureKey` and `rotationRadians` overrides on top of the type's
  `hazardConfig.ts` default — used for Debris Field texture/rotation
  variety (§5).
- A level file is expected to declare its own small local helpers
  (`debrisWall()`, `debrisRing()`, etc. — see below) rather than importing
  them from a shared module. Duplicated per file on purpose, matching
  `CLAUDE.md`'s "one hand-authored file per level" convention — keeps
  content authoring low-collision for parallel agents.

## 2. Sizing

There's no fixed formula — level size is a per-level design call, not a
strict geometric progression. Precedent so far:

| Level | Size | Relationship |
|---|---|---|
| `level-001` | 2400×1350 | base |
| `level-002` | 3600×2025 | 1.5× level-001 |
| `level-003` | 5400×3038 | 1.5× level-002 |
| `level-004` | 5400×3038 | matches level-003 exactly (recalibrated 2026-08-17 — an earlier "2× level-001, deliberately not 1.5× level-003" pass was a miscommunication, not an intended design point; see the level file's comment) |

Two things that *are* conventions, not just precedent:
- **"Nx the size" always means each dimension × N** (so area × N²), not
  area × N. Confirmed explicitly for "double" (level-002's original
  4800×2700 draft, later superseded) and for "1.5×" (level-002, level-003).
- Every level so far keeps level-001's 16:9 aspect ratio. No hard rule
  against changing it, but there's no precedent for doing so either.
- **Resizing an already-designed level to match a target footprint** is a
  uniform scale, not a redesign: multiply every coordinate (objectives,
  resupply, hazard placements, wall/ring endpoints) by the same factor on
  both axes. Because it's uniform, every distance/clearance relationship
  already verified pre-scale only grows, so it doesn't need re-deriving —
  see `level-004.ts`'s 2026-08-17 recalibration for a worked example
  (scaled by 5400/4800 = 3038/2700 = 1.125×, one factor covering both
  axes because the two target dimensions happened to share it).

## 3. Objective placement

`LevelObjectiveTracker` (`src/objects/LevelObjectiveTracker.ts`) sequences
the core loop strictly linearly: **Entry (spawn, not tracked) → Probe (1)
→ Relay Beacon (2) → Exit Wormhole (3)**.

**The rule:** only *consecutive* steps in that sequence need to be pushed
far apart. Non-consecutive steps can be close — it is **not** necessary to
evenly space every objective away from every other one. Concretely: Probe↔Beacon
and Beacon↔Exit should both be far apart; Probe↔Exit (not consecutive) is
fine close, and has been deliberately kept close in every level so far to
give the layout a real "there and back" shape instead of an evenly-spread
one.

Rough precedent (as % of the level's diagonal, `√(width²+height²)`,
recomputed from all four levels' actual coordinates): consecutive pairs
have landed around 65–76%, the non-consecutive pair around 12–13%. Not a
hard target, just what's read well so far.

Entry's own placement has no stated rule beyond "a reasonable starting
corner, clear of any hazard placed nearby."

## 4. Hazard roster & pacing

Every real level so far (`level-001` through `level-004`) intentionally
restricts its hazard roster to **Debris Field + Nebula Field only** — the
broader roster (Solar Flare, Ion Storm, Meteoroid) is meant to be
introduced **incrementally as abilities unlock**, not all at once in an
early level. Ion Storm and Meteoroid entered at `level-003`/`level-004`,
once `scan` and `teleport` were both already unlocked (see §7). **Solar
Flare has no placement precedent yet** — it's still available whenever the
next escalation point in the design makes sense.

**Exception, by explicit request (2026-08-25):** `level-001` now also has a
single Meteoroid instance, and `level-002` now has one Meteoroid plus one
Ion Storm, despite both granting few or no abilities — flagged to the user
before `level-001`'s addition (the player has no `scan` to identify either
hazard and no `teleport`/`rocketBoost` to dodge them), and repeated
knowingly for `level-002`. Don't read `level-001`/`level-002`'s hazard
rosters as Debris-Field-(+Nebula-Field)-only precedent going forward; this
is a deliberate, repeated override of this section's normal ordering, not a
revision of the convention itself.

General principle carried through every level so far: match a level's
hazard complexity/threat to the abilities the player actually has by the
time they reach it. Don't require an ability the player can't yet have
(`LEVEL_ORDER`'s position is what guarantees this — see §7). **This
constraint has nothing left to gate once a level is past the point where
every ability is unlocked — see §8, which is exactly that situation and
is the deliberate target zone for the next level-authoring phase.**

No puzzle-taxonomy element (`PuzzleElementBase` and its five subtypes) has
been placed in any real level yet — every level's `puzzleElements` is
still `[]`. That's still Phase 2b-deferred work; `level-000` (Test Level)
remains the only place they're exercised. See the GDD open question this
guide doesn't try to resolve: whether/how a puzzle site should ever gate
the mandatory loop (GDD §9's "Sequential mandatory puzzle gating" item).

## 5. Debris Field — the primary hazard

Debris Field is `blocksMovement: true`, zero resource cost (GDD §9's
2026-08-07 re-scope) — a solid obstacle, not a drain zone. Every level so
far chains many instances into walls rather than placing isolated pieces.

```ts
// Standard per-file helper (duplicate this, don't import it):
const DEBRIS_TEXTURES = ['debris_large', 'debris_large_alt2', 'debris_large_alt3'];

function debrisWall(x1: number, y1: number, x2: number, y2: number, spacing = 115): HazardPlacement[] {
  const length = Math.hypot(x2 - x1, y2 - y1);
  const count = Math.max(2, Math.round(length / spacing) + 1);
  const placements: HazardPlacement[] = [];
  for (let i = 0; i < count; i++) {
    const t = i / (count - 1);
    placements.push({
      type: 'debrisField',
      x: x1 + (x2 - x1) * t,
      y: y1 + (y2 - y1) * t,
      textureKey: DEBRIS_TEXTURES[i % DEBRIS_TEXTURES.length],
      rotationRadians: (i * 0.83) % (Math.PI * 2),
    });
  }
  return placements;
}
```

- **Why `spacing = 115`:** Debris Field's collision radius is 60px
  (`hazardConfig.ts`). Two adjacent circles must be spaced under
  `2 × 60 = 120px` center-to-center or a ship can slip through the gap.
  115 leaves a comfortable margin without excessive overlap.
- **Texture/rotation variety:** cycle `['debris_large', 'debris_large_alt2', 'debris_large_alt3']`
  and vary `rotationRadians` per index — otherwise a long chain reads as
  one sprite copy-pasted end to end. Both are `HazardPlacement` overrides
  (§1), purely cosmetic (they never affect the Arcade collision body).
- **Never span a full map dimension.** Every wall placed so far leaves
  open space at both ends to route around — hard requirement while a
  level's abilities are limited (see the sealed-ring exception below,
  which is the one deliberate departure from this and is gated on an
  ability specifically).
- **Clearance:** keep every wall segment 250px+ from every
  objective/resupply point. Checked by hand/by construction so far, not by
  an automated check — see §11's verification checklist.

### Undulation — don't leave a long wall ruler-straight

A perfectly straight chain of Debris Field instances reads as artificial
next to hand-placed content (playtest feedback, 2026-08-24 — see
`level-006.ts` through `level-008.ts` for the worked examples this section
distills). `debrisWall()` should offset interior instances perpendicular to
the wall's own axis instead of leaving every point exactly on the line
between `(x1,y1)` and `(x2,y2)`. Updated helper (this is now the standard
to copy — level-006 was the original prototype, `level-001`–`level-008` all
carry a version of this):

```ts
const SWEEP_AMPLITUDE = 28;
const SWEEP_PERIOD_INSTANCES = 12;
const TEXTURE_AMPLITUDE = 4;
const TEXTURE_PERIOD_INSTANCES = 4;
const MIN_UNDULATE_COUNT = 8;
const BOW_AMPLITUDE = 30;
const MIN_BOW_COUNT = 4;

function debrisWall(x1: number, y1: number, x2: number, y2: number, spacing = 115): HazardPlacement[] {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const length = Math.hypot(dx, dy);
  const count = Math.max(2, Math.round(length / spacing) + 1);
  const mode = count >= MIN_UNDULATE_COUNT ? 'sweep' : count >= MIN_BOW_COUNT ? 'bow' : 'straight';
  const perpX = -dy / length;
  const perpY = dx / length;
  const placements: HazardPlacement[] = [];
  for (let i = 0; i < count; i++) {
    const t = i / (count - 1);
    let x = x1 + dx * t;
    let y = y1 + dy * t;
    if (mode === 'sweep') {
      const envelope = Math.sin(Math.PI * t); // 0 at both ends, 1 at the midpoint
      const sweep = SWEEP_AMPLITUDE * Math.sin((i / SWEEP_PERIOD_INSTANCES) * Math.PI * 2);
      const texture = TEXTURE_AMPLITUDE * Math.sin((i / TEXTURE_PERIOD_INSTANCES) * Math.PI * 2);
      const offset = envelope * (sweep + texture);
      x += perpX * offset;
      y += perpY * offset;
    } else if (mode === 'bow') {
      const offset = Math.sin(Math.PI * t) * BOW_AMPLITUDE;
      x += perpX * offset;
      y += perpY * offset;
    }
    placements.push({
      type: 'debrisField',
      x,
      y,
      textureKey: DEBRIS_TEXTURES[i % DEBRIS_TEXTURES.length],
      rotationRadians: (i * 0.83) % (Math.PI * 2),
    });
  }
  return placements;
}
```

- **Two shapes, picked automatically by instance count.** `count >= 8` gets
  a two-term sine "sweep" — a slow ~2-period broad meander plus a faster
  small-amplitude "texture" term, so a long wall doesn't read as one
  perfectly repeating S-curve. `count` 4–7 gets a single-term "bow" instead
  — just the envelope times one flat amplitude, a smooth one-directional
  "C" bulge with no oscillation. **Don't use the sweep formula on a short
  wall** — with too few points, a full sine period never completes and it
  reads as a jerky zigzag rather than a meander; the bow was added
  specifically because of that failure mode (`level-001`/`level-002`'s
  ~550–600px walls, 2026-08-24). Below `MIN_BOW_COUNT` (4), there aren't
  enough interior points for any offset to read as intentional, so the
  wall stays straight — this is a real, not just theoretical, floor:
  `count < 4` means 0–2 interior points, too few for even a bow.
- **Both shapes pin the endpoints exactly** via the `sin(π·t)` envelope
  (`0` at `t=0` and `t=1`) — `(x1,y1)`/`(x2,y2)` never move. This matters
  beyond aesthetics: every existing clearance/gap-boundary comment in a
  level file is measured from those endpoints (e.g. a maze wall's gap
  start/end), so an offset that moved them would silently invalidate
  documentation elsewhere in the same file.
- **Pass `spacing = 100` explicitly on any wall call that will undulate**
  (by either mode) instead of relying on the `115` default. This is a
  safety requirement, not a style choice — see below.
- **Safety math (why this isn't just eyeballed):** Debris Field is
  `blocksMovement`, so the "no ship-width gap" guarantee depends on every
  pair of neighboring instances staying within `2 × 60 = 120px` of each
  other. A first pass at the default 115px spacing worked but left only a
  ~2px margin — thin enough to be uncomfortable. The fix wasn't smaller
  amplitude: the along-axis spacing so dominates
  `sqrt(spacing² + offsetDelta²)` that even halving the offset barely moves
  the result. Tightening spacing to 100px instead buys a real margin
  (~18–19px, empirically verified by generating each candidate wall and
  measuring actual worst-case neighbor distance, not just estimating it) —
  do the same if you introduce a new amplitude/period/threshold
  combination: generate the actual points and measure, don't trust the
  formula alone (the margin doesn't scale linearly with amplitude the way
  intuition suggests). `MIN_UNDULATE_COUNT = 8` (not level-006's original,
  more conservative `16`) is the value actually verified safe down to
  `count = 7` at `spacing = 100` — reuse `8`, not `16`, for a new level.
- **Add a dev-time sanity check** alongside any new undulating wall,
  mirroring `level-001.ts`–`level-008.ts`: re-inspect the actual generated
  array(s) inside `if (import.meta.env.DEV)` and `console.warn` if any
  neighbor pair exceeds `2 × 60`. Cheap, and it fails fast at import time
  instead of silently shipping a wall with a hole in it if a future edit to
  these constants breaks the margin.
- **Doesn't apply to `debrisRing`** (below) — a sealed circle isn't a
  "wall" in this sense. Undulating its radius is a separate, unvalidated
  design question nobody's decided yet.
- **Current adoption isn't uniform, by design, not oversight:** every real
  level (`level-001`–`level-008`) has the sweep tier; only `level-001` and
  `level-002` currently have the bow tier wired up (they're the only files
  with walls short enough to need it) — nothing in `level-003`–`level-008`
  currently produces `count` 4–7, so they never hit that branch. If a new
  level introduces a short wall, use the bow tier rather than leaving it
  straight or forcing the sweep formula onto it.

### The sealed ring — a deliberate exception, not a pattern

```ts
function debrisRing(cx: number, cy: number, radius: number, count: number): HazardPlacement[] {
  const placements: HazardPlacement[] = [];
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2;
    placements.push({
      type: 'debrisField',
      x: cx + Math.cos(angle) * radius,
      y: cy + Math.sin(angle) * radius,
      textureKey: DEBRIS_TEXTURES[i % DEBRIS_TEXTURES.length],
      rotationRadians: (i * 0.83) % (Math.PI * 2),
    });
  }
  return placements;
}
```

`level-003` used this once to fully enclose the Probe, reachable only via
`teleport` (the one ability whose plain `setPosition()` passes through
`blocksMovement` colliders). **This was specifically to reinforce a
just-granted ability the level right after it was earned — not a running
pattern to repeat in every level.** Reuse it only when there's an
equally deliberate reason (e.g. reinforcing a different ability the same
way, right after it's granted) — **that restriction is about levels still
inside the unlock sequence (roughly 001–004). Once a level is past that
point and every ability is already unlocked, §8 explicitly lifts it: a
sealed section is fair game as a recurring device, not a one-off.**

If you do reuse it, the range math has to hold:

```
approach_distance ≈ ring_radius + 60 (debris radius) + ~28 (ship half-size)
```

`approach_distance` must stay comfortably under the relevant ability's max
range (e.g. `abilityConfig.teleport.maxRange`, currently 350px) — level-003
used `ring_radius = 150`, giving `approach_distance ≈ 238px`, ~112px of
slack. Also account for the felt consequence: once inside, normal movement
can't get back out either, so the player is briefly trapped until the
relevant ability's cooldown resets. That's intentional, not a bug, but
worth deciding on purpose rather than as an accident of the geometry.
level-003.ts also has a dev-time sanity check (`console.warn` at import if
the math stops holding) — worth copying if you reuse the ring.

## 6. Nebula Field — placed with intent, not scattered

Nebula Field is a static, energy-draining zone (no `blocksMovement`). Every
level places multiple instances, each with a specific reason, not a
uniform scatter. Categories used so far:

- **Bypass toll** — sitting at the open end of a Debris Field wall, so the
  "easy" route around a wall still costs something.
- **Early-route toll** — near Entry, on the path a player naturally takes
  first.
- **Bridging toll** — between a level's close, non-consecutive objective
  pair (§3's Probe↔Exit), so even that short hop isn't hazard-free.

Since it doesn't block movement, it's fine (even good) for a Nebula Field
to visually overlap a Debris Field wall's edge — that reads as a
compound obstacle, not a bug.

## 7. Moving hazards (Ion Storm, Meteoroid)

Both use `movementPattern: 'linear'` in `hazardConfig.ts`. `GameScene`
auto-detects any hazard placement of that pattern and hands it to
`MovingHazardManager` (`src/objects/MovingHazardManager.ts`) — a level
file just places initial positions:

```ts
{ type: 'ionStorm', x: 2800, y: 900 },
{ type: 'meteoroid', x: 900, y: 2000 },
```

No other wiring needed. What to know as a level author:

- **The authored x/y only governs the first leg**, before the hazard first
  drifts out of the level bounds. Every respawn after that is chosen by
  `MovingHazardManager`: a fresh point on the level's perimeter, heading
  aimed near `LevelObjectiveTracker`'s *current* objective target, jittered
  by `movingHazardConfig.objectiveJitterRadius` (350px) so it's not a
  deterministic beeline. You don't control this, and don't need to design
  around it beyond the initial placement.
- **Same instance for the whole level** — it wraps, it doesn't
  destroy/respawn a new one. No count to manage; one placement = one
  hazard, permanently.
- **Introduce only once the player has abilities to cope with a moving
  threat.** Ion Storm/Meteoroid first appeared at `level-003` (by which
  point `scan` and `teleport` are both unlocked). Don't place one on an
  early level where `LEVEL_ORDER`'s position means the player has few or
  no abilities yet. Once past that point, though, the count used so far
  (2–3 per level) was a "prove the mechanic works" number, not a ceiling —
  see §8 for using more of them deliberately.
- Give the initial placement the same 250px+ clearance from every
  wall/objective/resupply point as any other hazard.
- Not yet an explicitly designed interaction (flagging so it's not
  mistaken for settled): a moving hazard has no `blocksMovement` of its
  own, so its path can freely overlap a Debris Field wall visually. Not
  identified as a problem, just never deliberately designed either way.

## 8. The post-full-unlock era: this is where the next levels should experiment

`abilityUnlockOrder` (`abilityConfig.ts`) has exactly three entries —
`scan`, `teleport`, `rocketBoost` — and `ProgressionManager` grants the
next one on every level completion. `level-003`'s completion grants the
last of the three, so **every level from `level-004` onward starts with
the entire toolkit already unlocked, permanently.** There's no ability
left to wait for. §4's "match hazard complexity to the abilities the
player has" and §7's "introduce only once the player can cope" both stop
being a gating constraint at that point — not because they were wrong, but
because they've got nothing left to gate against.

**Decided (2026-08-17): treat that as an opportunity for the upcoming
parallel-agent level-authoring phase, not a plateau.** Levels built from
`level-004` onward can genuinely push past what `level-001`–`level-004`
did:

- **More instances of moving hazards** than any level built so far — 2–3
  Ion Storm/Meteoroid was a "prove `MovingHazardManager` works" count, not
  a target to keep hitting.
- **More complicated Debris Field layouts** — mazes, multiple interlocking
  walls, more than one sealed section in the same level — rather than the
  handful of simple straight-line dividers every level so far has used.
- **Walled-off sections reused more freely.** §5's sealed ring was
  deliberately restricted to one narrative use (reinforcing `teleport`
  right after level-003 granted it) precisely because it was written for
  levels still inside the unlock sequence. That restriction doesn't apply
  here — with every ability already unlocked, a section gated behind any
  one of them is fair game as a recurring device.
- "And the like" — anything in the same spirit that a full toolkit makes
  viable and earlier levels genuinely couldn't attempt.

**The point of this phase is variety, not convergence.** Different levels
landing at different points on the difficulty/complexity spectrum is the
useful outcome, not a problem to smooth out — it's what generates the
signal a playtesting pass needs to find which combinations (hazard
density, how often a sealed section shows up, how many moving hazards at
once, ...) actually feel best. Once that signal exists, a follow-up pass
is expected to *conform* the level set toward whatever's discovered —
meaning §2 through §7's specific numbers (spacing, instance counts,
clearance margins) are this guide's pre-experimentation baseline, not a
ceiling on what comes next. Update those sections once the conforming
pass happens.

**What doesn't relax:** §11's verification discipline, unchanged. An
experimental level still has to type-check, load with zero console
errors, and — especially now that sealed sections are meant to recur
rather than being a single deliberate exception — every gated area's
approach-range math (§5) has to actually be checked, not eyeballed.
Pushing the design further is the goal; shipping something that's
secretly unreachable or soft-locked is not a version of that.

## 9. Resupply points

One `AsteroidField` per level so far (structure repair only — energy
regenerates passively, no dedicated object). Placed centrally/accessibly,
kept 250–300px+ clear of any wall or ring.

## 10. Visual variety: the 180° flip

When a new level's design logic closely echoes an earlier one — same
rules applied the same way, similar size — consider point-reflecting every
placement through the map's center instead of redesigning from scratch:

```
(x, y) → (width - x, height - y)
```

This is a 180° rotation about the center, **not** two independent mirror
passes. It's distance-preserving, so every spacing/clearance relationship
already verified pre-flip (§3's objective spacing, §5's wall clearances)
carries over exactly — recompute the coordinates, then just relabel each
hazard's now-mirrored orientation in comments (a wall's old *south* bypass
becomes its *north* bypass, etc.).

Precedent: `level-002` was flipped relative to how closely it echoed
`level-001`'s layout logic (2026-08-15); `level-004` was flipped relative
to `level-003` for the same reason (2026-08-17). Both read as genuinely
different levels afterward, confirmed in-browser, not just on paper.

## 11. Verification checklist for a new or edited level

1. `npx tsc --noEmit -p .` — catches placement/type errors immediately.
2. Confirm registration: the level id is in both `src/levels/index.ts`'s
   `LEVELS` map and appended (not inserted) to `LEVEL_ORDER`.
3. For layout/shape checks specifically (wall undulation, clearance,
   objective spacing) — `npm run level-viewer` (`tools/level-viewer/`) is a
   standalone, read-only, Phaser-free visualizer that reads the same
   `LevelConfig` the game does; pick the level from its dropdown and
   scroll/drag to inspect a wall's shape up close, without needing to fly
   the ship there. Much faster than a full playthrough for this kind of
   check, though it doesn't replace step 4 below for anything that needs
   real gameplay (collision, reachability, ability interactions).
4. Live-check in a real browser, not just by reading the file:
   - `npm run dev`, open the game.
   - To jump straight to the level under test without playing through
     everything before it: `localStorage.setItem('trailing_edge_save', JSON.stringify({ levelId: 'level-NNN' }))`,
     reload, click **Continue** on the title screen.
   - Dev-only console hooks available for scripted checks (all gated on
     `import.meta.env.DEV`, same convention as `window.tuning` — see
     `docs/reference/console-tuning-reference.md`): `window.game`,
     `window.getPlayerShip()`, `window.getProgressionManager()`.
     `window.game.scene.getScene('GameScene')` returns the live scene
     instance — TypeScript's `private` isn't enforced at runtime, so
     bracket-notation access to its internal fields (`scene['movingHazards']`,
     etc.) or private methods (`scene['handleLevelComplete']()`) is a
     legitimate way to drive a test script without waiting out real
     playthrough time (e.g. granting abilities directly, or forcing a
     moving hazard's position to test `MovingHazardManager`'s wrap logic).
5. Confirm **zero console errors** across the check.
6. For anything with a hard reachability/collision requirement (a wall, a
   sealed ring), verify by forcing the edge case rather than trusting the
   math alone — e.g. click-to-move directly at an enclosed objective to
   confirm normal movement is genuinely blocked; force a moving hazard's
   position out of bounds and confirm it respawns correctly.

## 12. Open / not yet decided

- Solar Flare has no placement precedent.
- No fixed target for exactly how many Nebula/Debris instances "feels
  right" relative to map size — eyeballed per level so far (roughly 3–4
  Nebula instances; wall count falls out of `debrisWall()`'s automatic
  segment count for whatever length is chosen). **This is exactly what §8's
  experimentation phase is meant to resolve** — expect this bullet to
  become a stated convention once a conforming pass happens, not to stay
  open forever.
- The GDD's open question on sequential mandatory puzzle-site gating
  (GDD §9) is unrelated to hazard design but affects the same files if
  it's ever decided — check that item before assuming `puzzleElements: []`
  is permanent for every level.
