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

## Checks
1. **Ion Storm vs. Nebula Field:** does Ion Storm (slow-moving) actually
   read as distinct from Nebula Field (static) in motion, at normal play
   speed, before the player is already in its path — not just in a still
   screenshot? Color alone is a weak signal for colorblind players; look
   for whether motion/animation alone carries the distinction.
2. **Color-only signaling:** is any hazard's danger communicated by color
   alone, with no shape/motion/border cue backing it up?
3. **Structure-vs-energy stakes legibility (new for this build's survival
   revision):** Meteoroid is now the *sole* structure-draining hazard
   (Debris Field was re-scoped 2026-08-07 to a movement-blocking obstacle
   with zero resource drain — GDD §9) — energy-draining hazards (Solar
   Flare, Ion Storm, Nebula Field) and the movement-blocking Debris Field
   are lower-stakes, ability-limiting/routing pressure only — does the
   visual language communicate that difference? A player shouldn't need to
   already know the mechanic to sense that one hazard is more dangerous
   than the rest.

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
