# Accessibility/Telegraphing Reviewer

## Role
Checks whether hazards actually read the way GDD §5's telegraphing rule
requires — visible and distinguishable before contact, not just in
principle but at normal play speed, in motion, for a colorblind player.
Tied directly to §9's still-open items rather than a general accessibility
audit.

## Inputs
- A playable build (or the closest available placeholder-asset build) —
  this role reviews what a player actually sees, not code or config files.
- `docs/trailing_edge_gdd_draft_31.md` §9 (open questions) and §5 (survival
  systems, stakes asymmetry).
- **Real placements now exist to check, as of 2026-08-17, and span every
  level as of this pass** — every `level-001` through `level-010`
  (`src/levels/`) places Ion Storm and Nebula Field instances (Meteoroid
  too), managed by `MovingHazardManager`, so this is checkable across the
  full Phase 2b content set, not just one or two levels. Note also: `scan`'s
  hazard-ID overlay (`HazardScanOverlay`, 2026-08-14) gives a player an
  *active, on-demand* way to identify a hazard's type/threatened resource
  — real mitigation, but explicitly not a resolution of this role's checks
  (CLAUDE.md is direct about this): it doesn't help a player without
  `scan` unlocked yet, on cooldown, or simply not using it, who still needs
  to read hazards passively. Keep evaluating the no-ability case.
- **Final art now exists for Ion Storm and Nebula Field (sourced/integrated
  2026-08-19 through 2026-08-22)**, no longer placeholder textures.
  Deliberately independently-styled per-hazard (a one-off deviation from
  the shared-pass plan in `art-production-guidelines.md`): Ion Storm is
  hard-edged/lightning-veined, Nebula Field is soft-edged/muted-body-with-
  core-glow, across 2-3 texture variants each. `docs/STATUS.md`'s
  2026-08-19 entry is explicit that side-by-side candidates reading as
  distinct was **a static-image judgment only** and that "the GDD §9 item
  stays open" pending exactly the in-motion, in-engine check this role
  does — **this review has not actually been run against the final art
  yet.** Also carry in: a 2026-08-22 owner decision accepted Nebula Field's
  muted dark-violet/charcoal-grey body as low-contrast-but-legible against
  the black background rather than brightening it — a relevant data point
  for Check #2, not a settled answer to it (accepted "as legible enough,"
  not evaluated against this role's checklist specifically).

## Checks
1. **Ion Storm vs. Nebula Field:** with final, deliberately-differentiated
   art now in place (hard-edged/lightning-veined vs. soft-edged/glow-core)
   and Ion Storm's motion switched to a looping `'trochoid'` sweep
   (2026-08-25, replacing a straight drift), does Ion Storm actually read
   as distinct from static Nebula Field in motion, at normal play speed,
   before the player is already in its path — not just in a still
   screenshot? Color alone is a weak signal for colorblind players; check
   whether shape/edge-hardness and motion carry the distinction even with
   color removed.
2. **Color-only signaling:** is any hazard's danger communicated by color
   alone, with no shape/motion/border cue backing it up? Also weigh the
   2026-08-22 finding that Nebula Field's grey/violet body reads as
   low-contrast against the black background (accepted as-is by the owner,
   not re-litigated here, but worth confirming it doesn't compound with
   this check).
3. **Structure-vs-energy stakes legibility (reframed 2026-08-25 — do not
   use the old framing):** Meteoroid is *no longer* the sole
   structure-draining hazard — Nebula Field, Ion Storm, and Solar Flare
   all now carry `resourceCost.structure` too (only Debris Field stays
   zero-cost). `HazardScanOverlay` colors a hazard's outline orange if
   `resourceCost.structure > 0`, so most hazards now render orange. Does
   the passive (no-`scan`) visual language still let a player sense that
   some hazards are more dangerous than others, now that the orange/blue
   split no longer cleanly maps to "Meteoroid vs. everything else"? This is
   an open question, not a check with a known-good answer to confirm.

## When this runs
Once at the week-2 gate (Phase 1, §12) — the first real chance to look at
actual hazards in motion. Again during Phase 3, across the full level set,
once all hazard placements exist — a hazard combination that reads fine in
isolation can still fail this check once several hazard types share a
level.

## Output
A pass/flag report per hazard type (and, at the Phase 3 pass, per level) —
specific enough to point at what doesn't read clearly, not just that
something feels off. If a check fails, the GDD already names fallback
options for the Ion Storm/Nebula item specifically (particle trail,
border/outline treatment, reverting to two visually distinct phenomena) —
cite those rather than inventing a new fix from scratch unless none of them
fit.

## Explicit non-goals
- Code-level review — this role looks at what renders, not how it's
  implemented.
- Deciding gameplay balance (is this hazard too punishing) — that's a
  separate design judgment from "does it read clearly."
