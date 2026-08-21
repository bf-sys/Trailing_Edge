# Phase 1 Asset Manifest & Prep Task List

**Updated 2026-07-29** for a GDD revision that changed Phase 1's scope and
reassigned two already-sourced assets. **Updated again 2026-07-31** for a
core-loop change splitting the Home Marker into Entry/Exit Wormhole (no new
sourcing — see below). **Updated again 2026-08-01**: five sprites plus the
starfield backgrounds replaced with final AI-generated art (ship, wormhole
pair, AsteroidField large, Relay Beacon, `backgrounds/`) — these drop the
`_PLACEHOLDER` suffix, since they're no longer stand-ins. See `STATUS.md`'s
"Design update" sections for the full explanation; this file reflects the
*current* correct scope and directory layout going forward.

Scope: the eight items Phase 1 (GDD §12) requires — ship, one Debris Field
hazard, one AsteroidField resupply point (structure repair only — energy
regenerates passively, no dedicated object), the Probe, the Relay Beacon
(a mandatory per-level waypoint, **not** a puzzle), the Entry Wormhole and
Exit Wormhole (launch position and required return destination — two
distinct locations as of 2026-07-31, previously one shared Home Marker),
minimal HUD. **No puzzle-taxonomy element ships in Phase 1** — Signal Array
(the renamed sequence puzzle, formerly named Relay Beacon) and the rest of
the taxonomy are Phase 2a scope. Cargo Pod/Wreckage and the base Ansimuz
tileset were incidentally found in an earlier pass but are Phase 2a/2b
scope — listed at the bottom as "on deck," not prepped now.

## Directory convention

Per GDD §11.7, level content is one hand-authored TS/JSON config per level,
referencing assets by path — so asset paths should be stable and decided
once, not renamed later. Current structure (as of the 2026-07-29 update):

```
assets/
  ship/
    ship_base.png   (AI-generated final art, 2026-08-01 — was ship_base_PLACEHOLDER.png)
    ship_damage_overlay_PLACEHOLDER.png   (per owner's overlay-VFX decision;
      unaffected by the 2026-08-01 batch, still the Kenney placeholder)
  hazards/
    debris_large_PLACEHOLDER.png, debris_medium_PLACEHOLDER.png,
    debris_small_PLACEHOLDER.png
    hazard_meteoroid.png, hazard_ion_storm.png
      (AI-generated final art, 2026-08-20 — added via the new art
      Generate-Evaluate-Refine loop, see STATUS.md's 2026-08-19/20
      entries; chroma-keyed and auto-cropped to content bounds by
      tools/asset-prep/chroma-key.js, the first real script written for
      that tool's previously-scaffolding-only package.json. Beyond Phase
      1's scope listed above — Solar Flare remains the only open-world
      hazard with no sourced art)
    hazard_nebula_field.png, hazard_nebula_field_alt2.png,
    hazard_nebula_field_alt3.png
      (AI-generated final art — three variants from the 2026-08-21
      multi-variant Nebula Field pass art-production-guidelines.md called
      for, mirroring debris_large_alt2/alt3 above; see STATUS.md's
      2026-08-21 entries (both the initial pass and the same-day
      follow-up). Same chroma-key/auto-crop prep as the other GER-loop
      hazard art. Cycled per-placement via level files' NEBULA_TEXTURES
      arrays wherever a level places more than one Nebula Field instance.
      hazard_nebula_field.png's *content* was replaced same-day, after
      this manifest's original 2026-08-20-sourced nebula_field candidate
      was dropped from the rotation entirely (oblong result) in favor of
      nebula_field_1; hazard_nebula_field_alt2.png's content is
      nebula_field_2, integrated on the project owner's direct approval
      after that candidate hit the GER loop's 3-round cap — see
      STATUS.md/ATTRIBUTION.md's 2026-08-21 entries for the full history)
  resupply/
    asteroid_large.png   (AI-generated final art, 2026-08-01 — was
      asteroid_large_PLACEHOLDER.png)
    asteroid_medium_PLACEHOLDER.png, asteroid_small_PLACEHOLDER.png
      (unaffected by the 2026-08-01 batch, still the OGA placeholder;
      moved here 2026-07-29 — was filed under hazards/ before AsteroidField
      was official Phase 1 scope; these are the structure-repair resupply
      object now, distinct from the Debris Field hazard above even though
      both come from the same source pack)
  objectives/
    (new 2026-07-29 — the required-every-level core-loop objects; none of
    these are puzzle-taxonomy content, §6)
    wormhole.png   (AI-generated final art, 2026-08-01 — was
      wormhole_PLACEHOLDER.png, before that resupply/star_PLACEHOLDER.png,
      then objectives/home_marker_PLACEHOLDER.png; used for **both**
      EntryWormhole and ExitWormhole instances, tinted differently at
      runtime via waypointTintConfig)
    relay_beacon.png   (AI-generated final art, 2026-08-01 — single asset,
      replaces both relay_beacon_idle_PLACEHOLDER.png and
      relay_beacon_reached_overlay_PLACEHOLDER.png; RelayBeaconObject now
      tints it via waypointTintConfig instead of swapping to a separate
      reached-overlay file, matching the wormhole pair's convention)
    probe.png   (AI-generated final art, 2026-08-01 — was
      probe_PLACEHOLDER.png, the owner's original greyscale placeholder)
  puzzle/
    (currently empty — Signal Array is unsourced again as of 2026-07-29;
    left in place for Phase 2a rather than deleted)
  ui/
    bar_energy_PLACEHOLDER.png
    bar_structure_PLACEHOLDER.png
    panel_frame_PLACEHOLDER.png
    (remaining UI Pack - Sci-Fi files held uncropped in
    art-staging/ui-source/ until Phase 2a needs specific icons — moved out
    of assets/ui/_source/ 2026-08-01, see below)
  backgrounds/
    (new 2026-08-01) bg_stars_far.jpg, bg_stars_near.jpg — AI-generated
    final art, replacing StarfieldBackground.ts's procedurally generated
    tiles. Kept as .jpg (no transparency needed for an opaque full-bleed
    tile) rather than converted to .png, unlike every other category here —
    see art-production-guidelines.md.
```

