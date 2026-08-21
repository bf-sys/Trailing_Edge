# Art Evaluation Log — 2026-08-19

## meteoroid (round 1) — VERDICT: pass

**Candidate:** `tools/art-reviewer/assets/meteoroid.jpg` (1408x768)
**Prompt (from `tools/art-reviewer/assets.json`):** "Isolated single sprite
of a top-down 2D pixel art jagged mineral meteoroid rock chunk hurtling
through space, angular fractured silhouette with glowing molten orange-red
cracks and ember trail streaks signaling danger and motion, distinct from a
smooth asteroid or an icy comet, gritty dark sci-fi, 32-bit, NO environment,
NO scene, on a solid bright chroma-key green (#00FF00) background, no
shading on the background."

**Round 0 check:** `grep`'d `docs/history/art-eval-log-*.md` for `meteoroid`
before this run — no prior log files existed at all (`docs/history/` had no
`art-eval-log-*.md` entries). Confirmed round 1, not a circuit-breaker case.

### Technique: 8/10
- Crisp pixel-grid edges with a consistent black outline treatment on the
  rock silhouette, matching the outlining convention already used in
  `asteroid_large.jpg` and `debris_large.jpg`.
- Limited, coherent palette per region: dark grey/black faceted rock faces,
  a glowing orange-red crack network, and an orange/red ember trail — no
  smooth photographic gradient standing in for shading anywhere on the rock
  body itself.
- Reads clearly as an angular, fractured rock chunk trailing embers even
  imagined downscaled to ~48-64px — the jagged silhouette and diagonal
  motion-trail composition survive small in-game display size.
- No baked-in text, watermark, or UI chrome from the generation model.
- Deduction: the ember/flame trail at the tail end is noticeably softer and
  more painterly-blended than the crisply-faceted rock body — it reads more
  like a rendered VFX glow than hard pixel-grid streak work. The rock body
  alone is close to indistinguishable in technique from the two precedent
  assets; the trail is the one area pulling this below a 9.

### Style: 8/10
- Muted, desaturated dark grey/black/brown rock palette is consistent with
  both comparison assets: `asteroid_large.jpg` (grey/brown rock with
  silver-ore highlights) and `debris_large.jpg` (rusted dark grey/brown
  wreckage) — same industrial, muted-metallic family, no bright/cartoon
  colors anywhere on the rock itself.
- High-contrast, harsh lighting via the molten orange-red crack network and
  ember trail reads as genuinely dangerous/utilitarian, consistent with the
  project's established "high-contrast lighting from thrusters" language
  (`ship_base` prompt) rather than decorative.
- No genre-breaking elements — no primary-color accents, no cute/cartoon
  proportions, no fantasy motifs; silhouette is worn/jagged/functional, not
  sleek.
- Precedent comparison: palette family (dark grey/brown/black) matches
  `asteroid_large.jpg`/`debris_large.jpg` closely. The one genuine departure
  from precedent is the saturated orange-red glow — both comparison assets
  use white/silver highlights, not a colored internal glow. This reads as
  intentional per the prompt's explicit "molten," "danger," and
  "distinct from a smooth asteroid" language, not an error, but it is a new
  palette element for this asset family and is named here rather than
  silently absorbed into the score.

### Format: 8/10
- Deterministic check ran successfully via `jimp` (`tools/asset-prep/node_modules/jimp`,
  script executed from `tools/asset-prep/` so `require('jimp')` resolved;
  `Jimp.read` succeeded on the 1408x768 JPEG).
- Sampled 8 patches (5x5-pixel averages each) at all four corners and all
  four edge midpoints, each well clear of the subject. Results (avg RGB,
  distance from target `(0,255,0)`):
  - topLeft: (5.0, 245.6, 2.3) — dist 10.9
  - topMid: (6.8, 246.3, 5.7) — dist 12.4
  - topRight: (9.6, 241.5, 6.3) — dist 17.7
  - leftMid: (8.3, 244.1, 3.2) — dist 14.1
  - rightMid: (9.8, 241.3, 6.7) — dist 18.1
  - bottomLeft: (8.1, 242.6, 6.6) — dist 16.2
  - bottomMid: (9.1, 242.8, 6.9) — dist 16.7
  - bottomRight: (13.4, 237.9, 9.6) — dist 23.8
- All 8 patches fall within the ~25-30-unit compliant-deviation band; no
  single patch's per-channel deviation from pure green exceeds ~14 units.
- Patch-to-patch variance is real but modest, and directional rather than
  random noise: top-left is closest to pure green (dist 10.9) and
  bottom-right is the furthest outlier (dist 23.8) — a gentle diagonal
  trend (R climbs ~5 -> ~13, B climbs ~2 -> ~10, G drops ~246 -> ~238 moving
  top-left to bottom-right), consistent with a very slight, likely
  JPEG-compression-scale gradient rather than the sharp cross-frame
  disagreement the "not flat" failure case looks like (this candidate's
  spread is on the order of 8-13 units per channel across the whole frame,
  not tens of units concentrated at one edge). Flagged as a minor,
  non-blocking deduction rather than a fail.
- Visual check (`Read`): no visible green fringing at the rock or ember
  edges, no partial environment/scene bleeding in at the frame edges, and
  the subject has no green surfaces of its own that would risk mis-keying.

### Fix list (optional polish, not required for pass — no dimension scored below 7)
- Technique: if a future round wants to push this to 9-10, sharpen the
  ember trail's edge treatment to match the rock body's harder pixel-grid
  faceting rather than its current softer/blended glow.
- Format: if a future round wants to tighten this further, regenerate
  emphasizing a perfectly uniform flat `#00FF00` fill with zero falloff
  toward the bottom-right corner specifically — current bottom-right patch
  (13.4, 237.9, 9.6) is the single furthest-from-pure-green sample of the
  8, and the top-left-to-bottom-right trend suggests a faint directional
  vignette worth eliminating at the source rather than just tolerating.

No comparison paragraph — this was a single-candidate batch, not a
multi-candidate round.

## ion_storm (round 1) — VERDICT: pass

**Candidate:** `tools/art-reviewer/assets/ion_storm.jpg` (1408x768)
**Prompt (from `tools/art-reviewer/assets.json`):** "Isolated single sprite
of a top-down 2D pixel art ion storm hazard, a dense dark electromagnetic
storm cloud mass crackling with arcing jagged blue-white electrical energy
and lightning bolts within and around its silhouette, energetic and
dangerous, visually distinct from a soft diffuse nebula cloud, fully opaque
solid-shaded pixel art with no transparency or see-through areas, gritty
dark sci-fi, 32-bit, NO environment, NO scene, on a solid bright chroma-key
green (#00FF00) background, no shading on the background."

**Round 0 check:** `grep`'d `ion_storm` across `docs/history/art-eval-log-*.md`
before this run — only `docs/history/art-eval-log-2026-08-19.md` exists at
all, and it had no prior `ion_storm` entry. Confirmed round 1, not a
circuit-breaker case.

### Technique: 7/10
- Crisp, consistent black-outlined silhouette overall, and the lightning
  bolts themselves are rendered with genuinely hard pixel-grid edges (sharp
  jagged branching, no anti-aliased blur) — this part reads as strong,
  deliberate pixel art.
- Deduction: the cloud body's internal swirl shading uses closely-blended,
  continuous-tone grey/blue-grey transitions rather than the discrete
  palette-banding a limited-palette pixel-art cloud would use — it reads
  closer to soft airbrushed/painterly shading in the swirl interior than
  the harder-edged treatment on the lightning and outer silhouette. This is
  a milder, more widespread version of the same issue flagged on
  `meteoroid.jpg`'s ember trail (round 1, above) — there it was confined to
  one accent element; here it runs through the whole cloud body, which is
  most of the sprite's visible area.
- Readability check: at an imagined ~48-64px downscale, the overall round
  storm-cloud silhouette with lightning branches escaping past its edges
  still reads clearly as "storm," and the lightning's high local contrast
  should survive scaling even if the interior swirl shading softens/muddies
  further at that size — the silhouette-level read holds up better than the
  interior-shading fidelity would suggest on its own.
- No baked-in text, watermark, or UI chrome from the generation model.

### Style: 8/10
- Muted, desaturated dark navy/grey/black cloud palette accented by
  white/pale-blue lightning is consistent with a harsh, utilitarian,
  high-contrast-lighting reading — no bright/saturated cartoon colors, no
  cute/friendly proportions, no fantasy motifs.
- Precedent comparison against `meteoroid.jpg` (accepted, same hazard-art
  family): both share the same core formula — a muted/dark desaturated body
  (meteoroid: grey/black rock; ion storm: dark navy/grey cloud) plus a
  single saturated high-contrast accent color signaling danger (meteoroid:
  molten orange-red; ion storm: white/blue electrical arcs) against a
  common black outline convention. Palette *family* differs (blue/white
  electrical vs. orange/red molten) but that's the correct differentiator
  for two distinct hazard identities, not drift — the shared muted-base +
  hot-accent structure is what actually needs to hold across the family,
  and it does.
- No genre-breaking elements; the electromagnetic-storm concept and its
  execution stay within gritty dark sci-fi rather than reading as a
  generic weather/fantasy-storm cloud.
- Minor deduction relative to precedent: the lightning's pale blue-white is
  a cooler, slightly more "clean-tech" accent than meteoroid's molten
  orange-red or the ship's thruster-glow language elsewhere in the asset
  set — not a genre break, but a small departure worth naming rather than
  silently absorbing into the score.

### Format: 9/10
- Deterministic check ran successfully via `jimp` (`tools/asset-prep/node_modules/jimp`,
  script executed from `tools/asset-prep/` so `require('jimp')` resolved;
  `Jimp.read` succeeded on the 1408x768 JPEG).
- Sampled 8 patches (5x5-pixel averages each) at all four corners and all
  four edge midpoints, each well clear of the subject. Results (avg RGB,
  distance from target `(0,255,0)`):
  - topLeft: (5.7, 247.9, 3.4) — dist 9.7
  - topMid: (5.4, 248.3, 3.8) — dist 9.4
  - topRight: (7.5, 244.7, 3.9) — dist 13.3
  - leftMid: (7.2, 247.1, 2.4) — dist 10.9
  - rightMid: (9.6, 244.2, 4.6) — dist 15.2
  - bottomLeft: (7.4, 245.4, 2.8) — dist 12.5
  - bottomMid: (7.6, 246.5, 3.8) — dist 12.0
  - bottomRight: (9.9, 243.4, 6.2) — dist 16.4
- All 8 patches fall well inside the ~25-30-unit compliant-deviation band —
  no single patch's per-channel deviation from pure green exceeds ~10
  units, and every patch's total distance is under 17.
- Patch-to-patch variance is small and directional rather than sharply
  disagreeing: top-left/top-mid are closest to pure green (dist ~9.4-9.7)
  and bottom-right/right-mid are the furthest (dist ~15.2-16.4), a gentle
  diagonal trend of roughly 6-7 units total spread across the whole frame.
  This is tighter than `meteoroid.jpg`'s round-1 check (dist range
  10.9-23.8, ~13-unit spread) on the same background-fill task, and reads
  as ordinary JPEG-compression-scale noise plus a very faint vignette, not
  a real gradient/lighting-falloff defect — background counts as flat and
  on-spec.
- Visual check (`Read`): no visible green fringing at the cloud or
  lightning edges, no partial environment/scene bleeding in at the frame
  edges. The subject has no green surfaces of its own (dark navy/grey/black
  cloud body, white/pale-blue lightning) that would risk mis-keying — no
  green-vs-background tension to flag here, unlike a subject whose own
  design might call for green.

No fix list — all three dimensions scored at or above the pass threshold
of 7 (Technique 7, Style 8, Format 9).

### Extra note (context for the upcoming Nebula Field round, not scored,
does not affect the verdict above): this candidate reads clearly as an
"electrical storm" rather than a generic cloud. The white/pale-blue
lightning bolts branch both across the cloud's interior swirl and past its
outer silhouette edge, giving it a distinct jagged/energetic accent
language a soft diffuse nebula (per the prompt's own "visually distinct
from a soft diffuse nebula cloud" instruction and
`art-production-guidelines.md`'s planned "soft-edged, semi-transparent
glow/wisp texture" brief for Nebula Field) shouldn't share. The one thing
worth flagging for that later comparison: this candidate's cloud body is
**fully opaque and fairly dense/dark** with hard black silhouette edges —
if Nebula Field's eventual candidate leans into the "soft-edged,
semi-transparent" language from the production guidelines, that opacity/
edge-hardness difference alone (independent of the lightning) may end up
doing a lot of the differentiation work, which is worth checking for
explicitly once that candidate exists rather than relying on motion alone
per GDD §9's still-open question.

### Comparison paragraph
Not applicable — single-candidate batch, not a multi-candidate round. (A
comparison against `meteoroid.jpg` was made throughout the Style and Format
sections above as the requested precedent check, not as a competing
candidate in this same round.)

## nebula_field (round 1) — VERDICT: flagged

**Candidate:** `tools/art-reviewer/assets/nebula_field.jpg` (1408x768)
**Prompt (from `tools/art-reviewer/assets.json`):** "Isolated single sprite
of a top-down 2D pixel art nebula field hazard, a soft diffuse gaseous cloud
of drifting purple, magenta, and violet space gas with a gently rounded,
wispy irregular silhouette and soft internal shading bands suggesting
billowing gas density, calm and static-feeling with no lightning, no
electrical arcs, and no hard jagged edges, visually distinct from a dense
hard-edged electromagnetic storm cloud, fully opaque solid-shaded pixel art
with no transparency or see-through areas, gritty dark sci-fi, 32-bit, NO
environment, NO scene, on a solid bright chroma-key green (#00FF00)
background, no shading on the background."

**Round 0 check:** `grep`'d `nebula_field` across `docs/history/art-eval-log-*.md`
before this run — only `docs/history/art-eval-log-2026-08-19.md` exists at
all (it already had `meteoroid` and `ion_storm` round-1 entries, added
earlier today, above), and it had no prior `nebula_field` entry. Confirmed
round 1, not a circuit-breaker case.

### Technique: 7/10
- Clear pixel-grid stepping is visible along the cloud's rounded, lumpy
  silhouette (jagged/blocky boundary at close inspection, consistent with a
  genuine pixel-scale image rather than a raw photographic render), and the
  overall wispy-lumped shape reads recognizably as a gas cloud even imagined
  downscaled to ~48-64px, though it's a fairly plain single-lobe blob
  compared to `ion_storm.jpg`'s more structurally distinctive swirl.
- Internal shading is genuinely banded rather than one smooth photographic
  gradient: a fine-grained pixel sample transect (`jimp`, y=400, x=64→220,
  1408px-wide image) shows discrete color steps moving into the cloud body
  — (112,52,151) → (129,56,159) → (143,62,162) → (153,64,167) — flat runs of
  several pixels each rather than a per-pixel blend, i.e. real limited-
  palette banding, not an airbrushed gradient standing in for shading.
- The outer edge treatment is the main deduction. Rather than the crisp
  black outline convention shared by `meteoroid.jpg`, `ion_storm.jpg`,
  `debris_large.jpg`, and `asteroid_large.jpg`, this candidate uses a
  two-step grey/blue-grey halo band between the green background and the
  purple body — same transect: pure green through x=21 (13,243,8), a ~2px
  greenish anti-aliased blend at x=22-23 ((51,220,51), (24,193,24)), then
  two flat grey-blue bands at x=24-47 ((70-83,115-122,85-101)) and x=48-63
  ((92,100,114)) before the purple body starts at x=64. This is executed as
  discrete quantized bands (not a wide photographic blur — the whole
  transition from pure green to full purple body spans only ~43px of a
  1408px-wide image), so it doesn't read as unprocessed-photo/painterly
  technique failure, but it is a genuine, checkable deviation from the
  house black-outline convention the rest of the accepted hazard family
  shares.
- No baked-in text, watermark, or UI chrome from the generation model.

### Style: 6/10 — below the pass threshold
- Precedent comparison against `meteoroid.jpg` and `ion_storm.jpg` (both
  accepted, same hazard-art family): both precedent assets share a "muted/
  desaturated industrial base + one saturated hot accent" structure —
  meteoroid is a muted grey/black rock body with a molten orange-red crack/
  ember *accent*; ion_storm is a muted dark navy/grey/black cloud *body*
  with white/pale-blue lightning as the accent. In both cases the saturated
  color is confined to a minority accent element, not the sprite's dominant
  mass.
- `nebula_field` breaks that structure: the saturated purple/magenta *is*
  the entire body, with no muted/desaturated industrial anchor tone
  anywhere in the silhouette. Pixel-sampled via `jimp`: interior core points
  average ~(171,67,174) (e.g. (700,380), (750,300), (850,280) all land
  within a few units of this), and the darker "shadow" band near the edges
  samples ~(113,53,152)-(153,64,167) per the Technique transect above —
  both ranges are moderately-to-highly saturated jewel-tone purple/magenta
  (saturation ≈ 0.6 by HSV at the core sample), not a muted/grayed-down
  tone. There is no point sampled anywhere in the cloud's visible mass that
  reads as "muted industrial metallics, rust, dark blues/greys."
- This isn't a genre-breaking failure in the 1-3 sense — purple/magenta gas
  is a thematically reasonable read for a nebula (real astronomical nebulae
  skew this palette), there are no cartoon proportions, no fantasy motifs,
  and no primary-color accents unrelated to the subject — and the silhouette
  itself is appropriately soft/calm per the prompt's explicit "calm and
  static-feeling... no hard jagged edges" language, correctly differentiated
  from Ion Storm's harsher shape. But on the specific, scored "palette-
  consistent with existing accepted assets" and "muted, desaturated,
  industrial palette... not bright, saturated... colors" criteria, this
  candidate is a clear, measurable outlier against both direct precedent
  comparisons available in this asset family — the whole sprite sits closer
  to a vivid jewel-tone than anything else accepted so far.

### Format: 8/10
- Deterministic check ran successfully via `jimp` (`tools/asset-prep/node_modules/jimp`,
  script executed from `tools/asset-prep/` so `require('jimp')` resolved;
  `Jimp.read` succeeded on the 1408x768 JPEG).
- Sampled 8 patches (5x5-pixel averages each) at all four corners and all
  four edge midpoints, each well clear of the subject. Results (avg RGB,
  distance from target `(0,255,0)`):
  - topLeft: (5.0, 244.3, 3.5) — dist 12.4
  - topMid: (3.4, 246.0, 4.4) — dist 10.6
  - topRight: (5.4, 243.2, 3.6) — dist 13.5
  - leftMid: (6.7, 246.6, 2.2) — dist 10.9
  - rightMid: (7.1, 246.3, 3.8) — dist 11.9
  - bottomLeft: (6.2, 244.5, 4.4) — dist 12.9
  - bottomMid: (4.5, 244.6, 4.4) — dist 12.1
  - bottomRight: (5.9, 243.8, 6.3) — dist 14.2
- All 8 patches fall well inside the ~25-30-unit compliant-deviation band —
  no single patch's per-channel deviation from pure green exceeds ~7 units,
  and every patch's total distance is between 10.6 and 14.2. This is the
  tightest, most uniform corner-patch spread of the three hazard candidates
  evaluated today (spread of only ~3.6 dist units, vs. ion_storm's ~7-unit
  spread and meteoroid's ~13-unit spread) — no directional gradient/vignette
  signal at all; background counts as flat and on-spec by this check.
- Edge-fringing check (finer-grained than the corner patches, since
  fringing happens at the subject boundary, not in open background): a
  1px-step transect across the cloud's left edge at y=400 (see Technique
  above) found pure green through x=21, then a genuine ~2px greenish
  anti-aliased blend band at x=22-23 — (51,220,51) and (24,193,24), both
  still closer to background-green than to the grey halo that follows —
  before settling into the flat grey-blue halo bands and then the purple
  body. This is real, measurable green fringing, though narrow (~2px in a
  1408px-wide image) and confined to a single sampled location; visual
  inspection (`Read`) elsewhere along the silhouette didn't show an obvious
  wide/inconsistent fringe, but this wasn't transect-sampled at every point
  around the boundary, so treat "narrow and localized" as the finding, not
  "absent."
- No partial environment/scene bleeding in at the frame edges. The subject
  itself has no green surfaces (purple/magenta/violet body, grey-blue halo)
  that would risk being incorrectly keyed out — no green-on-subject tension
  to flag here.
- Net: background fill itself is excellent (best of the three candidates
  evaluated today), but the confirmed narrow green fringe at the sampled
  edge point is a real, checkable defect worth a deduction — "solid and
  close to #00FF00, minor fringing... at one edge" per the 7-8 tier of the
  rubric.

### Fix list (Style is the only dimension below 7 — this is the required
fix; Technique/Format notes below are optional polish, included since both
carry genuine, checkable findings worth acting on if the Refine stage is
touching this file anyway)
- **Style (required):** Regenerate with a desaturated, dark-violet/charcoal-
  grey anchor tone covering most of the cloud's visible mass, reserving the
  more saturated magenta/purple (current core sample ~(171,67,174)) for a
  smaller highlight/core region rather than the whole silhouette — mirror
  the "muted body + saturated accent" structure `meteoroid.jpg` (muted rock
  + molten-orange accent) and `ion_storm.jpg` (muted cloud + electric-blue
  accent) both use, so this candidate's overall value/saturation profile
  sits in the same family as the two already-accepted hazards it needs to
  read alongside.
- **Technique (optional):** if a future round wants to push this toward 8-9,
  replace the current two-step grey/blue-grey halo band (sampled
  (70-83,115-122,85-101) then (92,100,114), see transect above) with the
  same crisp black outline convention used on `meteoroid.jpg`/
  `ion_storm.jpg`/`debris_large.jpg`/`asteroid_large.jpg`, for consistency
  with the rest of the accepted hazard family's edge treatment.
- **Format (optional):** if a future round wants to close the narrow
  fringing gap, regenerate emphasizing a fully solid cutout with zero
  anti-aliased blend pixels between the green background and the subject's
  outer edge — the ~2px greenish blend band sampled at x=22-23 (y=400) is
  the concrete defect to eliminate; a harder-edged outline treatment (see
  the Technique note above) would likely also incidentally tighten this,
  since a solid black outline pixel is much less likely to blend toward
  green than the current soft grey-blue halo's edge pixels are.

### Extra note — direct side-by-side comparison against `ion_storm.jpg`
(context only, not scored, does not affect the Technique/Style/Format
scores or the verdict above): viewed together, `nebula_field.jpg` and
`ion_storm.jpg` read as clearly distinct hazard identities, not a recolor
of a shared texture — multiple independent cues differ, not just one:
- **Color family:** nebula is purple/magenta/violet throughout; ion storm is
  dark navy/grey/black with white/pale-blue accents. This is the single
  strongest, most immediate at-a-glance differentiator between the two, and
  it's a hue-family difference (warm-cool-neutral axis aside, purple vs.
  blue-grey), not just a brightness/saturation difference — should still
  read distinctly to most colorblind viewers, unlike a same-hue,
  different-brightness pair would.
