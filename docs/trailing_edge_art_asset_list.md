# Trailing Edge — Art Asset List

*Draft v0.1 — derived from Design Document v0.2. Core = fixed regardless of level count; Content = scales with number of levels built (initial scope: 3–4 additional levels per §12.2).*

**Updated 2026-07-29** for a GDD revision that changed Phase 1's scope, split
"Relay Beacon" into two different things (§1.3a below), and removed Star as
a resupply object. **Updated again 2026-07-31** for a core-loop change that
splits the single "Home Marker" object into two distinct locations, Entry
Wormhole and Exit Wormhole (§1.3a, §2.1) — same reused Star sprite, no new
sourcing — and separately for a new decorative background-set-piece layer
(§2.1), currently procedural placeholder art with a real sourcing need
recorded there. **Updated again 2026-08-01**: ship, wormhole pair,
AsteroidField (large), Relay Beacon, Probe, and the starfield backgrounds
all replaced with final AI-generated art (§1.1, §1.3a, §1.4, §2.1) — see
`STATUS.md`'s 2026-08-01 "Design update" section.

---

## 1. Core Assets

Fixed set. Needed once, regardless of how many levels ship. This is what Phase 1's vertical slice and Phase 2a's core-contract work actually depend on.

### 1.1 Player Ship

| Asset | Notes |
|---|---|
| Base ship sprite | **Sourced/final (2026-08-01)** — `ship/ship_base.png`, AI-generated via the Art Director Agent/Gemini. "Older, reliable, proven" tech per §1.1 — a specific silhouette, not a generic spaceship. |
| Movement / thrust animation states | Supports click-to-move, non-Newtonian control feel (§4). |
| Damage state: healthy (≥ 50% structure) | New — two-state damage model. |
| Damage state: damaged (< 50% structure) | New — visually distinct from healthy state (scorching, sparking, hull damage, etc.). Single threshold at 50%; no additional states planned for initial scope. |

**Flag:** The doc doesn't yet specify whether the damage-state swap is a full sprite swap, a texture/material overlay, or an added VFX layer (smoke, sparks) on the same base sprite. That's an implementation choice as much as an art one — worth deciding before sourcing, since a licensed pack may only give you one clean route (e.g., overlay VFX is much easier to find generically than a matching pre-damaged variant of the same ship model).

### 1.2 Open-World Hazards (§9 reference table, §11.3 `HazardZoneElement`)

| Phenomenon | Behavior | Drains | Asset note |
|---|---|---|---|
| Debris Field | Static zone, blocks movement | None (re-scoped 2026-08-07 — see flag below) | Naturally-occurring rock/ice fragments, not ship wreckage (fiction changed alongside the mechanic). **Sourced/final (2026-08-07)** — `hazards/debris_large.png`, AI-generated via the Art Director Agent/Gemini, chroma-keyed and center-cropped to a square footprint for `HazardZoneElement`'s `circle` shape. Two additional distinct-composition variants (`debris_large_alt2.png`, `debris_large_alt3.png`) sourced alongside it per the "2-3 distinct textures" guidance in `art-production-guidelines.md`, reserved for Phase 2b's multi-instance/rotation compositing — not yet loaded or referenced by any code. |
| Solar Flare | Dynamic, pulsed | Energy | Requires a distinct pre-burst warning visual — telegraphing is a hard requirement (§5), not optional polish. |
| Ion Storm | Dynamic, drifting cloud | Energy | Same visual family as Nebula Field — one shared asset-production pass serves both (see flag below). Open item, not blocking. |
| Nebula Field | Static cloud | Energy | Same visual family as Ion Storm. |
| Meteoroid | Dynamic, moving object | Structure | Single moving hazard, not a zone/cloud — distinct sprite from the puzzle-element Comet (§6). |

**Flag (updated 2026-08-08):** production approach decided, differentiation still open. `docs/reference/art-production-guidelines.md`'s new "Nebula Field / Ion Storm cloud art" section scopes this as one texture-production pass for both hazards: 2-3 distinct soft-cloud silhouette variants (not a Debris-Field-style discrete-fragment cluster — a nebula is diffuse gas, not countable objects), each a single texture stretched via `setDisplaySize()` rather than composed from pieces, with rotation-per-instance once wired in. Whether motion alone (Ion Storm drifting vs. Nebula Field static) reads clearly at normal play speed is unresolved — the reserve options (particle trail, border/outline) would layer onto this shared texture set rather than require separate base art per hazard, but that's still to validate with a real placeholder, not decided on paper. Resolve at the week-2 accessibility gate (§12) rather than before.

