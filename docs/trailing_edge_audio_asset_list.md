# Trailing Edge — Audio Asset List

*Draft v0.1, written 2026-08-21 — companion to `trailing_edge_art_asset_list.md`,
same Core/Content split (Core = fixed regardless of level count; Content =
scales with level count). Unlike the art list, this one isn't derived from
a GDD audio spec — §9's asset-procurement resolution explicitly decided
"no separate art/audio workstream needs to be carved out," so audio was
never scoped anywhere the way art was. This is the first pass at that
scoping, derived directly from what's actually implemented in `src/`
rather than from a design document.*

**Scope (owner decision, 2026-08-21):** covers everything currently built —
Phase 1's core loop plus Phase 2a's abilities and puzzle-taxonomy elements,
matching how the art asset list already covers built-but-unshipped Phase 2a
content (Signal Array, Scan Target, etc.). SFX are scoped one-per-hazard/
one-per-ability rather than coarser shared buckets, per GDD §5's
telegraphing emphasis — a distinct audio cue is one of the strongest
telegraphing tools available, especially for Solar Flare's already-required
pre-burst warning. Music starts as a single ambient loop covering the whole
game; splitting it by context is explicitly deferred, not decided against
(§1.8). This list describes *what's* needed, not *how* to source it
(licensed pack vs. AI-generated) — same restraint the art list itself
mostly keeps, leaving the "how" to a separate sourcing pass later.

---

## 1. Core Assets

### 1.1 Player Ship

| Asset | Notes |
|---|---|
| Thruster / movement loop | Plays while `ExplorationController` has the ship en route to a click-to-move destination; silent at rest. |
| Click-to-move confirm | A short tick on issuing a new destination — core-loop feedback rather than a menu interaction, listed here rather than in §1.7. |

### 1.2 Open-World Hazards (`hazardConfig.ts`, 5 types)

| Hazard | Behavior | Drains | Audio note |
|---|---|---|---|
| Debris Field | Static, blocks movement | None | A collision thud on contact with the solid Arcade collider — the only hazard whose "cost" is physical (blocked movement), not resource drain, so its sound should read as an impact/bump, not a hazard-warning tone. |
| Solar Flare | Dynamic, pulsed | Energy | **Needs a distinct pre-burst warning cue — the same GDD §5 telegraphing requirement the art list flags for its visual.** Audio may be the stronger telegraphing channel here than a static sprite is for a timed pulse; a rising tone or tick building to the burst is a natural fit. Plus a separate burst/hit sound on the pulse itself. |
| Ion Storm | Dynamic, drifting cloud | Energy | Ambient hum/crackle loop while in contact — should read as electrical, and distinct from Nebula Field's cue (see flag below). |
| Nebula Field | Static cloud | Energy | Ambient hum/drone loop while in contact — same "same visual family, needs to read as distinct" question the art list raises for Ion Storm (§1.2 there), now an audio question too. |
| Meteoroid | Dynamic, moving object | Structure | An impact/hit sound on contact — the sole structure-draining hazard, so this is the one hazard cue that should carry real weight/danger, distinct from the three energy-hazard cues above. |

**Flag:** Ion Storm/Nebula Field's shared-visual-family question (art list
§1.2, GDD §9) has an audio parallel — if the sprites are hard to tell apart
at a glance, distinct sound identities become one of the few remaining ways
to tell them apart at all (their only current *mechanical* difference is
motion). Worth deciding alongside the visual differentiation question, not
separately from it.

**Flag:** whether a hazard's own ambient/impact sound plays *instead of* or
*alongside* a generic damage-taken cue (§1.6 below) is an open design
question — not decided here.

### 1.3 Puzzle-Site Elements (`objects/puzzle/`, 5 types) — Phase 2a, optional/additive; no real level places one yet

