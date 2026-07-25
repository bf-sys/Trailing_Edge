# Asset Procurement Agent Flow

Visual companion to `README.md`. Three role-scoped agents turn
`trailing_edge_art_asset_list.md` into sourced, license-checked,
import-ready assets — run **per category** (ship, hazards, puzzle-props,
UI, VFX), not as one pass over the whole list.

```mermaid
flowchart TD
    ASSETLIST["trailing_edge_art_asset_list.md<br/>(§1.1–§1.7 category headers)"]
    POLICY["Project license policy<br/>(CC0 / CC-BY / CC-BY-SA accepted —<br/>no redistribution planned)"]

    subgraph CAT["Per-category loop: ship, hazards, puzzle-props, UI, VFX"]
        direction TB

        A1["**Agent 1 — Sourcing**<br/>Searches kenney.nl, opengameart.org,<br/>itch.io free-tag.<br/>Over-collects, no fit judgment."]
        CANDIDATES["Candidate list<br/>(name, url, source, stated_license,<br/>file_count/format, categories, notes)"]

        A2["**Agent 2 — Evaluation**<br/>Scores every asset-list line item:<br/>Full / Partial / None.<br/>Flags license, style mismatch,<br/>format burden, bundled sub-licenses."]
        MATRIX["Coverage matrix<br/>(table: line item · candidate ·<br/>license · coverage · note)"]
        GAPS["Gap list<br/>(None items + suggested<br/>next search strategy)"]

        OWNER{{"Project owner<br/>decides tradeoffs<br/>(Partial accept? license tier?<br/>normalize vs. accept mismatch?)"}}

        A3["**Agent 3 — Prep**<br/>Runs only on Full / owner-accepted<br/>Partial items. Verifies actual pack<br/>contents before naming anything."]

        OUT_ASSETS["Populated asset directory<br/>(matches Phaser loading manifest)"]
        OUT_ATTR["ATTRIBUTION.md<br/>(per-original-author credit)"]
        OUT_LOG["phase1-prep-log.md<br/>(per-item: converted / placeholder /<br/>kicked back / discrepancy found)"]

        A1 --> CANDIDATES --> A2
        A2 --> MATRIX
        A2 --> GAPS
        MATRIX --> OWNER
        OWNER -->|"Full / accepted Partial"| A3
        A3 --> OUT_ASSETS
        A3 --> OUT_ATTR
        A3 --> OUT_LOG

        A3 -.->|"Hard rule: usability worse<br/>than coverage call implied —<br/>stop, flag back, don't downgrade quietly"| A2
    end

    ASSETLIST --> A1
    ASSETLIST --> A2
    POLICY --> A2
    GAPS -.->|"redirects search strategy<br/>for the next category"| A1

    style A1 fill:#1f6feb,color:#fff
    style A2 fill:#8957e5,color:#fff
    style A3 fill:#2ea043,color:#fff
    style OWNER fill:#d29922,color:#000
```

## Reading the diagram

- **Solid arrows** are the normal per-category pipeline: Sourcing → candidate
  list → Evaluation → coverage matrix → owner tradeoff calls → Prep → final
  outputs.
- **Dashed arrows** are the two feedback paths that keep the pipeline honest:
  - Agent 2's gap list redirects Agent 1's search strategy on the *next*
    category (e.g. the Cargo Pod/Beacon Cluster zero-hit finding changed the
    query approach to generic shape-based terms).
  - Agent 3 can kick an item back to Agent 2 mid-prep if its actual,
    opened-up usability is worse than the coverage call assumed — Prep never
    silently re-judges coverage itself.
- The **owner decision diamond** is where License-tier tradeoffs and
  accept-Partial-as-placeholder calls surface — Agent 2 is explicitly barred
  from picking a winner unilaterally when tiers differ.