**2026-07-31 renaming pass:** every currently-sourced Phase 1 asset now
carries `_PLACEHOLDER` in its filename, not just the ones Agent 2 originally
scored "Partial" (see the redefined convention note below) — done so the
project owner can tell at a glance, while generating real art, which files
in `assets/` are still temporary stand-ins vs. finished. `assets/ui/_source/`
(raw, uncropped pack files, never individually loaded by code) was
deliberately left out of this pass — it isn't an in-use asset in the first
place. `assets/warped_top_down_tech_lab_extension.png` (an uncropped Phase
2a source sheet, same category as `ui/_source/`) was left alone for the
same reason.

**Build-time caveat (found 2026-07-29, resolved 2026-08-01):** Vite's
`publicDir` (set to `assets/` in `vite.config.ts`) copies its entire tree
into every build verbatim — it does not honor `.gitignore`. This used to
mean `assets/ui/_source/` (~3MB of raw, uncropped source-pack files) and
the loose `assets/warped_top_down_tech_lab_extension.png` both shipped
inside `dist/` even though nothing references either at runtime. **Fixed**
by moving both out of `assets/` entirely, into the new `art-staging/`
workbench directory (see below) — `art-staging/ui-source/` and
`art-staging/warped_top_down_tech_lab_extension.png` respectively. Since
`art-staging/` is a sibling of `assets/`, not nested under it, Vite's
`publicDir` never sees either file, so this class of problem can't recur
for anything staged there going forward.

