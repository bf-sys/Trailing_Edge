# Trailing Edge — Asset Sourcing Agent Team

Three role-scoped agents for turning `docs/trailing_edge_art_asset_list.md` into sourced, license-checked, import-ready assets. Built and validated across two run-throughs (see `docs/run-log-2026-07-24.md` for the first pass, `docs/phase1-prep-log.md` for the Agent 3 prep detail, and `docs/STATUS.md` for current state).

## Run this via Claude Code, not the desktop app, for Prep Agent

The first run-through used the Claude desktop app. Sourcing and Evaluation Agents worked fine there, but Prep Agent stalled: its job is moving downloaded packs from the operator's Downloads folder into `assets/` and extracting/cropping/renaming files, and the desktop app's sandboxed environment can't reach either the local Downloads folder or the project directory. After human intervention to download the identified files, Prep Agent was able to run via Claude Code CLI to process those images, but the search and evaluation agents couldn't find a good match for the Relay Beacon asset. That run ended with Phase 1 "source-complete, not file-complete."

Re-running the agent crew in **Claude Code** (this CLI, with real local filesystem access) resolved that — it's how the Relay Beacon sprite went from "no usable match found" to fully extracted and in `assets/puzzle/` (see `docs/phase1-prep-log.md`'s Relay Beacon entry), which the desktop app's tool access wouldn't have supported either. **If you're re-running this exercise, use Claude Code for any session that includes Prep Agent** — the desktop app is fine for Sourcing Agent and Evaluation Agent only.

## Why three agents, not one

A single "find and prep assets" prompt collapses two different failure modes into one step: sourcing failure (nothing exists) looks identical to evaluation failure (something exists but is wrong/mismatched/wrongly-licensed) if one agent does both. Splitting them means a stalled search and a rejected match produce different, diagnosable outputs instead of one vague "couldn't do it."

## Run order

1. **`agent-01-sourcing.md`** — searches, returns raw candidates. No judgment calls about fit; over-collect rather than under-collect.
2. **`agent-02-evaluation.md`** — takes Agent 1's candidate list plus `docs/trailing_edge_art_asset_list.md`, scores coverage, flags licenses, flags cross-pack style mismatches. Produces the artifact that gates Agent 3.
3. **`agent-03-prep.md`** — only runs on line items Agent 2 marked usable. Does not re-evaluate; if it disagrees with a coverage call, it stops and flags rather than silently overriding.

Run Sourcing + Evaluation together **per category** (ship, hazards, puzzle-props, UI, VFX) rather than sourcing the entire list up front — a gap found while evaluating one category should redirect the next search query. This run-through found puzzle-site props (Cargo Pod, Beacon Cluster, Relay Beacon) return zero direct hits under their in-fiction names; that's a category-level finding that changes the search strategy (search by generic shape — crate, satellite dish, ring light — then relabel) rather than something to keep re-searching literally.

## License policy for this project

Per project owner: CC0 and CC-BY (attribution) and CC-BY-SA (share-alike) are all acceptable — **this build is not being redistributed**, so share-alike's copyleft obligation doesn't trigger. Evaluation Agent still records license per item, because that record is what lets this decision get revisited later if scope changes (e.g., posting to itch.io, a public portfolio).

## Standing decisions (apply on any re-run, don't re-litigate)

- Ship damage-state implementation: **overlay VFX**, not sprite-swap.
- First Prep pass is scoped to **GDD Phase 1 only** (§12) — one hazard (Debris Field), one resupply point (Star), one puzzle element (Relay Beacon). Full-taxonomy coverage is Phase 2a/2b and out of scope until Phase 1 is source-and-file complete.
- CC-BY-SA accepted for this project — no redistribution planned, so share-alike doesn't currently trigger. Re-check if that changes.

## Current status (see `docs/STATUS.md` for full detail)

Phase 1 is now **source-complete and file-complete** — all five items (ship, Debris Field, Star, Relay Beacon, minimal HUD) are extracted into `assets/`, following the Agent 3 re-run under Claude Code described above.

- Star (Simple Space, flat line art) vs. ship (Space Shooter Remastered, shaded/rendered) — style mismatch confirmed real; owner decision was to keep both as placeholders as-is and revisit later, not to block on it.
- Phase 2a/2b only, not currently blocking: Cargo Pod/Wreckage still needs prep (already sourced); Beacon Cluster still has no named match; Comet vs. Meteoroid distinction unconfirmed; Ion Storm/Nebula Field style choice (composite vs. pre-made) still open.

For the original desktop-app run's findings before the Agent 3 re-run, see `docs/run-log-2026-07-24.md`.