- **Silhouette/internal energy:** ion storm has jagged lightning bolts
  branching both through its interior swirl and past its outer edge,
  giving it a visibly energetic, "crackling" read. Nebula field has no
  internal linework at all — just soft rounded lobes and internal shading
  bands, correctly matching the prompt's explicit "calm and static-feeling
  ... no lightning, no electrical arcs" brief. This silhouette-level
  difference would likely still read even if desaturated to greyscale,
  which the color difference alone would not.
- **Edge treatment:** ion storm uses a hard black outline; nebula field uses
  the softer grey-blue halo band described in the Technique/Format sections
  above. This wasn't a deliberate differentiation choice on nebula's part —
  it's flagged above as a Technique deviation from house convention — but
  it happens to reinforce the "harsher/denser" vs. "softer/diffuse"
  distinction the two hazards' prompts were written to create.
- Given three independent cues (color, internal linework/energy, edge
  softness) all point the same direction rather than one doing all the
  work, this candidate pairing looks like it resolves GDD §9's still-open
  Ion Storm/Nebula Field distinctness question favorably, at least for this
  specific pair of independently-generated sprites — a stronger outcome
  than the shared-texture-family approach the project's docs originally
  called for was expected to produce on its own (see
  `art-production-guidelines.md`'s "one shared texture family" section,
  which flagged differentiation as still needing validation). That said,
  this is a static side-by-side image comparison, not an in-engine
  playtest at true on-screen size/distance/lighting — the GDD's own
  validation bar ("validate with a real placeholder asset during the
  vertical slice rather than deciding on paper") isn't fully met by this
  note alone, and should still happen once both are integrated.

### Comparison paragraph
Not applicable in the "competing candidates from the same Generate round"
sense — this was a single-candidate round for `nebula_field`, not a batch.
(A full precedent comparison against both `meteoroid.jpg` and
`ion_storm.jpg` was made throughout the Style section above per this
round's specific request, and the requested `ion_storm.jpg` side-by-side
identity-distinctness note is above as a separate, unscored section.)

## nebula_field (round 2) — VERDICT: pass

**Candidate:** `tools/art-reviewer/assets/nebula_field.jpg` (1408x768,
overwritten by `art-refiner-agent` since round 1)
**Prompt (base, from `tools/art-reviewer/assets.json`, plus round 2's
feedback appended by the API):** "Isolated single sprite of a top-down 2D
pixel art nebula field hazard, a soft diffuse gaseous cloud of drifting
purple, magenta, and violet space gas with a gently rounded, wispy
irregular silhouette and soft internal shading bands suggesting billowing
gas density, calm and static-feeling with no lightning, no electrical arcs,
and no hard jagged edges, visually distinct from a dense hard-edged
electromagnetic storm cloud, fully opaque solid-shaded pixel art with no
transparency or see-through areas, gritty dark sci-fi, 32-bit, NO
environment, NO scene, on a solid bright chroma-key green (#00FF00)
background, no shading on the background." + round 2 feedback: "Desaturate
most of the cloud's visible mass to a dark-violet/charcoal-grey anchor tone
covering the majority of the silhouette; confine the current saturated
jewel-tone magenta/purple to a smaller highlight or core-glow region only,
not the whole body, mirroring the muted-body-plus-saturated-accent
structure already used by the accepted meteoroid.jpg (muted rock plus
molten-orange accent) and ion_storm.jpg (muted cloud plus electric-blue
accent) hazard sprites. Also render a fully solid cutout with a hard, clean
edge transition directly from the green background into the cloud
silhouette, eliminating any greenish anti-aliased blend/fringe pixels at
the boundary."

**Round 0 check:** `grep`'d `"nebula_field (round"` across
`docs/history/art-eval-log-*.md` before this run — only
`docs/history/art-eval-log-2026-08-19.md` exists at all, and it had exactly
one prior header match, `## nebula_field (round 1) — VERDICT: flagged`
(above). This is round 2, well under the 3-round circuit-breaker cap;
proceeding with a full fresh scoring rather than escalating.

### Technique: 8/10
- Crisp pixel-grid stepping confirmed by direct pixel-level crops (`jimp`
  crop-and-4x-nearest-neighbor-upscale of two boundary regions, saved to
  the scratchpad and viewed via `Read`): both the right-edge region
  (~x=1240-1408, y=280-500) and the top-edge region (~x=600-900, y=20-140)
  show a genuine hard, blocky pixel staircase directly between green
  background and the cloud body — no soft blur, no halo band, no gradient
  ring, visually confirming the round-2 Format-adjacent edge fix (see
  Format below) actually landed at the pixel level, not just in the prompt
  text.
- Palette per region is limited and coherent, now in a clearer two-tier
  read than round 1: a desaturated dark violet/charcoal-grey body
  (sampled ~(69-71, 66-67, 79-82), HSV S≈0.16-0.20, V≈0.31-0.32 across four
  independent body points) plus a smaller, distinctly more saturated
  magenta/purple core-glow region (sampled ~(125-157, 31-46, 121-154), HSV
  S≈0.71-0.79, V≈0.49-0.62 across three core points) — a real two-band
  palette, not a smooth full-spectrum gradient standing in for shading.
- Reads clearly as a soft gas-cloud silhouette at an imagined ~48-64px
  downscale — same overall lumpy-lobed blob shape as round 1 (this
  regeneration changed palette/edge treatment, not the base silhouette),
  still a fairly plain single-lobe shape relative to `ion_storm.jpg`'s more
  structurally distinctive swirl, but functionally readable.
- No baked-in text, watermark, or UI chrome from the generation model.
- Deduction, not a fail: unlike `meteoroid.jpg`/`ion_storm.jpg`/
  `debris_large.jpg`/`asteroid_large.jpg`, this candidate still doesn't use
  the house crisp-black-outline convention — the edge goes directly from
  green to the charcoal body color with no black outline pixel at all. This
  was flagged as optional polish in round 1's fix list and wasn't part of
  this round's required feedback, so it's not held against Style/Format,
  but it's the one remaining Technique-convention gap keeping this below
  9-10.

### Style: 8/10 — up from round 1's 6/10 (the required fix)
- Precedent comparison against `meteoroid.jpg` and `ion_storm.jpg` (both
  accepted): approximate HSV sampling on both precedent assets (a handful
  of eyeballed-coordinate points each, not a rigorous full-region average —
  flagging that imprecision explicitly rather than overstating it) puts
  `meteoroid.jpg`'s rock body around S≈0.32-0.62 and `ion_storm.jpg`'s
  cloud body around S≈0.23-0.30. This round's `nebula_field` body samples
  at S≈0.16-0.20 — as muted or more muted than either precedent's body
  tone, comfortably inside the "muted, desaturated, industrial... dark
  blues/greys" language rather than merely close to threshold.
- The required structural fix is confirmed pixel-sampled, not just visually
  plausible: body-mass points (four independent samples across the
  silhouette) land tightly around (69-71, 66-67, 79-82) — desaturated
  dark-violet/charcoal-grey, majority coverage by area — while the
  saturated magenta/purple (core sample ~(143, 31, 145) up to ~(157, 46,
  154)) is now confined to a visibly smaller central core-glow region,
  roughly a third of the silhouette's area by eye, not the whole body as in
  round 1. This directly mirrors the requested "muted body + saturated
  accent" structure both `meteoroid.jpg` (muted rock + molten-orange
  accent) and `ion_storm.jpg` (muted cloud + electric-blue accent) use.
- High-contrast reading holds: the saturated magenta core against the dark
  charcoal-violet body gives real local contrast, consistent with the
  project's harsh/utilitarian lighting language, not decorative.
- No genre-breaking elements — no cartoon proportions, no fantasy motifs,
  no primary-color accents unrelated to the subject; the soft, calm
  silhouette (no lightning, no hard jagged edges) remains correctly
  differentiated from Ion Storm per the prompt's own language.
- Remaining minor gap keeping this at 8 rather than 9-10: the core-glow
  region's proportion of total silhouette area (~30%, by eye) reads as
  somewhat more generous than `meteoroid.jpg`'s molten-crack accent
  coverage (a thinner network across a smaller fraction of the rock), and
  the magenta hue itself is inherently more "vivid jewel-tone" than
  meteoroid's orange-red or ion_storm's blue-white even at matched
  saturation/value — both are acceptable, intentional differentiators for
  this hazard's own identity (real nebulae skew this palette; the base
  prompt explicitly calls for purple/magenta/violet), not new defects, but
  worth naming as the reason this isn't a 9-10 precedent match rather than
  silently rounding up.

