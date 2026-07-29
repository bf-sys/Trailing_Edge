# STATUS — Trailing Edge Asset Sourcing (as of 2026-07-29)

One-page entry point. Read this first; go to `run-log-2026-07-24.md` for
search-by-search detail, or `phase1-prep-log.md` for the full per-item prep
record (conversions, placeholder flags, kickbacks) behind the summary below.

## Design update (2026-07-29) — read this before trusting anything below

A GDD revision on this date changed Phase 1's scope and renamed/reassigned
several already-sourced assets. The prep narrative further down (and all of
`phase1-prep-log.md`) is an accurate *historical* record of what was
sourced and why — it just predates this rename. Current mapping:

- **"Relay Beacon" now means a new, mandatory, non-puzzle per-level
  waypoint** (find it after the probe, before you can return). The
  previously-sourced satellite asset (idle + glow-overlay states, originally
  built for the *old* Relay Beacon puzzle) has been **reassigned to this new
  waypoint** and moved to `assets/objectives/` — see below.
- **The old Relay Beacon puzzle element is renamed Signal Array** (still the
  same `SequenceSpotElement` mechanic — move to spots in a particular
  order). It is now **Phase 2a scope, not Phase 1**, and its asset need is
  now **unsourced again** — the satellite sprite went with the rename to
  the new waypoint, not with the puzzle.
- **Star is no longer a resupply object.** It's reassigned to `HomeMarker` —
  the level's launch/return position — moved to `assets/objectives/` and
  renamed `home_marker_PLACEHOLDER.png`. Energy now regenerates passively;
  there's no dedicated energy-resupply object at all.
- **AsteroidField (the "Resource Field" asteroids) is now the official
  Phase 1 resupply object** (structure repair only). These were sourced
  incidentally alongside Debris Field before this was official scope, filed
  under `hazards/` — moved to `assets/resupply/` to match.
- **The Probe had no sourced asset at all** when this revision landed — it
  was never listed as a requirement anywhere (a pre-existing gap this
  revision exposed). **Resolved same day:** the project owner added an
  original greyscale placeholder, `objectives/probe_PLACEHOLDER.png` — not
  sourced from a licensed pack, so no `ATTRIBUTION.md` entry needed, just
  the usual `_PLACEHOLDER` stand-in flag.

File moves made as part of this update (`git mv`, so history is preserved):

```
assets/resupply/star_PLACEHOLDER.png           → assets/objectives/home_marker_PLACEHOLDER.png
assets/puzzle/relay_beacon_idle.png            → assets/objectives/relay_beacon_idle.png
assets/puzzle/relay_beacon_active_overlay.png  → assets/objectives/relay_beacon_reached_overlay.png
assets/hazards/asteroid_{large,medium,small}.png → assets/resupply/asteroid_{large,medium,small}.png
```

`assets/puzzle/` is now empty (Signal Array, its only occupant, is unsourced
again) — left in place rather than deleted, since Phase 2a will need it.

## What's done

- **Sourcing + Evaluation (Agents 1+2), full pass:** every category in
  `trailing_edge_art_asset_list.md` has been searched at least once. Coverage
  matrix and license flags recorded in the run log.
- **Original scope narrowing (owner decision, since superseded above):** one
  hazard (Debris Field), one resupply point (Star), one puzzle element
  (Relay Beacon), ship, minimal HUD. This was Phase 1 **as of 2026-07-25** —
  see the design update above for the current, correct scope.
- **Five source files downloaded and moved into the project directory**
  (`assets/`): Space Shooter Remastered, Simple Space, UI Pack - Sci-Fi
  (downloaded under the filename `kenney_ui-pack-space-expansion.zip` —
  confirmed by owner to be the same pack listed on the Kenney site as
  "UI Pack - Sci-Fi"), Asteroids/Debris Set (`Objects.zip`), Warped Top-Down
  Tech Lab Extension — all CC0.
- **Attribution ledger written** (`ATTRIBUTION.md`) — covers the CC0 Phase-1
  set (no attribution legally required) and flags two deferred CC-BY /
  CC-BY-SA items for later phases, including a bundled-license correction
  found in one OGA item's comment history.
- **Manifest + task list written** (`phase1-manifest-and-tasks.md`) —
  directory convention mapped to GDD §11.7, per-file extraction steps,
  placeholder-naming rule. Updated 2026-07-29 for the new directory/scope
  changes above.
- **Owner decisions locked in:** overlay VFX for ship damage states;
  CC-BY-SA accepted since this build won't be redistributed.
- **Directory structure created** under `assets/`: `ship/`, `hazards/`,
  `resupply/`, `ui/` (+ `ui/_source/`), plus `objectives/` (new, added
  2026-07-29 for Probe/Relay Beacon/Home Marker — see design update above).
  `puzzle/` still exists but is currently empty.