| Element | Class | Audio note |
|---|---|---|
| Signal Array (sequence) | `SequenceSpotElement` | Per-step correct/incorrect tone, distinct from the full-sequence-solved fanfare below. |
| Scan Target / Marker | `ScanInteractElement` | Interact/success chime — likely the cheapest audio item on this list, same reasoning the art list gives for its sprite (§1.3 there). |
| Comet (tracking) | `MovingSpotDurationElement` | A tracking-in-progress tone/hum while the ship stays within the moving spot's radius, distinct from losing track (silence, or a negative blip) and from completion. |
| Cargo Pod / Wreckage (push/pull) | `PushPullObjectElement` | A mechanical push/scrape sound while being moved (position/velocity tweened, per CLAUDE.md's Arcade-physics tradeoffs — not real force application) — should read as effortful, not frictionless. |
| Beacon Cluster (trail/encircle) | `TrailDrawElement` | A progress tone while drawing the trail, distinct from the completion cue. |

Shared across all five: a **puzzle-site-solved fanfare**. `PuzzleSite`
already emits a clean `onSiteSolved` event (`objects/PuzzleSite.ts`) every
one of these can hook into — a single shared sound (or a shared base with
per-type variation) is a reasonable default rather than five entirely
separate solve-fanfares.

### 1.3a Core-Loop Objects (required every level)

| Object | Audio note |
|---|---|
| Probe | Discovery/pickup chime on arrival (`ProbeObject.onPlayerArrival()`). |
| Relay Beacon | Waypoint-reached chime, distinct from the Probe's — two different moments in the loop, and should sound like it even though there's no visual-identity confusion risk between the two objects. |
| Entry Wormhole | Visual-only, no player interaction (CLAUDE.md) — likely doesn't need a dedicated sound. An ambient "wormhole hum" while nearby is a reasonable optional touch, not a requirement. |
| Exit Wormhole | Two distinct moments, don't conflate into one sound: an "opens" cue when it tints active (beacon reached), and a separate transition sound on entering it to complete the level. |

### 1.4 Resupply Points

| Asset | Notes |
|---|---|
| AsteroidField (structure repair) | A repair tick/loop while overlapping and `repairStructure()` is firing — should read as constructive/healing, deliberately contrasting with the hazard-contact sounds in §1.2 (mirrors the art list's Debris-Field-vs-AsteroidField "avoid vs. approach" contrast, §1.2/§1.4 there). |

### 1.5 In-World Ability Activation Audio (mirrors the art list's §1.5 ability-VFX gap)

`abilityConfig.ts`'s three unlockable abilities, plus `tractorBeam`
(always-unlocked, no player-facing UI since the 2026-08-14 rework, but
still mechanically active):

- **Scan** — an activation cue on `tryActivate()`, matching its "reveal
  hazards" mechanic; a ping or pulse is a natural fit.
- **Teleport** — two moments, not one: an arm sound on entering aim state
  (`isTeleportArmed()`), and a distinct blink/teleport sound on confirm.
- **Rocket Boost** — a thruster burst sound for the straight-line speed
  burst.
- **Tractor Beam** — an engage/pull sound while active on a
  `PushPullObjectElement`'s Cargo Pod — de-scoped from player-facing UI but
  still mechanically real, so still needs a sound if it's used at all.

**Flag:** same gap the art list names for VFX (§1.5 there) — none of these
are named as a requirement anywhere in the GDD; they're implied by the
ability existing at all. Worth scoping alongside the still-unsourced VFX
for the same abilities, since a matched sound+VFX pair will likely read
better designed together than sourced separately.

### 1.6 Survival Feedback

| Asset | Notes |
|---|---|
| Taking structure damage | A generic damage-taken stinger, distinct from any specific hazard's own contact sound — see §1.2's flag on whether these coexist or one replaces the other (not decided). |
| Taking energy damage | Same open question, energy side. |
| Hard-fail / restart | Structure hits zero (`SHIP_SURVIVAL_EVENTS.StructureDepleted`, `GameScene.wireHardFailRestart()`) — a distinct failure stinger. This is a real narrative beat (a full level restart), not just another damage tick, and should sound like one. |

**Flag:** there's currently no low-resource warning system in the game (no
"energy critical" / "structure critical" alert anywhere in
`ShipSurvivalComponent` or `ShipStatusArcs`) — not listing a sound for one
here, since that would mean inventing a feature alongside an asset need. If
that system gets built later, it'll need its own audio pass.

### 1.7 UI / Menu / Scenes

| Scene / interaction | Audio note |
|---|---|
| Menu click (Start / Continue / Test Level / Resume / Return to Title / Close) | One shared click sound is probably enough — these are all the same kind of interaction (`setInteractive` + `pointerdown` text buttons) across `TitleScene`/`PauseScene`/`AbilityUnlockScene`. |
| Hover | Optional. None of the current buttons have a distinct hover *visual* state either, so a hover sound isn't obviously warranted — flagging rather than assuming it's needed. |
| Pause open / close | Distinct from the generic menu click above — a "the game paused" cue, not just a button press. |
| Ability unlocked (`AbilityUnlockScene`) | A distinct fanfare, separate from the puzzle-site-solved fanfare (§1.3) and the win fanfare below — three different "you achieved something" moments that shouldn't all sound identical. |
| Level complete / `WinScene` | GDD explicitly defers content here ("fine to keep minimal," per the art list's §1.7) — likely the same for audio: lowest-priority scene, don't over-invest. Still the game's one true ending, though, and probably deserves more than reusing the ability-unlock fanfare. |
| `BootScene` | No player-facing time here currently (straight through to `TitleScene`) — likely no dedicated audio need. |

### 1.8 Music

| Asset | Notes |
|---|---|
| Ambient background loop | **Scope decided 2026-08-21: start with a single loop covering the whole game**, menu included. Splitting into distinct Menu/Title vs. in-level Exploration tracks is explicitly deferred, not decided against — see Flag. |

**Flag:** whether one loop stays the long-term answer, or gets split by
context (menu vs. gameplay, or even calmer-vs-denser by hazard density)
later, is an open decision — revisit once the single loop is in and
playtested, same "validate with something real before deciding on paper"
instinct the GDD applies to Ion Storm/Nebula Field's visual differentiation
(§9).

---

## 2. Content Assets

### 2.1 Per-Level

No new audio per level, same reasoning the art list gives for hazard/
puzzle placement (§2.2 there): `HazardZoneElement`'s one-class/many-configs
collapse means a hazard's sound is a property of its *type*, not its
placement. Listed here only so it isn't mistaken for a content-audio line
item.

---

## 3. Explicit Non-Requirements

Same three exclusions the art list states (GDD §10), audio side:

- No combat system → no weapon/impact SFX, no enemy vocalizations or
  movement sounds
- No control-remapping UI in the initial build → nothing audio-specific
  here
- No 4X / empire-management layer → no strategic-map audio

---

## 4. Open Items Carried Into Sourcing

- Ion Storm vs. Nebula Field audio identity — tied to the same still-open
  visual differentiation question (GDD §9); see §1.2's flag above.
- Hazard-contact sound vs. generic damage-taken sound — do they coexist, or
  does one replace the other per hazard? Not decided; see §1.2/§1.6 flags.
- Ability activation audio — not named as a requirement anywhere in the
  GDD, the same gap the art list names for ability VFX (§1.5 there); worth
  scoping the two together rather than separately.
- Music context split (menu vs. gameplay) — deliberately deferred, not
  decided against; revisit after the single loop is in and playtested.
- No low-resource warning system exists yet to source audio for — flagged
  so it isn't later mistaken for an existing gap that was simply missed.

---

## 5. Sourcing Recommendations (researched 2026-08-21)

Where to look for CC0/CC-BY audio matching the categories above — same
"describe what's needed, leave how-to-source for a separate pass" restraint
this doc opens with, now that separate pass has happened. Mirrors
`ATTRIBUTION.md`'s existing license-tracking discipline: CC0 preferred, but
CC-BY/CC-BY-SA already accepted for this build (per the art-sourcing
precedent), so it's a usable fallback, not a hard blocker.

### 5.1 General-purpose sources

- **Kenney.nl (audio)** — https://kenney.nl/assets?q=audio. All CC0, no
  account or attribution required, same pack/zip pattern already used for
  Kenney's *art* packs (Space Shooter Remastered, Simple Space, UI Pack -
  Sci-Fi — see `ATTRIBUTION.md`). Three relevant packs, confirmed live:
  **Sci-fi Sounds** (engine/space one-shots — thruster loop candidate,
  §1.1; several §1.5 ability sounds), **Interface Sounds**, and the newer
  **UI Audio** (clicks/confirms/menu cues — direct fit for §1.7). Given the
  existing art pipeline already leans on Kenney, this is the obvious first
  stop for consistency alone.
- **OpenGameArt.org** — pre-curated packs (not loose clips), filterable by
  license on the browse page — same site already used for the Objects.zip
  debris/asteroid pack (see `phase1-manifest-and-tasks.md`). CC0 sci-fi
  packs worth checking first: "60 CC0 Sci-Fi SFX" and its companion "50 CC0
  Sci-Fi SFX" (lasers, metallic hits, ambient hums, warp/terminal tones —
  candidates for Ion Storm's crackle and Nebula Field's drone, §1.2; a
  wormhole-warp cue, §1.3a; ability pings, §1.5), plus "Sci-Fi Sound
  Effects Library," "Dark Sci-Fi Sound Effects," and "Space Sounds." Also
  has music, not just SFX. Attribution needed only where a specific
  submission is CC-BY/BY-SA rather than CC0 — track it in `ATTRIBUTION.md`
  the same way the art packs already are.
