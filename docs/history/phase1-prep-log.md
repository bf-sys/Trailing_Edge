# Phase 1 Prep Log

One entry per asset-list line item, per `agent-03-prep.md`'s output
requirement. Covers everything converted, placeholder-flagged, or kicked
back so far. `STATUS.md` summarizes from this; this file is the source
record.

**Note (2026-07-29):** this log is left as-written — an accurate historical
record of what was sourced and why at the time. A GDD revision on this date
renamed/reassigned some of what's described below (Star → Home Marker, the
old Relay Beacon puzzle → Signal Array, its satellite asset reassigned to a
new Relay Beacon waypoint). See `STATUS.md`'s "Design update" section for
the current mapping before treating any naming below as current.

## Ship

- **Converted:** `ship/ship_base_PLACEHOLDER.png` — copied directly from
  Space Shooter Remastered (`playerShip1_blue.png`, blue variant, no
  cropping needed). `ship/ship_damage_overlay_PLACEHOLDER.png` — 20
  individual `fire00–19` effect frames composited into one horizontal strip
  (format conversion: frames → single overlay file, task 1's reverse
  direction).
- **Placeholder:** yes, both files — ship art is a stand-in single-color
  variant, and the damage overlay is a flame/glow effect repurposed as
  impact VFX, not built for this specifically.
- **Kicked back:** nothing.

## Debris Field + Resource Field (asteroids)

- **Converted:** `hazards/debris_{large,medium,small}.png`,
  `hazards/asteroid_{large,medium,small}.png` — direct copies, renamed to
  match the asset-reference scheme.
- **Placeholder:** no — Agent 2 scored Debris Field Full.
- **Kicked back, then resolved:** the pack's own README description implied
  9 debris + 9 asteroid sprites (3 variants × 3 sizes each). Actual pack
  contents: 1 variant per size, 6 files total. Flagged to project owner;
  owner confirmed proceeding with the real 6 files rather than fabricating
  the missing variants. (This is the exact case task 0 of the current
  `agent-03-prep.md` spec was added to catch on future runs.)

## Star

- **Converted:** `resupply/star_PLACEHOLDER.png` — cropped from
  `simpleSpace_sheet.png` using the exact rect in its companion `.xml`
  (`star_large`, 48×48).
- **Placeholder:** yes — Simple Space's flat line-art style visibly clashes
  with the ship's shaded/rendered style.
- **Kicked back, then resolved:** flagged the style mismatch per the
  manifest's explicit hard rule on this pair. Owner decision: keep as
  placeholder as-is for now, revisit later. Not re-sourced.

## HUD

- **Converted:** `ui/bar_energy.png` (Blue), `ui/bar_structure.png` (Grey),
  `ui/panel_frame.png` (`panel_rectangle.png`) — all pre-existing individual
  files, no cropping needed. Full pack staged uncropped in `ui/_source/` per
  the manifest's deferred-icon note.
- **Placeholder:** no.
- **Kicked back, then resolved:** the manifest named the source pack
  "UI Pack - Sci-Fi 2.0"; the file actually downloaded was
  `kenney_ui-pack-space-expansion.zip`. Flagged the name mismatch; owner
  confirmed (re-checked the source site) that this is in fact the same pack
  under its actual filename, not a substitution. Proceeded.
- **Judgment call, not fully automatable:** which color variant maps to
  "energy" vs. "structure" (Blue/Grey picked) — arbitrary but reasonable,
  easy to swap later.

## Relay Beacon

- **First pass — kicked back, not resolved.** Source:
  `warped_top_down_tech_lab_extension.png` (Warped Top-Down Tech Lab
  Extension, OGA listing described a "Beacon (animated)" tile). No
  companion Aseprite/JSON; tile bounds were measured manually via
  column/row alpha-profiling and flood-fill connected-component analysis.
  Found three repeated 4-icon candidates: a glass pod/tank (4 pixel-identical
  copies, no animation), a ring-with-torch marker (4 pixel-identical copies,
  no animation — best thematic fit but no distinct active frame), and a
  shield icon (the only one with real frame variation, but reads as a status
  icon, not a beacon). None confidently matched the listing's "animated"
  description. Flagged back; owner deferred rather than picking one.
- **Second pass — resolved.** Owner authorized broadening the visual concept
  to "a standard orbital satellite," which reframed this as a sourcing
  problem, not a cropping problem. Re-ran sourcing (targeted OpenGameArt
  search for CC0 2D satellite sprites) and evaluation:
  - Ruled out an OGA "Satellite" item (3D model, CC-BY — off-scope, wrong
    format, per the same criteria that ruled out 3D industrial-object packs
    earlier in the project).
  - Found Kenney's **Space Shooter Extension** pack (CC0, OpenGameArt
    mirror, individual PNG files, same author/style family as the ship
    sprite already in use) — scores better than the tech-lab candidates on
    license, format burden, *and* style consistency simultaneously.
  - **Converted:** `puzzle/relay_beacon_idle.png` (copied directly from
    `spaceStation_021.png`, no cropping needed) and
    `puzzle/relay_beacon_active_overlay.png` (a soft radial-gradient glow,
    generated procedurally via `System.Drawing`, not sourced from any pack —
    no license implication).
  - **Re-scoped the requirement while evaluating:** the GDD's own §9 table
    marks Relay Beacon `Static`, and the actual documented need (asset list)
    is a *solved/unsolved visual state*, not animation. Applied the same
    overlay-VFX pattern already used for ship damage (owner's standing
    decision, GDD §11 "Owner decisions locked in") instead of hunting for a
    second full "active" sprite — base sprite unchanged, glow overlay drawn
    on top only when the beacon is solved.
  - **Placeholder:** no — this is a Full match against the (owner-broadened)
    requirement, not a stand-in.
  - Attribution updated in `ATTRIBUTION.md`. The tech-lab pack's CC0 entry
    was kept (retitled to Cargo Pod/Wreckage) since that pack is still the
    intended Phase 2a source for the Cargo Pod tile — not dropped, just no
    longer covering the Beacon.