**Flag:** New from this pass — Debris Field (hazard) and the AsteroidField resupply asteroids (§1.4, resupply) are both asteroid/rubble phenomena that need to read as opposite in intent — one is avoided, one is approached. **Resolved 2026-08-07:** `docs/reference/art-production-guidelines.md`'s "Style consistency" section now gives explicit differentiation guidance — Debris Field as a many-small-fragments cluster vs. AsteroidField as one single large rock with visible metal ore — rather than leaving this as an open GDD §9 item.

**Flag (added 2026-07-29, updated 2026-08-07):** since only structure-draining hazards can end a level — energy is now a non-fail, ability-gating resource, §5 — the energy-draining family (Solar Flare, Ion Storm, Nebula Field) is lower-stakes and should probably read as visibly less dangerous than the structure family, not just differently colored. Meteoroid is now the *sole* structure-draining hazard (Debris Field was re-scoped 2026-08-07 to a movement-blocking, zero-drain obstacle — see the Debris Field row above and GDD §9), so this open item is sharper than when written, not resolved by the re-scope. Open item, GDD §9.

### 1.3 Puzzle-Site Elements (§9 reference table, §11.3) — optional/additive content, not required to complete a level

| Phenomenon | Element class | Asset note |
|---|---|---|
| Signal Array (sequence) — **renamed from "Relay Beacon" 2026-07-29**, see §1.3a below | `SequenceSpotElement` | Needs a solved/unsolved visual state and a way to read sequence order (numbering, light-up order, etc.). Unsourced as of 2026-07-29 — its previously-sourced satellite asset was reassigned to the new Relay Beacon waypoint instead (`STATUS.md`). |
| Scan Target / Marker | `ScanInteractElement` | Base interact marker — likely the cheapest asset on this list. |
| Comet (tracking) | `MovingSpotDurationElement` | Must read as distinct from Meteoroid despite both being small moving objects — the GDD renamed Meteoroid specifically to avoid a name collision (§9); the visual distinction needs equal attention, not just the name. |
| Cargo Pod / Wreckage (push/pull) | `PushPullObjectElement` | Static object sprite; gated behind Tractor/Repulsor ability. |
| Beacon Cluster (trail/encircle) | `TrailDrawElement` | Set of beacon objects plus a trail-draw effect. |

### 1.3a Core-Loop Objects (§9 reference table, §11.11–11.14) — new 2026-07-29, required every level, distinct from the optional puzzle-site elements above

| Object | Asset note |
|---|---|
| Probe | **Sourced/final (2026-08-01)** — `objectives/probe.png`, AI-generated via the Art Director Agent/Gemini, replacing the owner-original greyscale placeholder (`probe_PLACEHOLDER.png`, added 2026-07-29). Never listed as a requirement anywhere before the 2026-07-29 revision (a pre-existing gap that revision exposed); resolved as a placeholder same day, now resolved as final art. |
| Relay Beacon (mandatory waypoint — **not** the same thing as Signal Array above) | **Sourced/final (2026-08-01)** — `objectives/relay_beacon.png`, AI-generated via the Art Director Agent/Gemini. **Implemented as a single asset**, per the "under consideration" note this row carried until now: `RelayBeaconObject` tints it via `waypointTintConfig` (starts `inactiveTint`, swaps to `activeTint` on reach) rather than the old two-file idle/reached-overlay setup, matching `EntryWormhole`/`ExitWormhole`'s convention. |
| Entry Wormhole / Exit Wormhole (launch position and required return destination — **two distinct locations** as of 2026-07-31, previously one shared "Home Marker" object) | **Sourced/final (2026-08-01)** — `objectives/wormhole.png`, AI-generated via the Art Director Agent/Gemini, replacing the reused Star sprite placeholder. Still one file backing **both** instances, distinguished by runtime tint (`waypointTintConfig.activeTint`/`inactiveTint`, renamed from `wormholeConfig`). No longer a resupply object, since energy regenerates passively now. Same asset as the "Home base / launch point visual" line in §2.1 below — that content-list entry is now confirmed fulfilled by this sprite. |

