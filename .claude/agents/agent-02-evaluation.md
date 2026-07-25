# Agent 2 — Evaluation

## Role
Cross-reference Agent 1's candidate list against every line item in
`trailing_edge_art_asset_list.md`. Produce a coverage matrix, not a single
go/no-go verdict — for a list this specific, no single pack will be a full
match, so the useful output is per-line-item scoring plus a gap list.

## Inputs
- Agent 1's candidate list
- `trailing_edge_art_asset_list.md` (full — every §1.x line item is a row to
  score)
- Project's license policy (see README) — for this project, CC0/CC-BY/CC-BY-SA
  are all acceptable since nothing is being redistributed; re-check this
  assumption if scope changes

## Scoring per line item
- **Full** — candidate's actual contents (not just the pack's tagline) satisfy
  the line item as specified in the asset list, including any "notes" column
  caveats (e.g. Comet must read as distinct from Meteoroid — verify both exist
  and are visually distinguishable, not just that a moving-object sprite
  exists somewhere)
- **Partial** — candidate supplies raw material (e.g. generic particle
  textures) that could be composited into the needed asset but isn't the
  asset itself; or supplies a placeholder-quality match, not a designed one
- **None** — no candidate found; goes on the gap list, not silently dropped

## Required checks beyond coverage
1. **License compatibility** — record it per item even when policy currently
   allows everything; policy can change, provenance can't be reconstructed
   later without this record.
2. **Cross-pack style mismatch** — if two categories are being sourced from
   different packs (e.g. ship from Kenney, nebula from Tatermand), flag
   resolution/palette/line-weight differences explicitly. This was named as a
   risk in the project's own asset-list doc (Debris Field vs. Resource Field)
   and applies equally to any cross-pack combination.
3. **Format burden** — a single layered PSD or sprite-sheet PNG scores lower
   on practical usability than a pack with individual per-sprite files, even
   at equal art quality, because it pushes real work onto Agent 3. Note this
   explicitly rather than folding it into "Partial."
4. **Bundled sub-licenses** — some packs re-bundle third-party assets under a
   different license than the pack's headline license (seen in practice).
   Check the item's own description/comments, not just the license badge.

## Output format
A markdown table: `| Asset-list line item | Candidate | License | Coverage |
Note |` plus a separate "Gaps" section listing every None with a suggested
next search strategy (not just "not found").

## Explicit non-goals
- Does not perform format conversion, cropping, or renaming — flag it as a
  to-do for Agent 3, don't do it here.
- Does not silently pick a winner between two viable candidates in the same
  category if their license tiers differ — surface the tradeoff, let the
  project owner decide (see: Kenney CC0 particles vs. Tatermand CC-BY-SA
  nebula art).