### Format: 9/10 — up from round 1's 8/10
- Deterministic check ran successfully via `jimp` (`tools/asset-prep/node_modules/jimp`,
  script executed from `tools/asset-prep/` so `require('jimp')` resolved;
  `Jimp.read` succeeded on the 1408x768 JPEG).
- Sampled 8 patches (5x5-pixel averages each) at all four corners and all
  four edge midpoints, each well clear of the subject. Results (avg RGB,
  distance from target `(0,255,0)`):
  - topLeft: (4.5, 248.2, 4.0) — dist 9.1
  - topMid: (4.8, 249.3, 4.5) — dist 8.7
  - topRight: (7.9, 246.7, 5.4) — dist 12.7
  - leftMid: (4.1, 248.8, 3.5) — dist 8.2
  - rightMid: (7.5, 246.0, 6.0) — dist 13.2
  - bottomLeft: (8.5, 247.0, 5.6) — dist 12.9
  - bottomMid: (6.6, 248.0, 6.1) — dist 11.4
  - bottomRight: (8.4, 246.1, 6.1) — dist 13.7
- All 8 patches fall well inside the ~25-30-unit compliant-deviation band —
  no single patch's per-channel deviation from pure green exceeds ~8.5
  units, every patch's total distance is between 8.2 and 13.7 (spread of
  only ~5.5 dist units across the whole frame). No directional
  gradient/vignette signal; background counts as flat and on-spec, in the
  same tier as round 1's already-strong background result.
