# Phase 1 Asset Manifest & Prep Task List

Scope: exactly the five items Phase 1 (GDD §12) requires — ship, one Debris
Field hazard, one Star resupply point, one Relay Beacon puzzle element,
minimal HUD. Nothing else. Cargo Pod/Wreckage and the base Ansimuz tileset
were incidentally found in the same pass but are Phase 2a/2b scope —
listed at the bottom as "on deck," not prepped now.

## Directory convention

Per GDD §11.7, level content is one hand-authored TS/JSON config per level,
referencing assets by path — so asset paths should be stable and decided
once, not renamed later. Proposed structure:

```
assets/
  ship/
    ship_base_PLACEHOLDER.png
    ship_damage_overlay_PLACEHOLDER.png   (per owner's overlay-VFX decision)
  hazards/
    debris_large_01.png … debris_small_03.png   (9 files, 3 sizes)
    asteroid_large_01.png … asteroid_small_03.png   (9 files, 3 sizes — resupply-field asteroids, kept in a separate subfolder from debris/ even though both come from the same source pack, since §5/§11.6 treat Debris Field hazard and Resource Field resupply as different objects)
  resupply/
    star_PLACEHOLDER.png
  puzzle/
    relay_beacon_idle.png
    relay_beacon_active.png   (extract both animation frames from the tileset, not just one static tile)
  ui/
    bar_energy.png
    bar_structure.png
    panel_frame.png
    (remaining UI Pack - Sci-Fi files held uncropped in ui/_source/ until Phase 2a needs specific icons)
```

`_PLACEHOLDER` suffix marks anything Agent 2 scored "Partial" and the owner
accepted as a stand-in (ship base, star). Drop the suffix only when a closer
match replaces it — don't rename in place, since level configs will already
reference the placeholder filename by then.

## Per-asset task list

1. **Ship (Space Shooter Remastered.zip)**
   - Extract one ship sprite (any single-color variant — placeholder, not a
     final art pick) → `ship/ship_base_PLACEHOLDER.png`
   - Extract one explosion/impact frame sequence → 
     `ship/ship_damage_overlay_PLACEHOLDER.png`
   - Owner decision already made: overlay VFX, not sprite-swap — so this is
     a layer drawn on top of the base ship, not a second full ship sprite.

2. **Debris Field + Resource Field (Objects.zip)**
   - Unzip; the pack's own README describes 9 asteroid + 9 debris sprites,
     3 sizes each — confirm the actual filenames match that description
     before building the level config's `HazardZoneElement` reference.
   - Split into `hazards/` (debris set) and `resupply/`-adjacent asteroid
     set per the folder note above.

3. **Star (Simple Space.zip)**
   - Extract the star/sparkle icon sprite → `resupply/star_PLACEHOLDER.png`.
   - **Do not skip the style-mismatch check**: view this sprite next to
     `ship_base_PLACEHOLDER.png` before committing. *Simple Space* is flat
     minimalist line art; *Space Shooter Remastered* is shaded/rendered. If
     they clash badly even as placeholders, flag back rather than shipping
     mismatched Phase 1 art — per Agent 3's own hard rule about not
     silently absorbing a coverage problem that surfaces during prep.

4. **Relay Beacon (warped_top_down_tech_lab_extension.png)**
   - This is a single sprite-sheet PNG, not pre-split files — needs manual
     tile-grid cropping (check for a companion Aseprite/JSON file on the
     OGA page; if none exists, tile size will need to be measured directly
     from the PNG).
   - Extract both idle and active/animated frames for the beacon tile
     specifically — the listing describes it as "Beacon (animated)," so
     confirm multiple frames exist before assuming a single static crop
     is sufficient.

5. **HUD (UI Pack - Sci-Fi.zip)**
   - Extract only what Phase 1's "bare-minimum HudOverlay" needs per GDD
     §12 step 5: energy bar, structure bar. Ability icons and puzzle-site
     indicator are explicitly Phase 2a (§11.10) — don't extract them yet,
     to keep this pass scoped to what Phase 1 actually uses.

## On deck (Phase 2a/2b — found, not prepped)

- Cargo Pod / Wreckage — "Crates & barrel" tile, same
  `warped_top_down_tech_lab_extension.png` sheet as the Relay Beacon; crop
  in the same pass as the beacon when Phase 2a starts, since it's the same
  source file.
- Base tileset `Warped Top-Down Tech Lab` (Ansimuz) — floor/wall tiles for
  puzzle-site backgrounds; not evaluated for specific coverage yet, listed
  as a lead only.

## Open item carried forward
Star vs. ship style-mismatch (item 3 above) is the one unresolved judgment
call in this Phase 1 set. Resolve it before calling Phase 1 asset prep done.
