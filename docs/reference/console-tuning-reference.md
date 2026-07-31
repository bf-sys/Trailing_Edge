# Browser Console Tuning Reference

A quick reference for the live-tuning values exposed on `window.tuning`
while playing a dev build (`npm run dev`). This is the "expose config
objects on window in dev builds for live console tuning" convention from
`CLAUDE.md`'s tech-stack section — every per-subsystem config module
(`shipConfig.ts`, `survivalConfig.ts`, ...) registers itself here so you can
tweak feel without editing a file or reloading the page.

**This list reflects the config modules that exist right now (Phase 1). As
more get added (e.g. `abilityConfig.ts`, per-hazard cost tuning), this file
will need updating — check `src/config/` directly if something here looks
out of date.**

## Opening the console

- **Chrome / Edge:** `F12`, or `Ctrl+Shift+J` (jumps straight to Console)
- **Firefox:** `F12`, or `Ctrl+Shift+K`
- Any browser: right-click the page → **Inspect** → **Console** tab

Click into the input line at the bottom, type a command, press Enter.

## How it works

`window.tuning` is a plain object, one key per config module, only present
in dev builds (`import.meta.env.DEV` — a production `vite build` won't have
it). Each value is the *actual* config object the game reads from every
frame, not a copy — setting a field mutates the live config directly, so
the effect is immediate, no reload needed.

Typing `window.tuning` alone and expanding it in the console shows
everything currently registered, which is the fastest way to check this
reference is still accurate.

## `window.tuning.ship` (`src/config/shipConfig.ts`)

Click-to-move feel (GDD §4 — non-Newtonian: no drift/overshoot, the ship
always ends up exactly on the clicked point).

| Field | Default | What it does |
|---|---|---|
| `maxSpeed` | `260` | Top speed in px/s while traveling to a target |
| `acceleration` | `700` | px/s² ramp-up rate toward `maxSpeed` |
| `deceleration` | `900` | px/s² ramp-down rate while inside `arrivalRadius`, and while coasting to a stop with no target |
| `arrivalRadius` | `48` | Distance (px) from the target where slowing begins |
| `stopRadius` | `4` | Distance (px) from the target at which the ship snaps to a full stop |
| `spriteFacingOffsetRadians` | `Math.PI / 2` | Rotation offset so the ship sprite (which faces up, not right) points the direction it's actually traveling |

```js
window.tuning.ship.maxSpeed = 400        // faster top speed
window.tuning.ship.acceleration = 1500   // snappier ramp-up
window.tuning.ship.arrivalRadius = 100   // starts slowing down earlier
```

## `window.tuning.survival` (`src/config/survivalConfig.ts`)

Energy/structure resource behavior (GDD §5 — structure is the fail
resource, energy just gates ability use and never fails the level).

| Field | Default | What it does |
|---|---|---|
| `maxEnergy` | `100` | Energy pool size |
| `maxStructure` | `100` | Structure pool size |
| `energyRegenPerSecond` | `8` | Passive energy regen rate — always on, no resupply object needed |
| `structureRepairPerSecond` | `20` | Repair rate while overlapping an AsteroidField resupply point |

```js
window.tuning.survival.structureRepairPerSecond = 50  // faster repair at AsteroidField
window.tuning.survival.energyRegenPerSecond = 20      // faster passive energy regen
window.tuning.survival.maxStructure = 200             // bigger structure pool (won't heal existing run above the old max mid-level)
```

## Not tunable from the console yet

- **Hazard costs** (e.g. Debris Field's structure-drain rate) — currently a
  literal object inline in `GameScene.create()`, not its own config module.
- **Ability costs/cooldowns** — `AbilityComponent` doesn't exist yet.
- **Camera/parallax settings** (scroll factors, level size) — level/scene
  setup, not treated as a tunable-feel config module.

If you need to tune one of these, it's a code edit for now, not a console
command — worth asking to have it promoted to a `window.tuning`-exposed
config module if it turns out to need frequent iteration.
