# Art Production Guidelines

Technical parameters for producing new art assets for the game — format,
resolution, orientation, naming, and placement. This is the "how to
produce it" companion to `trailing_edge_art_asset_list.md` (which covers
*what's* needed, not how to make it) and `phase1-manifest-and-tasks.md`
(directory convention and per-file extraction tasks for already-sourced
packs). Written 2026-07-30, derived from the actual dimensions/format of
the assets already in `assets/` — not an abstract spec, a description of
what's already there plus guidance for staying consistent with it.

## File format

**PNG, with alpha transparency.** Every sprite checked in `assets/` (ship,
hazards, resupply, objectives) is RGBA PNG. Sprites composite over the
scene/starfield background, so a transparent background is required, not a
solid fill color.

**Exception: `assets/backgrounds/`** (added 2026-08-01) — the starfield
tiles are opaque, full-bleed `.jpg` files, not PNG. This is fine for a
*single* background layer, but **caught a real bug when stacking two**:
`GameScene` layers a far and a near starfield tile for parallax, and since
neither has transparency, the near layer's solid black areas completely
hid the far layer beneath it (only found during an actual playtest — a
static screenshot of either layer alone looks fine, the problem only shows
up with both layered). Fixed in code, not by regenerating the art: the near
layer uses `Phaser.BlendModes.ADD` (`GameScene.createParallaxBackground()`)
so its black pixels contribute nothing and only its actual stars add on top
of the far layer. **If you add a third stacked opaque layer later, it'll
need the same blend-mode treatment** — this isn't a one-time fix, it's a
standing consequence of using opaque backgrounds in a multi-layer parallax.

## Resolution / canvas size

There's no single fixed resolution — existing assets range from 32×32
(`hazards/debris_small_PLACEHOLDER.png`) up to 288px tall
(`objectives/relay_beacon_idle_PLACEHOLDER.png`),
and non-square canvases exist (e.g. `ship/ship_damage_overlay_PLACEHOLDER.png`
is a 320×41 frame strip). This is deliberate, not inconsistent: per
`CLAUDE.md`'s asset/gameplay-size decoupling rule, on-screen display size is
always authored in code via `setDisplaySize()`/`setScale()`, **never**
derived from a sprite's native pixel dimensions. There is no exact
resolution requirement to hit.

Practical guidance in place of a fixed number:
- Source resolution should be *at or above* whatever size the object will
  typically render at on-screen, so it doesn't look soft when scaled up.
  A rough sanity check: look at the existing tiered assets for the same
  role (e.g. `debris_{large,medium,small}` at 128/64/32px) and match that
  general scale for a similar-tier object.
- Aspect ratio and canvas size should just follow the actual artwork —
  square canvases with transparent padding around the visual content are
  fine and already common in this set.
- Current asset sizes for reference:

| Asset | Size (px) |
|---|---|
| `ship/ship_base.png` (AI-generated, 2026-08-01) | 442×542 |
| `ship/ship_damage_overlay_PLACEHOLDER.png` (20-frame strip) | 320×41 |
| `hazards/debris_large_PLACEHOLDER.png` | 128×128 |
| `hazards/debris_medium_PLACEHOLDER.png` | 64×64 |
| `hazards/debris_small_PLACEHOLDER.png` | 32×32 |
| `resupply/asteroid_large.png` (AI-generated, 2026-08-01) | 760×672 |
| `objectives/probe.png` (AI-generated, 2026-08-01) | 564×504 |
| `objectives/wormhole.png` (AI-generated, 2026-08-01) | 668×692 |
| `objectives/relay_beacon.png` (AI-generated, 2026-08-01 — single asset, replaces the old idle/reached-overlay pair) | 1124×656 |
| `backgrounds/bg_stars_far.jpg` / `bg_stars_near.jpg` (AI-generated, 2026-08-01) | 1024×1024 |

## Field/area hazards — no tile grid, one sprite per authored footprint

