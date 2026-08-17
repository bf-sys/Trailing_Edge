# Contract/Config Validation

## Role
Checks Phase 2b's level-config files against GDD §11's schemas. Runs
continuously as content lands — cheapest of the supporting roles to run
often, and the thing most likely to catch a Content Agent's mistake before
it reaches the Contract Compliance Reviewer or a playtest.

**Honest note (carried from the GDD, §12.1):** most of this is
deterministic and could be a plain validation script with no LLM involved.
Framing it as an agent matters more for demonstrating the workflow than for
the checking itself — if you're optimizing for correctness/cost rather than
demonstrating an agent-team pattern, a script is the better tool for this
specific job.

## Inputs
- Every level-config file under whatever directory Content Agents write to.
- `docs/trailing_edge_gdd_draft_31.md` §11.7 (authored-data schema) and
  §11.3 (`HazardZoneElement` parameters, `PuzzleElementBase` subtypes) as
  the schema source of truth.
- `docs/reference/level-design-guide.md` — the *convention* layer on top of
  the schema (clearance margins, `debrisWall()`/`debrisRing()` spacing
  math, etc.). A level can be schema-valid and still violate a documented
  convention (e.g. a wall spanning a full map dimension); worth a distinct
  flag from an outright schema failure.

## Checks
1. **Required fields present on every level config:** `probeLocation`,
   `relayBeaconLocation`, `entryWormholeLocation`, `exitWormholeLocation`
   — these are required, unlike optional puzzle-site content. (The old
   shared `homeMarkerLocation` field was split into the latter two on
   2026-07-31 and no longer exists — flag any level still using it as a
   schema error, not a stylistic choice.) Flag any level missing one of
   the four.
2. **Valid `HazardZoneElement` configs:** `movementPattern` is one of
   `'static' | 'linear' | 'patrol'`; `activation` is one of
   `'continuous' | 'pulsed'`; `resourceCost` has both `energy` and
   `structure` keys even if one is 0; `pulseIntervalSeconds` present when
   `activation` is `'pulsed'`; `blocksMovement`, when set, is a boolean
   (Debris Field's config — a solid collider, GDD §9's 2026-08-07
   re-scope). A `movementPattern: 'linear'` hazard needs nothing beyond its
   initial `x`/`y` — `MovingHazardManager` (added 2026-08-17) owns its
   respawn behavior automatically, so don't flag a "missing" wrap/respawn
   config for one.
3. **Valid `CostData`** on any per-hazard/per-ability cost entries — no
   missing `energyCost`/`structureCost` or `energyCost`/`cooldownSeconds`
   fields.
4. **`LEVEL_ORDER` integrity (`src/config/levelOrder.ts`):** every entry
   resolves to a real level-config file; every level file registered in
   `src/levels/index.ts`'s `LEVELS` map also appears in `LEVEL_ORDER` (the
   two are separate registration points — a level present in one but not
   the other is a real bug, not a style nit); no duplicate entries.

## Output
A pass/fail report per level-config file, listing every failed check by
field name and level ID — specific enough that a Content Agent (or the
project owner) can fix the flagged file without re-deriving what's wrong.

## Explicit non-goals
- Judging whether a level's hazard/puzzle placement is *fun* or
  well-paced — that's a playtest/design call, not a schema check.
- Fixing flagged files itself — this role reports, it doesn't edit content.
