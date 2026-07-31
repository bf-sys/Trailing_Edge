# Agent 3 — Prep

## Role
Convert Agent 2's approved ("Full" or accepted "Partial") line items into
import-ready files matching the Phaser loading manifest. Runs per-item, only
on items Agent 2 explicitly cleared — never on the gap list, never on an item
Agent 2 flagged as license-blocked under current policy.

## Inputs
- Agent 2's coverage matrix, filtered to `Full` and owner-accepted `Partial`
  rows
- Target directory/naming convention from the GDD's §11.7 (one config file per
  level, asset references by path) — confirm this convention before writing
  anything, since renaming later means re-touching level configs too

## Tasks (only as needed per item, don't do all of these to every asset)
0. **Verify actual pack contents against the assumed description before
   naming or referencing anything** — Agent 1/2's notes on file count,
   variant count, or format (e.g. "9 sprites, 3 sizes") describe the pack's
   own README or listing, not a guarantee. Open the real files first. If
   what's actually there differs from what was assumed (fewer variants,
   different dimensions, missing frames), that's a Hard Rule case — stop and
   flag back rather than silently padding, renaming around, or fabricating
   to match the assumed count.
1. **Format conversion** — sprite sheet → individual frames, PSD layers →
   individual PNGs, compositing multiple individual frames into one strip
   (e.g. an animation sequence needed as a single overlay file), etc.
2. **Palette/resolution normalization** — only when Agent 2 flagged a
   cross-pack mismatch; don't normalize items that came from a single
   internally-consistent pack. Normalizing (recoloring/rescaling to reduce
   the clash) and accepting the mismatch as-is are both live options — this
   is a coverage judgment call, so per the Hard Rule, surface the choice to
   the project owner rather than picking one unilaterally.
3. **Renaming** to match the project's asset-reference scheme.
4. **Attribution file generation** — required for any CC-BY or CC-BY-SA item;
   for packs bundling multiple original authors under one license badge
   (seen in practice with a Lostgarden-sourced pack), attribute each original
   author separately, not just the uploader.
5. **Placeholder flagging** — if Agent 2 marked an item "Partial" and the
   owner accepted it as a stand-in, name the output file so that's visible
   (e.g. `ship_base_PLACEHOLDER.png`), so it isn't mistaken for final art
   later.

## Hard rule
If, during prep, an asset's actual usability turns out worse than Agent 2's
coverage call implied (e.g. a "Full" match turns out to need heavy edits to
read correctly at game resolution) — stop and flag back to Agent 2 rather
than quietly downgrading it or spending unbounded time fixing it. Prep is not
where coverage judgment calls get made or remade.

## Output
- Populated asset directory matching the project's manifest convention
- `docs/ATTRIBUTION.md` covering every CC-BY/CC-BY-SA item, with per-original-author
  credit where a pack bundles multiple sources
- **A prep log, written as its own file** (e.g. `docs/history/phase1-prep-log.md`), not
  folded into a general project-status doc — one entry per item covering:
  what was converted, what was left as placeholder, what got kicked back to
  Agent 2 (and why), and any assumed-vs-actual discrepancy caught by task 0
  above. This is required output, not optional notes; a project-status file
  can summarize from it later, but shouldn't be the only place this record
  lives.
