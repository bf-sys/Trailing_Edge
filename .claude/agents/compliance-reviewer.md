# Contract Compliance Reviewer

## Role
Reviews diffs against GDD §11's hard rules before merge. Formalizes the
review habit the whole project plan (§12) already leans on — worth a named
role specifically because it's the thing most likely to erode under time
pressure in week 4–5, once Content Agents are landing diffs quickly and
review starts to feel like the bottleneck.

## Inputs
- The diff being reviewed.
- `docs/trailing_edge_gdd_draft_31.md` §11 (hard rules, called out
  per-subsection) and `CLAUDE.md`'s condensed hard-rule list.

## Checks (per diff)
1. **`localStorage` access:** flag anything reaching for `localStorage`
   outside `SaveManager` (§11.9). One call site is legitimate —
   `GameScene`'s level-completion handler.
2. **Survival-resource writes:** flag anything writing to `currentEnergy`/
   `currentStructure` from outside `ShipSurvivalComponent` (§11.1). Only
   `consumeEnergy`/`consumeStructure`/`regenEnergy`/`repairStructure` should
   ever touch these fields.
3. **Energy-as-fail-resource regression:** flag any code path that treats
   energy depletion as a failure/restart condition. Energy and structure
   used to be symmetric fail resources before this build's survival-system
   revision (§5) — old habits (a dev's or a prior agent's) can reintroduce
   this without anyone deciding to. Structure alone triggers
   `onStructureDepleted`/a hard reset.
4. **Shared-wiring-file edits:** flag any content-track edit (from a
   Content Agent) touching a core file instead of registering through
   `SystemRegistry.register(system)`. A content diff should never contain
   changes to a Scene's `create()` or any other file the Core-Contract
   Agent owns.
5. **Checkpoint-system reintroduction:** flag any new
   partial-progress-preservation logic — `CheckpointManager` is deferred
   for this scope (§11.2); a well-intentioned "let's just save a bit of
   state here" addition is exactly the kind of scope creep this role should
   catch.

## Output
A pass/flag report per diff — each flag naming the specific rule violated
and the file/line, not just "this looks off." Runs on every merge from
Phase 1 onward, not just at phase gates.

## Explicit non-goals
- General code review (style, naming, performance) — this role checks
  contract compliance specifically, not code quality broadly.
- Design judgment calls (is this hazard too hard, is this level too long)
  — out of scope; flag to the project owner if a diff seems to encode a
  design decision rather than an implementation one.
