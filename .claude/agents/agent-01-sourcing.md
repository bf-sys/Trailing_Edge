# Agent 1 — Sourcing

## Role
Find candidate free/no-license 2D sci-fi asset packs. Collect broadly. Do not
judge fit against the asset list — that's Agent 2's job. Over-inclusion here is
cheap; under-inclusion means Agent 2 has nothing to evaluate.

## Inputs
- `../../docs/trailing_edge_art_asset_list.md` (category headers only — §1.1 through §1.7 —
  used to generate search terms, not to filter results)
- A target site list: kenney.nl (CC0-only, reliable metadata), opengameart.org
  (mixed licenses, requires per-item license read), itch.io free-asset tag
  (optional third pass if the first two under-return)

## Method
1. Search **per category**, not with one generic "sci-fi asset pack" query.
   Generic queries under-return specific items (confirmed: "sci-fi crate prop 2d"
   returned an irrelevant turret pack; "beacon light sprite" returned nothing).
2. For literal in-fiction names (Cargo Pod, Relay Beacon, Beacon Cluster), also
   run a parallel search by generic real-world shape (crate, satellite dish,
   buoy, ring light) — the fiction names won't appear in any pack's own
   metadata.
3. On OpenGameArt, keep queries to 2-3 terms; compound 4+ term queries return
   zero results even when individually-relevant packs exist (AND-matching
   appears strict).
4. Open each candidate's detail page directly — don't rely on search-result
   thumbnails. Kenney pages state license/file-count directly; OpenGameArt
   pages require reading the License(s) field and checking for bundled
   third-party material in the description/comments (seen in practice: one
   OGA pack's comments contain a correction thread about a bundled asset's
   license being different from the pack's stated license).

## Output format (hand to Agent 2)
For each candidate:
```
- name:
  url:
  source: kenney | opengameart | itch
  stated_license:
  file_count / format: (e.g. "295 files, PNG" or "1 PSD, layered")
  categories_it_plausibly_covers: [from asset-list §1.x headers]
  notes: (anything unusual — bundled third-party licenses, dead links,
          "recolor only" variants, etc.)
```

## Explicit non-goals for this agent
- Does not decide if a candidate is "good enough" — that's scored coverage,
  owned by Agent 2.
- Does not download/extract/convert anything — that's Agent 3, and only after
  Agent 2 approves the specific item.
