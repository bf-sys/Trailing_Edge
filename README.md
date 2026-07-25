# Trailing Edge — Asset Sourcing Agent Team

Three role-scoped agents for turning `trailing_edge_art_asset_list.md` into sourced,
license-checked, import-ready assets. Built and validated in one live run-through
(see `run-log-2026-07-24.md` for the actual output of that run).

## Why three agents, not one

A single "find and prep assets" prompt collapses two different failure modes into
one step: sourcing failure (nothing exists) looks identical to evaluation failure
(something exists but is wrong/mismatched/wrongly-licensed) if one agent does both.
Splitting them means a stalled search and a rejected match produce different,
diagnosable outputs instead of one vague "couldn't do it."

## Run order

1. **`agent-01-sourcing.md`** — searches, returns raw candidates. No judgment calls
   about fit; over-collect rather than under-collect.
2. **`agent-02-evaluation.md`** — takes Agent 1's candidate list plus
   `trailing_edge_art_asset_list.md`, scores coverage, flags licenses, flags
   cross-pack style mismatches. Produces the artifact that gates Agent 3.
3. **`agent-03-prep.md`** — only runs on line items Agent 2 marked usable.
   Does not re-evaluate; if it disagrees with a coverage call, it stops and
   flags rather than silently overriding.

Run Sourcing + Evaluation together **per category** (ship, hazards, puzzle-props,
UI, VFX) rather than sourcing the entire list up front — a gap found while
evaluating one category should redirect the next search query. This run-through
found puzzle-site props (Cargo Pod, Beacon Cluster, Relay Beacon) return zero
direct hits under their in-fiction names; that's a category-level finding that
changes the search strategy (search by generic shape — crate, satellite dish,
ring light — then relabel) rather than something to keep re-searching literally.

## License policy for this project

Per project owner: CC0 and CC-BY (attribution) and CC-BY-SA (share-alike) are all
acceptable — **this build is not being redistributed**, so share-alike's copyleft
obligation doesn't trigger. Evaluation Agent still records license per item,
because that record is what lets this decision get revisited later if scope
changes (e.g., posting to itch.io, a public portfolio).

## Standing decisions (apply on any re-run, don't re-litigate)

- Ship damage-state implementation: **overlay VFX**, not sprite-swap.
- First Prep pass is scoped to **GDD Phase 1 only** (§12) — one hazard
  (Debris Field), one resupply point (Star), one puzzle element (Relay
  Beacon). Full-taxonomy coverage is Phase 2a/2b and out of scope until
  Phase 1 is source-and-file complete.
- CC-BY-SA accepted for this project — no redistribution planned, so
  share-alike doesn't currently trigger. Re-check if that changes.

## Known gaps as of the last run (see `run-log-2026-07-24.md` for full detail)

- **Phase 1 is source-complete, not file-complete.** All five Phase-1 source
  packs were located and download-triggered, but this environment can't
  reach kenney.nl/opengameart.org from its sandboxed container, and browser
  downloads land in the operator's local Downloads folder — outside the
  container's reach. Extraction/cropping/renaming (see
  `phase1-manifest-and-tasks.md`) still needs to happen manually, or from an
  environment with local filesystem access to both the downloads and the
  project folder.
- Star (Simple Space, flat line art) vs. ship (Space Shooter Remastered,
  shaded/rendered) — unresolved style-mismatch flag, Phase 1 scope.
- Phase 2a/2b only, not currently blocking: Beacon Cluster still has no
  named match; Comet vs. Meteoroid distinction unconfirmed; Ion Storm/Nebula
  Field style choice (composite vs. pre-made) still open.
