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
