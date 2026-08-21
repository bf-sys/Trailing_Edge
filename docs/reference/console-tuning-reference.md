# Browser Console Tuning Reference

A quick reference for the live-tuning values exposed on `window.tuning`
while playing a dev build (`npm run dev`). This is the "expose config
objects on window in dev builds for live console tuning" convention from
`CLAUDE.md`'s tech-stack section — every per-subsystem config module
(`shipConfig.ts`, `survivalConfig.ts`, ...) registers itself here so you can
tweak feel without editing a file or reloading the page.

**This list reflects the config modules that exist right now. As more get
added, this file will need updating — check `src/config/` directly if
something here looks out of date.**

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
| `displayWidth` / `displayHeight` | `46` / `56` | On-screen ship size (px), applied via `setDisplaySize()` (added 2026-08-01, after `ship_base.png`'s AI-generated art at ~4.5x the old placeholder's native resolution revealed the previous `setScale(0.5)` call was tying display size to native pixel size — exactly the anti-pattern `CLAUDE.md`'s asset/gameplay-size decoupling rule warns against) |

```js
window.tuning.ship.maxSpeed = 400        // faster top speed
window.tuning.ship.acceleration = 1500   // snappier ramp-up
window.tuning.ship.arrivalRadius = 100   // starts slowing down earlier
```

**Note:** unlike the movement fields above, `displayWidth`/`displayHeight`
are only applied once, in `PlayerShip`'s constructor (`setDisplaySize()`) —
not read every frame. A console edit has no visible effect until the next
hard-fail restart or level load (same class of caveat as `hud`'s
texture-baked marker size/color, and `backgroundSetPieces`' size/color
fields).

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

## `window.tuning.waypointTint` (`src/config/waypointTintConfig.ts`)

Shared active/inactive tint language (GDD §11.13/§11.14) for
`EntryWormhole`/`ExitWormhole` and, as of 2026-08-01, `RelayBeaconObject`
too (renamed from `wormholeConfig` when the Relay Beacon moved to this same
single-texture-plus-tint convention instead of its old separate
idle/reached-overlay files).

| Field | Default | What it does |
|---|---|---|
| `activeTint` | `0xffffff` (changed from `0x88ffcc` 2026-08-01 — see below) | Tint applied while "open"/"reached" (Entry Wormhole at level start; Exit Wormhole and Relay Beacon once the Relay Beacon is reached) |
| `inactiveTint` | `0x445566` | Tint applied while "closed"/"not yet reached" (Entry Wormhole after `entryCloseDelayMs`; Exit Wormhole and Relay Beacon until the Relay Beacon is reached) |
| `entryCloseDelayMs` | `400` | Delay (ms) after level start before the Entry Wormhole swaps from `activeTint` to `inactiveTint` |

```js
window.tuning.waypointTint.entryCloseDelayMs = 1000  // Entry Wormhole stays open longer before closing
window.tuning.waypointTint.activeTint = 0xffddaa     // warm-tinted "open"/"reached" glow instead of true colors
```

**Note (2026-08-01):** `activeTint` defaults to `0xffffff` (a no-op
multiplicative tint, i.e. true colors) rather than a colored tint —
`setTint()` multiplies per channel, so a colored value like the original
`0x88ffcc` reads as a subtle glow on a near-monochrome placeholder icon but
recolors a detailed, naturally-colored sprite (like the AI-generated Relay
Beacon) with a visible cast toward whichever channel the tint leaves
un-reduced. If you set `activeTint` to a color again, check it against the
actual sprite, not just in isolation.

## `window.tuning.hud` (`src/config/hudConfig.ts`)

Off-screen objective marker feel (resolves GDD §9's off-screen-objective-
visibility open question) — a single edge-pinned arrow pointing at the
current objective (Probe → Relay Beacon → Exit Wormhole) whenever it's
outside the camera viewport.

| Field | Default | What it does |
|---|---|---|
| `objectiveMarkerEdgeMargin` | `32` | Inset (px) from the viewport edge where the marker sits when clamped |
| `objectiveMarkerSize` | `18` | Arrow size (px) |
| `objectiveMarkerColor` | `0xffcc33` | Arrow fill color |

```js
window.tuning.hud.objectiveMarkerEdgeMargin = 60  // marker sits further in from the screen edge
```

**Note:** `objectiveMarkerSize`/`objectiveMarkerColor` are baked into a
generated texture the first time `HudOverlay` constructs, and — same as
`StarfieldBackground`'s procedural tiles — that texture lives in the global
texture manager, not per-scene, so it's never regenerated once created, not
even across a hard-fail restart. Changing these two values via the console
has no visible effect until a full page reload; `objectiveMarkerEdgeMargin`
(read fresh every frame in `HudOverlay.update()`) applies instantly like
`ship`/`survival`/`wormhole`.

## `window.tuning.backgroundSetPieces` (`src/config/backgroundSetPieceConfig.ts`)

Decorative-only background dressing (no gameplay effect) — a handful of
large, slow-parallax "set piece" images (a planet, a distant galaxy, ...)
scattered across the level to break up the tiled starfield's
(`StarfieldBackground.ts`) monotony. Placement is seeded per level + session
(`BackgroundSetPieces.ts`), so it's stable across a hard-fail restart of the
same level, varies between levels, and reshuffles on a fresh page load.

| Field | Default | What it does |
|---|---|---|
| `count` | `3` | Set pieces placed per level |
| `minSpacing` | `400` | Minimum distance (px) enforced between placed set pieces |
| `scrollFactor` | `0.08` | Parallax speed — slower than the far starfield layer (`0.15`), reads as further away |
| `depth` | `-110` | Render depth — behind the far starfield layer (`-100`) |
| `minScale` / `maxScale` | `0.8` / `1.6` | Random per-instance scale range |
| `minAlpha` / `maxAlpha` | `0.5` / `0.9` | Random per-instance alpha range |

```js
window.tuning.backgroundSetPieces.count = 6          // more set pieces per level (takes effect on next restart, not live)
window.tuning.backgroundSetPieces.scrollFactor = 0.15 // move at the same speed as the far starfield layer
```

**Note:** unlike `ship`/`survival`/`wormhole`, these values are only read
once per `GameScene.create()` (including hard-fail restarts), not every
frame — a console edit takes effect on the *next* restart or level load, not
instantly. The roster textures themselves (`bg_setpiece_planet`,
`bg_setpiece_galaxy`) are placeholder procedural art, same caveat as
`hud`'s marker texture: not reconfigurable from here at all, only replaceable
by editing `BackgroundSetPieces.ts` or swapping in real sourced art.

## `window.tuning.shipStatusArc` (`src/config/shipStatusArcConfig.ts`)

Ship-relative energy/structure readout (`ShipStatusArcs`, added 2026-08-10
as a replacement for `HudOverlay`'s old screen-pinned bars) — a straight
structure bar below the ship, a thinner straight energy bar directly below
that, both following the ship in world space. **Structure switched from a
curved dome arc to a horizontal bar 2026-08-14** — the arc read as a shield
to playtesters, which misrepresented structure as absorbing damage rather
than being consumed by it.

| Field | Default | What it does |
|---|---|---|
| `structureBarWidth` | `56` | Structure bar width (px) |
| `structureBarHeight` | `8` | Structure bar height (px) |
| `structureBarOffsetY` | `34` | Distance (px) below ship center to the structure bar |
| `structureBarTrackColor` | `0x1a1a22` | Structure bar's empty-track background color |
| `structureBarTrackAlpha` | `0.7` | Structure bar track opacity |
| `structureColor` | `0xff8a4c` | Structure bar fill color |
| `energyBarWidth` | `56` | Energy bar width (px) |
| `energyBarHeight` | `4` | Energy bar height (px) |
| `energyBarOffsetY` | `45` | Distance (px) below ship center to the energy bar |
| `energyBarTrackColor` | `0x1a1a22` | Energy bar's empty-track background color |
| `energyBarTrackAlpha` | `0.7` | Energy bar track opacity |
| `energyColor` | `0x4fc3f7` | Energy bar fill color |
| `depth` | `15` | Render depth — above `PlayerShip`'s depth of `10` |

```js
window.tuning.shipStatusArc.structureBarHeight = 12  // thicker structure bar
window.tuning.shipStatusArc.energyBarWidth = 80      // longer energy bar
window.tuning.shipStatusArc.structureColor = 0xff3344  // redder structure bar
```

**Note:** all fields except `depth` are read fresh inside `render()`, which
fires on every `onResourceChanged` event — since energy regenerates
passively while below max, this fires almost every frame during normal
play, so most console edits show up within a moment. If both resources are
already full (no pending regen, no recent damage), no event fires and
you won't see a change until you take damage, spend energy, or repair —
poke either value via `ShipSurvivalComponent` (or just take a hit) to force
a redraw. `depth` is only applied once, in the constructor — same
next-restart-only caveat as `ship`'s `displayWidth`/`displayHeight`.

## `window.tuning.destinationMarker` (`src/config/destinationMarkerConfig.ts`)

Quick, purely-decorative "scanner ping" (`docs/reference/phaser-vfx-notes.md`)
shown at the ship's click-to-move destination once it's committed — an
expanding-ring tween fired on `pointerup`
(`ExplorationController`'s `EXPLORATION_EVENTS.DestinationSet`), rendered by
`DestinationMarker`. No gameplay effect.

| Field | Default | What it does |
|---|---|---|
| `color` | `0x8fd3ff` | Ring color |
| `strokeWidth` | `4` | Ring line thickness (px) |
| `durationMs` | `350` | How long the expand-and-fade tween runs |
| `startScale` / `endScale` | `0.4` / `1.2` | Scale the ring tweens between |
| `startAlpha` | `0.85` | Starting opacity (tweens to `0`) |
| `depth` | `5` | Render depth — above world content, below the ship (depth `10`) |

```js
window.tuning.destinationMarker.durationMs = 700   // slower, more lingering ping
window.tuning.destinationMarker.color = 0xff6644   // orange ping instead of blue
```

**Note:** `color`/`strokeWidth` are baked into a generated ring texture the
first time `BootScene` runs (same procedural-texture caveat as `hud` and
`backgroundSetPieces` above) — changing either has no visible effect until a
full page reload. `durationMs`/`startScale`/`endScale`/`startAlpha`/`depth`
are read fresh each time a ping plays, so those apply to the very next click
with no reload needed.

## `window.tuning.hazard` (`src/config/hazardConfig.ts`)

Per-hazard-type shape/movement/activation/resource-cost defaults for all
five named hazards (GDD §9/§11.3's "one class, five content configs"
collapse) — extracted 2026-08-11 from literals that used to sit inline in
`GameScene.create()`, closing the gap this file used to flag below. Keyed
by `HazardType`: `debrisField`, `solarFlare`, `ionStorm`, `nebulaField`,
`meteoroid`. Deliberately excludes each instance's `x`/`y` — placement is
per-level authored content (GDD §11.7), not a global tunable, and stays in
`GameScene.ts` until Phase 2b's per-level config files exist.

| Field (per hazard type) | What it does |
|---|---|
| `shape` | `{ kind: 'circle', radius }` or `{ kind: 'rectangle', width, height }` — collision/interaction size, authored independent of sprite pixel size |
| `movementPattern` / `speed` / `headingRadians` | `'static'` \| `'linear'` \| `'patrol'` (`'patrol'` reserved, unimplemented — see `HazardZoneElement`); `speed` px/s, ignored when static |
| `activation` / `pulseIntervalSeconds` / `hitCooldownSeconds` | `'continuous'` drains every frame while overlapping; `'pulsed'` drains once per `pulseIntervalSeconds`; `'impact'` (added 2026-08-21, Meteoroid) applies `resourceCost` as a one-time hit on contact, gated by `hitCooldownSeconds` so a lingering overlap doesn't re-trigger every frame |
| `resourceCost` | `{ energy, structure }` per second (continuous), per pulse (pulsed), or per hit (impact) |
| `blocksMovement` | Solid collider — ship physically bounces off instead of passing through. No longer implies zero cost (decoupled 2026-08-21): Debris Field is `blocksMovement` with zero cost, Meteoroid is `blocksMovement` *and* charges an impact hit — the two are independent flags now, not one implying the other |
| `cancelTargetOnContact` | Experimental, added 2026-08-21, Meteoroid only. On contact, clears the player's click-to-move destination so `ExplorationController` stops re-steering into the hazard every frame and fighting Arcade's collision separation — see the `cancelTargetOnContact` bullet in `CLAUDE.md`'s Architecture contract for the measured before/after. Only meaningful alongside `blocksMovement` |
| `placeholderTexture` | `{ color, alpha }` for the four hazards with no sourced art yet (Solar Flare/Ion Storm/Nebula Field/Meteoroid, `docs/STATUS.md`) — `GameScene` bakes this into a flat circle texture under `textureKey`. Debris Field omits this since it has final sourced art. |

```js
window.tuning.hazard.meteoroid.resourceCost.structure = 40  // meaner Meteoroid hits
window.tuning.hazard.ionStorm.speed = 40                    // faster drift
window.tuning.hazard.solarFlare.pulseIntervalSeconds = 1    // more frequent bursts
```

**Note:** like `survival`/`ship`, most fields are read fresh by
`HazardZoneElement` each frame or each pulse, so cost/speed/pulse-interval
edits apply live. `shape`, `placeholderTexture`, `blocksMovement`, and
`cancelTargetOnContact` are only read once, when `GameScene.create()`
constructs that hazard's `HazardZoneElement` instance — a console edit to
those needs a level restart (hard-fail restart or a fresh `Start`) to take
effect, same next-restart-only caveat as `backgroundSetPieces`.

## `window.tuning.ability` (`src/config/abilityConfig.ts`)

Per-ability dual/triple gate (`energyCost`, `cooldownSeconds`, plus
per-type extras added by the 2026-08-14 ability rework) — has been live
since `AbilityComponent` was built in Phase 2a (2026-08-10), just not
previously documented here. Keyed by `AbilityType`: `scan`, `tractorBeam`,
`teleport`, `rocketBoost`.

| Field | Default | What it does |
|---|---|---|
| `energyCost` | per ability | Energy spent on a successful `tryActivate` — `0` no-ops this gate |
| `cooldownSeconds` | per ability | Time before the next `tryActivate` succeeds — `0` no-ops this gate |
| `hotkey` | per ability | Phaser `keydown-<KEY>` suffix bound in `ExplorationController` |
| `durationSeconds` | `scan: 4` | How long `AbilityComponent.isActive(type, ...)` reports `true` after a successful activation — drives `HazardScanOverlay` and `HudOverlay`'s objective-marker visibility. Unset for the other three types. |
| `maxRange` | `teleport: 350` | Fixed max blink distance (px) — **not** distance-scaled cost, see `ExplorationController.clampToTeleportRange()` |
| `boostSpeed` | `rocketBoost: 520` | px/s during the burst |
| `boostDurationSeconds` | `rocketBoost: 0.6` | Burst length |

```js
window.tuning.ability.scan.durationSeconds = 8      // longer hazard-ID/objective-marker window
window.tuning.ability.teleport.maxRange = 600       // longer blink
window.tuning.ability.rocketBoost.boostSpeed = 800  // faster burst
```

**Note:** all fields are read fresh at activation time (`tryActivate()`)
or every frame (`isActive()`/`ExplorationController`'s boost/teleport
math), so console edits apply to the next activation with no restart
needed. `hotkey` is read once, in `ExplorationController.init()` — a
console edit needs a level restart (or fresh `Start`) to rebind.

## `window.tuning.scan` (`src/config/scanConfig.ts`)

`HazardScanOverlay`'s hazard-ID visual (2026-08-14 ability rework) — while
`scan` is active, hazards within `scanRadius` get an outline colored by
resource type plus a name label.

| Field | Default | What it does |
|---|---|---|
| `scanRadius` | `500` | px from ship — hazards farther than this stay unrevealed |
| `outlineThickness` | `3` | Outline line width (px) |
| `outlineMargin` | `6` | px beyond the hazard's own radius the outline is drawn at |
| `neutralColor` | `0xaaaaaa` | Outline color for `blocksMovement` hazards with zero resource cost (Debris Field) |
| `labelFontSize` | `13` | Name label font size (px) |
| `labelColorCss` | `'#ffffff'` | Name label color |
| `labelOffsetY` | `10` | px above the outline's top edge the label sits at |
| `depth` | `16` | Render depth — above `ShipStatusArcs` (`15`), below `HudOverlay`'s screen-pinned depth (`2000`) |

```js
window.tuning.scan.scanRadius = 800        // reveal hazards from further away
window.tuning.scan.neutralColor = 0xffffff // brighter Debris Field outline
```

**Note:** structure/energy outline colors aren't fields here — they're
read live from `window.tuning.shipStatusArc.structureColor`/`energyColor`
so the color language stays in sync with the rest of the HUD; tune those
instead if you want to change them. All fields above are read fresh every
frame in `update()`, so edits apply instantly next time `scan` is active.

## `window.tuning.teleportRangeRing` (`src/config/teleportRangeRingConfig.ts`)

`TeleportRangeRing`'s visual (2026-08-14 ability rework) — a ring at
`teleport`'s max range centered on the ship, plus a reticle at the live
clamped aim point, shown only while teleport is armed.

| Field | Default | What it does |
|---|---|---|
| `ringThickness` | `2` | Range-ring line width (px) |
| `ringColor` | `0xd88fff` | Range-ring color (matches `hudConfig.abilityIconColors.teleport`) |
| `ringAlpha` | `0.6` | Range-ring opacity |
| `reticleRadius` | `10` | Reticle circle radius (px) |
| `reticleThickness` | `2` | Reticle line width (px) |
| `reticleColor` | `0xffffff` | Reticle color |
| `depth` | `16` | Render depth — same layer as `HazardScanOverlay` |

```js
window.tuning.teleportRangeRing.ringColor = 0x00ffcc  // recolor the range ring
```

**Note:** the ring's radius itself isn't a field here — it's
`window.tuning.ability.teleport.maxRange`, so the ring always reflects the
real range rather than a display-only copy that could drift out of sync.
All fields above are read fresh every frame, applying instantly the next
time teleport is armed.

## Not tunable from the console yet

- **Camera/parallax settings** (scroll factors, level size) — level/scene
  setup, not treated as a tunable-feel config module.

If you need to tune this, it's a code edit for now, not a console
command — worth asking to have it promoted to a `window.tuning`-exposed
config module if it turns out to need frequent iteration.