- **Extraction done, historically, for what was Phase 1's five items as of
  2026-07-25** (roles reassigned since — see design update above):
  - **Ship** — `ship/ship_base_PLACEHOLDER.png` (Space Shooter Remastered,
    blue variant) and `ship/ship_damage_overlay_PLACEHOLDER.png` (20-frame
    strip composited from the pack's `fire00–19` effect frames). Unaffected
    by the design update.
  - **Debris Field + Resource Field** — `hazards/debris_{large,medium,small}.png`
    (unaffected — still the Debris Field hazard) and, now moved,
    `resupply/asteroid_{large,medium,small}.png` (the AsteroidField resupply
    object, per the design update above). **Correction to the manifest's
    original expectation:** the actual pack has 1 variant per size (6 files
    total), not 3 variants × 3 sizes (18 files) as the README description
    implied — owner confirmed proceeding with the 6 real files.
  - **Home Marker (was: Star resupply point)** —
    `objectives/home_marker_PLACEHOLDER.png`, cropped from
    `simpleSpace_sheet.png` using the exact rect in its companion `.xml`
    (`star_large`, 48×48). No longer a resupply object — see design update.
  - **HUD** — `ui/bar_energy.png` (Blue), `ui/bar_structure.png` (Grey),
    `ui/panel_frame.png`, all from the UI Pack; full pack staged uncropped in
    `ui/_source/` per the manifest's deferred-icons note. Unaffected by the
    design update.
- **Home Marker/ship style-mismatch flag resolved (for now):** confirmed real
  (flat pale Simple Space star next to shaded Space Shooter Remastered ship
  clash visibly) — owner decision: keep as placeholder as-is, revisit later.
  (Originally flagged when this asset was still the Star resupply point;
  same visual, same call, new role.)
- **Relay Beacon (waypoint) — sourced, reassigned from the old puzzle
  element.** The original candidate (a tile on
  `warped_top_down_tech_lab_extension.png`, OGA-listed as "Beacon
  (animated)") never panned out: manual tile-grid measurement found three
  repeated icon candidates (glass pod, ring/torch marker, shield), none of
  which convincingly matched an animated beacon — see `phase1-prep-log.md`
  for the full trail. Owner authorized broadening the visual concept to "a
  standard orbital satellite," which turned this back into a sourcing
  problem. Re-ran sourcing + evaluation targeting CC0 2D satellite sprites;
  found Kenney's **Space Shooter Extension** pack (OpenGameArt mirror,
  CC0, individual PNG files, same author/style family as the already-used
  ship sprite — better on license, format, *and* style consistency than the
  tech-lab candidates). Extracted `objectives/relay_beacon_idle.png`
  (`spaceStation_021.png`, unmodified) and
  `objectives/relay_beacon_reached_overlay.png` (a procedurally generated
  glow, not sourced — no license implication), following the same
  overlay-VFX pattern already used for ship damage. **2026-07-29 update:**
  this asset was originally sourced for the sequence-puzzle element (idle/
  active states per spot, multiple instances) — it has since been reassigned
  to the new mandatory Relay Beacon waypoint (a single simple arrival
  marker), per owner decision. The renamed puzzle element (Signal Array,
  Phase 2a) is unsourced again as a result. The tech-lab pack's CC0 entry
  was kept (retitled to Cargo Pod/Wreckage) since it's still that item's
  intended Phase 2a source — unaffected by any of the above.

Phase 1 is now **file-complete again** — every required object (Debris
Field, AsteroidField, Probe, Relay Beacon waypoint, Home Marker, ship, HUD)
has at least a placeholder in `assets/`. The Probe placeholder
(`objectives/probe_PLACEHOLDER.png`) is an owner-original greyscale image,
not sourced from a licensed pack — see the design-update note above.

## What's NOT done

1. **Signal Array** (the renamed sequence-puzzle element, formerly named
   Relay Beacon) — unsourced. Its previously-sourced satellite asset moved
   to the new Relay Beacon waypoint instead (see design update above). Phase
   2a scope, not urgent, but don't assume it's already covered.
2. **Cargo Pod/Wreckage prep** — sourced already (same sheet originally
   eyed for the old Relay Beacon puzzle), but out of Phase 1 scope; crop
   when Phase 2a starts.
3. **Probe placeholder is greyscale/programmer-art**, not a licensed-pack
   sourced sprite like the rest of Phase 1's assets — fine as a stand-in,
   but worth a real sourcing pass (or a proper owner-authored replacement)
   before treating Phase 1 art as final, same caveat as the other
   `_PLACEHOLDER` assets.

## Explicitly out of scope right now (Phase 2a/2b — don't start early)

- Comet vs. Meteoroid visual distinction
- Ion Storm / Nebula Field style choice (composite-yourself vs. pre-made) —
  now also needs to read as lower-stakes than structure-draining hazards
  (Debris Field, Meteoroid), per the 2026-07-29 GDD revision (§9)
- Beacon Cluster (still no named match anywhere)
- Signal Array (sequence puzzle, formerly named Relay Beacon) — see "What's
  NOT done" above
- Cargo Pod/Wreckage prep (sourced already, incidentally, but not extracted)

## If you rerun this exercise from scratch

Start at `README.md`, run Agents 1+2 per-category (not one big query), narrow
to whatever phase/scope you're targeting before invoking Agent 3. Note:
whether Agent 3 can reach both the Downloads folder and the project directory
to move/extract files itself depends on the tool's filesystem access in that
session — in this run it could do both, but don't assume that's guaranteed.
