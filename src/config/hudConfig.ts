import { registerTuning } from './devTuning';
import { shipStatusArcConfig } from './shipStatusArcConfig';

// Off-screen objective marker (resolves GDD §9's off-screen-objective-
// visibility open question): a single edge-pinned arrow is sufficient since
// Probe -> Relay Beacon -> Exit Wormhole is a strictly linear sequence, so
// only one objective is ever "current".
export const hudConfig = {
  objectiveMarkerEdgeMargin: 32, // px inset from the viewport edge
  objectiveMarkerSize: 18, // px, arrow triangle size
  objectiveMarkerColor: 0xffcc33,
  // 2026-08-14 ability rework: the marker is no longer always-on -- visible
  // only while scan's duration window is active, plus this one-shot flash
  // window (level start, probe found, beacon reached) so a player is never
  // left with zero information right when the game changes what it's
  // asking of them, regardless of energy state.
  objectiveMarkerFlashSeconds: 2,

  // Resupply waypoint marker (2026-08-21, TODO.md's "Resupply waypoint
  // during scan") -- a second edge-pinned arrow, same shape/positioning
  // logic as the objective marker above, pointing at the nearest
  // AsteroidField ResupplyPoint while scan is active. No flash window of
  // its own (unlike the objective marker) -- resupply isn't tied to a
  // level-start/probe-found/beacon-reached moment, only to scan.
  // Color matches shipStatusArcConfig.structureColor (the structure bar
  // under the ship) on purpose -- same visual language for "this is about
  // structure/healing" wherever it shows up. Smaller than
  // objectiveMarkerSize on purpose too, to read as secondary/optional
  // information next to the mandatory objective.
  resupplyMarkerSize: 14,
  resupplyMarkerColor: shipStatusArcConfig.structureColor,

  // Ability icons (GDD §11.10, completed 2026-08-10/Phase 2a) -- one square
  // per AbilityType in abilityConfig, left-to-right in authored order,
  // reoccupying the screen-pinned top-left corner ShipStatusArcs's arcs/bar
  // vacated. Locked abilities render dimmed; a cooldown sweep (reusing
  // ShipStatusArcs's arc-drawing technique) covers an unlocked-but-cooling
  // icon proportional to time remaining.
  abilityIconX: 16,
  abilityIconY: 16,
  abilityIconSize: 32,
  abilityIconSpacing: 8,
  abilityIconLockedAlpha: 0.35,
  abilityIconColors: {
    scan: 0x8fd3ff,
    tractorBeam: 0xc9a26b,
    teleport: 0xd88fff,
    rocketBoost: 0xff8a4c,
  } as Record<string, number>,
  abilityCooldownOverlayColor: 0x000000,
  abilityCooldownOverlayAlpha: 0.6,

  // Puzzle-site-active indicator (GDD §11.10, completed 2026-08-10/Phase
  // 2a) -- GDD explicitly allows "even just a highlight or icon," so this
  // is a single small text label shown while the ship is near any unsolved
  // PuzzleSite, hidden otherwise. GameScene registers site positions via
  // HudOverlay.setPuzzleSites() once Phase 2a's test-level instances exist
  // (Step 5) -- with none registered, this never shows, which is correct
  // for any scene without puzzle-site content yet.
  puzzleSiteIndicatorRadius: 220, // px -- ship-to-site distance that counts as "nearby"
  puzzleSiteIndicatorY: 60,
};

registerTuning('hud', hudConfig);