- Edge-fringing re-check (the round's other targeted fix): a 1px-step
  transect at the left edge (y=400, x=55→90) now shows pure green through
  x=73, a narrow 2-3px soft transition at x=74-77, then straight into the
  charcoal body by x=78 — versus round 1's ~43px-wide two-step grey-blue
  halo band at the same kind of location. A second automated per-row scan
  (right edge, `isGreenish` classifier walking inward from the first
  non-pure-green pixel) initially flagged some rows with much wider
  apparent "blend" runs (up to ~10-13px, e.g. around y=350); direct visual
  inspection of 4x-upscaled crops of that exact region (saved to scratchpad,
  viewed via `Read`) showed this is a false positive from the classifier,
  not a real soft fringe — the true boundary there is a hard pixel
  staircase (diagonal steps), and a purely-horizontal per-pixel scan
  crossing a staircase at a shallow local angle clips multiple step corners
  in a row, each contributing one JPEG-softened transitional pixel; zoomed
  in, there is no visible blur, halo, or gradient at all, just a crisp
  blocky cutout. Flagging the methodology gap explicitly: the numeric
  per-row "greenish pixel count" metric alone would have overstated the
  fringe here, and the visual crop check was the thing that actually
  resolved it — worth remembering as a caveat on this specific automated
  technique for future non-convex/staircase-boundary sprites, not a defect
  in this candidate.
- No partial environment/scene bleeding in at the frame edges. The subject
  (charcoal-violet body, magenta core) has no green surfaces that would
  risk mis-keying — no green-on-subject tension to flag.
- Net: background fill remains excellent and essentially unchanged from
  round 1's already-strong result, and the round-1 edge-fringe finding (a
  genuine, if narrow, ~2px greenish anti-aliased blend band) reads as
  substantially addressed — the edge is now a hard pixel-grid cutout at the
  pixel level, confirmed by direct visual crop, not just narrower per the
  raw numbers. Not a 10 because a hairline 2-3px soft transition still
  exists at some sampled points (e.g. the y=400 left-edge transect above)
  rather than a literally zero-blend single-pixel cut, and because this
  check sampled a finite set of transects/crops rather than the entire
  boundary.