- **Freesound.org** — the deepest library for oddly specific one-shots (an
  electrical-crackle loop, a meteor-impact thud, a tracking-hum texture,
  §1.2/§1.3's harder-to-find items), but licensing is mixed **per file** —
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
  hard-fail/restart stinger (§1.6), tractor-beam engage (§1.5).
- **itch.io sci-fi SFX packs** (e.g. a "Free Sci-Fi UI Sound Effects Pack"
  with 100+ bleeps/clicks/glitches) — licensing is inconsistent
  per-creator, no site-wide CC0 guarantee the way Kenney/OpenGameArt have.
  Read each pack's license section individually before treating it as
  CC0/CC-BY equivalent, and credit in `ATTRIBUTION.md` per-pack rather than
  assuming public domain.

### 5.2 Music (§1.8)

- **FreePD.com** — https://freepd.com/scoring.php. True CC0 public domain,
  no attribution ever required. The "Scoring"/ambient categories include
  drone-style atmosphere tracks that fit a single loopable sci-fi bed —
  best current candidate for §1.8's one ambient background loop.
- **incompetech.com** (Kevin MacLeod) — still active, free with
  attribution (or a paid tier to waive it). Catalog skews orchestral/
  cinematic rather than ambient-loop sci-fi, so a better fit for a fanfare
  moment (puzzle-solved, §1.3; ability-unlocked or win, §1.7) than the main
  background loop itself.

### 5.3 Suggested sourcing order

Kenney (covers most of §1.7 UI plus a chunk of §1.1/§1.5) + the two
OpenGameArt CC0 sci-fi packs (covers most of §1.2 hazards, §1.3a wormhole,
remaining §1.5 ability sounds) get most of this list in two stops. Fill
what's left — per-step puzzle tones (§1.3), the two damage-stinger
variants (§1.6), and the distinct fanfares (§1.3/§1.7) — from Freesound or
the Sonniss bundle where Kenney/OGA don't have a close match.
