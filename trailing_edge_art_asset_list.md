# Trailing Edge — Art Asset List

*Draft v0.1 — derived from Design Document v0.2. Core = fixed regardless of level count; Content = scales with number of levels built (initial scope: 3–4 additional levels per §12.2).*

---

## 1. Core Assets

Fixed set. Needed once, regardless of how many levels ship. This is what Phase 1's vertical slice and Phase 2a's core-contract work actually depend on.

### 1.1 Player Ship

| Asset | Notes |
|---|---|
| Base ship sprite | "Older, reliable, proven" tech per §1.1 — a specific silhouette, not a generic spaceship. |
| Movement / thrust animation states | Supports click-to-move, non-Newtonian control feel (§4). |
| Damage state: healthy (≥ 50% structure) | New — two-state damage model. |
| Damage state: damaged (< 50% structure) | New — visually distinct from healthy state (scorching, sparking, hull damage, etc.). Single threshold at 50%; no additional states planned for initial scope. |

**Flag:** The doc doesn't yet specify whether the damage-state swap is a full sprite swap, a texture/material overlay, or an added VFX layer (smoke, sparks) on the same base sprite. That's an implementation choice as much as an art one — worth deciding before sourcing, since a licensed pack may only give you one clean route (e.g., overlay VFX is much easier to find generically than a matching pre-damaged variant of the same ship model).

### 1.2 Open-World Hazards (§9 reference table, §11.3 `HazardZoneElement`)

| Phenomenon | Behavior | Drains | Asset note |
|---|---|---|---|
| Debris Field | Static zone | Structure | Fixed boundary, learnable — needs a clear "danger area" read distinct from the Resource Field below (see flag). |
| Solar Flare | Dynamic, pulsed | Energy | Requires a distinct pre-burst warning visual — telegraphing is a hard requirement (§5), not optional polish. |
| Ion Storm | Dynamic, drifting cloud | Energy | Same visual family as Nebula Field by current assumption — see flag below. Open item, not blocking: source multiple candidate treatments and pick after the week 1–2 test. |
| Nebula Field | Static cloud | Energy | Same visual family as Ion Storm. |
| Meteoroid | Dynamic, moving object | Structure | Single moving hazard, not a zone/cloud — distinct sprite from the puzzle-element Comet (§6). |

**Flag:** Ion Storm / Nebula Field stays open per your note — plan to source 2–3 candidate cloud treatments (varying color, particle density, and a border/outline option) rather than committing to one asset up front. Resolve at the week-2 accessibility gate (§12) rather than before.

**Flag:** New from this pass — Debris Field (hazard) and the Resource Field asteroids (§1.4, resupply) are both asteroid/rubble phenomena that need to read as opposite in intent — one is avoided, one is approached. This pairing isn't called out as a risk anywhere in the GDD's own open-questions log (§9) and should probably be added to it.

### 1.3 Puzzle-Site Elements (§9 reference table, §11.3)

| Phenomenon | Element class | Asset note |
|---|---|---|
| Relay Beacon (sequence) | `SequenceSpotElement` | Needs a solved/unsolved visual state and a way to read sequence order (numbering, light-up order, etc.). |
| Scan Target / Marker | `ScanInteractElement` | Base interact marker — likely the cheapest asset on this list. |
| Comet (tracking) | `MovingSpotDurationElement` | Must read as distinct from Meteoroid despite both being small moving objects — the GDD renamed Meteoroid specifically to avoid a name collision (§9); the visual distinction needs equal attention, not just the name. |
| Cargo Pod / Wreckage (push/pull) | `PushPullObjectElement` | Static object sprite; gated behind Tractor/Repulsor ability. |
| Beacon Cluster (trail/encircle) | `TrailDrawElement` | Set of beacon objects plus a trail-draw effect. |

### 1.4 Resupply Points (§11.6)

| Asset | Notes |
|---|---|
| Star | Recharge point (energy). |
| Resource field — asteroids | Structure-material resupply. Per your note: likely fewer, larger asteroids, distinct in composition (not just count/density) from the smaller, more plentiful Debris Field hazard — see flag in §1.2. This is a scope change from the original "AsteroidField" framing and should probably be reflected in §11.6's naming if the code-level distinction matters, though that's a separate question from the asset itself. |

### 1.5 In-World Ability VFX

§11.10 specifies HUD icons only (unlock/cooldown state). It does not specify what an ability looks like when activated in the world — that's a separate, currently unaddressed asset need.

- Scan — beam or pulse effect
- Tractor / Repulsor — beam effect; distinct pull vs. push if both exist as separate abilities
- Teleport — effect at origin and/or destination
- Rocket boost — thruster/trail effect

**Flag:** None of these four are named as art requirements anywhere in §7 or §11 — they're implied by the ability existing at all. Worth confirming before Phase 2a closes, since §6 already flags PushPullObjectElement/TractorBeam as the one ability most likely to need rework if it doesn't feel clean in Arcade physics (§11) — a placeholder VFX here could mask or exaggerate that feel during prototyping.

### 1.6 UI / HUD (§11.10)

| Asset | Notes |
|---|---|
| Energy bar | Bound to `onResourceChanged`; display-only. |
| Structure bar | Bound to `onResourceChanged`; display-only. |
| Ability icons × 4 | Scan, Tractor/Repulsor, Teleport, Rocket boost — reflect `isUnlocked()` / cooldown state. |
| Puzzle-site-active indicator | GDD explicitly allows this to be minimal — "even just a highlight or icon." Low sourcing cost, don't over-invest. |

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

- Home base / launch point visual — one asset, used across all levels
- Per-level backgrounds / starfields — one distinct treatment per level
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

- Ion Storm / Nebula Field — resolve via multiple candidate assets at the week 1–2 vertical-slice gate (§9, §12), not before
- Debris Field vs. Resource Field asteroids — confirm the visual distinction is legible at a glance, not just a difference in asteroid count/size on paper
- Player ship damage-state implementation — sprite swap vs. overlay VFX vs. material change; affects what to look for in licensed packs
- Ability activation VFX — not currently named as a requirement anywhere in §7/§11; needs to be added explicitly or it risks being discovered late, during Phase 2a's ability-gating work rather than during asset sourcing