### 1.4 Resupply Points (§11.6)

| Asset | Notes |
|---|---|
| AsteroidField (Resource field — asteroids) | Structure-material resupply — the **only** resupply object as of 2026-07-29 (energy regenerates passively, no dedicated object; Star is retired as a resupply object, see §1.3a). Likely fewer, larger asteroids, distinct in composition (not just count/density) from the smaller, more plentiful Debris Field hazard — see flag in §1.2. **Large variant sourced/final (2026-08-01)** — `resupply/asteroid_large.png`, AI-generated via the Art Director Agent/Gemini; medium/small variants are unaffected, still the OpenGameArt placeholder (unused in Phase 1's current test scene). |

### 1.5 In-World Ability VFX

§11.10 specifies HUD icons only (unlock/cooldown state). It does not specify what an ability looks like when activated in the world — that's a separate, currently unaddressed asset need.

- Scan — beam or pulse effect
- Tractor / Repulsor — beam effect; distinct pull vs. push if both exist as separate abilities
- Teleport — effect at origin and/or destination
- Rocket boost — thruster/trail effect

**Flag:** None of these four are named as art requirements anywhere in §7 or §11 — they're implied by the ability existing at all. Worth confirming before Phase 2a closes, since §6 already flags PushPullObjectElement/TractorBeam as the one ability most likely to need rework if it doesn't feel clean in Arcade physics (§11) — a placeholder VFX here could mask or exaggerate that feel during prototyping.

### 1.6 UI / HUD (§11.10, §11.10a)

| Asset | Notes |
|---|---|
| Energy bar | **Resolved 2026-08-10 — no art asset needed.** Implemented as `ShipStatusArcs`'s ship-relative straight bar, procedurally drawn via `Phaser.GameObjects.Graphics`, not a sprite. Previously sourced `ui/bar_energy_PLACEHOLDER.png` (Kenney UI Pack - Sci-Fi) is now unused. |
| Structure bar | **Resolved 2026-08-10 — no art asset needed.** Implemented as `ShipStatusArcs`'s ship-relative curved arc, procedurally drawn the same way. Previously sourced `ui/bar_structure_PLACEHOLDER.png` is now unused. |
| Ability icons × 4 | Scan, Tractor/Repulsor, Teleport, Rocket boost — reflect `isUnlocked()` / cooldown state. |
| Puzzle-site-active indicator | GDD explicitly allows this to be minimal — "even just a highlight or icon." Low sourcing cost, don't over-invest. |

**Note (2026-08-10):** the on-screen resource display was replaced with a
world-space, ship-relative readout (`ShipStatusArcs`) — a deliberate style
choice, not a placeholder. `ui/panel_frame_PLACEHOLDER.png` (previously the
bars' background panel) is now unused for the same reason. All three
placeholder files were moved to `art-staging/ui-unused/` (gitignored,
reserved for reuse if ever needed) since they're no longer loaded by any
code; see `STATUS.md`'s 2026-08-10 entry.

### 1.7 Scenes (§11.8)

| Scene | Notes |
|---|---|
| TitleScene | Title art, Start / Continue buttons. |
| PauseScene | Overlay treatment (Phaser scene-stacking, not a swap). |
| WinScene | GDD explicitly defers content here ("fine to keep minimal") — lowest-priority art in the entire list. |
| BootScene | Likely just a loading indicator — no dedicated art called for in §11.8. |

---

## 2. Content Assets

Scales with level count. Initial scope per §12.2 is a vertical slice plus roughly 3–4 additional levels — plan sourcing volume against that number, not an unbounded campaign.

### 2.1 Environment

- Home base / launch point visual — one asset, used across all levels. **Fulfilled** by the reused Star sprite (now backing both `EntryWormhole` and `ExitWormhole`, §1.3a — two distinct locations as of 2026-07-31, tinted differently) as a placeholder — no new sourcing needed here.
- **Per-level backgrounds / starfields** — one distinct treatment per level. **Sourced/final (2026-08-01):** `assets/backgrounds/bg_stars_far.jpg`/`bg_stars_near.jpg`, AI-generated via the Art Director Agent/Gemini (1024×1024, matching the prior placeholder tile size exactly), replacing the procedurally generated tiles (`StarfieldBackground.ts`, now stripped to just its two exported texture-key constants). Still rendered as two `Phaser.GameObjects.TileSprite`s at different depths/scroll speeds for parallax (far: `scrollFactor 0.15`, depth `-100`; near: `scrollFactor 0.4`, depth `-90`) — the **tiling path** was the one chosen of the two previously open here (vs. a single non-repeating per-level backdrop), since these were generated at 1024×1024 to tile seamlessly — visually confirmed, no seam at tile boundaries when panning across them in-browser. Kept as `.jpg` rather than converted to `.png` — no transparency needed for a *single* opaque full-bleed background tile, unlike every sprite category in §1. **Playtest caught one real bug from this, though:** stacking two fully-opaque layers meant the near layer's solid black areas hid the far layer entirely — fixed via `Phaser.BlendModes.ADD` on the near layer (`GameScene.createParallaxBackground()`), not by regenerating the art. See `art-production-guidelines.md`'s File Format section for the full explanation.
- **Background set pieces (added 2026-07-31)** — decorative-only images (a planet, a distant galaxy/nebula, ...) scattered a few at a time across a level to break up the tiled starfield's monotony; no gameplay effect, placement is randomized (seeded per level, see `BackgroundSetPieces.ts`). **Currently procedural placeholder art** (two Graphics-drawn textures — a shaded circle for "planet," a colored dot-cloud for "galaxy" — same throwaway-art approach as the starfield tiles themselves). Real sourcing need: a small roster (3–5+) of varied deep-space backdrop images — planets, nebulae, distant galaxies, derelict structures, etc. — sized to read clearly at large scale/low alpha against the starfield. Not urgent; swap in as real art becomes available, one roster entry at a time, following the `_PLACEHOLDER` naming convention (`docs/phase1-manifest-and-tasks.md`) once sourced.
- Per-level cargo/data reward representation — §1.1 (Appendix) frames each level's recovered data as also carrying narrative payoff (that system's habitability verdict); confirm whether this needs a unique per-level visual or can reuse one generic "recovered data" asset with text/UI doing the narrative work

### 2.2 Per-Level Hazard & Puzzle Placement

No new art per level for this category, assuming §11.3's `HazardZoneElement` collapse holds (one class, five content configs). Placement is a config/tuning task, not an asset-production task — listed here only so it isn't mistaken for a content art line item.

---

## 3. Explicit Non-Requirements

Stated to avoid over-sourcing against systems the GDD deliberately excludes (§10):

- No combat system → no weapons, projectiles, or enemy-ship assets
- No control-remapping UI in the initial build
- No 4X / empire-management layer → no strategic-map or territory assets

---

## 4. Open Items Carried Into Sourcing

- Ion Storm / Nebula Field — production approach decided 2026-08-08 (shared 2-3-variant soft-cloud texture set, see §1.2 flag and `art-production-guidelines.md`), motion-vs-static differentiation still resolved via a real placeholder at the week 1–2 vertical-slice gate (§9, §12), not before; now also needs to read as lower-stakes than the structure-draining family (§1.2 flag, added 2026-07-29)
- Debris Field vs. AsteroidField resupply asteroids — differentiation guidance is now written (`art-production-guidelines.md`, 2026-08-07: many-small-fragments vs. one-large-rock-with-ore) and Debris Field's real art now exists (`hazards/debris_large.png`) and renders correctly in an in-engine check; still needs a side-by-side playtest read against `resupply/asteroid_large.png` at normal play speed, not just confirmed individually
- Player ship damage-state implementation — sprite swap vs. overlay VFX vs. material change; affects what to look for in licensed packs
- Ability activation VFX — not currently named as a requirement anywhere in §7/§11; needs to be added explicitly or it risks being discovered late, during Phase 2a's ability-gating work rather than during asset sourcing
- **Signal Array (added 2026-07-29)** — unsourced again after its satellite asset was reassigned to the new Relay Beacon waypoint; Phase 2a scope, not urgent. See §1.3.
- ~~Probe placeholder is greyscale/programmer-art~~ — **Resolved 2026-08-01**, replaced with final AI-generated art. See §1.3a.
