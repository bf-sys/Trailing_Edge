# Trailing Edge — To-Do List

Consolidated from `docs/STATUS.md`, `docs/phase1-manifest-and-tasks.md`, `docs/gap-analysis-2026-08-11.md`, `docs/gap-analysis-2026-08-19.md`, `docs/ability-rework-brainstorm-2026-08-14.md`, and `docs/trailing_edge_art_asset_list.md` as of 2026-08-21. Grouped by area, not yet prioritized — add your own scattered items (post-its, etc.) under "Not yet captured" below and we'll sort/prioritize the whole thing once it's complete.

Items already resolved in these docs (e.g. Probe art, ship/wormhole/beacon art, hazard-config extraction, per-level config schema, the ability rework itself) are left off this list on purpose — this is only what's still open.

## Art / Assets

- [ ] **Solar Flare** — still the only open-world hazard with zero sourced art. Also needs a distinct pre-burst warning telegraph (hard requirement, GDD §5), not just a body sprite.
- [ ] **Nebula Field readability** — the accepted sprite (desaturated dark-violet/charcoal-grey) renders low-contrast against black space; easy to miss in normal full-screen play. Decide whether to brighten it or accept as-is.
- [ ] **Signal Array** (sequence puzzle, formerly named "Relay Beacon") — fully unsourced. Needs a solved/unsolved visual state plus a way to read sequence order (numbering, light-up order, etc.). Phase 2a scope.
- [ ] **Beacon Cluster** (trail/encircle puzzle element) — no candidate art found anywhere yet.
- [ ] **Scan Target / Marker** (`ScanInteractElement`) — still unsourced; flagged as likely the cheapest asset on the whole list.
- [ ] **Cargo Pod / Wreckage** — already sourced (tech-lab tile sheet) but not yet cropped/extracted into a usable file.
- [x] ~~Base tileset — "Warped Top-Down Tech Lab" (Ansimuz)"~~ — same owner decision 2026-08-21 as Cargo Pod/Wreckage below: not using this file. Puzzle-site floor/wall tiles will need a fresh source when that's scoped.
- [ ] **Player ship damage states** — undecided whether the healthy/damaged swap is a full sprite swap, texture overlay, or VFX layer. Needs a decision before sourcing, since licensed packs may only support one route cleanly.
- [ ] **Ability activation VFX** (separate from the mechanical effects already built) — none sourced yet: scan pulse/beam, teleport blink VFX at origin/destination, rocket boost thruster/trail. (Tractor beam VFX is explicitly low-priority/de-scoped — skip unless there's spare time.)
- [ ] **Background set pieces** (planets, distant galaxies/nebulae) — still placeholder Graphics shapes. Needs a real roster of 3–5+ varied deep-space backdrop images.
- [ ] **Per-level "recovered data" reward visual** — decide whether each level needs a unique image or one generic asset (with text/UI carrying the narrative) is enough.
- [ ] Two extra Debris Field texture variants (`debris_large_alt2.png`, `debris_large_alt3.png`) are sourced but unused — on deck for Phase 2b's multi-instance/rotation work, not urgent.
- [x] ~~Cargo Pod / Wreckage~~ — **owner decision 2026-08-21: won't use `warped_top_down_tech_lab_extension.png` for this at all.** Nothing on that sheet unambiguously reads as crate/barrel; will source fresh separately when this item comes up for real. Struck here rather than left open against a source that's no longer the plan.
- [ ] **VFX asset list** — ship thrust trail, plus an open idea (not decided) for a resupply effect at AsteroidField, maybe a mining-laser-style beam for structure repair.
- [x] ~~Meteoroid orientation~~ — **fixed 2026-08-21.** Added `spriteFacingOffsetRadians` to `hazardConfig.ts` (measured from the sprite's own pixel data — trail-to-rock centroid vector, ~30 deg) and applied as `heading + offset` in `HazardZoneElement.applyMovement()`/`reposition()`, the same pattern `shipConfig.ts` already uses for the ship. Verified against the math directly (a self-implemented rotation matrix on the full-resolution source art gave -0.3 deg and 89.7 deg against 0/90 deg targets) after an in-browser screenshot check first gave a false alarm from antialiasing noise on the small in-game sprite size — flagging that in case anyone re-verifies this visually and sees the same small offset in a screenshot.
- [ ] **Window/panel UI chrome** — reusable pieces (corners, edges, etc.) for building windowed panels instead of full-screen overlay rectangles for everything. Scoped for now to building the capability itself — where/how to actually use it (Pause, Ability Unlock, How to Play, etc.) is a separate follow-up once it exists, not part of this item.

## Audio

- [x] ~~Audio asset list~~ — **written 2026-08-21**, `docs/trailing_edge_audio_asset_list.md`. Several real open questions came out of it, not yet decided: Ion Storm/Nebula Field audio identity (tied to their still-open visual-differentiation question), whether a hazard's own sound coexists with or replaces a generic damage-taken cue, and the menu-vs-gameplay music split (deliberately deferred). See that doc's §4 for the full list.
- [ ] **Source the audio files** — both SFX and music.
- [ ] **Implement audio in-game** — wire sourced files to their trigger points.
- [ ] **Volume control** — an option on the main menu / pause screen.

## Design decisions still open (GDD §9 + related)

- [ ] **Ion Storm vs. Nebula Field — do they read as visually distinct in motion?** Checked only as a static-image comparison so far; needs a real in-engine playtest at the week-2 accessibility gate.
- [ ] **Structure-vs-energy hazard stakes legibility** — the energy-draining family (Solar Flare, Ion Storm, Nebula Field) should probably read as visibly lower-stakes than the structure-draining family (now just Meteoroid), not only differently colored. Still unresolved; `scan`'s hazard-ID rework mitigates but doesn't settle it.
- [ ] **Show damage severity in scan** — expand `scan`'s hazard-ID overlay (currently colors by which resource a hazard costs) to also convey *how much* damage it does, not just which stat it threatens. Needs a design pass on the best way to show this (numeric readout, bar, color intensity, etc.) before building — may end up being the actual fix for the stakes-legibility item just above, not a separate concern.
- [x] ~~Resupply waypoint during scan~~ — **implemented 2026-08-21.** A second edge-pinned marker in `HudOverlay`, visible only while `scan` is active, pointing at the nearest `ResupplyPoint` (new `getPosition()` getter). Colored `shipStatusArcConfig.structureColor` (matches the structure bar under the ship, per owner request) and sized smaller than the objective marker (14px vs. 18px triangle size, also per owner request, to read as secondary to the mandatory objective). The shared clamp-to-edge/rotate-to-face math was factored out of `updateObjectiveMarker()` into a `positionEdgeMarker()` helper both markers now call. Verified in-browser: correct color/size/position/rotation, hides correctly when `scan` is inactive or a level has no resupply points. One thing worth knowing if anyone else drives this game headlessly for testing: the Phaser canvas is a fixed 1280x720 with no Scale Manager (`main.ts`) — a Playwright viewport smaller than that clips/misleads on-screen position checks; use a matching 1280x720 viewport.
- [ ] **Debris Field vs. AsteroidField** — differentiation guidance is written and both have final art individually, but nobody's done a side-by-side playtest read at normal play speed to confirm the "many small fragments vs. one large ore rock" distinction actually holds up in motion.
- [ ] **Comet vs. Meteoroid** — Meteoroid now has final art; Comet still doesn't, and the visual-distinction question (they're both small moving objects) is unaddressed.
- [ ] **Sequential mandatory puzzle-site gating** — explicitly undecided in the GDD itself ("not decided, no code changes made"). Needs an owner decision before any engineering work can happen here.

## Tuning

Primarily on Bryan to playtest and direct — tracked here, not assigned as build work.

- [ ] **Hazard balance pass** — how many per level, their size and speed, type mix, and damage amounts.
- [ ] **Ability cooldowns/energy costs** — tweak values. Flagged as worth doing *before* the VFX/audio work above, so those reflect the settled feel rather than values that are about to change.
- [ ] **Ship movement feel** — consider lowering acceleration and faking some drift when turning.

## How to Play screen

- [ ] **"How to Play" option** on the main menu / pause screen — an image-supported summary of movement controls and the core loop (start → probe → relay beacon → exit).
- [ ] Consider **tabs** within it for abilities, hazards, and puzzles as separate reference sections. Would be a natural first user of the window/panel chrome above once that exists, but doesn't need to wait on it — can ship as a plain overlay first.

## Code / Systems

- [x] ~~`WinScene` stale comment~~ — **fixed 2026-08-21.** Replaced with an accurate comment pointing at `LEVEL_ORDER` (`src/config/levelOrder.ts`).
- [x] ~~`console-tuning-reference.md` stale bullet~~ — **checked 2026-08-21, already fixed.** No "doesn't exist yet" text found anywhere in the file; `window.tuning.ability` is fully documented. Whatever fixed it happened before this check, just was never marked done here.
- [ ] **Phase 3 integration pass** — a full `LEVEL_ORDER` playthrough, `Continue`-resume check, and packaged-build check has not been run yet. Gates on treating the current 8 levels as content-complete.

## Not yet captured

Add your own notes here (post-its, ideas not yet in any doc, etc.) — once this section has everything, we can go through and prioritize/action the full list together.

-
