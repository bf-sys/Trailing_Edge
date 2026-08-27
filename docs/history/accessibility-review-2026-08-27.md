# Accessibility/Telegraphing Reviewer — pass 2026-08-27

Run against the role in `.claude/agents/accessibility-reviewer.md` (updated
same day — see that file's Inputs/Checks for what changed and why before
this pass). First live run of this role since the 2026-08-17 level-003/004
placements; this pass is the first to see final Ion Storm/Nebula Field art
(sourced 2026-08-19 through 2026-08-22) in motion rather than as a static
candidate image.

## Method

Dev build (`npm run dev`), driven directly via `window.game.scene.start()`
to jump into real levels (bypassing `TitleScene`/progression), camera
detached from the ship (`stopFollow()`/`centerOn()`) to survey hazards
without risking a hard-fail restart. `ProgressionManager.grantNextAbility()`
called manually to unlock `scan` for the passive-vs-active comparison in
Check 3 (a real playthrough wouldn't have it this early on `level-005`).
Levels used: `level-005` (5 Ion Storm / 4 Nebula Field placements, good
density for a side-by-side) and `level-008` (the "Drift Expanse"
`nebulaWall()` gauntlet, 108 chained Nebula Field instances).

## Check 1 — Ion Storm vs. Nebula Field: PASS

Side-by-side at normal scale, static and in motion (trochoid loop confirmed
visibly displacing the sprite over a 3s window): the two hazards read as
unambiguously distinct. Nebula Field is a soft-edged, rounded violet/grey
cloud with a bright pink-white core glow; Ion Storm is a hard-edged,
jagged storm cloud with crackling white/blue lightning veins radiating out
past its own silhouette. Different hue family, different edge hardness,
different internal texture, and (per the trochoid switch) different
motion — this holds up even imagining color removed, since shape/edge
treatment alone carries the distinction. This resolves the "does it read
distinctly in motion" half of the open question that the 2026-08-19
static-image comparison explicitly declined to claim — see follow-up below.

## Check 2 — Color-only signaling: PASS in isolation, FLAG at `level-008` wall density

No hazard's danger is color-only in isolation — every hazard has a
shape/motion cue backing up its color. But `level-008`'s dense
`nebulaWall()` columns (screenshot: chained Nebula Field instances packed
edge-to-edge into near-continuous columns with only narrow gaps between
them) compound two things at once: individual cloud silhouettes visually
merge where adjacent instances' soft blooms overlap, and the already-noted
2026-08-22 low-contrast grey/violet body makes it hard to read exactly
where one instance's hazard radius ends and a gap begins. Not a color-only
violation of Check 2's letter, but a real legibility cost at this specific
level's density that individual-instance review can't catch. This is the
same gap CLAUDE.md's Current Project State already flagged as a "known,
deferred consequence" of the 2026-08-25 structure-cost change
(`level-008`'s placement was authored energy-only) — this pass adds a
direct visual confirmation, not a new issue.

## Check 3 — Structure-vs-energy stakes legibility (reframed 2026-08-25 question): CONFIRMED OPEN, no longer just theoretical

Activated `scan` near both a Nebula Field and an Ion Storm instance
together: `HazardScanOverlay` outlines **both orange** (each has
`resourceCost.structure > 0` per the 2026-08-25 hazard-cost change) with
name labels. This directly confirms the concern CLAUDE.md's Open Design
Questions section raised as a still-open question rather than a checked
fact — with most hazards now orange, the active-scan visual language no
longer singles out a "most dangerous" hazard the way it did when only
Meteoroid carried structure cost. No fix attempted or recommended here per
this role's non-goals (legibility observation, not balance/design
decision) — flagging as confirmed for whoever picks up that open question
next.

## Follow-up for CLAUDE.md

Ion Storm vs. Nebula Field visual differentiation can move from "open" to
"resolved for the current build" in CLAUDE.md's Open Design Questions
section — see that file's update alongside this doc. Structure-vs-energy
stakes legibility stays open, now with a concrete confirmed data point
instead of a hypothetical.
