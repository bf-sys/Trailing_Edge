import { registerTuning } from './devTuning';
import type { HazardActivation, HazardMovementPattern, HazardShape } from '../objects/HazardZoneElement';

// Per-hazard-type tunables (GDD §11.3's "one class, five content configs"
// collapse) -- shape/movement/activation/resourceCost for each of the five
// named hazards (Debris Field, Solar Flare, Ion Storm, Nebula Field,
// Meteoroid). Extracted from GameScene.create()'s inline literals per
// CLAUDE.md's tunable-parameters convention, which names "hazard ...
// costs" explicitly as belonging in a per-subsystem config module, never
// inline in a class's/Scene's logic -- the same convention every other
// subsystem (shipConfig, survivalConfig, abilityConfig, puzzleConfig, ...)
// already follows.
//
// Deliberately excludes x/y placement: per-level object *position* is
// authored level content (GDD §11.7), not a global tunable default, and
// stays in GameScene.ts's level-000 test-scene placements (Phase 2b will
// move it into real per-level config files). Only the hazard-type-level
// defaults below -- the part that's the same regardless of which level
// places an instance -- belongs in this module.
export interface HazardTypeConfig {
  textureKey: string;
  // Player-facing name shown by scan's hazard-ID overlay (2026-08-14 ability
  // rework, docs/ability-rework-brainstorm-2026-08-14.md) -- the fix for
  // Ion Storm/Nebula Field being visually hard to tell apart at a glance.
  displayName: string;
  shape: HazardShape;
  movementPattern: HazardMovementPattern;
  speed: number;
  headingRadians?: number;
  // Corrects a 'linear' hazard's sprite rotation so it visually faces its
  // direction of travel, the same spriteFacingOffsetRadians pattern
  // shipConfig.ts already uses (rotation = heading + offset). Native art
  // orientation varies per sprite, so this is per-hazard-type, not derived.
  // Unset means "don't rotate the sprite from its authored/default
  // orientation" -- correct for movementPattern: 'static' hazards, and for
  // Ion Storm, whose swirl art doesn't read as facing any particular way.
  spriteFacingOffsetRadians?: number;
  // Continuous cosmetic spin (added 2026-08-21, Ion Storm), independent of
  // spriteFacingOffsetRadians/heading -- see HazardZoneConfig's comment.
  spinRadiansPerSecond?: number;
  // 'trochoid' movementPattern only (added 2026-08-25, Ion Storm experiment)
  // -- radius/angular speed of the loop around the carrier point. See
  // HazardZoneConfig's comment in HazardZoneElement.ts for the math.
  orbitRadius?: number;
  orbitAngularSpeedRadiansPerSecond?: number;
  // 'continuous' activation only (added 2026-08-25, Nebula Field). See
  // HazardZoneConfig's comment in HazardZoneElement.ts for the math.
  exposureRampPerSecond?: number;
  activation: HazardActivation;
  pulseIntervalSeconds?: number;
  hitCooldownSeconds?: number;
  resourceCost: { energy: number; structure: number };
  blocksMovement?: boolean;
  cancelTargetOnContact?: boolean;
  knockbackSpeed?: number;
  depth?: number;
  // Solar Flare has no sourced art yet (docs/STATUS.md) -- GameScene
  // generates a flat placeholder circle texture at this color/alpha under
  // `textureKey`. Debris Field, Ion Storm, Nebula Field, and Meteoroid all
  // omit this field since they have final sourced art loaded by BootScene
  // (Ion Storm/Nebula Field/Meteoroid added 2026-08-20 via the art
  // Generate-Evaluate-Refine loop, docs/STATUS.md's 2026-08-19/20 entries).
  placeholderTexture?: { color: number; alpha: number };
}

export type HazardType = 'debrisField' | 'solarFlare' | 'ionStorm' | 'nebulaField' | 'meteoroid';

