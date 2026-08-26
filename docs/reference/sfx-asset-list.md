# Audio Asset List — Required vs. Nice-to-Have

Written 2026-08-26; consolidated same day from two documents into this one.
Originally this file covered only sound effects, cut by sourcing priority,
alongside a separate full taxonomy at `docs/trailing_edge_audio_asset_list.md`
(Core/Content split, written 2026-08-21, covering every audio need including
music and a sourcing-site writeup). Per owner request, **that file is now
deleted and this is the single audio asset list** — its content is folded in
below, re-validated against current `src/` (see the verification note under
each section that changed), and re-cut by Required-vs-Nice-to-have instead of
Core/Content, since sourcing priority is more actionable than "fixed
regardless of level count" — every audio item in this game is that kind of
fixed cost anyway (no level needs bespoke audio; see §5 below), so the
Core/Content axis never actually did any differentiating work here the way it
does for the art list.

**No audio is implemented in `src/` yet** (confirmed zero `this.sound`/
`Phaser.Sound` usage as of 2026-08-26) — every row below is a gap, not a mix/
balance note.

**How the Required/Nice-to-have cut is made:** Required = the player loses
real information (a hit they didn't clock, a fail state that reads as a
silent glitch, a menu action with zero feedback) without it. Nice-to-have =
the game is already legible without it; the sound would add atmosphere,
redundancy, or finer differentiation between two things already
distinguishable some other way (color, text label, animation). Judgment
call, flagged per-row where it's close.

