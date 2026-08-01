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

**PNG, with alpha transparency.** Every asset checked in `assets/` (ship,
hazards, resupply, objectives) is RGBA PNG — no exceptions found. Sprites
composite over the scene/starfield background, so a transparent background
is required, not a solid fill color.

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
| `ship/ship_base_PLACEHOLDER.png` | 99×75 |
| `ship/ship_damage_overlay_PLACEHOLDER.png` (20-frame strip) | 320×41 |
| `hazards/debris_large_PLACEHOLDER.png` | 128×128 |
| `hazards/debris_medium_PLACEHOLDER.png` | 64×64 |
| `hazards/debris_small_PLACEHOLDER.png` | 32×32 |
| `resupply/asteroid_large_PLACEHOLDER.png` | 128×128 |
| `objectives/probe_PLACEHOLDER.png` | 98×97 |
| `objectives/wormhole_PLACEHOLDER.png` | 48×48 |
| `objectives/relay_beacon_idle_PLACEHOLDER.png` | 172×288 |
| `objectives/relay_beacon_reached_overlay_PLACEHOLDER.png` | 172×288 |

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

There's an existing, accepted-but-unresolved style mismatch from early prototyping: the flat, minimalist `Simple Space` look (Home Marker's star sprite) sits next to the shaded, rendered `Space Shooter Remastered` family. Both of these styles are now considered **legacy placeholders**. Any final art replacing these placeholders must adhere to the Gritty Dark Sci-Fi Pixel style.

## Naming convention

- `_PLACEHOLDER` suffix marks a stand-in asset accepted as "good enough for
  now, not final" — e.g. `ship_base_PLACEHOLDER.png`,
  `probe_PLACEHOLDER.png`. Drop the suffix only when a closer/final asset
  replaces it, and **don't rename in place** — level configs and code will
  already reference the placeholder filename by then, so swap the file
  content/replace the reference deliberately rather than renaming out from
  under existing references.
- Assets without a real final replacement path yet (e.g. procedurally
  generated ones like the starfield tiles) don't need this suffix — it's
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
- No per-level background/starfield art has been sourced or specified yet (`trailing_edge_art_asset_list.md` §2.1) — the current starfield is a procedurally generated placeholder (`StarfieldBackground.ts`). When produced, background art should match the dark, high-contrast pixel aesthetic.
