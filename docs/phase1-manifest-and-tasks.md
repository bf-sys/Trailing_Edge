# Phase 1 Asset Manifest & Prep Task List

**Updated 2026-07-29** for a GDD revision that changed Phase 1's scope and
reassigned two already-sourced assets. See `STATUS.md`'s "Design update"
section for the full explanation; this file reflects the *current* correct
scope and directory layout going forward.

Scope: the seven items Phase 1 (GDD §12) requires — ship, one Debris Field
hazard, one AsteroidField resupply point (structure repair only — energy
regenerates passively, no dedicated object), the Probe, the Relay Beacon
(a mandatory per-level waypoint, **not** a puzzle), the Home Marker
(launch/return position), minimal HUD. **No puzzle-taxonomy element ships
in Phase 1** — Signal Array (the renamed sequence puzzle, formerly named
Relay Beacon) and the rest of the taxonomy are Phase 2a scope. Cargo
Pod/Wreckage and the base Ansimuz tileset were incidentally found in an
earlier pass but are Phase 2a/2b scope — listed at the bottom as "on deck,"
not prepped now.

## Directory convention

Per GDD §11.7, level content is one hand-authored TS/JSON config per level,
referencing assets by path — so asset paths should be stable and decided
once, not renamed later. Current structure (as of the 2026-07-29 update):

```
assets/
  ship/
    ship_base_PLACEHOLDER.png
    ship_damage_overlay_PLACEHOLDER.png   (per owner's overlay-VFX decision)
  hazards/
    debris_large.png, debris_medium.png, debris_small.png
  resupply/
    asteroid_large.png, asteroid_medium.png, asteroid_small.png
    (moved here 2026-07-29 — was filed under hazards/ before AsteroidField
    was official Phase 1 scope; these are the structure-repair resupply
    object now, distinct from the Debris Field hazard above even though
    both come from the same source pack)
  objectives/
    (new 2026-07-29 — the three required-every-level core-loop objects;
    none of these are puzzle-taxonomy content, §6)
    home_marker_PLACEHOLDER.png   (was resupply/star_PLACEHOLDER.png —
      Star is no longer a resupply object, reassigned to Home Marker)
    relay_beacon_idle.png, relay_beacon_reached_overlay.png
      (was puzzle/relay_beacon_*.png — reassigned from the old Relay Beacon
      puzzle element, now renamed Signal Array, to the new mandatory
      waypoint of the same name; see STATUS.md)
    probe_PLACEHOLDER.png   (owner-original greyscale placeholder, not
      sourced from a licensed pack — no ATTRIBUTION.md entry needed)
  puzzle/
    (currently empty — Signal Array is unsourced again as of 2026-07-29;
    left in place for Phase 2a rather than deleted)
  ui/
    bar_energy.png
    bar_structure.png
    panel_frame.png
    (remaining UI Pack - Sci-Fi files held uncropped in ui/_source/ until
    Phase 2a needs specific icons)
```

**Build-time caveat (found 2026-07-29, scaffolding pass):** Vite's
`publicDir` (set to `assets/` in `vite.config.ts`) copies its entire tree
into every build verbatim — it does not honor `.gitignore`, so
`assets/ui/_source/` (~3MB of raw, uncropped source-pack files) ships inside
`dist/` even though it's gitignored and nothing references it at runtime.
Harmless for now (no real deploy yet), but move `_source/` out of `assets/`
(or add an explicit build-exclude step) before treating any build as
shippable. Same fix should also address `assets/warped_top_down_tech_lab_extension.png`
sitting loose at `assets/` root, unused until Phase 2a's Cargo Pod/Wreckage
crop.

`_PLACEHOLDER` suffix marks anything Agent 2 scored "Partial" and the owner
accepted as a stand-in (ship base, home marker). Drop the suffix only when a
closer match replaces it — don't rename in place, since level configs will
already reference the placeholder filename by then.

## Per-asset task list

1. **Ship (Space Shooter Remastered.zip)** — done, unaffected by the
   2026-07-29 scope change.
   - Extract one ship sprite (any single-color variant — placeholder, not a
     final art pick) → `ship/ship_base_PLACEHOLDER.png`
   - Extract one explosion/impact frame sequence →
     `ship/ship_damage_overlay_PLACEHOLDER.png`
   - Owner decision already made: overlay VFX, not sprite-swap — so this is
     a layer drawn on top of the base ship, not a second full ship sprite.

2. **Debris Field + AsteroidField (Objects.zip)** — done.
   - Unzip; the pack's own README describes 9 asteroid + 9 debris sprites,
     3 sizes each — confirm the actual filenames match that description
     before building the level config's `HazardZoneElement` reference.
   - Split into `hazards/` (Debris Field, the hazard) and `resupply/`
     (AsteroidField, the structure-repair resupply object — moved here
     2026-07-29, now that it's official Phase 1 scope rather than
     incidental).

