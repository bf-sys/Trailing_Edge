# Trailing Edge — Agent Teams

`.claude/agents/` holds two separate agent teams for two different phases of this project:

- **Asset-sourcing team** (`agent-01-sourcing.md`, `agent-02-evaluation.md`, `agent-03-prep.md`) — three role-scoped agents for turning `docs/trailing_edge_art_asset_list.md` into sourced, license-checked, import-ready assets. Built and validated across two run-throughs (see `docs/run-log-2026-07-24.md` for the first pass, `docs/phase1-prep-log.md` for the Agent 3 prep detail, and `docs/STATUS.md` for current state). **The rest of this README is about this team specifically.**
- **Dev-phase agent team** (`core-contract-agent.md`, `content-agent.md`, `config-validator.md`, `compliance-reviewer.md`, `accessibility-reviewer.md`, `asset-integration-agent.md`) — the six roles from the GDD's development plan (§12.1), for once code work starts. Each file documents its own role, inputs, hard rules, and output; see the GDD §12 (`docs/trailing_edge_gdd_draft_31.md`) for how they sequence — Core-Contract Agent runs Phase 1/2a sequentially, Content Agents run Phase 2b in parallel, the remaining three (Config Validator, Compliance Reviewer, Accessibility Reviewer) run continuously alongside both, and Asset Integration continues the asset-sourcing team's pipeline on an as-needed basis. **No game code exists yet** (see `CLAUDE.md`), so this team hasn't run.

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
- First Prep pass was scoped to **GDD Phase 1 as of 2026-07-25** — one hazard (Debris Field), one resupply point (Star), one puzzle element (Relay Beacon). **A GDD revision on 2026-07-29 changed this scope** (Star is no longer a resupply object, the puzzle element is renamed Signal Array and moved to Phase 2a, two new required objects — Probe and a redefined Relay Beacon — were added to Phase 1) — see `docs/STATUS.md`'s "Design update" section before treating the original five-item list as current. Full-taxonomy coverage is still Phase 2a/2b, out of scope until Phase 1 is source-and-file complete.
- CC-BY-SA accepted for this project — no redistribution planned, so share-alike doesn't currently trigger. Re-check if that changes.

## Current status (see `docs/STATUS.md` for full detail)

**File-complete again as of 2026-07-29** — the GDD revision that day briefly added a required Probe object with no sourced asset at all (a pre-existing gap the revision exposed, not a new invention), but the project owner closed that gap same-day with an original greyscale placeholder (`objectives/probe_PLACEHOLDER.png`, no licensing involved). Everything in the current Phase 1 scope (Debris Field, AsteroidField, Probe, the redefined Relay Beacon waypoint, Home Marker, ship, HUD) is now sourced/placeholder-covered, including two reassigned-not-resourced items: the Star asset now serves as `HomeMarker` (launch/return position), and the previously-sourced Relay Beacon satellite sprite now serves the new waypoint rather than the puzzle element (which is unsourced again under its new name, Signal Array).

- Home Marker (was: Star; Simple Space, flat line art) vs. ship (Space Shooter Remastered, shaded/rendered) — style mismatch confirmed real; owner decision was to keep both as placeholders as-is and revisit later, not to block on it.
- Probe placeholder is greyscale/programmer-art, not a licensed sprite like the rest of Phase 1's assets — fine as a stand-in, worth a real sourcing pass before final art.
- Phase 2a/2b only, not currently blocking: Cargo Pod/Wreckage still needs prep (already sourced); Signal Array needs fresh sourcing (its old asset moved to the Relay Beacon waypoint); Beacon Cluster still has no named match; Comet vs. Meteoroid distinction unconfirmed; Ion Storm/Nebula Field style choice (composite vs. pre-made) still open, now also needing to read as lower-stakes than structure-draining hazards per the same GDD revision.

For the original desktop-app run's findings before the Agent 3 re-run, see `docs/run-log-2026-07-24.md`. For the full asset-reassignment detail behind the 2026-07-29 changes above, see `docs/STATUS.md`.