**`art-staging/` (added 2026-08-01) — where new raw art goes before prep.**
For newly generated art (background removal, cropping, etc. still needed
before it's usable), drop raw files in the top-level `art-staging/`
directory (a sibling of `assets/`, `src/`, `docs/` — not nested under
`assets/`) rather than an `assets/<category>/_source/` folder. This is a
deliberate departure from the `ui/_source/` precedent above, specifically
*because* of the build-time caveat in this same section: anything under
`assets/` ships into `dist/` verbatim regardless of `.gitignore`, and
`art-staging/` living outside `assets/` sidesteps that entirely rather than
adding to it. Gitignored the same way `_source/` already is (raw prep
material was never meant to be version-tracked). The two existing offenders
were moved here the same day this directory was created, resolving the
build-time caveat rather than just avoiding it going forward:
`assets/ui/_source/` → `art-staging/ui-source/` (already gitignored, pure
filesystem move) and `assets/warped_top_down_tech_lab_extension.png` →
`art-staging/warped_top_down_tech_lab_extension.png` (previously
git-tracked — this one now drops out of version control going forward,
same as everything else under `art-staging/`; still easily re-sourced from
OpenGameArt if ever needed, and `ATTRIBUTION.md`'s license record for it is
unaffected). Once a file is
background-removed/cropped/named, move it into its real home under
`assets/<category>/` (with `_PLACEHOLDER` in the name per the convention
above, until it's final) — `art-staging/` is a workbench, not a permanent
location for anything code will ever reference.

**Convention redefined 2026-07-31:** `_PLACEHOLDER` now marks *every*
currently-sourced Phase 1 asset actually wired into the game (regardless of
whether Agent 2 scored it "Partial" or a good match) — the point going
forward is tracking temporary/prototype art vs. finished art while new art
gets generated, not just flagging weak matches. Originally (through
2026-07-29) the suffix meant specifically "Agent 2 scored this Partial and
the owner accepted it as a stand-in" (ship base, home marker); that
narrower history still explains why those two got the suffix first. Either
way: drop the suffix only when a closer/final asset replaces a file — don't
rename in place, since level configs and `BootScene.ts` will already
reference the placeholder filename by then.

## Per-asset task list

1. **Ship — base sprite replaced with final AI-generated art 2026-08-01**
   (was: Space Shooter Remastered.zip placeholder, unaffected by the
   2026-07-29 scope change until now).
   - `ship/ship_base.png` — generated via the Art Director Agent / Gemini,
     prepped with `tools/asset-prep/chroma-key-trim.js` (chroma-key removal
     + auto-trim on the generated green-screen source). Drops
     `_PLACEHOLDER`; this is final art, resolving the style-mismatch open
     item (see "Open items" below).
   - `ship/ship_damage_overlay_PLACEHOLDER.png` (explosion/impact frame
     sequence) is **unaffected** — no new art for it in this batch, still
     the Kenney placeholder extracted per the original owner decision:
     overlay VFX, not sprite-swap, so this is a layer drawn on top of the
     base ship, not a second full ship sprite.

2. **Debris Field + AsteroidField (Objects.zip)** — done; **AsteroidField's
   large variant replaced with final AI-generated art 2026-08-01**, the
   rest unaffected.
   - Unzip; the pack's own README describes 9 asteroid + 9 debris sprites,
     3 sizes each — confirm the actual filenames match that description
     before building the level config's `HazardZoneElement` reference.
   - Split into `hazards/` (Debris Field, the hazard) and `resupply/`
     (AsteroidField, the structure-repair resupply object — moved here
     2026-07-29, now that it's official Phase 1 scope rather than
     incidental).
   - `hazards/debris_{medium,small}_PLACEHOLDER.png` and
     `resupply/asteroid_{medium,small}_PLACEHOLDER.png` are **unaffected** —
     still the OGA-sourced placeholders, `_PLACEHOLDER` suffix from
     2026-07-31 per the redefined convention below.
   - `resupply/asteroid_large.png` — generated via the Art Director Agent /
     Gemini, prepped with `tools/asset-prep/chroma-key-trim.js`, replacing
     `asteroid_large_PLACEHOLDER.png`. Drops `_PLACEHOLDER`; final art. Only
     the large (currently used) variant was replaced — medium/small stay
     placeholder until/unless they're actually wired into a level.
   - `hazards/debris_large.png` — **replaced with final AI-generated art
     2026-08-07**, following the Debris Field re-scope to a movement-
     blocking obstacle (see `STATUS.md`'s 2026-08-07 entries). Generated via
     the Art Director Agent/Gemini, prepped with `chroma-key-trim.js` then a
     new `tools/asset-prep/square-crop.js` (center-crop to square, for
     `HazardZoneElement`'s `circle` shape), replacing
     `debris_large_PLACEHOLDER.png`. Drops `_PLACEHOLDER`; final art. Two
     more distinct-composition variants sourced alongside it,
     `debris_large_alt2.png`/`debris_large_alt3.png` — reserved for Phase
     2b's multi-instance/rotation content work, not yet loaded by any code.

3. **Entry Wormhole / Exit Wormhole — replaced with final AI-generated art
   2026-08-01** (was: Simple Space.zip placeholder; role reassigned twice
   before that — Star resupply point → Home Marker, 2026-07-29; Home
   Marker split into Entry/Exit Wormhole, 2026-07-31).
   - `objectives/wormhole.png` — generated via the Art Director Agent /
     Gemini, prepped with `tools/asset-prep/chroma-key-trim.js`, replacing
     `wormhole_PLACEHOLDER.png`. Still used for **both** `EntryWormhole` and
     `ExitWormhole` instances, distinguished only by runtime tint
     (`waypointTintConfig.activeTint`/`inactiveTint`, renamed from
     `wormholeConfig` 2026-08-01 — see item 4 below). One file, drops
     `_PLACEHOLDER`; final art.
   - **Style-mismatch item resolved**: this replaces the flat *Simple
     Space* sprite that clashed with the shaded *Space Shooter Remastered*
     ship — now both ship and wormhole come from the same AI-generation
     pipeline, so the mismatch this item used to track no longer applies
     (see "Open items" below).

4. **Relay Beacon (mandatory waypoint) — replaced with final AI-generated
   art 2026-08-01, and collapsed to a single asset** (was: reassigned,
   not re-sourced, from the old Relay Beacon puzzle element on 2026-07-29 —
   satellite sprite + generated glow overlay pair).
   - `objectives/relay_beacon.png` — generated via the Art Director Agent /
     Gemini, prepped with `tools/asset-prep/chroma-key-trim.js`. **Single
     file**, replacing both the old idle sprite and the generated
     reached-overlay — `RelayBeaconObject` now tints it via
     `waypointTintConfig` (starts `inactiveTint`, swaps to `activeTint` on
     `BeaconReached`) instead of swapping in a second overlay image,
     matching the wormhole pair's convention. Drops `_PLACEHOLDER`; final
     art.
   - The two old files (`relay_beacon_idle_PLACEHOLDER.png`,
     `relay_beacon_reached_overlay_PLACEHOLDER.png`) are deleted, not kept
     around — fully superseded, not just reassigned this time.

5. **Probe — replaced with final AI-generated art 2026-08-01** (was: an
   owner-original greyscale placeholder added directly 2026-07-29, not the
   Agent 1/2/3 pipeline).
   - `objectives/probe.png` — generated via the Art Director Agent / Gemini,
     prepped with `tools/asset-prep/chroma-key-trim.js`, replacing
     `probe_PLACEHOLDER.png`. Drops `_PLACEHOLDER`; final art. Still no
     `ATTRIBUTION.md` entry needed (AI-generated, not third-party sourced —
     see `ATTRIBUTION.md`'s "Owner-created assets" section).
   - This was never listed as an asset requirement anywhere before the
     2026-07-29 GDD revision (a pre-existing gap the revision exposed, not
     a new invention); resolved as a placeholder same day, now resolved as
     final art. Narrative framing per GDD §1.1: an inactive probe, older
     tech relative to the player's ship but still distinctly "advanced
     probe" silhouette, not a generic crate/box — the new art was generated
     against this framing.

6. **HUD (UI Pack - Sci-Fi.zip)** — done, unaffected by the 2026-07-29
   scope change.
   - Extract only what Phase 1's "bare-minimum HudOverlay" needs per GDD
     §12 step 5: energy bar, structure bar. Ability icons and puzzle-site
     indicator are explicitly Phase 2a (§11.10) — don't extract them yet,
     to keep this pass scoped to what Phase 1 actually uses.
   - Filenames (`bar_energy_PLACEHOLDER.png`, `bar_structure_PLACEHOLDER.png`,
     `panel_frame_PLACEHOLDER.png`) carry `_PLACEHOLDER` as of 2026-07-31
     per the redefined convention above.
   - **Superseded 2026-08-10:** the resource display moved to
     `ShipStatusArcs`, a procedurally-drawn, ship-relative readout — these
     three extracted files are no longer loaded by any code (`BootScene`'s
     preload calls for them were removed). Moved from `assets/ui/` to
     `art-staging/ui-unused/` (gitignored) rather than deleted; see
     `STATUS.md`'s 2026-08-10 entry and `trailing_edge_art_asset_list.md`
     §1.6.

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

- ~~Entry/Exit Wormhole vs. ship style-mismatch (item 3 above)~~ —
  **Resolved 2026-08-01**: both are now AI-generated art from the same
  pipeline, so the flat-vs-shaded clash this item tracked no longer exists.
- ~~Probe placeholder (item 5 above) is greyscale/programmer-art~~ —
  **Resolved 2026-08-01**, replaced with final AI-generated art.
- ~~`assets/ui/_source/` (and the loose `warped_top_down_tech_lab_extension.png`
  at `assets/` root) need to move out of the `publicDir`-served tree before a
  real production build~~ — **Resolved 2026-08-01**, both moved into
  `art-staging/`. See the build-time caveat above.
