# Adversarial QA Agent

This tool targets the game as its subject but lives outside the game's own dev 
plan (the GDD's own Phase 3 planning explicitly chose *not* to build an automated
playtesting agent for the project itself, reasoning that manual play gives a
stronger signal for a timing-sensitive 2D game — see CLAUDE.md/§12). This is
an independent, complementary check: instead of confirming the intended path
works (that's Phase 3's job), it actively tries to break the game — boundary
breaks, stuck states, unintended collisions, exploits.

## How it works

Drives a real, running instance of the game via [Playwright](https://playwright.dev/)
against `npm run dev` (dev-mode only — it relies on the console hooks
`main.ts`/`ExplorationController.ts`/`devTuning.ts` expose behind
`import.meta.env.DEV`: `window.game`, `window.getPlayerShip()`,
`window.getExplorationController()`, `window.tuning`). This is the same
"Playwright + this game's dev-only console hooks" pattern
`.claude/agents/level-evaluator-agent.md` already uses to playtest candidate
levels headlessly.

Each tick it:
1. Polls a snapshot of ship position/velocity/resources, the current move
   target, and every hazard's position/shape/`blocksMovement` flag.
2. Runs that snapshot through `detectors.mjs`'s checks.
3. Picks a weighted-random behavior — movement, interaction (ability
   hotkeys, pause/resume), or boundary-probing (including a synthetic
   off-map click-to-move target, bypassing what a real mouse click can
   reach) — and executes it.

### Scope (revised 2026-08-26, second run)

An earlier version also reported any two `blocksMovement` colliders'
circles simply overlapping — e.g. a Meteoroid's path crossing through a
Debris Field wall. That's not reported anymore: per explicit project-owner
direction, that kind of visual overlap is common in games like this and not
a problem on its own. What matters is **play impact** — two checks now carry
the weight of this tool:

- **Is the ship actually stuck?** `checkStuck` tracks real position history
  (not velocity or the pending click-to-move target — see its comment for
  why those turned out to be the wrong signal: Meteoroid's own
  `cancelTargetOnContact` fix clears the target at the exact moment contact
  happens, and Arcade lets a ship slide along a static wall rather than
  stopping dead). If the ship hasn't gone anywhere in ~1.8s while touching a
  hazard and/or the level boundary, that's reported — `high` if it's pinned
  by 2+ things at once, a moving hazard (Meteoroid), or the map edge;
  `medium` for a single static Debris Field wall alone.
- **Does teleporting into a solid hazard break anything?** Teleport is
  documented (CLAUDE.md) to pass through `blocksMovement` colliders via a
  plain `setPosition()` call. `behaviorTeleportIntoDebrisField` deliberately
  aims a confirmed blink at the center of a nearby blocker (topping up
  energy first via the ship's own public `rechargeEnergy()`, so the
  ability's cooldown — not an incidental energy shortage from other
  adversarial behaviors sharing the same pool — is the only thing gating
  it), then `checkTeleportProbe` watches the next ~1.5s for the ship staying
  trapped inside the collider or getting ejected at a physically
  implausible speed.

Three behaviors are weighted higher than the rest to manufacture the
scenarios these checks are looking for: `meteoroidPinchSeek` (steers toward
the gap between a Meteoroid and the nearest other solid hazard),
`meteoroidBoundaryPinchSeek` (steers toward the level edge nearest a
Meteoroid's predicted path, trying to get wedged between the two), and
`teleportIntoDebrisField` (above). Both pinch-seeking behaviors extrapolate
the targeted Meteoroid's position forward using its own measured velocity
(a plain point-and-click aims at empty space by the time the ship arrives at
280px/s) and stay "sticky" on the same Meteoroid across a few consecutive
picks rather than re-rolling a new target every time.

## Usage

```bash
cd tools/adversarial-qa
npm install
npx playwright install chromium   # first time only
node agent.mjs --level level-006 --duration 180
```

Flags (all optional):
- `--level <id>` — which `LEVEL_ORDER` entry to jump straight to via
  TitleScene's dev-only "Jump to Level" links (default `level-006`).
- `--duration <seconds>` — how long to run (default `180`).
- `--tick-ms <ms>` — polling/action interval (default `350`).
- `--port <n>` — preferred dev-server port (default `5199`; if taken, Vite
  picks the next free one and the script follows along).
- `--headed` — show the browser instead of running headless.
- `--out <path>` — output path *without extension*; writes `<path>.json`
  and `<path>.csv`. Defaults to `reports/report-<level>-<timestamp>`.

The script starts its own `npm run dev` instance and tears it down when
done — no need to have one running already.

## Report format

Both files carry the same findings; JSON keeps `gameContext` as real nested
data, CSV flattens it to a JSON string per the assignment's "JSON or CSV,
another developer should be able to read this and act on it" requirement.
Required fields plus a couple that make a finding actually actionable:

| Field | Meaning |
|---|---|
| `timestamp` | Wall-clock time the finding was recorded |
| `location` | `{x, y, levelId}` — world position closest to the finding |
| `errorType` | Short category, e.g. `Ship Pinned / Stuck Against Solid Geometry` |
| `severity` | `low` / `medium` / `high` |
| `gameContext` | Whatever's relevant to that finding type — contact list, resource deltas, elapsed time, etc. |
| `detail` | One sentence, grounded in the actual mechanism (not "seems buggy") |

`meta` in the JSON report also carries: any real browser console
errors/exceptions seen during the run; the hazard tuning values pulled from
`window.tuning.hazard` at the moment the run started; how many times a
behavior itself threw (distinct from a game bug); `behaviorCounts` and
`behaviorNoTargetCounts` (how often each behavior ran, and how often it
found nothing to act on — e.g. no Meteoroid on this level, or no
`blocksMovement` hazard within teleport range); and
`confirmedTeleportIntoHazardCount`/`barelyMovedTickCount`, sample-size
context for judging how much weight a *clean* run (zero findings) actually
carries — a "0 findings" report backed by 60 confirmed teleport-into-hazard
landings means something different than one backed by 2.

## Confirmed bug: Meteoroid/world-boundary physics freeze

`repro-meteoroid-boundary-stall.mjs` and `repro-followup-check.mjs` are
targeted, one-off repro scripts (not part of the general adversarial loop
above) for a specific bug report from the project owner (2026-08-26):
running to the right map edge at roughly Test Level's Meteoroid's y-level
gets the ship pinned against the boundary, and afterward the Meteoroid
itself goes immobile even once the ship moves away. **Confirmed, with an
exact mechanism:**

- Test Level's one Meteoroid starts at `(300, 900)`, heading due east at
  280px/s, in a 2400x1350 level. A sweep of y-offsets from that midline
  (running straight to the right edge at each) found the freeze at
  y-offsets **-45 and -35** (i.e. `y=855`/`y=865` — a glancing hit near the
  edge of the Meteoroid's 56px radius, not a dead-center one), not at
  smaller offsets or dead-center.
- The trigger is two constraints landing on the ship in the **same physics
  step**: its collision edge reaching the world's right boundary (ship
  `displayWidth: 46` → 23px half-width; froze at `ship.x=2377`, exactly
  `2400 - 23`) at the same instant it's still grazing the Meteoroid's
  collider (~88px apart, within `56 + shipHalfWidth`).
- At that instant, **both** the ship's and the Meteoroid's velocity snap to
  exactly `(0, 0)` simultaneously — confirmed via a fine-grained
  (~90ms-resolution) trace, not just an inference.
- The freeze is scoped to that pair, not the whole Scene: energy kept
  regenerating normally and Ion Storm kept moving over an 8+ second
  follow-up observation window, while the Meteoroid stayed pinned at
  `(2300, 900)` — short of `MovingHazardManager`'s wrap threshold
  (`levelWidth + radius = 2456`), so it can never self-recover via the
  normal wrap path.
- The ship *can* eventually break free (matching the report) — it took a
  third distinct move-away click in the follow-up check, the first two
  silently failed — but the Meteoroid never resumes, permanently parked and
  harmless for the rest of the level.

Root cause is very likely in how Phaser's Arcade Physics resolves a
body-vs-body collision (ship vs. Meteoroid, the latter `setImmovable(true)`)
landing in the same step as that same body's world-bounds check
(`setCollideWorldBounds(true)`) — not something in this project's own
collision code, which never touches a hazard's velocity outside
construction/`reposition()`. Full traces (ship+Meteoroid position/velocity
every ~90ms through contact and the freeze) are in
`reports/repro-meteoroid-boundary-stall-*.json`.