There's no tile-based map anywhere in this project (`CLAUDE.md`'s
"hand-authored TS/JSON level configs, not Tiled" decision) — a level is a
continuous pixel-space world, and every hazard is placed at an explicit
`(x, y)` with an authored `shape` (`HazardZoneElement`'s `{ kind: 'circle',
radius }` or `{ kind: 'rectangle', width, height }`). One sprite gets
`setDisplaySize()`'d to exactly that footprint — same size-decoupling rule
as everything else in this doc. The art never dictates how big a given
placement is, and the same image can render small in one spot and large in
another with zero art changes.

Two practical consequences specifically for "field"/area-style hazards, as
opposed to a single compact object like the ship or probe:

- **Compose it as a cluster, not a single object.** Since one image gets
  stretched to fill whatever footprint a level author picks, a single rock
  stretched across a big area reads as one smeared blob, not "a field." A
  loose composition of several small fragments in one image holds up much
  better at larger authored sizes.
- **If the natural composition comes out clearly non-square, say so** —
  that placement should use the `rectangle` shape variant instead of
  `circle`, rather than letting a wide/tall image get force-squished into a
  square footprint. This is exactly what went wrong with the Relay Beacon's
  first pass (see `console-tuning-reference.md`/`STATUS.md`'s 2026-08-01
  playtest-fix notes) — flag it up front instead of discovering it in play.

### Variable-size/irregular fields — composing from multiple instances (2026-08-07)

`HazardZoneElement.shape` only supports `circle` or `rectangle` — there's no
polygon/freeform footprint. A field that needs to read as larger or more
irregularly shaped than either primitive (Debris Field is the motivating
case, now that it's a movement-blocking obstacle rather than a single
structure-drain zone — GDD §9) is authored as **several instances placed
near/overlapping each other**, not as one oddly-shaped hazard. This is
content authoring (Phase 2b, level-config data), not a code change — the
same "union of primitives" approach most 2D games use for irregular
collision areas.

That raises a real art-asset need this doc didn't call out before: placing
several copies of the *same* cluster texture next to each other at the same
scale reads as an obvious stamp, more so than a repeated single rock would,
because a cluster image already has its own internal arrangement of several
rocks — repeat it and that whole arrangement repeats, not just one shape.
To avoid that:

- **Produce 2-3 distinct debris cluster textures**, same brief (a loose
  cluster of small rock/ice fragments, per the section above) but a
  different internal arrangement/density each — same tiering pattern
  already used for `debris_{large,medium,small}`, just for compositional
  variety instead of size. Cheap to generate given the existing AI-generation
  pipeline (Art Director Agent/Gemini).
- **Vary rotation per placed instance** on top of that (a straightforward
  code addition to `HazardZoneElement` — `Phaser.GameObjects.Image` supports
  `setRotation()` natively, it's just not wired into the config yet).
  Rotation alone, from a single texture, isn't enough on its own — the same
  cluster reoriented still has the same silhouette and rock density up
  close — but combined with 2-3 real texture variants it stretches that
  small set much further, same spirit as `BackgroundSetPieces`' existing
  seeded random scale/alpha per instance.

## Orientation

`ship_base` faces **up** by default, and the code compensates for exactly
that (`shipConfig.spriteFacingOffsetRadians = Math.PI / 2`, in
`src/config/shipConfig.ts`). Any new directional/rotatable sprite (a new
ship variant, a moving hazard with a visible "front") should follow the
same up-facing convention — otherwise it needs its own rotation-offset
constant wired into whichever code positions it, since that offset is
currently a single ship-wide value, not per-sprite.

## Style consistency

The official art direction for Trailing Edge is **Gritty Dark Sci-Fi Pixel**. This is a survival-focused, grimy, industrial aesthetic emphasizing 16-bit/32-bit retro-futuristic arcade visuals.

* **Vibe:** High contrast, muted industrial metallics, tactical precision, and stark lighting (e.g., bright thruster contrast against dark space).
* **Execution:** All new assets should be produced as pixel art.

**Resolved 2026-08-01:** the style mismatch flagged here from early
prototyping (the flat, minimalist `Simple Space` look vs. the shaded,
rendered `Space Shooter Remastered` family) no longer applies — ship,
wormhole, Relay Beacon, Probe, AsteroidField (large), and the starfield
backgrounds are all now AI-generated via the Art Director Agent/Gemini
against this same Gritty Dark Sci-Fi Pixel direction, so there's one
consistent look across them rather than two clashing source packs.
Remaining Kenney/OpenGameArt placeholders not yet replaced (debris,
AsteroidField medium/small, ship damage overlay, HUD bars/panel) are still
**legacy placeholders** — any final art replacing those must adhere to the
Gritty Dark Sci-Fi Pixel style too.

**Debris Field vs. AsteroidField — deliberate visual differentiation
(2026-08-07):** Debris Field's fiction was reframed from ship wreckage to
naturally-occurring rock/ice debris — the setting doesn't establish enough
prior space-faring civilization for wreckage fields to make sense. Same
name (`CLAUDE.md`/GDD wording is unchanged), same asset slot, just a
different in-fiction read. This makes it visually closer to AsteroidField
(the resupply object) than before, so keep them deliberately distinct when
producing new Debris Field art: **Debris Field reads as a field of many
small, loose rock/ice fragments** (a cluster composition, per the
Field/area hazards section above); **AsteroidField reads as one single
large rock with visible metal ore** (`resupply/asteroid_large.png`'s
existing look — for reference, not to be changed). Many-small vs.
one-large is the differentiator to hold onto, not just color/palette —
one is meant to be avoided, the other approached.

## Naming convention

- `_PLACEHOLDER` suffix marks a stand-in asset accepted as "good enough for
  now, not final" — e.g. `hazards/debris_large_PLACEHOLDER.png`,
  `ship/ship_damage_overlay_PLACEHOLDER.png`. Drop the suffix only when a
  closer/final asset replaces it, and **don't rename in place** — level
  configs and code will already reference the placeholder filename by then,
  so swap the file content/replace the reference deliberately rather than
  renaming out from under existing references. `ship_base.png`,
  `probe.png`, `wormhole.png`, `objectives/relay_beacon.png`, and
  `resupply/asteroid_large.png` all dropped the suffix this way on
  2026-08-01, once AI-generated final art replaced their placeholders.
- Assets without a real final replacement path yet (e.g. procedurally
  generated ones like `HudOverlay`'s objective-marker arrow or
  `BackgroundSetPieces`' planet/galaxy roster) don't need this suffix — it's
  specifically for "art that should eventually be swapped for something
  better," not everything non-final.

## Directory placement

Follow the existing convention from `phase1-manifest-and-tasks.md`:

```
assets/
  ship/
  hazards/
  resupply/
  objectives/
  ui/
  puzzle/       (Phase 2a — Signal Array, currently empty)
  backgrounds/  (added 2026-08-01 — full-bleed background tiles, .jpg not .png, see File format above)