No fix list — all three dimensions scored at or above the pass threshold of
7 (Technique 8, Style 8, Format 9). VERDICT: pass.

### Style precedent comparison note (requested explicitly this round)
Both required precedent comparisons were made inline above (Style section):
against `meteoroid.jpg` (muted grey/black rock body, S≈0.32-0.62 by
approximate sampling, plus a molten orange-red crack/ember accent) and
`ion_storm.jpg` (muted dark navy/grey/black cloud body, S≈0.23-0.30 by
approximate sampling, plus a white/pale-blue lightning accent). This
round's `nebula_field` candidate now shares the same muted-body +
saturated-accent structural language as both, with a body saturation
(S≈0.16-0.20) at or below either precedent's — the specific defect round
1 flagged (a fully saturated body with no muted anchor tone anywhere) is
resolved. Caveat carried over from the sampling method: the meteoroid/
ion_storm comparison points were a handful of eyeballed coordinates on
each image, not a systematic region average the way this round's
`nebula_field` body/core samples were (four and three independent points
respectively, chosen specifically to represent each of the two bands) —
treat the precedent numbers as ballpark context, not as precise as the
candidate's own numbers.

### Comparison paragraph
Not applicable in the "competing candidates from the same Generate round"
sense — this was a single-candidate round 2 re-evaluation of
`nebula_field`, not a batch. The requested comparison against
`meteoroid.jpg`/`ion_storm.jpg` is the precedent check made inline in the
Style section and the note directly above, not a competing-candidate
comparison.
