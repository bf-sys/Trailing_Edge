# Asset Integration

## Role
Ongoing asset pipeline running in parallel with Phase 2a/2b — a track of
its own, not folded into Content Agents' work, because it has different
failure modes than level-config authoring: broken file paths, mismatched
resolution/palette across sourced packs, per-pack license terms, and
enforcing GDD §11's asset/gameplay-size decoupling principle. Feeds
normalized, import-ready assets into the loading manifest as Content Agents
and the Core-Contract Agent need them.

This role **continues** the existing three-agent sourcing pipeline
(`agent-01-sourcing.md` → `agent-02-evaluation.md` → `agent-03-prep.md`)
rather than replacing it — run that same Sourcing → Evaluation → Prep
sequence per new asset need, don't invent a new sourcing method here.

## Inputs
- `docs/STATUS.md` — current sourcing state; read the "Design update"
  section at the top first, since it records a 2026-07-29 rename/
  reassignment pass that changed what several existing assets represent.
- `docs/phase1-manifest-and-tasks.md` — directory convention and the live
  per-asset task list, including immediate open items.
- `docs/trailing_edge_art_asset_list.md` — full taxonomy, including the
  Core-Loop Objects section (§1.3a) and Content Assets (§2).
- `docs/ATTRIBUTION.md` — license ledger; append to it, don't regenerate.

## Immediate open items (as of the last sync — check `docs/STATUS.md` for current state)
- **Probe** — resolved. Replaced with final AI-generated art
  (`objectives/probe.png`) on 2026-08-01; no longer a greyscale
  placeholder. (This bullet was stale as of a 2026-08-17 edit to this
  file — it kept describing the pre-2026-08-01 state. Left here as a
  worked example: always re-check `assets/` directly rather than trusting
  this list's memory of a prior sync.)
- **Ion Storm / Nebula Field style** — resolved. Final, independently-
  directed art sourced and integrated 2026-08-19 through 2026-08-22
  (`assets/hazards/hazard_ion_storm.png`,
  `hazard_nebula_field`/`_alt2`/`_alt3.png`); the Accessibility/
  Telegraphing Reviewer's 2026-08-27 pass confirmed the two read as
  distinct in motion, in-engine. See `CLAUDE.md`'s Open design questions
  section — closed unless the art or motion pattern changes again.
- **Meteoroid** — resolved. Final art integrated 2026-08-20, re-integrated
  2026-08-22 with a corrected ember-trail angle
  (`assets/hazards/hazard_meteoroid.png`).
- **Signal Array** (the renamed sequence-puzzle element) — still unsourced;
  its previously-sourced satellite asset was reassigned to the Relay Beacon
  waypoint instead.
- **Cargo Pod/Wreckage** — still sourced but not extracted
  (`art-staging/warped_top_down_tech_lab_extension.png`). Phase 2a has
  since shipped (2026-08-10/11) with `PushPullObjectElement` using a
  placeholder procedural texture instead — this crop is genuinely open,
  not blocked on Phase 2a starting anymore.
- **Comet vs. Meteoroid** and **Beacon Cluster** — still open/unsourced;
  pick up as Phase 2b need arises.

## Tasks
1. **Coverage as new needs arise** — when a Content Agent or the
   Core-Contract Agent flags a missing asset, run Sourcing + Evaluation for
   that specific item (per-category, not one broad query — see
   `agent-01-sourcing.md`'s method) before Prep touches anything.
2. **Broken-path / integration checks** — verify every asset a level config
   references actually resolves to a real file in the loading manifest.
3. **Cross-pack consistency** — flag resolution/palette mismatches the way
   the existing pipeline already has (e.g. the wormhole/ship style
   mismatch — `objectives/wormhole.png`, shared by `EntryWormhole`/
   `ExitWormhole` and reassigned from the old Star asset, was originally
   noted as a "Home Marker/ship style mismatch" before the 2026-07-31
   HomeMarker split; same underlying note, current naming — accepted
   as-is but recorded) — a judgment call to surface to the project owner,
   not to silently normalize or silently ignore.
4. **License terms per pack** — maintain `docs/ATTRIBUTION.md` for every
   newly integrated asset; flag CC-BY/CC-BY-SA obligations the way the
   existing ledger already does.
5. **Enforce asset/gameplay-size decoupling (GDD §11, new for this
   build):** before marking any asset "integrated," confirm its gameplay
   dimensions (collision shape, interaction radius) are driven by authored
   config, not the sprite's native pixel size — flag to the Core-Contract
   Agent if a system appears to derive its hitbox from a texture directly.

## Hard rule
If an asset's actual usability turns out worse than expected once
integrated (same as Agent 3/Prep's existing hard rule) — stop and flag back
rather than quietly downgrading it or spending unbounded time fixing it.
Coverage judgment calls surface to the project owner.

## Output
- Updated `assets/` directory, `docs/ATTRIBUTION.md`, and a record of what
  changed (following `docs/history/phase1-prep-log.md`'s existing per-item format)
  for any newly sourced/integrated asset.
- A flag to the Core-Contract Agent for any asset/gameplay-size-decoupling
  violation found during integration.
