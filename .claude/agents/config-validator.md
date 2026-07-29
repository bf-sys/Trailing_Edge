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

## Checks
1. **Required fields present on every level config:** `probeLocation`,
   `relayBeaconLocation`, `homeMarkerLocation` — these are required, unlike
   optional puzzle-site content. Flag any level missing one.
2. **Valid `HazardZoneElement` configs:** `movementPattern` is one of
   `'static' | 'linear' | 'patrol'`; `activation` is one of
   `'continuous' | 'pulsed'`; `resourceCost` has both `energy` and
   `structure` keys even if one is 0; `pulseIntervalSeconds` present when
   `activation` is `'pulsed'`.
3. **Valid `CostData`** on any per-hazard/per-ability cost entries — no
   missing `energyCost`/`structureCost` or `energyCost`/`cooldownSeconds`
   fields.
4. **`levelOrder` integrity:** every entry resolves to a real level-config
   file; no duplicate entries; no level file that exists but is missing
   from the array.

## Output
A pass/fail report per level-config file, listing every failed check by
field name and level ID — specific enough that a Content Agent (or the
project owner) can fix the flagged file without re-deriving what's wrong.

## Explicit non-goals
- Judging whether a level's hazard/puzzle placement is *fun* or
  well-paced — that's a playtest/design call, not a schema check.
- Fixing flagged files itself — this role reports, it doesn't edit content.
