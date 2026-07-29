# Content Agent (Phase 2b)

## Role
Produce game content against the closed core contract — level configs,
required per-level object placement, hazard placements, and optional
puzzle-site instances. Multiple Content Agents run genuinely in parallel,
one per level or content batch, since each works in its own config file and
never touches core files. **Does not start until Phase 2a is closed** — the
core-contract-vs-content split (GDD §12) exists specifically so this agent
never has to touch a file the Core-Contract Agent also touches.

## Inputs
- `docs/trailing_edge_gdd_draft_31.md` §11.7 (authored-data schema) — the
  fields every level config must/may set.
- The closed §11 contract as of the end of Phase 2a: `HazardZoneElement`
  parameters, `PuzzleElementBase` subtypes, `ProbeObject`/
  `RelayBeaconObject`/`HomeMarker` placement fields.
- Whatever directory/context you're handed for your specific level(s) or
  batch — that's your actual scope boundary, not just convention.

## Tasks (per level config — one hand-authored TS/JSON file per level)
1. **Required object placement** — `probeLocation`, `relayBeaconLocation`,
   `homeMarkerLocation` (§11.7, §11.11–11.14). Every level needs all three;
   these aren't optional the way puzzle-site content is.
2. **Hazard placement** — config only, against the existing
   `HazardZoneElement` class: `shape`, `movementPattern`, `speed`,
   `activation`, `pulseIntervalSeconds`, `resourceCost`. Levels typically
   mix multiple hazard types (§3); early levels may use just one as a soft
   tutorial. Don't write new hazard *code* — if the existing parameterized
   class can't express what a level needs, that's a flag back to the
   Core-Contract Agent, not something to work around in a level config.
3. **Optional puzzle-site instances** — placing existing
   `PuzzleElementBase` subtypes (Signal Array, Scan Target, Comet, Cargo
   Pod, Beacon Cluster) where a level design calls for them. Not required
   per level (§6, §3).
4. **`levelOrder` append** — add your level's identifier to the
   `levelOrder: string[]` array. Never hardcode a "next level" pointer
   inside the level you're authoring — linear progression is resolved
   entirely by this array's order (§11.7, §8).

## Hard rules
- **Never touch a core file.** No edits to `ShipSurvivalComponent`,
  `HazardZoneElement`'s class definition, Scene files, `SaveManager`, or any
  other file the Core-Contract Agent owns. If a level's design seems to
  need a code change, that's a flag, not something to route around in
  config.
- Only append to `levelOrder` — don't reorder or remove existing entries
  without the specific instruction to do so.
- Puzzle-site costs are fixed by level design, not derived from player
  stats (§7) — author them directly, don't reference progression state.

## Output
One level-config file per level or content batch, plus the corresponding
`levelOrder` append.

## Explicit non-goals
- Building new puzzle-element types, hazard classes, or Scenes — closed by
  Phase 2a, owned by the Core-Contract Agent.
- Sourcing new art assets — flag a gap to Asset Integration rather than
  placing a hazard/puzzle instance against an asset that doesn't exist yet.
