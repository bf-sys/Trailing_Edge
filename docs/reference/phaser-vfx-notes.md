# Phaser VFX Notes

Reference notes on how Phaser handles visual effects, written while thinking
ahead about thruster trails, scanner pulses, and damage feedback. Nothing in
this file is implemented or decided yet — it's a map of what Phaser offers
and which tool fits which effect, for when that work actually starts.

## The toolkit

Phaser has four main techniques for VFX. Each shows up differently in code
and fits a different kind of effect.

### Particle emitters (`scene.add.particles`)

Config-driven: speed, lifespan, scale, alpha, tint, blend mode, frequency,
quantity, gravity. An emitter can be attached to follow a GameObject, so it
tracks a moving ship without manual position updates. Best for effects that
should look organic/scattered rather than clean and geometric — exhaust,
sparks, debris, explosion fragments.

- **Good fit:** thruster exhaust (emit while accelerating, stop when idle),
  a scanner effect if you want it to look like a burst of particles rather
  than a clean expanding shape.
- **Tradeoff:** more flexible and organic-looking, but more parameters to
  tune to get right, and more render cost at scale than a tween or a static
  sprite.

### Tweens (`scene.tweens.add`)

Animates any numeric property (scale, alpha, tint, position, rotation) over
time with an easing curve. No particle system involved — just interpolating
a value. Best for clean, one-shot, geometric effects.

- **Good fit:** a damage flash (tint or alpha pulse on hit), an expanding-
  ring scanner ping (scale-up + fade-out), a fade-in for a "reached" state
  (e.g. `RelayBeaconObject`'s overlay, which currently just snaps to
  visible with `setVisible(true)` — a tween would look better and costs
  almost nothing to add).
- **Tradeoff:** cheap and simple, but reads as more mechanical/uniform than
  particles — less good for anything that should look scattered or random.

### Pre/Post FX pipeline (`gameObject.preFX` / `postFX`)

Built into Phaser 3.60+: shader-based effects (Glow, Shadow, Blur, Bloom,
ColorMatrix) applied directly to a GameObject without hand-building
anything. Cheap way to get a polished-looking pulse or flash.

- **Good fit:** a glow pulse on a scanner or objective marker, a quick red
  color-matrix flash for damage feedback.
- **Tradeoff:** less control over the exact look than particles/tweens; you
  get what the built-in effect gives you, tuned via its own parameters.

### Sprite-sheet flipbook animations (`scene.anims`)

A pre-drawn frame-by-frame animation played back like a movie clip, via
Phaser's animation system on an `AnimatedSprite`.

- **Already relevant here:** `ship/ship_damage_overlay_PLACEHOLDER.png` was
  sourced specifically for this — a 20-frame strip composited from a
  source pack's `fire00–19` effect frames (see
  `docs/phase1-manifest-and-tasks.md`). It exists in `assets/` but isn't
  wired to an `AnimatedSprite`/`scene.anims` config yet.
- **Tradeoff:** looks exactly as good as the source art, but is fixed —
  no procedural variation, and needs an actual frame-strip asset (which
  this project already has for ship damage, but not for other effects).

## Mapping the three effects mentioned

| Effect | Likely technique | Why |
|---|---|---|
| Ship thruster trail | Particle emitter | Continuous, organic, tied directly to existing movement state (`ExplorationController`'s acceleration) |
| Scanner effect | Tween (expanding ring) or particle burst | Either works; tween is simpler if a clean geometric ping reads well, particles if it should look more like a scattered pulse |
| Damage splat / feedback | Tween or postFX flash + the existing `ship_damage_overlay` flipbook | Flash (tween/postFX) for the instant hit feedback, flipbook overlay for a persistent "damaged" visual state |

## Architectural fit with what's already built

VFX should stay **display-only and event-driven**, the same pattern
`HudOverlay` already uses: it reacts to `ShipSurvivalComponent.
onResourceChanged` rather than any gameplay system reaching out to trigger
it directly. A VFX layer should work the same way — react to
`onResourceChanged`/hazard-contact events, don't have gameplay code call
into a VFX system directly. This keeps the same separation CLAUDE.md
already establishes for `HudOverlay`: it queries/reacts, it doesn't gate or
drive gameplay.

Tunable effect parameters (particle counts, tween durations, colors) should
live in a config module following the same convention as `shipConfig.ts`/
`survivalConfig.ts` — plain data, exposed on `window.tuning` in dev builds,
not hardcoded inline in whichever system triggers the effect.

## Not yet decided

- Whether thruster/scanner/damage effects get their own dedicated
  `VfxController`-style class, or stay as small pieces of logic inside the
  systems that already own the relevant state. Worth deciding once more
  than one or two effects exist — premature to build an abstraction for
  just one.
- Whether procedurally generated VFX textures (same approach as
  `StarfieldBackground.ts`'s generated star tiles) are good enough for a
  placeholder pass, or whether this is worth a real sourcing pass sooner
  given `ship_damage_overlay` is already sourced and sitting unused.

Recommended starting point whenever this work begins: the thruster particle
trail, since it's continuous and ties directly to state that already
exists (`ExplorationController`'s velocity/acceleration), making it the
easiest to validate feel against.