3. **Home Marker (Simple Space.zip)** — done; role reassigned 2026-07-29
   (was: Star resupply point).
   - Extract the star/sparkle icon sprite → `objectives/home_marker_PLACEHOLDER.png`
     (currently a placeholder for a future distinct object, e.g. a
     wormhole — GDD §11.14).
   - **Do not skip the style-mismatch check**: view this sprite next to
     `ship_base_PLACEHOLDER.png` before committing. *Simple Space* is flat
     minimalist line art; *Space Shooter Remastered* is shaded/rendered.
     Already flagged once (as the Star resupply point) and accepted
     as-is by the owner — same visual, same call now that it's Home Marker.

4. **Relay Beacon (mandatory waypoint) — reassigned, not re-sourced,
   2026-07-29.** Previously sourced for the old Relay Beacon *puzzle*
   element (now Signal Array); reassigned to the new mandatory waypoint of
   the same name per owner decision (satellite sprite fits a "marker in
   space" concept well; Signal Array gets fresh sourcing instead, see item
   6 below).
   - Files already extracted: `objectives/relay_beacon_idle.png`
     (`spaceStation_021.png`, Kenney Space Shooter Extension, CC0,
     unmodified) and `objectives/relay_beacon_reached_overlay.png` (a
     procedurally generated glow, not sourced — no license implication).
   - The waypoint doesn't strictly need a "reached" glow state the way the
     old puzzle needed a solved/unsolved state per spot — but there's no
     reason not to reuse it as arrival feedback (e.g. flash on overlap).
     Not a blocking decision; revisit if it looks wrong in practice.

5. **Probe — done, via owner-original placeholder (2026-07-29), not the
   Agent 1/2/3 pipeline.**
   - The project owner added `objectives/probe_PLACEHOLDER.png` directly —
     a greyscale, owner-authored image, not sourced from a licensed pack.
     No `ATTRIBUTION.md` entry needed (nothing third-party involved).
   - This was never listed as an asset requirement anywhere before the
     2026-07-29 GDD revision (a pre-existing gap the revision exposed, not
     a new invention) — now resolved as a placeholder, same day.
   - Still open: this is programmer-art/greyscale, not a licensed sprite
     like the rest of Phase 1's assets. Fine as a stand-in; a real sourcing
     pass (Agents 1+2, targeting this specifically) or a proper
     owner-authored replacement is still worth doing before treating Phase
     1 art as final. Narrative framing per GDD §1.1: an inactive probe,
     older tech relative to the player's ship but still distinctly
     "advanced probe" silhouette, not a generic crate/box.

6. **HUD (UI Pack - Sci-Fi.zip)** — done, unaffected by the 2026-07-29
   scope change.
   - Extract only what Phase 1's "bare-minimum HudOverlay" needs per GDD
     §12 step 5: energy bar, structure bar. Ability icons and puzzle-site
     indicator are explicitly Phase 2a (§11.10) — don't extract them yet,
     to keep this pass scoped to what Phase 1 actually uses.

## On deck (Phase 2a/2b — found or reassigned away, not prepped for Phase 1)

- **Signal Array** (sequence puzzle, formerly named Relay Beacon) —
  unsourced as of 2026-07-29. Its previously-sourced satellite asset moved
  to the new Relay Beacon waypoint (item 4 above) instead. Needs: a
  solved/unsolved visual state, readable across multiple instances in a
  level, plus a way to read sequence order (numbering, light-up order,
  etc.) — same requirements the original Relay Beacon puzzle asset note
  described, just now needing a fresh source.
- Cargo Pod / Wreckage — "Crates & barrel" tile, same
  `warped_top_down_tech_lab_extension.png` sheet as the old Relay Beacon
  candidate; crop in the same pass as other Phase 2a puzzle assets, since
  it's the same source file.
- Base tileset `Warped Top-Down Tech Lab` (Ansimuz) — floor/wall tiles for
  puzzle-site backgrounds; not evaluated for specific coverage yet, listed
  as a lead only.

## Open items carried forward

- Home Marker vs. ship style-mismatch (item 3 above) — the one unresolved
  judgment call carried over from the original Phase 1 set. Resolve before
  calling Phase 1 asset prep done.
- Probe placeholder (item 5 above) is greyscale/programmer-art, not a
  licensed-pack sprite — fine as a stand-in, worth a real sourcing pass or
  owner-authored replacement before final art.
- `assets/ui/_source/` (and the loose `warped_top_down_tech_lab_extension.png`
  at `assets/` root) need to move out of the `publicDir`-served tree before a
  real production build — see the build-time caveat above. Found during code
  scaffolding, not an asset-prep task, but flagged here since this doc owns
  the directory convention.