export const hazardConfig: Record<HazardType, HazardTypeConfig> = {
  // Re-scoped 2026-08-07 (GDD §9/§11.3): movement-blocking obstacle, zero
  // resource drain -- naturally-occurring rock/ice debris, not a drain zone.
  debrisField: {
    textureKey: 'debris_large',
    displayName: 'DEBRIS FIELD',
    shape: { kind: 'circle', radius: 60 },
    movementPattern: 'static',
    speed: 0,
    activation: 'continuous',
    resourceCost: { energy: 0, structure: 0 },
    blocksMovement: true,
  },

  // 2026-08-11: energy costs below bumped so all three energy-draining
  // hazards clearly outdrain survivalConfig.energyRegenPerSecond (8/s at
  // the time -- dropped to 2/s 2026-08-24 alongside energyNodeConfig.ts's
  // pickups, so these values outdrain the current baseline even more
  // clearly than when they were tuned). At the old pre-2026-08-11 values
  // (solarFlare avg 4.8/s, ionStorm/nebulaField 6/s), passive regen ran
  // ahead of drain every frame (regenEnergy() runs before hazard update()
  // in GameScene.update()), so the energy bar visibly held near max
  // instead of draining. No regen-side change made here -- regen is
  // already the smallest lever in the system, and "weaker regen inside a
  // hazard" is equivalent to a bigger hazard-side number anyway.
  solarFlare: {
    textureKey: 'hazard_solar_flare',
    displayName: 'SOLAR FLARE',
    shape: { kind: 'circle', radius: 70 },
    movementPattern: 'static',
    speed: 0,
    activation: 'pulsed',
    pulseIntervalSeconds: 2.5,
    // structure added 2026-08-25 (brought in line with Nebula Field/Ion
    // Storm's same-day structure additions, for completeness -- see
    // CLAUDE.md's Current project state -- even though Solar Flare has no
    // placement precedent in any real level yet). 35 per pulse, not derived
    // from a played rate the way Nebula/Ion Storm's per-second values were --
    // this hazard delivers cost in discrete lumps (like Meteoroid's impact
    // hit) rather than continuously, so a per-pulse lump is the closer
    // comparison than a per-second rate; picked as a middle value between
    // Meteoroid's 25/hit (1s cooldown) and what continuous exposure to
    // Nebula/Ion Storm would total over one 2.5s pulse interval (50-62.5).
    // First-pass, unplayed -- retune once this hazard actually appears in a
    // level.
    resourceCost: { energy: 28, structure: 35 }, // 11.2/s avg energy, delivered as a visible ~28% chunk per pulse
    placeholderTexture: { color: 0xff6644, alpha: 0.55 },
  },

  // Same visual family as Nebula Field (GDD §9) -- motion is the only
  // behavioral difference: a slow linear drift vs. fully static. Size/speed
  // bumped 2026-08-21 (same "make it a little bigger and faster" pass as
  // Meteoroid) -- no collision change, still pure fly-through/drain, no
  // blocksMovement. Originally kept well under Meteoroid's speed so it read
  // as a *drift*, not a threat requiring reflexes -- the GDD's "slow-moving
  // hazard area" framing for Ion Storm vs. Nebula Field's fully static one
  // is unchanged, just more visibly in motion than the old barely-there 15.
  // Speed bumped 30 -> 140 -> 200 (2026-08-25, live console tuning) -- still
  // under Meteoroid's (280), so the relative drift-vs-threat read is
  // preserved even though this is no longer a slow crawl in absolute terms.
  //
  // movementPattern switched 'linear' -> 'trochoid' (2026-08-25, user
  // request/experiment): an invisible carrier still advances in a straight
  // line at `speed`/`headingRadians` exactly like before, but the hazard's
  // actual drawn position now loops around that carrier (orbitRadius 220,
  // one revolution every 5s) instead of sitting on it -- sweeps a ~440px-wide
  // band across the map instead of a single-pixel-wide line, and reads as
  // visibly distinct from Meteoroid's straight charge. Tangential loop speed
  // (radius * angularSpeed ~= 276px/s) intentionally exceeds the carrier's
  // forward speed -- that's what makes it trace visible loop-the-loops (a
  // true trochoid, not just a wavy line) rather than a gentle sideways
  // wobble. Meteoroid stays 'linear' on purpose -- see
  // HazardMovementPattern's 'trochoid' comment in HazardZoneElement.ts.
  // Carrier speed dropped 200 -> 100 (2026-08-25, user playtest feedback
  // after a few in-browser iterations of the trochoid pattern) -- widens the
  // gap under the 276px/s tangential loop speed further, reads better with
  // the corkscrew motion than the old 200 did.
  ionStorm: {
    textureKey: 'hazard_ion_storm',
    displayName: 'ION STORM',
    shape: { kind: 'circle', radius: 110 },
    movementPattern: 'trochoid',
    speed: 100,
    headingRadians: Math.PI,
    orbitRadius: 220,
    orbitAngularSpeedRadiansPerSecond: (Math.PI * 2) / 5, // one loop every 5s
    // Swirling-cloud spin (2026-08-21, tuned same day: 8s -> 16s -> 24s) --
    // clockwise, one full rotation every 24s. Purely cosmetic (doesn't
    // touch the circular collision body, which is rotation-invariant);
    // independent of headingRadians/the trochoid loop above, so it spins in
    // place regardless of drift direction or where it is on the loop.
    spinRadiansPerSecond: (Math.PI * 2) / 24,
    activation: 'continuous',
    // structure added 2026-08-25 (user request/design decision -- see the
    // "more tension via run-fail risk" discussion this followed): Ion Storm
    // is no longer purely ability-limiting, it's now a real fail-stakes
    // hazard alongside Meteoroid. Energy cost is kept alongside it (not
    // replaced) -- still costs ability-fuel too.
    // Retuned same day, second pass (user request): energy 15->25,
    // structure 25->20 -- Ion Storm now leans more energy-heavy relative to
    // Nebula Field (below), which leans more structure-heavy. Not derived
    // from a stated rationale beyond the swap itself; retune further as it
    // plays.
    resourceCost: { energy: 25, structure: 20 },
    // 2026-08-24: 'linear' hazards render above the static world layer
    // (Debris/Nebula/Solar Flare, resupply, objectives -- all left at
    // Phaser's default depth 0) but below PlayerShip (depth 10, see
    // PlayerShip.ts) -- they're the two things on the map that actually
    // move, so they read as passing over static scenery rather than
    // blending into it. Meteoroid (8) sits above Ion Storm (7) on request,
    // so a Meteoroid crossing an Ion Storm's cloud stays visible on top.
    depth: 7,
  },

  // Three sourced art variants as of 2026-08-21 (hazard_nebula_field,
  // hazard_nebula_field_alt2, hazard_nebula_field_alt3 -- the latter two
  // from the multi-variant GER pass docs/reference/art-production-guidelines.md
  // called for, mirroring debrisField's alt2/alt3 precedent above), cycled
  // per-placement via HazardPlacement.textureKey in level files that chain
  // multiple Nebula Field instances -- this textureKey is just the default
  // for a placement that doesn't override it.
  nebulaField: {
    textureKey: 'hazard_nebula_field',
    displayName: 'NEBULA FIELD',
    shape: { kind: 'circle', radius: 100 },
    movementPattern: 'static',
    speed: 0,
    activation: 'continuous',
    // structure added 2026-08-25 (user request/design decision, same pass
    // as Ion Storm's -- see that field's comment): Nebula Field is static
    // and, per every level's design so far, trivial to route around, so
    // real punishment for lingering/being sloppy in one is fine.
    // Retuned same day, second pass (user request): energy 15->20, structure
    // 20->25 -- Nebula Field now leans more structure-heavy relative to Ion
    // Storm (above), which leans more energy-heavy. Not derived from a
    // stated rationale beyond the swap itself; retune further as it plays.
    resourceCost: { energy: 20, structure: 25 },
    // exposureRampPerSecond added 2026-08-25 (user request), Nebula Field
    // only -- deliberately NOT applied to Ion Storm: it's a moving hazard
    // whose trochoid path can carry it over the ship involuntarily, whereas
    // Nebula Field is static and trivially easy to just leave, so punishing
    // lingering here doesn't risk punishing a player for something outside
    // their control the way it could for Ion Storm. Linear, gentle by
    // design (user: "reinforcement not to stick around," not
    // over-punishing) -- at 0.15, a quick ~0.77s pass-through (200px
    // diameter at max ship speed) is barely affected (+11.5% for that
    // instant), but standing still long enough to matter escalates fast:
    // total structure drained reaches the 100 max at ~3.2s of continuous
    // stationary exposure (vs. ~4s unramped) -- see CLAUDE.md's Current
    // project state for the full math. First-pass value, easy to retune via
    // window.tuning.hazard.nebulaField.exposureRampPerSecond.
    exposureRampPerSecond: 0.15,
  },

  // No longer the *sole* structure-draining open-world hazard as of
  // 2026-08-25 (Nebula Field/Ion Storm above both gained structure cost,
  // same pass -- see their comments) -- that "one dedicated fail-stakes
  // hazard" asymmetry from GDD §9's 2026-08-07 re-scope is deliberately
  // retired, not an oversight; CLAUDE.md's Open design questions section
  // needs a matching update. Meteoroid's own distinct identity is now its
  // *delivery* (a one-time impact hit + physical knockback, via
  // blocksMovement collision) rather than being the only hazard that can
  // hard-fail a run. Collision rework (2026-08-21): a blocksMovement solid
  // collider (ship physically bounces off instead of flying through it)
  // that deals a one-time impact hit rather than a per-second drain --
  // hitCooldownSeconds stops repeat hits while Arcade's collision
  // separation is still shoving the ship clear.
  meteoroid: {
    textureKey: 'hazard_meteoroid',
    displayName: 'METEOROID',
    shape: { kind: 'circle', radius: 56 },
    movementPattern: 'linear',
    speed: 280, // bumped from 140, 2026-08-25 (live console tuning)
    headingRadians: 0,
    // hazard_meteoroid.png's rock+ember-trail art faces down-and-left at
    // zero rotation, not due east -- same "measure the art, name the
    // offset" approach shipConfig.ts's comment describes. Recalibrated
    // 2026-08-22 when the sprite was regenerated to fix a misaligned ember
    // trail (the previous art's trail ran at a shallower angle than the
    // rock body's own long axis; this version's trail runs collinear with
    // it, but the regeneration also happened to flip the rock/trail
    // layout roughly 180 degrees on the canvas, hence the sign flip from
    // the old +30 deg value).
    // First-pass recalibration used an ember/rock color-centroid vector
    // (~150 deg) and looked right on paper, but the project owner reported
    // the in-game travel direction still looked visibly off from the
    // rock's nose (their guess: "maybe 10-15 degrees"). A same-day
    // follow-up measurement taking the true extreme tip-to-tip pixels
    // (rock nose corner <-> trail's farthest ember pixel, see
    // tools/asset-prep/measure-tip-axis.js) landed at ~152.8 deg -- and
    // the project owner independently confirmed it by drawing their own
    // desired-direction line on the sprite, which measured out to ~152.66
    // deg (tools/asset-prep's ad hoc PCA fit over the drawn line's
    // pixels). Both landing within 0.15 deg of each other is why ~152.7
    // deg is trusted here over the original ~150 -- the earlier centroid
    // measurement wasn't wrong so much as a few degrees short of true, and
    // apparently that's enough to visibly read as misaligned once the
    // rock is actually moving rather than sitting still on a static image.
    spriteFacingOffsetRadians: -(152.7 * Math.PI) / 180,
    activation: 'impact',
    hitCooldownSeconds: 1,
    resourceCost: { energy: 0, structure: 25 },
    blocksMovement: true,
    // Experimental (2026-08-21) -- see HazardZoneConfig's comment. Playtest
    // feedback: hitting Meteoroid head-on felt "stuck" rather than bounced
    // off, because click-to-move kept re-steering into it every frame.
    cancelTargetOnContact: true,
    // Follow-up (2026-08-21): cancelTargetOnContact alone stops the ship
    // dead against the hazard rather than bouncing it off (Arcade
    // separation has zero restitution, confirmed via the earlier A/B) --
    // hard to clear by normal acceleration (700 px/s^2) while still
    // touching the collider. shipConfig.maxSpeed (260) is the effective
    // ceiling here -- setVelocity() gets silently clamped to it by the
    // ship body's own setMaxVelocity() cap, so anything higher is wasted --
    // set to that ceiling directly after playtesting asked for more
    // distance than 220 gave. Covers ~37.6px before deceleration
    // (900 px/s^2) brings it to rest (v^2/2a), clearing the hazard's
    // radius (56px as of 2026-08-22's size bumps, was 40px originally)
    // plus the ship's ~23-28px half-extent with real margin.
    // Direction was also changed the same playtesting pass: perpendicular
    // to the hazard's line of travel rather than radially outward from its
    // center (see applyKnockback()'s comment in HazardZoneElement.ts) --
    // a straight-on hit's radial direction is just "back the way the ship
    // came," which a still-moving hazard simply catches back up to.
    knockbackSpeed: 260,
    depth: 8, // above ionStorm's 7 -- see that field's comment
  },
};

registerTuning('hazard', hazardConfig);
