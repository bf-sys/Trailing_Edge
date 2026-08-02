# Trailing Edge — Art Asset List

*Draft v0.1 — derived from Design Document v0.2. Core = fixed regardless of level count; Content = scales with number of levels built (initial scope: 3–4 additional levels per §12.2).*

**Updated 2026-07-29** for a GDD revision that changed Phase 1's scope, split
"Relay Beacon" into two different things (§1.3a below), and removed Star as
a resupply object. **Updated again 2026-07-31** for a core-loop change that
splits the single "Home Marker" object into two distinct locations, Entry
Wormhole and Exit Wormhole (§1.3a, §2.1) — same reused Star sprite, no new
sourcing — and separately for a new decorative background-set-piece layer
(§2.1), currently procedural placeholder art with a real sourcing need
recorded there. See `STATUS.md`'s "Design update" sections for the full
asset-sourcing-side explanation of what moved/reassigned where.

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

**Flag:** New from this pass — Debris Field (hazard) and the AsteroidField resupply asteroids (§1.4, resupply) are both asteroid/rubble phenomena that need to read as opposite in intent — one is avoided, one is approached. This pairing isn't called out as a risk anywhere in the GDD's own open-questions log (§9) and should probably be added to it.

**Flag (added 2026-07-29):** since only structure-draining hazards (Debris Field, Meteoroid) can end a level — energy is now a non-fail, ability-gating resource, §5 — the energy-draining family (Solar Flare, Ion Storm, Nebula Field) is lower-stakes and should probably read as visibly less dangerous than the structure family, not just differently colored. New open item, GDD §9.

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
| Probe | **Sourced, as an owner-original placeholder** (`objectives/probe_PLACEHOLDER.png`, greyscale, added 2026-07-29 directly by the project owner — not from a licensed pack, no attribution needed). Never listed as a requirement anywhere before this revision (a pre-existing gap this revision exposed); resolved as a placeholder same day. Still worth a real sourcing pass before final art. |
| Relay Beacon (mandatory waypoint — **not** the same thing as Signal Array above) | Sourced, via reassignment: the satellite sprite originally sourced for the old Relay Beacon puzzle (now Signal Array) was reassigned here 2026-07-29, since it fits "a marker in space" well and the puzzle's per-spot solved/unsolved requirement doesn't apply to a single simple waypoint. **Current implementation uses two separate files** (`relay_beacon_idle_PLACEHOLDER.png` base sprite + `relay_beacon_reached_overlay_PLACEHOLDER.png`, shown/hidden on top of it) — `RelayBeaconObject`. **Under consideration (2026-08-01, not yet implemented):** collapse to a single "activated" beacon asset, tinted dark/desaturated for the inactive state and restored on reach, matching `EntryWormhole`/`ExitWormhole`'s one-sprite-plus-tint convention (`wormholeConfig`) rather than the current two-file approach — would mean sourcing/generating only one relay beacon image instead of two. Worth deciding before generating new art for this object, since it changes what to produce (one asset vs. two). |
| Entry Wormhole / Exit Wormhole (launch position and required return destination — **two distinct locations** as of 2026-07-31, previously one shared "Home Marker" object) | Sourced, via reassignment: the Star sprite (§1.4's old "recharge point" entry) is reused for **both** instances as a placeholder, distinguished only by tint (active/inactive) — no new sourcing needed for the split. No longer a resupply object, since energy regenerates passively now. Same asset as the pre-existing "Home base / launch point visual" line in §2.1 below — that content-list entry is now confirmed fulfilled by this reused sprite. |

### 1.4 Resupply Points (§11.6)

| Asset | Notes |
|---|---|
| AsteroidField (Resource field — asteroids) | Structure-material resupply — the **only** resupply object as of 2026-07-29 (energy regenerates passively, no dedicated object; Star is retired as a resupply object, see §1.3a). Likely fewer, larger asteroids, distinct in composition (not just count/density) from the smaller, more plentiful Debris Field hazard — see flag in §1.2. |

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

- Home base / launch point visual — one asset, used across all levels. **Fulfilled** by the reused Star sprite (now backing both `EntryWormhole` and `ExitWormhole`, §1.3a — two distinct locations as of 2026-07-31, tinted differently) as a placeholder — no new sourcing needed here.
- **Per-level backgrounds / starfields** — one distinct treatment per level. **Current implementation (placeholder):** two procedurally generated tile textures (`STARFIELD_FAR_KEY`/`STARFIELD_NEAR_KEY`, 1024×1024, `StarfieldBackground.ts`), rendered as two `Phaser.GameObjects.TileSprite`s at different depths/scroll speeds for parallax (far: `scrollFactor 0.15`, depth `-100`; near: `scrollFactor 0.4`, depth `-90`), sized to `LEVEL_WIDTH/HEIGHT * 1.5` so panning never runs past the tiled texture (`GameScene.createParallaxBackground()`).
  - **Replacing with real art — two paths, pick one before sourcing:**
    1. **Keep the tiling approach (smaller code change).** Load two real PNGs under the existing `STARFIELD_FAR_KEY`/`STARFIELD_NEAR_KEY` texture keys in `BootScene` and drop the call to `createStarfieldTextures()` — no `GameScene` changes needed at all, since it only ever references the texture keys. **Hard constraint this puts on the art itself: it must tile seamlessly at every edge**, since `TileSprite` repeats it continuously — visible seams are an easy, common failure mode for hand-drawn or AI-generated tile art, and are worth explicitly checking for (tile the candidate 2×2 and look for a repeating seam) before accepting a sourced/generated image. Source resolution should stay reasonably high (at least the current 1024×1024, ideally 2048×2048) so tiles don't look soft when the level (and therefore the tiled area) grows larger than today's 2400×1350 test map.
    2. **Move to one non-repeating backdrop per level (bigger code change).** Replace the `TileSprite` pair with a single `Image` scaled/positioned to cover the level bounds — sidesteps the seamless-tiling constraint entirely (much easier art to source or generate) and matches this bullet's own "one distinct treatment per level" framing better than a shared repeating tile does. Tradeoffs: needs a real code change in `GameScene.createParallaxBackground()` (no more one-texture-fits-every-level reuse), and file size scales with level size rather than staying fixed at one small repeating tile — worth a quick sanity check against build size once real levels are bigger than the current test map.
  - Not urgent to decide until real starfield art is actually being sourced/generated; this note exists so that decision happens deliberately rather than by default when that time comes.
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

- Ion Storm / Nebula Field — resolve via multiple candidate assets at the week 1–2 vertical-slice gate (§9, §12), not before; now also needs to read as lower-stakes than the structure-draining family (§1.2 flag, added 2026-07-29)
- Debris Field vs. AsteroidField resupply asteroids — confirm the visual distinction is legible at a glance, not just a difference in asteroid count/size on paper
- Player ship damage-state implementation — sprite swap vs. overlay VFX vs. material change; affects what to look for in licensed packs
- Ability activation VFX — not currently named as a requirement anywhere in §7/§11; needs to be added explicitly or it risks being discovered late, during Phase 2a's ability-gating work rather than during asset sourcing
- **Signal Array (added 2026-07-29)** — unsourced again after its satellite asset was reassigned to the new Relay Beacon waypoint; Phase 2a scope, not urgent. See §1.3.
- **Probe placeholder is greyscale/programmer-art** (owner-original, added 2026-07-29), not a licensed sprite — fine as a Phase 1 stand-in, but a real sourcing pass is still worth doing before final art. See §1.3a.