**Relevant event plumbing, confirmed current as of 2026-08-26** (useful for
whoever wires these sounds up): `ShipSurvivalComponent` fires
`SHIP_SURVIVAL_EVENTS.StructureDepleted` on the zero-crossing edge (wired to
`GameScene`'s `scene.restart()`) and a separate `ResourceChanged` event on
*every* energy/structure mutation — regen tick, consume, `repairStructure()`,
`rechargeEnergy()` all reuse the same event, there's no dedicated
"repair-complete" or "energy-depleted" event. Relevant to §2's open question
on whether a hazard-specific sound and a generic damage-taken sound can
listen for logically distinct moments, or have to share one event and be
differentiated by the caller.

---

## 1. Required / Core SFX

### 1.1 Ship & movement

| Sound | Trigger | Why required |
|---|---|---|
| Click-to-move confirm | New destination issued (`ExplorationController`) | The only feedback a click landed at all — currently silent, so a missed click and a successful one look identical for a beat. |
| Thruster / movement loop | Ship en route to a destination; silent at rest | Without it, "moving" and "stopped" are visually similar at low speed — this is the primary state-change cue for the core input. |

### 1.2 Hazard contact (`hazardConfig.ts`, 5 types — every type but Debris Field now costs a resource, per CLAUDE.md's 2026-08-25 change)

| Sound | Trigger | Why required |
|---|---|---|
| Debris Field collision thud | `blocksMovement` collider contact, zero resource cost | The only feedback for a solid bump — no resource bar moves to confirm it happened. |
| Generic energy-drain tick/hum | Any hazard with `resourceCost.energy > 0` while in contact (Solar Flare, Ion Storm, Nebula Field) | Energy bar changes are otherwise silent and easy to miss mid-navigation; this is the baseline "something is costing you energy right now" cue even before per-hazard identity sounds exist. |
| Generic structure-hit stinger | Any hazard with `resourceCost.structure > 0` (now Solar Flare, Ion Storm, Nebula Field, Meteoroid — no longer Meteoroid alone) | Structure is the fail resource; a silent structure hit is the single worst gap on this list — a player can be one hazard tick from a hard-fail restart with no audio warning at all. |
| Meteoroid impact + knockback whoosh | `activation: 'impact'` hit (25 structure, one-time, `knockbackSpeed: 260` perpendicular kick) | Distinct from the generic structure-hit stinger above — this is a discrete, high-consequence physical event (a real velocity kick, not just a resource tick) and reads as broken/silent without a matching sound. |

**Flag, close call:** whether Ion Storm/Nebula Field need their own
*ambient identity* loop (crackle vs. drone) to be **required** rather than
nice-to-have is genuinely borderline — tied to the still-open visual-
differentiation question (GDD §9). Kept in §2 below because the generic
energy/structure ticks above already give baseline resource feedback even
without it; differentiation is a legibility *improvement*, not the only
thing standing between the player and confusion.

### 1.3 Survival & fail state

| Sound | Trigger | Why required |
|---|---|---|
| Hard-fail / restart stinger | `SHIP_SURVIVAL_EVENTS.StructureDepleted` (structure hits 0, full level restart) | The single most consequential moment in the game currently has zero audio — a full run gets thrown away with no distinct "you failed" beat, easy to misread as a bug on first encounter. |

### 1.4 Core-loop objects (required every level)

| Sound | Trigger | Why required |
|---|---|---|
| Probe discovery chime | `ProbeObject.onPlayerArrival()` → `LevelObjectiveTracker.onProbeFound()` | Confirms the level's first real objective was actually reached — currently no distinct feedback beyond the HUD marker updating. |
| Relay Beacon reached chime | Arrival at the mandatory waypoint (`RelayBeaconObject`, plain navigate-to trigger, not a puzzle) | Also unlocks the Exit Wormhole — a state change with real consequence (a previously-closed exit opens) that's otherwise silent. Distinct sound from the Probe's above — two different moments in the loop. |
| Exit Wormhole "opens" cue | Tints active once `canReturn()` is satisfied (beacon reached) | Distinct moment from the chime above — the exit becoming *reachable* is different from the beacon *arrival* itself, and both currently fire silently at the same instant with nothing to tell them apart. |
| Exit Wormhole transition / level-complete sound | Entering the Exit Wormhole (`ExitWormhole.onPlayerArrival()` passes its own `canReturn()` check), completing the level | The other bookend to the hard-fail stinger above — succeeding a level currently sounds identical to every other frame of gameplay. |

### 1.5 Resupply

| Sound | Trigger | Why required |
|---|---|---|
| Repair tick/loop | In range of AsteroidField (manual per-frame distance check, `repairStructure()` firing, `structureRepairPerSecond: 20`) | Structure regenerating is a slow, easy-to-miss bar change without an audio cue confirming "this is working right now." Should read as constructive/healing, deliberately contrasting with the hazard-contact sounds in §1.2. |

### 1.6 Energy Node pickups (added 2026-08-24)

| Sound | Trigger | Why required |
|---|---|---|
| Pickup collect chime | Overlap trigger, `rechargeAmount: 10` energy granted, pickup starts its 6s respawn cooldown | A flat, instant resource grant with a VFX burst (`energyNodeVfxConfig.ts`) already exists but no matching sound — collecting one of the game's primary energy sources (`survivalConfig.energyRegenPerSecond` is only 2/s passively) currently plays no confirmation at all. |

### 1.7 Abilities (`abilityConfig.ts` — all four are mechanically live, three have player-facing UI)

| Sound | Trigger | Why required |
|---|---|---|
| Scan activation ping | `AbilityComponent.tryActivate('scan')` (15 energy, opens a 4s hazard-ID/objective-marker window via `isActive()`) | The ability's entire value is information it reveals for a timed window — a silent activation makes it easy to lose track of whether the window is even open. |
| Teleport arm tone | Entering aim state (`ExplorationController.isTeleportArmed()`) | Distinct visual state (`TeleportRangeRing` appears) needs a matching audio cue so arming isn't confused with an accidental click. |
| Teleport blink sound | Confirm click, ship repositions (30 energy, up to 350px, passes through colliders) | An instant position change with zero transition sound reads as a teleport-shaped bug rather than an intentional ability. |
| Rocket Boost burst | Activation (20 energy, 520px/s burst for 0.6s, straight-line override) | A sudden, large speed change with no audio cue is disorienting and easy to misattribute to lag or a collision. |

### 1.8 UI / menu

| Sound | Trigger | Why required |
|---|---|---|
| Menu click | Any `setInteractive`/`pointerdown` text button (`TitleScene`/`PauseScene`/`AbilityUnlockScene`) | Baseline confirmation that a click registered — every other game genre trains players to expect this, and its absence reads as unresponsive UI. |
| Pause open/close | Entering/leaving the paused overlay | A state change that stops/resumes the whole simulation deserves more than the visual overlay alone. |
| Ability unlocked fanfare | `AbilityUnlockScene` launch (real level completion, next ability granted; dismissed only by its explicit close button, no timeout) | One of the few positive-reinforcement moments in the current build; currently indistinguishable from any other paused popup. |

### 1.9 Music

| Sound | Trigger | Why required |
|---|---|---|
| Ambient background loop | Continuous, menu included | **Scope decided 2026-08-21: start with a single loop covering the whole game.** The game currently has zero music in any state — a bigger absence than any individual missing SFX, and the one music item this list carries. Splitting into distinct Menu/Title vs. in-level Exploration tracks is explicitly deferred, not decided against — see §6's open questions. |

**Required count: 23 items** (excluding the two close-call ambient-identity
loops flagged into §2).

---

## 2. Nice-to-Have SFX

Everything here makes an already-legible moment richer, or adds
differentiation on top of an existing (non-audio) way to tell two things
apart. None of these block understanding what just happened.

### 2.1 Hazard identity & telegraphing

| Sound | Notes |
|---|---|
| Ion Storm ambient crackle loop (distinct from Nebula Field) | Addresses the still-open GDD §9 visual-differentiation question from the audio side — see §1.2's flag above. Should read as electrical. |
| Nebula Field ambient drone loop (distinct from Ion Storm) | Same pairing as above. Should read as a hum/drone, distinct from Ion Storm's crackle. |
| Nebula Field exposure-ramp audio escalation | `exposureRampPerSecond: 0.15` linearly ramps the effective drain rate the longer the ship sits still inside it — a rising pitch/intensity on the ambient loop as ramp accumulates would reinforce "get out" better than a flat loop does, but the flat loop (or the generic energy/structure ticks in §1.2) already conveys "this is costing you." |
| Solar Flare pre-burst warning tone | Not yet placed in any real level (`hazardConfig.ts` comment, CLAUDE.md). Audio may be the stronger telegraphing channel here than a static sprite is for a timed pulse (a rising tone/tick building to the burst is a natural fit) — genuinely useful once this hazard ships (GDD §5's telegraphing requirement), but sourcing it now is ahead of actual need. |
| Solar Flare pulse/burst sound | Same "unplaced yet" reasoning as the warning tone above; a separate sound from the warning tone, not a reuse of it. |

### 2.2 Puzzle-taxonomy elements (Phase 2a — mechanically complete, but no real level places one yet per CLAUDE.md)

| Sound | Notes |
|---|---|
| Signal Array per-step correct/incorrect tone | `SequenceSpotElement` — distinct from the full-sequence-solved fanfare below; no content need yet since no level uses it. |
| Scan Target/Marker interact chime | `ScanInteractElement` — likely the cheapest single item on this whole list whenever it's needed. |
| Comet tracking hum (in-progress) + lost-track blip | `MovingSpotDurationElement` — a tracking-in-progress tone while the ship stays within the moving spot's radius, distinct from losing track (silence or a negative blip) and from completion. |
| Cargo Pod push/pull scrape | `PushPullObjectElement` — position/velocity tweened, not real force application (CLAUDE.md's Arcade-physics tradeoffs), so it should read as effortful, not frictionless. Gated behind `tractorBeam`, which itself has no player-facing UI. |
| Beacon Cluster trail-progress tone | `TrailDrawElement` — a progress tone while drawing the trail, distinct from the completion cue. |
| Shared puzzle-solved fanfare | `PuzzleSite`'s `SiteSolved`/`onSiteSolved` event, which all five subtypes hook into — one shared sound (or a shared base with per-type variation) is a reasonable default over five entirely separate solve-fanfares; still blocked on any level actually shipping a puzzle site. |

### 2.3 Ability & object polish

| Sound | Notes |
|---|---|
| Tractor Beam engage/pull sound | Mechanically real (Cargo Pod interaction) but no player-facing UI or unlock ceremony (2026-08-14 de-scope) — low visibility even once puzzle sites ship, but still needs a sound if it's used at all. |
| Entry Wormhole ambient hum | Visual-only object, no player interaction — a reasonable optional touch, not a requirement. |
| Distinct fanfare variants per puzzle-element type | A shared base fanfare (§2.2) covers the requirement; per-type variation is refinement on top. |
| Hover sound on UI buttons | None of the current buttons have a distinct hover *visual* state either — adding audio-only hover feedback would be inventing a UI affordance that doesn't otherwise exist yet. |
| `WinScene` distinct ending theme/stinger (beyond reusing the ability-unlock fanfare) | GDD explicitly defers investment in this scene ("fine to keep minimal") — likely the same for audio, lowest-priority scene. Still the game's one true ending, though, and probably deserves more than reusing the ability-unlock fanfare eventually. |
| `BootScene` audio | No player-facing time here currently (straight through to `TitleScene`) — likely no dedicated audio need. |

### 2.4 Explicitly not scoped (feature doesn't exist)

- **Low-resource warning cue** — no "energy critical"/"structure critical"
  alert system exists anywhere in `ShipSurvivalComponent`/`ShipStatusArcs`
  (only the general-purpose `ResourceChanged` event exists, fired on every
  mutation, not a threshold-crossing alert). Not a sourcing gap; there's no
  event to attach a sound to yet. If that system gets built, it needs its
  own pass, not a retrofit onto this list.

---

## 3. Explicit non-requirements (GDD §10)

- No combat system → no weapon/impact SFX, no enemy vocalizations or
  movement sounds
- No control-remapping UI in the initial build → nothing audio-specific here
- No 4X / empire-management layer → no strategic-map audio

---

## 4. Per-level content

No new audio per level: `HazardZoneElement`'s one-class/many-configs
collapse means a hazard's sound is a property of its *type*, not its
placement, and the same is true of every other object/ability/puzzle-element
class. Every item in §1/§2 is sourced once and reused across every level
that places that type — listed here only so the absence of a "Content"
section (unlike the art asset list, which does scale per-level for
backgrounds/set pieces) isn't mistaken for an oversight.

---

## 5. Open design questions

Carried forward from the original 2026-08-21 audio list, still open:

- **Ion Storm vs. Nebula Field audio identity** — tied to the same
  still-open visual differentiation question (GDD §9); see §1.2/§2.1 above.
- **Hazard-contact sound vs. generic damage-taken sound** — do they coexist,
  or does one replace the other per hazard? Not decided. Complicated
  slightly by the 2026-08-26 verification finding that
  `ShipSurvivalComponent` only exposes one generic `ResourceChanged` event
  for all energy/structure mutations (no per-hazard event) — whichever
  system consumes hazard-contact audio will need to key off the hazard
  object itself (already known at the `onHazardContact()` call site), not
  off a resource-change event, if the two sounds are meant to be
  distinguishable by cause rather than just by which resource moved.
- **Ability activation audio** — not named as a requirement anywhere in the
  GDD; the whole category (§1.7) is implied by the abilities existing at
  all. Worth scoping alongside any matching VFX for the same abilities
  (`docs/trailing_edge_art_asset_list.md` §1.5's flag), since a matched
  sound+VFX pair will likely read better designed together than sourced
  separately.
- **Music context split (menu vs. gameplay)** — deliberately deferred, not
  decided against (§1.9); revisit after the single loop is in and
  playtested, same "validate with something real before deciding on paper"
  instinct the GDD applies to Ion Storm/Nebula Field's visual
  differentiation.
- **No low-resource warning system exists yet** to source audio for — see
  §2.4; flagged so it isn't later mistaken for an existing gap that was
  simply missed.

---

## 6. Sourcing recommendations (researched 2026-08-21, carried forward unchanged)

Where to look for CC0/CC-BY audio matching the categories above. Mirrors
`ATTRIBUTION.md`'s existing license-tracking discipline: CC0 preferred, but
CC-BY/CC-BY-SA already accepted for this build (per the art-sourcing
precedent), so it's a usable fallback, not a hard blocker.

### 6.1 General-purpose sources

- **Kenney.nl (audio)** — https://kenney.nl/assets?q=audio. All CC0, no
  account or attribution required, same pack/zip pattern already used for
  Kenney's *art* packs (Space Shooter Remastered, Simple Space, UI Pack -
  Sci-Fi — see `ATTRIBUTION.md`). Three relevant packs, confirmed live:
  **Sci-fi Sounds** (engine/space one-shots — thruster loop candidate,
  §1.1; several §1.7 ability sounds), **Interface Sounds**, and the newer
  **UI Audio** (clicks/confirms/menu cues — direct fit for §1.8). Given the
  existing art pipeline already leans on Kenney, this is the obvious first
  stop for consistency alone.
- **OpenGameArt.org** — pre-curated packs (not loose clips), filterable by
  license on the browse page — same site already used for the Objects.zip
  debris/asteroid pack (see `phase1-manifest-and-tasks.md`). CC0 sci-fi
  packs worth checking first: "60 CC0 Sci-Fi SFX" and its companion "50 CC0
  Sci-Fi SFX" (lasers, metallic hits, ambient hums, warp/terminal tones —
  candidates for Ion Storm's crackle and Nebula Field's drone, §2.1; a
  wormhole-warp cue, §1.4; ability pings, §1.7), plus "Sci-Fi Sound
  Effects Library," "Dark Sci-Fi Sound Effects," and "Space Sounds." Also
  has music, not just SFX. Attribution needed only where a specific
  submission is CC-BY/BY-SA rather than CC0 — track it in `ATTRIBUTION.md`
  the same way the art packs already are.
- **Freesound.org** — the deepest library for oddly specific one-shots (an
  electrical-crackle loop, a meteor-impact thud, a tracking-hum texture,
  §2.1/§2.2's harder-to-find items), but licensing is mixed **per file** —
  CC0, CC-BY, and CC-BY-NC sit side by side in the same search results, and
  the built-in license filter is clunky enough that it's worth checking
  each file's license tag individually rather than trusting the search
  filter or the pack framing. CC-BY-NC hits are not usable here even under
  the "CC-BY/SA accepted" policy — NC was never part of that acceptance.
  Free account required to download.
- **Sonniss GDC bundle** — https://gdc.sonniss.com/, still an annual
  release (a 2026 edition shipped this spring). License: free, commercial
  use permitted, no attribution required, can't resell raw clips or claim
  authorship — one new wrinkle since older recommendations of this bundle
  is an explicit AI-training-use prohibition clause, not relevant to this
  project but worth knowing it's there. Professional Foley-grade content in
  bulk — good for the heavier sounds: Meteoroid impact (§1.2), the
  hard-fail/restart stinger (§1.3), tractor-beam engage (§2.3).
- **itch.io sci-fi SFX packs** (e.g. a "Free Sci-Fi UI Sound Effects Pack"
  with 100+ bleeps/clicks/glitches) — licensing is inconsistent
  per-creator, no site-wide CC0 guarantee the way Kenney/OpenGameArt have.
  Read each pack's license section individually before treating it as
  CC0/CC-BY equivalent, and credit in `ATTRIBUTION.md` per-pack rather than
  assuming public domain.

### 6.2 Music (§1.9)

- **FreePD.com** — https://freepd.com/scoring.php. True CC0 public domain,
  no attribution ever required. The "Scoring"/ambient categories include
  drone-style atmosphere tracks that fit a single loopable sci-fi bed —
  best current candidate for §1.9's one ambient background loop.
- **incompetech.com** (Kevin MacLeod) — still active, free with
  attribution (or a paid tier to waive it). Catalog skews orchestral/
  cinematic rather than ambient-loop sci-fi, so a better fit for a fanfare
  moment (puzzle-solved, §2.2; ability-unlocked or win, §1.8/§2.3) than the
  main background loop itself.

### 6.3 Suggested sourcing order

Kenney (covers most of §1.8 UI plus a chunk of §1.1/§1.7) + the two
OpenGameArt CC0 sci-fi packs (covers most of §1.2 hazards, §1.4 wormhole,
remaining §1.7 ability sounds) get most of the Required list (§1) in two
stops. Fill what's left — per-step puzzle tones (§2.2), the damage-stinger
variants (§1.2), and the distinct fanfares (§1.8) — from Freesound or the
Sonniss bundle where Kenney/OGA don't have a close match. Source everything
in §1 before spending time on §2.
