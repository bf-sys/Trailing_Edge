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
| Solar Flare | Dynamic, pulsed | Energy | Requires a distinct pre-burst warning visual — telegraphing is a hard requirement (§5), not optional polish. Still the only open-world hazard with no sourced art. |
| Ion Storm | Dynamic, drifting cloud | Energy | **Sourced/final (2026-08-20)** — `hazards/hazard_ion_storm.png`, AI-generated via the new art Generate-Evaluate-Refine loop (`art-generator-agent.md`/`art-evaluator-agent.md`/`art-refiner-agent.md`), chroma-keyed and auto-cropped. Generated as an **independently-designed sprite**, not via the shared texture-family pass this row originally called for (see flag below) — a deliberate one-off deviation for that run, not a reversal of the decision. |
| Nebula Field | Static cloud | Energy | **Sourced/final, three variants (2026-08-21 rotation)** — `hazards/hazard_nebula_field.png` (candidate `nebula_field_1`, "Core Bloom"; content replaced 2026-08-21, see below), `hazard_nebula_field_alt2.png` (candidate `nebula_field_2`, "Layered Rings"), `hazard_nebula_field_alt3.png` (candidate `nebula_field_3`, "Drifting Wisp") — all from the multi-variant pass this row's Flag paragraph below always called for, mirroring Debris Field's `alt2`/`alt3` precedent above. Cycled per-placement via level files' `NEBULA_TEXTURES` arrays wherever a level places more than one instance. The original 2026-08-20 `nebula_field` candidate (same GER loop, same independently-designed-sprite deviation from the shared-pass decision — round 1 flagged on Style, round 2 passed) was **dropped from the rotation entirely on 2026-08-21**, replaced in the base texture slot by `nebula_field_1` — it was also oblong (~1276x674 native, ~1.9:1 aspect) despite its prompt asking for "gently rounded," the defect this whole follow-up pass was aimed at. `nebula_field_1`/`_3` passed the automated GER loop clean and land within ~5% of a circular 1:1 bounding box. `nebula_field_2` passed round 1 (8/8/8) but was judged "exceedingly regular" on direct owner review; a rougher-edges redo achieved that but the automated evaluator's bbox scan read the result as oblong (~1.786:1) across two refine rounds, hitting the loop's 3-round cap at `escalate` — **integrated anyway on the project owner's direct visual approval, a human override of that escalation**, not a retroactive automated pass; the actual chroma-keyed output measured 694x716px (0.969:1), reasonably circular by both eye and this alternate measurement method. **In-engine visibility flag, resolved 2026-08-22 — accept as-is.** The family's shared muted dark-violet/charcoal-grey body design (all three variants) renders low-contrast against the game's black space background, per the original integration check. Project owner's direct call on review: the grey reads as legible against the black background; no brightening pass needed. See `docs/STATUS.md`'s 2026-08-21 entries (both the initial pass and the same-day follow-up) and `docs/history/art-eval-log-2026-08-21.md`. |
| Meteoroid | Dynamic, moving object | Structure | **Sourced/final (2026-08-19)** — `hazards/hazard_meteoroid.png`, same GER loop. Passed round 1 clean. Distinct sprite from the puzzle-element Comet (§6), still unsourced. |

**Flag (updated 2026-08-20):** production *approach* was decided 2026-08-08 as one shared texture-production pass for Ion Storm/Nebula Field (2-3 distinct soft-cloud silhouette variants, a single texture per variant stretched via `setDisplaySize()`, not composed from pieces). As of 2026-08-19/20, both hazards now have sourced/final art, but via a one-off deviation from that decision — see `docs/STATUS.md`'s 2026-08-19 entry for the full reasoning and the "why" this isn't read as a reversal. `docs/reference/art-production-guidelines.md`'s shared-pass approach remains the documented default for any *future* re-sourcing pass. Whether the two now read as visually distinct was checked with real placeholders side by side (see the eval log) and looked favorable for this specific pair — but that's a static-image judgment only, not the in-engine playtest validation §9 actually calls for, so **§9's differentiation question stays open**. Resolve for real at the week-2 accessibility gate (§12) rather than treating this pass as having closed it.

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

