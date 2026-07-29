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
- **Probe** — not sourced at all. No prior candidate exists anywhere; run
  the full Sourcing → Evaluation → Prep pipeline fresh.
- **Signal Array** (the renamed sequence-puzzle element) — unsourced again;
  its previously-sourced satellite asset was reassigned to the Relay Beacon
  waypoint instead.
- **Cargo Pod/Wreckage** — already sourced, not yet extracted; crop when
  Phase 2a's `PushPullObjectElement` work starts.
- **Comet vs. Meteoroid**, **Ion Storm/Nebula Field style**, **Beacon
  Cluster** — all still open per `docs/STATUS.md`'s "explicitly out of
  scope" list; pick up as Phase 2a/2b need each one.

## Tasks
1. **Coverage as new needs arise** — when a Content Agent or the
   Core-Contract Agent flags a missing asset, run Sourcing + Evaluation for
   that specific item (per-category, not one broad query — see
   `agent-01-sourcing.md`'s method) before Prep touches anything.
2. **Broken-path / integration checks** — verify every asset a level config
   references actually resolves to a real file in the loading manifest.
3. **Cross-pack consistency** — flag resolution/palette mismatches the way
   the existing pipeline already has (e.g. the Home Marker/ship style
   mismatch, accepted as-is but recorded) — a judgment call to surface to
   the project owner, not to silently normalize or silently ignore.
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
  changed (following `docs/phase1-prep-log.md`'s existing per-item format)
  for any newly sourced/integrated asset.
- A flag to the Core-Contract Agent for any asset/gameplay-size-decoupling
  violation found during integration.
