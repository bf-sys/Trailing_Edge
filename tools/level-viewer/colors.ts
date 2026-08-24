// Color/shape language for the level viewer. Hazard and puzzle-element
// colors are pulled straight from the real game config (hazardConfig.ts's
// placeholderTexture, puzzleConfig.ts's per-element *Color fields) so the
// viewer's legend matches what a playtester actually sees in-browser rather
// than inventing a second, drifting palette. Objective/resupply colors have
// no in-game equivalent to match (EntryWormhole/ExitWormhole/RelayBeaconObject
// share one active/inactive *tint*, not a fixed per-object hue -- see
// waypointTintConfig.ts -- so there's nothing to reuse there), so those are
// this tool's own palette, chosen only for legibility against the dark canvas.
import { hazardConfig, type HazardType } from '../../src/config/hazardConfig';
import { puzzleConfig } from '../../src/config/puzzleConfig';
import type { PuzzleElementPlacement } from '../../src/levels/levelTypes';

export function hexColor(n: number): string {
  return '#' + n.toString(16).padStart(6, '0');
}

// Debris Field, Ion Storm, Nebula Field, and Meteoroid have no
// placeholderTexture in hazardConfig.ts -- all four now have final sourced
// art loaded in-game (Ion Storm/Nebula Field/Meteoroid since 2026-08-21/22's
// art/collision passes), so there's no placeholder hex to reuse. Fallback
// hues chosen only for legibility/distinctness against the dark canvas and
// each other. Solar Flare is the only hazard still on placeholder art as of
// this tool's last update -- see docs/STATUS.md.
const DEBRIS_FIELD_COLOR = '#8a7f6b';
const ION_STORM_COLOR = '#818cf8';
const NEBULA_FIELD_COLOR = '#c084fc';
const METEOROID_COLOR = '#f87171';

export const HAZARD_COLORS: Record<HazardType, string> = {
  debrisField: DEBRIS_FIELD_COLOR,
  solarFlare: hexColor(hazardConfig.solarFlare.placeholderTexture!.color),
  ionStorm: ION_STORM_COLOR,
  nebulaField: NEBULA_FIELD_COLOR,
  meteoroid: METEOROID_COLOR,
};

export const HAZARD_LABELS: Record<HazardType, string> = {
  debrisField: hazardConfig.debrisField.displayName,
  solarFlare: hazardConfig.solarFlare.displayName,
  ionStorm: hazardConfig.ionStorm.displayName,
  nebulaField: hazardConfig.nebulaField.displayName,
  meteoroid: hazardConfig.meteoroid.displayName,
};

export const HAZARD_TYPES: HazardType[] = ['debrisField', 'solarFlare', 'ionStorm', 'nebulaField', 'meteoroid'];

export type PuzzleType = PuzzleElementPlacement['type'];

export const PUZZLE_TYPES: PuzzleType[] = [
  'scanInteract',
  'sequenceSpot',
  'trailDraw',
  'movingSpotDuration',
  'pushPullObject',
];

export const PUZZLE_LABELS: Record<PuzzleType, string> = {
  scanInteract: 'Scan Target (ScanInteract)',
  sequenceSpot: 'Signal Array (SequenceSpot)',
  trailDraw: 'Beacon Cluster (TrailDraw)',
  movingSpotDuration: 'Comet (MovingSpotDuration)',
  pushPullObject: 'Cargo Pod (PushPullObject)',
};

export const PUZZLE_COLORS: Record<PuzzleType, string> = {
  scanInteract: hexColor(puzzleConfig.scanInteractColor),
  sequenceSpot: hexColor(puzzleConfig.sequenceSpotColor),
  trailDraw: hexColor(puzzleConfig.beaconMarkerColor),
  movingSpotDuration: hexColor(puzzleConfig.movingSpotColor),
  pushPullObject: hexColor(puzzleConfig.pushPullPodColor),
};

export const OBJECTIVE_COLORS = {
  entry: '#38bdf8',
  exit: '#fb923c',
  probe: '#facc15',
  beacon: '#a78bfa',
} as const;

export const RESUPPLY_COLOR = '#34d399';
export const PUSH_PULL_TARGET_COLOR = hexColor(puzzleConfig.pushPullTargetColor);