```

One file per asset, filed by category, not by level — per-level placement
is config data (`x`/`y`, which texture key), not separate asset copies.

## Attribution

Self-produced/original art (like the Probe placeholder) needs **no**
`ATTRIBUTION.md` entry — that ledger is only for third-party sourced packs
(Kenney, OpenGameArt, etc.) where license/credit terms apply. If new art is
traced from, generated by referencing, or otherwise derived from a licensed
source rather than fully original, treat it like sourced art and add an
entry.

## Multi-frame / animated assets

If producing an animation (e.g. a VFX effect per `docs/reference/phaser-vfx-notes.md`,
or an ability effect down the line), Phaser's sprite-sheet loading
(`scene.load.spritesheet(key, url, { frameWidth, frameHeight })`) expects a
uniform frame size across the whole strip/grid — every frame the same
width and height, laid out in a consistent row or grid, not variable-sized
frames packed together. `ship_damage_overlay_PLACEHOLDER.png` (320×41, 20
frames) already follows this — 16px-wide frames in a single row.

## Not yet decided

- While the "Gritty Dark Sci-Fi Pixel" style is now the official direction, a formal color palette (specific hex codes for UI, metallics, and thruster glows) has not been strictly defined yet.
- ~~No per-level background/starfield art has been sourced or specified yet~~ — **Resolved 2026-08-01**: `backgrounds/bg_stars_far.jpg`/`bg_stars_near.jpg`, AI-generated, in place (`trailing_edge_art_asset_list.md` §2.1).