- Scan — **resolved 2026-08-26**: `ScanActivationVfx` plays a one-shot Graphics-drawn ring that expands from the ship out to `scanConfig.scanRadius` and fades, triggered off `AbilityComponent`'s `Activated` event (per `docs/reference/phaser-vfx-notes.md`'s tween-based "expanding-ring scanner ping" recommendation — the same pattern `DestinationMarker` already used for click-to-move, applied here to the activation moment itself for the first time). Procedurally drawn, no sourced art needed, same style choice as `ShipStatusArcs`/`HazardScanOverlay`. Distinct from `HazardScanOverlay`, which still separately renders the *result* of an active scan (hazard outlines/labels) for the full duration window.
- Tractor / Repulsor — beam effect; distinct pull vs. push if both exist as separate abilities. **De-scoped from further investment 2026-08-14** — `tractorBeam` is intentionally minor/support now (de-scoped from all player-facing UI, per the ability rework), so this is a low-priority ask, not a gap blocking anything.
- Teleport — **resolved 2026-08-26**: `TeleportBlinkVfx` plays both ends of the blink — a shrinking/fading ghost duplicate left at the origin, and the real ship popping in at the destination (scaled down on arrival, tweened back up), each paired with a small violet ring flash (`teleportBlinkVfxConfig.color`, matching `TeleportRangeRing`'s existing hue). Triggered off a new `ExplorationController.EXPLORATION_EVENTS.TeleportConfirmed` event carrying both endpoints; the actual position change stays mechanically instant, unaffected by the VFX. Distinct from `TeleportRangeRing`, which only covers the aim-time state before confirm.
- Rocket boost — **resolved 2026-08-24** (found already implemented while building the scan VFX above, not new this pass): `ShipThrusterTrail` switches to a longer-lived/faster-traveling emitter variant (`thrusterVfxConfig.boostLifespanMs`/`boostSpeed`) for the burst's duration rather than getting a second, separate effect — visibly extends the existing trail instead of a dedicated one-shot VFX, but the ask ("thruster/trail effect") is met.

**Flag:** all three real abilities now have dedicated activation VFX (Scan and Rocket boost 2026-08-24/26, Teleport 2026-08-26 — see above); none of the four were ever named as art requirements anywhere in §7 or §11, only implied by the abilities existing at all. Tractor/Repulsor stays de-scoped per the 2026-08-14 rework — the only one of the four left without dedicated activation VFX, and intentionally so.

### 1.6 UI / HUD (§11.10, §11.10a)

| Asset | Notes |
|---|---|
| Energy bar | **Resolved 2026-08-10 — no art asset needed.** Implemented as `ShipStatusArcs`'s ship-relative straight bar, procedurally drawn via `Phaser.GameObjects.Graphics`, not a sprite. Previously sourced `ui/bar_energy_PLACEHOLDER.png` (Kenney UI Pack - Sci-Fi) is now unused. |
| Structure bar | **Resolved 2026-08-10 — no art asset needed.** Implemented as `ShipStatusArcs`'s ship-relative bar, procedurally drawn the same way (**switched from a curved arc to a horizontal bar 2026-08-14** — the arc read as a shield to playtesters). Previously sourced `ui/bar_structure_PLACEHOLDER.png` is now unused. |
| Ability icons × 3 | Scan, Teleport, Rocket boost — reflect `isUnlocked()` / cooldown state. **Tractor/Repulsor dropped from the icon row 2026-08-14** — de-scoped from all player-facing ability UI, always unlocked with no ceremony. |
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
- Ability activation VFX — **resolved 2026-08-26** for all three real abilities (Scan, Rocket Boost, Teleport — see §1.5); Tractor/Repulsor stays de-scoped per the 2026-08-14 rework.
- **Signal Array (added 2026-07-29)** — unsourced again after its satellite asset was reassigned to the new Relay Beacon waypoint; Phase 2a scope, not urgent. See §1.3.
- ~~Probe placeholder is greyscale/programmer-art~~ — **Resolved 2026-08-01**, replaced with final AI-generated art. See §1.3a.
