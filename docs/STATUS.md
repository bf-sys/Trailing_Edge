# STATUS — Trailing Edge Asset Sourcing (as of 2026-08-21)

One-page entry point. Read this first; go to `history/run-log-2026-07-24.md`
for search-by-search detail, or `history/phase1-prep-log.md` for the full
per-item prep record (conversions, placeholder flags, kickbacks) behind the
summary below.

## Art-integration update (2026-08-21) — multi-variant Nebula Field pass: two new sourced textures wired in, one candidate escalated and left out

Follow-up to the 2026-08-20 entry immediately below, closing the
multi-variant gap that entry's `nebula_field.png` never actually filled
(the "shared cloud-texture-family... 2-3 distinct variants" approach
`art-production-guidelines.md`'s "Nebula Field / Ion Storm cloud art"
section calls for, mirroring the existing `debris_large_1/2/3` precedent).
That single asset was also oblong (~1276x674 native, ~1.9:1 aspect) despite
its prompt asking for "gently rounded" — this pass explicitly re-biased the
prompt toward a circular silhouette to fix that, on top of adding variant
count.

**Ran the full GER loop against three new candidate ids** (`nebula_field_1`
"Core Bloom", `nebula_field_2` "Layered Rings", `nebula_field_3` "Drifting
Wisp"), registered in `tools/art-reviewer/assets.json` alongside the
untouched original `nebula_field` entry. `nebula_field_1` and
`nebula_field_3` passed clean (round 1 for `_1`: 8/8/9 Technique/Style/
Format; `_3` flagged round 1 at Format 3/10 for an unrequested two-cloud
contact-sheet artifact, fixed and passed round 2 at 8/8/9). Both landed
within ~5% of a circular 1:1 bounding box (`_1`: 622x616px/1.010:1; `_3`:
526x502px/1.048:1) — the specific defect this pass targeted is fixed.
`nebula_field_2` passed round 1 at 8/8/8 (758x748px/1.013:1) but the
project owner judged the accepted image "exceedingly regular" on direct
inspection; a follow-up redo aimed at rougher/less symmetrical edges
achieved that (Style held at 7/10, edges confirmed organic against
`nebula_field_1`/`_3`) but regressed the silhouette back to oblong
(~1.78:1) across two refine attempts and hit the 3-round cap — **left
`needs_revision` in `feedback.json`, not integrated below.** Full
round-by-round detail: `docs/history/art-eval-log-2026-08-21.md`.

**Integration mirrors the 2026-08-20 entry's own chroma-key/wiring method
exactly** — `tools/asset-prep/chroma-key.js` on the two accepted
candidates, producing `assets/hazards/hazard_nebula_field_alt2.png`
(628x624, from `nebula_field_1`) and `hazard_nebula_field_alt3.png`
(536x512, from `nebula_field_3`). Preloaded in `BootScene.ts` under those
texture keys alongside the existing `hazard_nebula_field`. **Judgment call,
flagged rather than silently decided:** the existing (oblong) original
`hazard_nebula_field.png` was kept as the first of now three variants
rather than retired — nothing asked for its removal, and Debris Field's own
precedent is three coexisting variants, not a replace-in-place. Every level
file placing more than one Nebula Field instance (`level-002` through
`level-008`, four-instance discrete placements plus `level-008`'s chained
`nebulaWall()` gauntlet) now cycles a per-file `NEBULA_TEXTURES` array
across its placements via `HazardPlacement.textureKey`, the same override
mechanism `debrisWall()`'s `DEBRIS_TEXTURES` already used — `level-000`'s
and `level-001`'s single-instance placements are left on the type-level
default, matching how single-instance Debris Field placements already
behave.

**Verified**, same bar as the 2026-08-20 entry: `npx tsc --noEmit` passes
clean, and a headless Playwright run jumping straight into `GameScene` at
`level-008` (the busiest `nebulaWall()` usage, 87 chained instances total)
confirmed zero console/page errors, all three `hazard_nebula_field*`
texture keys resolve, all three actually render in-scene (32/31/24 split
across the three variants), and a sampled `alt2` instance's display size is
the configured 200x200 (`shape.radius * 2`) despite its differing native
pixel dimensions from the original — asset/gameplay-size decoupling held.

**Docs updated this pass:** this STATUS.md entry, `ATTRIBUTION.md` (two new
"Owner-created assets" rows plus a note on the escalated candidate),
`phase1-manifest-and-tasks.md` (hazards/ directory listing).

### Follow-up, same day — `nebula_field_2` integrated after direct owner approval; original oblong asset dropped from rotation

The project owner reviewed the round-3 `nebula_field_2` image directly
(the one the entry above describes as escalated — rough/organic edges
achieved, but the evaluator's automated bbox scan read the silhouette as
oblong, ~1268x710px/1.786:1) and judged it good, overriding the automated
escalation. **This is a human override of a `escalate` verdict, not a
retroactive automated pass** — recorded as such rather than a fabricated
evaluator pass. Re-inspecting the same image directly (not just trusting
the automated measurement) it does read as reasonably round by eye — worth
noting the evaluator's noise-filtered bbox scan may itself have been an
overcautious read here, consistent with a couple of earlier false-positive
elongation reads this same session (`nebula_field_2` round 1's own
false-elongation scare, `nebula_field_3`'s per-panel measurement). The
chroma-keyed/auto-cropped output that actually ships
(`tools/asset-prep/chroma-key.js`'s alpha-threshold crop, a different,
arguably more reliable method than the evaluator's RGB-distance patch scan)
measured 694x716px — 0.969:1, genuinely close to circular.

Per the same conversation, the original (2026-08-20, oblong, ~1.9:1)
`nebula_field` asset is now **dropped from the game's rotation entirely** —
not just left as a non-preferred third option as the entry above described.
To minimize churn, the three existing texture keys
(`hazard_nebula_field`/`_alt2`/`_alt3`, and every level file's
`NEBULA_TEXTURES` array/`BootScene.ts` preload referencing them) were left
untouched; only which candidate's art occupies each key's PNG changed:
- `hazard_nebula_field.png` (base slot) — now `nebula_field_1`'s art
  (previously in the `_alt2` slot). The original oblong asset's pixel
  content no longer exists in `assets/hazards/` under any key.
- `hazard_nebula_field_alt2.png` — now `nebula_field_2`'s art (newly
  integrated this follow-up).
- `hazard_nebula_field_alt3.png` — unchanged, still `nebula_field_3`.

`tools/art-reviewer/feedback.json["nebula_field_2"]` is `"accepted"`; its
winning round-3 feedback was folded into `assets.json`'s stored base
prompt. **One process discrepancy surfaced while doing this, flagged
rather than quietly built on top of:** `feedback.json["nebula_field_2"]`
was already sitting at `"accepted"` (matching the pre-redo, round-1-pass
state committed in `4c6d6ae`) before this follow-up's own edit — not the
`"needs_revision"` the art-refiner-agent's cap-hit close-out step reported
leaving in place a few messages earlier in that session. The file's mtime
lines up with that close-out step's own run, so its write likely didn't
match its self-reported summary. Didn't block this integration (the
intended end state is `"accepted"` either way, now for a real reason — the
owner's direct approval — rather than whatever caused the earlier
mismatch), but worth a look if this pattern recurs.

Untracked in `assets/hazards/` before this follow-up, tracked in it after:
no new files (all three PNG paths already existed from the entry above;
only two of the three files' contents changed). Verified the same way —
`npx tsc --noEmit` clean (no code changed, since texture keys are stable);
image content changes don't need a fresh headless-render check beyond what
the entry above already confirmed for these exact texture keys resolving
and rendering.

## Art-integration update (2026-08-20) — Meteoroid/Ion Storm/Nebula Field moved from `tools/art-reviewer/` into real game assets

Follow-up to the 2026-08-19 entry immediately below: the three accepted
candidates are now actually wired into the game, not just sitting in the
review tool.

**New tool, not just new assets:** `tools/asset-prep/chroma-key.js` — the
first real script written for `tools/asset-prep`'s package.json, which
previously only *declared* "chroma-key removal + auto-trim" as its purpose
with no implementation. Uses `jimp` (already a real dependency there): an
excess-green threshold classifies each pixel as background/edge-band/
subject with a linear alpha ramp across the band, a despill step caps the
green channel at `max(r,b)` on every pixel so no fringe survives
compositing, then the opaque bounding box is computed directly from the
resulting alpha channel and cropped to it (plus a small transparent pad).
**Note for whoever reuses this:** jimp's own built-in `autocrop()` was
tried first and doesn't work for this — it compares border pixels to the
corner color with a near-zero default tolerance, meant for solid-color
opaque borders, and ordinary JPEG noise in the newly-transparent
background pixels defeats it every time (confirmed: it returned the
un-cropped original canvas). The alpha-bounding-box approach in this
script is a deliberate replacement for that call, not an alternative
option left in.

**Wired in, matching Debris Field's exact existing precedent** (the one
hazard that already had final art before this pass): `hazardConfig.ts`'s
`ionStorm`/`nebulaField`/`meteoroid` entries dropped their
`placeholderTexture` fields (now only `solarFlare` has one), and
`BootScene.ts` preloads the three new files under the texture keys
`hazardConfig.ts` already referenced (`hazard_meteoroid`,
`hazard_ion_storm`, `hazard_nebula_field`). No `GameScene.create()` logic
changed — `placeHazard()`'s existing `if (config.placeholderTexture)`
branch already skips placeholder-texture generation once that field is
absent, the same path Debris Field has always used.

**Verified, not just typechecked:** `npx tsc --noEmit -p .` passes, and a
headless Playwright run against `level-000` (which places all five
hazard types together) confirmed zero console/page errors, all five
hazard textures resolved (`scene.textures.exists(...)`), and each of the
three new hazards renders at its configured display size
(`shape.radius * 2`, matching the asset/gameplay-size-decoupling rule —
`hazard_nebula_field.png`'s very wide native aspect ratio, ~1276x674 after
auto-crop, gets non-uniformly scaled into a 200x200 display box as a
result; noted, not treated as a defect, same as any other sprite here).

**One real finding surfaced during that verification, not fixed
unilaterally:** with the camera moved off the ship (the default follow
target) and centered directly on Nebula Field, the sprite is genuinely
there — correct position, scale, alpha — but its Style-passing desaturated
dark-violet/charcoal-grey body renders quite low-contrast against the
game's black space background; easy to miss at a glance in a normal
full-screen view, easy to spot once you know to look. This is a real
telegraphing data point for GDD §9's still-open
structure-vs-energy/hazard-legibility question (see the 2026-08-19 entry
below and `trailing_edge_art_asset_list.md`'s updated flag) — recorded
here rather than silently brightening the already-evaluator-accepted art.

**Docs updated this pass:** this STATUS.md entry,
`phase1-manifest-and-tasks.md` (hazards/ directory listing),
`ATTRIBUTION.md` (three new "Owner-created assets" rows),
`trailing_edge_art_asset_list.md` (Meteoroid/Ion Storm/Nebula Field rows
marked sourced/final, flag paragraph updated with the visibility finding
and the still-open §9 status).

## Art-pipeline update (2026-08-19) — Meteoroid/Ion Storm/Nebula Field candidates generated via a new scored art GER loop; Ion Storm/Nebula Field deliberately diverge from the 2026-08-08 shared-pass decision below

**New tooling, not new final art integration.** Three new agents —
`.claude/agents/art-generator-agent.md`, `art-evaluator-agent.md`,
`art-refiner-agent.md` — mirror the existing level-authoring
Generate-Evaluate-Refine loop (`content-agent.md` /
`level-evaluator-agent.md` / `level-refiner-agent.md`), but for art: the
Generator wraps `art-director-agent.md`'s existing prompt discipline and
the `tools/art-reviewer` Gemini pipeline; the Evaluator scores each
candidate 1-10 on three dimensions (Technique — 2D pixel-art fidelity,
Style — gritty dark sci-fi adherence, Format — solid `#00FF00` chroma-key
compliance, checked deterministically via `jimp` patch-sampling, already a
real dependency of `tools/asset-prep`) against a pass threshold of 7 on
each; the Refiner translates flagged dimensions into regeneration feedback
and always loops back to Evaluate (an image has no "small scoped patch" —
every fix is a full regenerate-and-recheck), capped at 3 rounds.

**Run live against three previously-unsourced hazards:**
- **Meteoroid** — passed round 1 clean (Technique 8, Style 8, Format 8).
- **Ion Storm** — passed round 1 clean (Technique 7, Style 8, Format 9).
- **Nebula Field** — round 1 flagged on Style (6/10: the candidate's
  saturated purple/magenta was the entire cloud body, not a minority
  accent against a muted anchor tone the way `meteoroid.jpg`/`ion_storm.jpg`
  both use it). The Refiner translated that into targeted regeneration
  feedback; round 2 passed clean (Technique 8, Style 8, Format 9) and was
  finalized with that feedback folded into `assets.json`'s stored prompt.
  First real exercise of the loop's Refine step, not just its Generate/
  Evaluate halves.

Full per-round detail, pixel-sample numbers, and screenshots-equivalent
observations: `docs/history/art-eval-log-2026-08-19.md`.

**Deliberate deviation, flagged rather than silently reconciled:** the
"Planning update (2026-08-08)" entry immediately below this one decided
Ion Storm and Nebula Field should share **one** art-production pass (a
soft translucent cloud/wisp texture family, differentiated only by an
in-engine tint) rather than being independently designed. For this run,
the project owner explicitly chose to generate them as two independently-
directed sprites instead (Ion Storm: hard-edged, lightning-veined storm
cloud; Nebula Field: soft-edged, muted-body-with-core-glow cloud) — a
one-off exercise of the new art GER loop, not a reversal of the 2026-08-08
decision. That decision and its reasoning (a nebula's diffuse-gas fiction
doesn't survive a debris-style cluster approach, overlapping translucent
instances accumulate alpha, etc.) are unchanged and still the documented
default in `docs/reference/art-production-guidelines.md` if/when this asset
gets a real production pass.

One side effect worth recording: viewed side by side, this run's two
independently-styled candidates read as clearly distinct hazards (different
hue family, different edge hardness, presence/absence of internal
linework) — a live data point toward GDD §9's still-open "does Ion
Storm read as distinct from Nebula Field" question. This is a static-image
judgment only, not the in-engine playtest validation the GDD actually
calls for, so **the GDD §9 item stays open** — don't treat this run as
having resolved it.

**Not yet integrated.** All three candidates live only in
`tools/art-reviewer/assets/` (`meteoroid.jpg`, `ion_storm.jpg`,
`nebula_field.jpg`), marked `"accepted"` in `tools/art-reviewer/feedback.json`.
They have not been chroma-keyed or moved into the real `assets/` tree, and
`hazardConfig.ts`'s `placeholderTexture` fallback for `ionStorm`/
`nebulaField`/`meteoroid` and `BootScene`'s preload list are both still
unchanged — that's `asset-integration-agent.md`'s job (continuing the
existing Sourcing → Evaluation → Prep pipeline per its own doc), genuinely
separate follow-up work, not implied or started by this pass.

## Code update (2026-08-10) — resource display moved from screen-pinned HudOverlay to ship-relative ShipStatusArcs

Owner decision, implemented same day: the energy/structure bars in the
top-left `HudOverlay` panel (`ui/panel_frame_PLACEHOLDER.png`,
`ui/bar_energy_PLACEHOLDER.png`, `ui/bar_structure_PLACEHOLDER.png`) are
replaced by a new **`ShipStatusArcs`** class (`src/objects/ShipStatusArcs.ts`)
— a world-space, ship-relative readout: structure renders as a curved arc
above the ship, energy as a straight bar below it, both procedurally drawn
via `Phaser.GameObjects.Graphics` rather than sprites. `HudOverlay`
(`src/objects/HudOverlay.ts`) now owns only the off-screen objective-marker
arrow, unaffected by this change. `BootScene.ts`'s preload calls for the
three now-unused UI textures were removed. Verified in a headless-browser
run against the dev server (position/rotation tracking and depletion both
render correctly, no console errors) before being adopted as final.

**Not an art-sourcing gap** — this is a deliberate, decided style choice,
not a stand-in awaiting real art; no further HUD-bar sourcing is needed.
New tunables live in `src/config/shipStatusArcConfig.ts`, registered on
`window.tuning.shipStatusArc` (see `console-tuning-reference.md`).

**Follow-up done same day:** `panel_frame_PLACEHOLDER.png`,
`bar_energy_PLACEHOLDER.png`, `bar_structure_PLACEHOLDER.png` were
unreferenced by any code after this change, so — per the precedent set by
the 2026-08-01 "build-time caveat" fix (unused files under `assets/` still
ship into `dist/` via Vite's `publicDir`) — moved via `git mv` from
`assets/ui/` to `art-staging/ui-unused/` (gitignored, verified untracked
after the move; `git mv` initially force-added the destination despite the
ignore rule, corrected with `git rm --cached`). Same "reserved, easily
re-sourced if ever needed again" treatment as the tech-lab sheet in the
2026-08-01 entry below.

**Docs updated this pass:** `trailing_edge_gdd_draft_31.md` (source of
truth — §11.10 `HudOverlay` trimmed, new §11.10a `ShipStatusArcs` added,
§11.1's event comment, §12 Phase 1 plan step 5), `CLAUDE.md` (mirrors the
GDD edits), this STATUS.md entry, `trailing_edge_art_asset_list.md` (§1.6
UI/HUD rows), `phase1-manifest-and-tasks.md` (HUD extraction task note),
`art-production-guidelines.md` (dropped HUD bars/panel from the
legacy-placeholder list), `console-tuning-reference.md` (new
`window.tuning.shipStatusArc` section).

## Planning update (2026-08-08) — Nebula Field / Ion Storm art production approach scoped

**Decision only — nothing sourced yet.** Looking ahead from the Debris
Field work below, asked the same "what's the best way to generate this"
question for Nebula Field, and scoped the answer before generating
anything: since Ion Storm and Nebula Field are already established as "the
same visual family, motion is the only difference" (GDD §9), this is one
shared asset-production pass for both hazards, not two separate ones.

**Decided:** don't copy the Debris Field cluster approach — that pattern
(many small discrete fragments composed into one texture) exists because a
single rock has an implied real size and looks wrong stretched arbitrarily
large; a nebula is diffuse gas with no equivalent "correct" density, so a
single soft-edged, semi-transparent glow/wisp texture per variant,
stretched via `setDisplaySize()` like everything else, is the right base
case. What *does* carry over from debris: producing 2-3 distinct
silhouette variants (repetition-avoidance) and eventually varying rotation
per placed instance. What doesn't carry over: overlapping translucent
cloud instances accumulate alpha and can blotch at the overlap, unlike
opaque rocks which just occlude cleanly — composing a larger/irregular
field from multiple instances needs more care here than debris required.
Full reasoning in `docs/reference/art-production-guidelines.md`'s new
"Nebula Field / Ion Storm cloud art" section.

**Explicitly not resolved by this pass:** whether Ion Storm's motion
actually reads as distinct from Nebula Field's static cloud at normal play
speed is a separate, still-open question (GDD §9) — this was scoped as a
production-pipeline decision, not a look-and-feel one. The reserve fallback
options already on record (particle trail, border/outline treatment) would
most likely layer onto this shared texture set per-hazard rather than
require sourcing separate base art, but that's still to validate with a
real placeholder during the week 1–2 vertical slice, same as before.

## Art update (2026-08-07) — Debris Field sourced/final art, `circle` shape decided

Follow-up to the two entries below, same day: real art for Debris Field is
now in place, replacing `hazards/debris_large_PLACEHOLDER.png`.

Six AI-generated candidates (`debris_large_4` through `_9`, dropped in
`art-staging/` by the Art Director Agent/Gemini pipeline) were rated for
fit, weighing cluster-composition quality, differentiation from
`AsteroidField`'s single-large-ore-rock look, and how each would hold up
under the "several overlapping instances + per-instance rotation" plan for
irregular fields (`art-production-guidelines.md`'s "Variable-size/irregular
fields" section). `_9` and `_7` were picked as the two primary
"distinct textures" that section calls for, `_6` as an optional third
(picked despite being visually low-contrast against black space — a known
trade-off, not an oversight).

**Shape decision: `circle`, not `rectangle`.** All three sources came back
1408×768 (`_6` was already square). Went with `circle` anyway, over
squaring the source images to fit: Arcade circle bodies are
rotation-invariant, so the rotate-each-instance plan never causes the
visible sprite to drift out of sync with the (always axis-aligned)
collision area the way a rotated rectangle body would; sharing one shape
across all three variant textures also keeps Phase 2b's level-config
authoring simple regardless of which texture a given placement uses. Doing
this required center-cropping `_9`/`_7` down from their wide native aspect
to a square — **flagged, not silently done:** `tools/art-reviewer/
feedback.json` has earlier feedback on a prior debris candidate asking for
"a little more rectangular" shape, and the wide aspect on this batch of
candidates likely traces back to that ask. Surfaced this tension before
cropping; the call was made knowingly in favor of the rotation-consistency
argument, not missed.

**Processing:** each source went through `tools/asset-prep/
chroma-key-trim.js` (existing tool, already used for `asteroid_large`/
`wormhole`/etc.) for chroma-key removal + auto-trim, then a new
`tools/asset-prep/square-crop.js` (added this pass) for the center-crop to
square. Final files: `assets/hazards/debris_large.png` (656×656, from `_9`
— wired into `BootScene`/`GameScene`, replacing the placeholder),
`debris_large_alt2.png` (768×768, from `_7`), `debris_large_alt3.png`
(834×834, from `_6`) — the latter two sourced but not yet loaded/referenced
by any code, reserved for Phase 2b's multi-texture/rotation content work.
Verified in-browser (Playwright smoke check against the dev server): new
art renders with a clean transparent background (no green fringe), ship
gets blocked at the cluster's edge as expected, no console errors.

**Untouched:** `tools/art-reviewer/assets.json`/`feedback.json` already had
uncommitted local edits from an earlier, separate review pass (candidates
`debris_large_1/2/3`, all marked `needs_revision`) — left as-is, not part
of this pass's scope.

## Code update (2026-08-07) — Debris Field `blocksMovement` implemented

Follow-up to the design update below, same day: `HazardZoneElement` gained a
`blocksMovement?: boolean` param (`src/objects/HazardZoneElement.ts`). When
set, the zone's Arcade body is made immovable and wired via
`physics.add.collider()` instead of `physics.add.overlap()` — no resource-
cost callback fires at all, matching the "no `onHazardContact()` call for a
blocking hazard" hard rule in `CLAUDE.md`/GDD §11.3. `GameScene.ts`'s Debris
Field placement now sets `blocksMovement: true` with zero resource cost,
replacing the old `structure: 18` drain config. `docs/reference/
console-tuning-reference.md` and `.claude/agents/core-contract-agent.md`
updated to drop the now-stale "code hasn't caught up" notes. `tsc --noEmit`
passes; not yet playtested in-browser.

## Design update (2026-08-07) — Debris Field re-scoped: movement-blocking, not structure-draining; fiction changed

**Design decision, implemented in code the same day (see entry above).** Two
problems with Debris Field prompted this: (1) it felt mechanically redundant
with the
planned Nebula Field, since both read as "area that drains a resource" even
though they drain different resources; (2) the game's fiction doesn't
establish enough prior multi-civilization space travel to justify fields of
ship wreckage, which is what "debris field" implied.

**Decided:** keep the name "Debris Field" (no rename — avoids colliding with
the existing `AsteroidField` resupply object). Change the mechanic from
structure-drain to **movement-blocking, zero resource drain** — a new
`HazardZoneElement.blocksMovement: boolean` param, still one parameterized
hazard class per `CLAUDE.md`'s existing "don't build five hazard classes"
rule. Change the fiction from ship wreckage to **naturally-occurring rock/ice
debris**, which fits the setting and also gives Debris Field a legitimate
reason to visually resemble small loose fragments rather than salvage.

This makes Debris Field visually closer to the `AsteroidField` resupply
object than before (both now read as "rocks in space"), so
`docs/reference/art-production-guidelines.md`'s "Style consistency" section
was updated first with explicit differentiation guidance: Debris Field as a
**cluster of many small rock/ice fragments**, AsteroidField as **one single
large rock with visible metal ore** — many-small-and-avoided vs.
one-large-and-approached is the differentiator, not just color/palette.

**Side effect:** Meteoroid is now the *sole* structure-draining hazard
(previously Debris Field + Meteoroid), which sharpens rather than resolves
the existing open question about whether structure-vs-energy hazard stakes
read clearly in the current visual language (GDD §9).

**Docs updated this pass:** `trailing_edge_gdd_draft_31.md` (source of
truth — structure-resource description, §9 resolved/open items,
§11.3 `HazardZoneElement` contract, appendix reference table, Phase 1
dev-plan drift flag), `CLAUDE.md` (mirrors the GDD edits), this STATUS.md
entry, `trailing_edge_art_asset_list.md` (§1.2 Debris Field row, the
Debris-Field-vs-AsteroidField pairing-risk flag marked resolved via the art
guidelines, the structure-draining-hazards flag corrected to name Meteoroid
as sole member, and the §4 open-items list). `art-production-guidelines.md`
was updated in the prior turn, ahead of this pass.

**Implemented same day, see the "Code update" entry above.** This section
originally flagged `GameScene.ts` as still using the pre-re-scope
structure-drain config as known drift rather than silently-wrong behavior;
that follow-up work landed later on 2026-08-07 and the drift is resolved.

## Design update (2026-08-01, second playtest round) — Relay Beacon fixes + a real collision-radius bug

A second playtest pass, after the ship-size/starfield-layering fixes below,
surfaced two more Relay Beacon problems and, in tracking down the second
one, a genuine gameplay bug affecting four objects, not just the beacon:

1. **Relay Beacon looked squished.** Same root cause as the ship-size bug
   below, applied to `setDisplaySize()`: `RelayBeaconObject` forced a square
   display (`radius*2, radius*2`), but `relay_beacon.png` is 1124×656
   (~1.71:1). **Fixed** by giving `RelayBeaconConfig` explicit
   `displayWidth`/`displayHeight` (154×90 — also answers "a little bigger")
   instead of deriving both dimensions from one `radius`; the physics
   overlap radius stays independent (see bug below), so this was a
   visual-only change.
2. **Activating the beacon looked "oddly greenish."** `waypointTintConfig
   .activeTint` was `0x88ffcc` — Phaser's `setTint()` is *multiplicative*
   per channel, so a tint with a full green channel and reduced red/blue
   reads as a subtle glow on a near-monochrome placeholder icon but
   recolors a detailed, naturally-colored sprite's greys/silvers toward
   green wholesale. **Fixed** by changing `activeTint` to `0xffffff` (a
   no-op tint — the sprite's true colors); only `inactiveTint` actually
   recolors now. Affects `EntryWormhole`/`ExitWormhole` too, since all
   three share `waypointTintConfig` — improves them the same way, no
   complaint needed first.
3. **While debugging (2), found a real, unrelated bug:** reaching the Relay
   Beacon required near-pixel-perfect clicks — its actual collision area
   was only a few px across despite `radius: 45`. Root cause: Phaser's
   `Body#setCircle()`/`#setSize()` take the sprite's **native/unscaled**
   texture pixels, not display pixels, then multiply by the GameObject's
   current scale each frame. Passing an authored gameplay radius straight
   in (as every affected object did) only stays correct when native
   resolution ≈ display size — exactly the assumption the new AI-generated
   art (much higher native resolution than the old placeholders) broke.
   **Affected `ProbeObject`, `ResupplyPoint`, `ExitWormhole`, and
   `RelayBeaconObject`** (real collision radii of ~5-10px instead of the
   authored 40-60px) — `HazardZoneElement` wasn't currently broken (debris
   still uses old placeholder art at ~1:1 scale) but has the same latent
   bug, fixed proactively so it doesn't silently recur when that art is
   replaced too. **Fixed** with a new shared helper,
   `src/objects/arcadeBodyHelpers.ts`
   (`setCircleFromWorldRadius`/`setRectFromWorldSize`), applied at all five
   call sites. Verified by reaching the Probe and Relay Beacon with rough,
   imprecise clicks post-fix (previously needed many corrective micro-clicks
   to land inside the real hitbox).

## Design update (2026-08-01, playtest fixes) — two bugs only a real playtest caught

A first live playtest of the new AI-generated art (see the "7 assets
replaced" entry just below) surfaced two problems neither typecheck nor a
static screenshot had caught:

1. **Ship rendered far too large.** `PlayerShip` used `.setScale(0.5)`, a
   multiplier on the sprite's *native* pixel size — exactly the anti-pattern
   `CLAUDE.md`'s asset/gameplay-size decoupling rule warns against. The old
   placeholder was 99×75px; the new AI-generated art is 442×542px (~4.5x),
   so the same 0.5 scale produced a ship roughly 5x too big on screen.
   **Fixed** by switching to `setDisplaySize()` with new authored
   `shipConfig.displayWidth`/`displayHeight` fields (46×56, close to the old
   effective on-screen size), same pattern every other placed object
   already used.
2. **Only one starfield layer was visible.** `bg_stars_far.jpg`/
   `bg_stars_near.jpg` are fully opaque JPGs (no alpha channel), and
   `GameScene` stacks them as two `TileSprite`s for parallax — the near
   layer's solid black background completely hid the far layer beneath it.
   This was invisible in isolated review (each image looks fine alone) and
   only showed up once both were actually layered in a running scene.
   **Fixed in code**, not by regenerating the art: the near layer now uses
   `Phaser.BlendModes.ADD`, so its black pixels contribute nothing and only
   its stars add on top of the far layer.

See `art-production-guidelines.md` (File Format section) and
`trailing_edge_art_asset_list.md` §2.1/§1.1 for the fuller explanation of
each.

## Design update (2026-08-01, later same day) — 7 assets replaced with final AI-generated art

The project owner generated 7 new assets via the Art Director Agent/Gemini
pipeline and dropped them in `art-staging/` (per the workflow from the
"new art-prep workflow" entry just below): `ship_base`, `probe`,
`asteroid_large`, `wormhole`, `relay_beacon_idle` (all on chroma-key green
`#00FF00`, needing prep) and `bg_stars_far`/`bg_stars_near` (no green
screen, direct starfield backgrounds, no prep needed).

**New tool: `tools/asset-prep/chroma-key-trim.js`** — own `package.json`
(dependency: `jimp`), same isolated-from-root pattern as
`tools/art-reviewer/`. Chroma-keys on green dominance with a soft falloff
plus spill suppression (needed since these are JPGs — JPEG's lossy
compression blurs the green/subject edge, so a hard color cutoff left a
visible fringe on the first pass; tightened the falloff thresholds and
re-ran until clean), then auto-trims to content bounds plus a small padding
margin. Visually inspected all 5 outputs before moving them into `assets/`.

**Files replaced** (all final art, not more placeholders — dropped
`_PLACEHOLDER`; old files deleted, not kept):
- `ship/ship_base_PLACEHOLDER.png` → `ship/ship_base.png`
- `objectives/probe_PLACEHOLDER.png` → `objectives/probe.png`
- `objectives/wormhole_PLACEHOLDER.png` → `objectives/wormhole.png`
- `resupply/asteroid_large_PLACEHOLDER.png` → `resupply/asteroid_large.png`
  (medium/small variants unaffected, still OGA placeholders)
- `objectives/relay_beacon_idle_PLACEHOLDER.png` +
  `objectives/relay_beacon_reached_overlay_PLACEHOLDER.png` (both deleted)
  → single `objectives/relay_beacon.png`
- Procedurally generated starfield tiles (`StarfieldBackground.ts`) →
  `assets/backgrounds/bg_stars_far.jpg`/`bg_stars_near.jpg` (new category
  directory; kept as `.jpg`, no transparency needed for an opaque tile)

**Code changes alongside the asset swap:**
- `StarfieldBackground.ts` stripped to just its two exported texture-key
  constants — the procedural-generation function is gone now that real
  files exist. `BootScene.ts` loads the two new files directly instead.
- `RelayBeaconObject` collapsed to single-texture-plus-tint, matching
  `EntryWormhole`/`ExitWormhole`'s convention, since new Relay Beacon art
  meant only one file was needed going forward anyway (this was flagged as
  "under consideration" in `trailing_edge_art_asset_list.md` on 2026-08-01
  earlier the same day — implemented now).
- `wormholeConfig.ts` renamed to `waypointTintConfig.ts` (same rename
  reflected in `console-tuning-reference.md`'s `window.tuning` section) —
  motivated by `RelayBeaconObject` now sharing the same active/inactive
  tint language as the wormhole pair.

**Two carried-forward open items resolved as a side effect:** the Entry/
Exit Wormhole-vs-ship style mismatch and the Probe placeholder's
programmer-art quality (`phase1-manifest-and-tasks.md`) — both are gone now
that ship, wormhole, Relay Beacon, Probe, AsteroidField (large), and the
starfield all come from one consistent AI-generation pipeline instead of a
mix of Kenney/OpenGameArt packs and an owner-original placeholder.

`ATTRIBUTION.md` updated: these 6 assets moved out of the CC0-sourced table
(they're no longer third-party sprites at all) into "Owner-created assets,"
noting AI generation via Gemini — no new licensing concern, same as the
existing Probe entry before it was replaced.

## Design update (2026-08-01) — new art-prep workflow, build-time caveat resolved

Added `art-staging/` — a top-level directory (sibling of `assets/`, not
nested under it) where newly generated art lands before background
removal/cropping/naming, ahead of moving into its real home under
`assets/<category>/`. Gitignored, same as the existing `_source/`
convention. Full explanation in `phase1-manifest-and-tasks.md`.

While setting this up, resolved the long-standing build-time caveat (first
found 2026-07-29): `assets/ui/_source/` and the loose
`assets/warped_top_down_tech_lab_extension.png` both used to ship into
`dist/` via Vite's `publicDir`, despite being unused at runtime. Both moved
into `art-staging/` (`art-staging/ui-source/` and
`art-staging/warped_top_down_tech_lab_extension.png`) — verified
file-for-file identical before deleting the originals. The tech-lab sheet
was previously git-tracked and now isn't (everything under `art-staging/`
is gitignored); its `ATTRIBUTION.md` license record is unaffected, and the
pack is easily re-sourced from OpenGameArt if the file itself is ever
needed again.

## Design update (2026-07-31) — core loop split, no new sourcing needed

A core-loop change split the single `HomeMarker` object (launch position
**and** required return destination) into two distinct locations:
**`EntryWormhole`** (launch — starts tinted "active," closes shortly after
level start) and **`ExitWormhole`** (required return destination, a
separate spot on the map — starts tinted "inactive," opens once the Relay
Beacon is reached). See `docs/trailing_edge_gdd_draft_31.md` §11.14 and
`CLAUDE.md` for the full contract.

**No new asset sourcing required** — both objects reuse the same
placeholder sprite (the reassigned Star sprite from the 2026-07-29 update
below), distinguished purely by runtime tint (`wormholeConfig.activeTint` /
`inactiveTint`), same placeholder-reuse pattern as everything else in this
ledger.

File move made as part of this update (`git mv`, history preserved):

```
assets/objectives/home_marker_PLACEHOLDER.png → assets/objectives/wormhole_PLACEHOLDER.png
```

Also resolved this date: the off-screen-objective-visibility open question
(GDD §9, raised 2026-07-30) — a single edge-pinned directional arrow
(`HudOverlay`), not a minimap, since the core loop's objective sequence
(Probe → Relay Beacon → Exit Wormhole) is strictly linear. The arrow is a
**procedurally generated shape** (a Phaser-Graphics-drawn triangle baked to
a texture at runtime, same pattern as `StarfieldBackground`'s procedural
tiles) — no sourced art needed.

### Addendum (same day) — `_PLACEHOLDER` naming convention broadened

Separately, the project owner requested every currently-sourced Phase 1
asset actually wired into the game carry `_PLACEHOLDER` in its filename —
not just the two Agent 2 originally scored "Partial" (ship base, home
marker/wormhole) — so temporary/prototype art stays easy to distinguish
from finished art while new art gets generated. `phase1-manifest-and-tasks.md`
now owns the full redefined-convention explanation; this note just records
that the change happened and what moved (`git mv`, history preserved):

```
assets/hazards/debris_large.png              → assets/hazards/debris_large_PLACEHOLDER.png
assets/hazards/debris_medium.png             → assets/hazards/debris_medium_PLACEHOLDER.png
assets/hazards/debris_small.png              → assets/hazards/debris_small_PLACEHOLDER.png
assets/resupply/asteroid_large.png           → assets/resupply/asteroid_large_PLACEHOLDER.png
assets/resupply/asteroid_medium.png          → assets/resupply/asteroid_medium_PLACEHOLDER.png
assets/resupply/asteroid_small.png           → assets/resupply/asteroid_small_PLACEHOLDER.png
assets/objectives/relay_beacon_idle.png      → assets/objectives/relay_beacon_idle_PLACEHOLDER.png
assets/objectives/relay_beacon_reached_overlay.png → assets/objectives/relay_beacon_reached_overlay_PLACEHOLDER.png
assets/ui/panel_frame.png                    → assets/ui/panel_frame_PLACEHOLDER.png
assets/ui/bar_energy.png                     → assets/ui/bar_energy_PLACEHOLDER.png
assets/ui/bar_structure.png                  → assets/ui/bar_structure_PLACEHOLDER.png
```

`assets/ui/_source/` (raw, uncropped pack files) and the loose
`assets/warped_top_down_tech_lab_extension.png` (an uncropped Phase 2a
source sheet) were deliberately excluded — neither is an individually
loaded, in-use asset, so neither is "a placeholder" in this sense yet.

### Addendum (same day) — decorative background set pieces added

A new purely-decorative layer (no gameplay effect): a handful of large,
slow-parallax "set piece" images (a planet, a distant galaxy, ...) scattered
across each level to break up the tiled starfield's monotony, placement
seeded per level + session (`BackgroundSetPieces.ts`). **Completely
placeholder/procedural for now** — two Graphics-drawn textures (a shaded
circle, a colored dot-cloud), same throwaway-art approach as the starfield
tiles. No sourcing done yet; see `trailing_edge_art_asset_list.md` §2.1 for
the real-art requirement (a small roster of varied deep-space backdrops)
once ready to source.

## Design update (2026-07-29) — read this before trusting anything below

A GDD revision on this date changed Phase 1's scope and renamed/reassigned
several already-sourced assets. The prep narrative further down (and all of
`history/phase1-prep-log.md`) is an accurate *historical* record of what was
sourced and why — it just predates this rename. Current mapping:

- **"Relay Beacon" now means a new, mandatory, non-puzzle per-level
  waypoint** (find it after the probe, before you can return). The
  previously-sourced satellite asset (idle + glow-overlay states, originally
  built for the *old* Relay Beacon puzzle) has been **reassigned to this new
  waypoint** and moved to `assets/objectives/` — see below.
- **The old Relay Beacon puzzle element is renamed Signal Array** (still the
  same `SequenceSpotElement` mechanic — move to spots in a particular
  order). It is now **Phase 2a scope, not Phase 1**, and its asset need is
  now **unsourced again** — the satellite sprite went with the rename to
  the new waypoint, not with the puzzle.
- **Star is no longer a resupply object.** It's reassigned to `HomeMarker` —
  the level's launch/return position — moved to `assets/objectives/` and
  renamed `home_marker_PLACEHOLDER.png`. Energy now regenerates passively;
  there's no dedicated energy-resupply object at all.
- **AsteroidField (the "Resource Field" asteroids) is now the official
  Phase 1 resupply object** (structure repair only). These were sourced
  incidentally alongside Debris Field before this was official scope, filed
  under `hazards/` — moved to `assets/resupply/` to match.
- **The Probe had no sourced asset at all** when this revision landed — it
  was never listed as a requirement anywhere (a pre-existing gap this
  revision exposed). **Resolved same day:** the project owner added an
  original greyscale placeholder, `objectives/probe_PLACEHOLDER.png` — not
  sourced from a licensed pack, so no `ATTRIBUTION.md` entry needed, just
  the usual `_PLACEHOLDER` stand-in flag.

File moves made as part of this update (`git mv`, so history is preserved):

```
assets/resupply/star_PLACEHOLDER.png           → assets/objectives/home_marker_PLACEHOLDER.png
assets/puzzle/relay_beacon_idle.png            → assets/objectives/relay_beacon_idle.png
assets/puzzle/relay_beacon_active_overlay.png  → assets/objectives/relay_beacon_reached_overlay.png
assets/hazards/asteroid_{large,medium,small}.png → assets/resupply/asteroid_{large,medium,small}.png
```

`assets/puzzle/` is now empty (Signal Array, its only occupant, is unsourced
again) — left in place rather than deleted, since Phase 2a will need it.

## What's done

- **Sourcing + Evaluation (Agents 1+2), full pass:** every category in
  `trailing_edge_art_asset_list.md` has been searched at least once. Coverage
  matrix and license flags recorded in the run log.
- **Original scope narrowing (owner decision, since superseded above):** one
  hazard (Debris Field), one resupply point (Star), one puzzle element
  (Relay Beacon), ship, minimal HUD. This was Phase 1 **as of 2026-07-25** —
  see the design update above for the current, correct scope.
- **Five source files downloaded and moved into the project directory**
  (`assets/`): Space Shooter Remastered, Simple Space, UI Pack - Sci-Fi
  (downloaded under the filename `kenney_ui-pack-space-expansion.zip` —
  confirmed by owner to be the same pack listed on the Kenney site as
  "UI Pack - Sci-Fi"), Asteroids/Debris Set (`Objects.zip`), Warped Top-Down
  Tech Lab Extension — all CC0.
- **Attribution ledger written** (`ATTRIBUTION.md`) — covers the CC0 Phase-1
  set (no attribution legally required) and flags two deferred CC-BY /
  CC-BY-SA items for later phases, including a bundled-license correction
  found in one OGA item's comment history.
- **Manifest + task list written** (`phase1-manifest-and-tasks.md`) —
  directory convention mapped to GDD §11.7, per-file extraction steps,
  placeholder-naming rule. Updated 2026-07-29 for the new directory/scope
  changes above.
- **Owner decisions locked in:** overlay VFX for ship damage states;
  CC-BY-SA accepted since this build won't be redistributed.
- **Directory structure created** under `assets/`: `ship/`, `hazards/`,
  `resupply/`, `ui/` (+ `ui/_source/`), plus `objectives/` (new, added
  2026-07-29 for Probe/Relay Beacon/Home Marker — see design update above).
  `puzzle/` still exists but is currently empty.
- **Extraction done, historically, for what was Phase 1's five items as of
  2026-07-25** (roles reassigned since — see design update above):
  - **Ship** — `ship/ship_base_PLACEHOLDER.png` (Space Shooter Remastered,
    blue variant) and `ship/ship_damage_overlay_PLACEHOLDER.png` (20-frame
    strip composited from the pack's `fire00–19` effect frames). Unaffected
    by the design update.
  - **Debris Field + Resource Field** — `hazards/debris_{large,medium,small}.png`
    (unaffected — still the Debris Field hazard) and, now moved,
    `resupply/asteroid_{large,medium,small}.png` (the AsteroidField resupply
    object, per the design update above). **Correction to the manifest's
    original expectation:** the actual pack has 1 variant per size (6 files
    total), not 3 variants × 3 sizes (18 files) as the README description
    implied — owner confirmed proceeding with the 6 real files.
  - **Home Marker (was: Star resupply point)** —
    `objectives/home_marker_PLACEHOLDER.png`, cropped from
    `simpleSpace_sheet.png` using the exact rect in its companion `.xml`
    (`star_large`, 48×48). No longer a resupply object — see design update.
  - **HUD** — `ui/bar_energy.png` (Blue), `ui/bar_structure.png` (Grey),
    `ui/panel_frame.png`, all from the UI Pack; full pack staged uncropped in
    `ui/_source/` per the manifest's deferred-icons note. Unaffected by the
    design update.
- **Home Marker/ship style-mismatch flag resolved (for now):** confirmed real
  (flat pale Simple Space star next to shaded Space Shooter Remastered ship
  clash visibly) — owner decision: keep as placeholder as-is, revisit later.
  (Originally flagged when this asset was still the Star resupply point;
  same visual, same call, new role.)
- **Relay Beacon (waypoint) — sourced, reassigned from the old puzzle
  element.** The original candidate (a tile on
  `warped_top_down_tech_lab_extension.png`, OGA-listed as "Beacon
  (animated)") never panned out: manual tile-grid measurement found three
  repeated icon candidates (glass pod, ring/torch marker, shield), none of
  which convincingly matched an animated beacon — see
  `history/phase1-prep-log.md` for the full trail. Owner authorized broadening the visual concept to "a
  standard orbital satellite," which turned this back into a sourcing
  problem. Re-ran sourcing + evaluation targeting CC0 2D satellite sprites;
  found Kenney's **Space Shooter Extension** pack (OpenGameArt mirror,
  CC0, individual PNG files, same author/style family as the already-used
  ship sprite — better on license, format, *and* style consistency than the
  tech-lab candidates). Extracted `objectives/relay_beacon_idle.png`
  (`spaceStation_021.png`, unmodified) and
  `objectives/relay_beacon_reached_overlay.png` (a procedurally generated
  glow, not sourced — no license implication), following the same
  overlay-VFX pattern already used for ship damage. **2026-07-29 update:**
  this asset was originally sourced for the sequence-puzzle element (idle/
  active states per spot, multiple instances) — it has since been reassigned
  to the new mandatory Relay Beacon waypoint (a single simple arrival
  marker), per owner decision. The renamed puzzle element (Signal Array,
  Phase 2a) is unsourced again as a result. The tech-lab pack's CC0 entry
  was kept (retitled to Cargo Pod/Wreckage) since it's still that item's
  intended Phase 2a source — unaffected by any of the above.

Phase 1 is now **file-complete again** — every required object (Debris
Field, AsteroidField, Probe, Relay Beacon waypoint, Home Marker, ship, HUD)
has at least a placeholder in `assets/`. The Probe placeholder
(`objectives/probe_PLACEHOLDER.png`) is an owner-original greyscale image,
not sourced from a licensed pack — see the design-update note above.

## What's NOT done

1. **Signal Array** (the renamed sequence-puzzle element, formerly named
   Relay Beacon) — unsourced. Its previously-sourced satellite asset moved
   to the new Relay Beacon waypoint instead (see design update above). Phase
   2a scope, not urgent, but don't assume it's already covered.
2. **Cargo Pod/Wreckage prep** — sourced already (same sheet originally
   eyed for the old Relay Beacon puzzle), but out of Phase 1 scope; crop
   when Phase 2a starts.
3. **Probe placeholder is greyscale/programmer-art**, not a licensed-pack
   sourced sprite like the rest of Phase 1's assets — fine as a stand-in,
   but worth a real sourcing pass (or a proper owner-authored replacement)
   before treating Phase 1 art as final, same caveat as the other
   `_PLACEHOLDER` assets.

## Explicitly out of scope right now (Phase 2a/2b — don't start early)

- Comet vs. Meteoroid visual distinction (Meteoroid itself now has a
  candidate sprite, per the 2026-08-19 entry above — Comet does not, and
  the two-object distinction question is unaddressed by that pass)
- Ion Storm / Nebula Field — production *approach* decided 2026-08-08 (see
  entry below); as of 2026-08-19, candidate sprites for both now exist
  (`tools/art-reviewer/assets/ion_storm.jpg`, `nebula_field.jpg`, both
  `"accepted"`) but were deliberately generated as independent designs for
  that one GER-loop exercise rather than via the shared-pass approach
  decided here, and neither is integrated into the real `assets/` tree yet
  — see the 2026-08-19 entry above before assuming this line is resolved.
  The motion-vs-static differentiation question itself is still open, and
  Ion Storm/Nebula Field still need to read as lower-stakes than the
  structure-draining hazard family, per the 2026-07-29 GDD revision (§9) —
  Meteoroid is now the *sole* member of that family as of the 2026-08-07
  Debris Field re-scope, see above
- Beacon Cluster (still no named match anywhere)
- Signal Array (sequence puzzle, formerly named Relay Beacon) — see "What's
  NOT done" above
- Cargo Pod/Wreckage prep (sourced already, incidentally, but not extracted)

## If you rerun this exercise from scratch

Start at `README.md`, run Agents 1+2 per-category (not one big query), narrow
to whatever phase/scope you're targeting before invoking Agent 3. Note:
whether Agent 3 can reach both the Downloads folder and the project directory
to move/extract files itself depends on the tool's filesystem access in that
session — in this run it could do both, but don't assume that's guaranteed.
