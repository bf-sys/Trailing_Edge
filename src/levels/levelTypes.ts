import type { HazardType } from '../config/hazardConfig';

export interface Point {
  x: number;
  y: number;
}

export interface HazardPlacement {
  type: HazardType;
  x: number;
  y: number;
  // Per-instance overrides, both optional -- fall back to hazardConfig.ts's
  // type-level textureKey/no-rotation default when omitted. Added so a
  // single hazard type (e.g. Debris Field's three sourced art variants) can
  // vary per placement -- e.g. chaining several instances into a wall reads
  // as repeated content without it. Purely visual: neither affects
  // HazardZoneElement's collision shape (its Arcade body is sized from
  // config.shape, not the texture, per CLAUDE.md's asset/gameplay-size
  // decoupling rule; a circle body is rotation-invariant regardless).
  textureKey?: string;
  rotationRadians?: number;
}

export interface ResupplyPlacement {
  x: number;
  y: number;
  textureKey: string;
  radius: number;
}

// One variant per PuzzleElementBase subtype (GDD §11.3) -- each carries only
// the placement data its constructor needs; per-type visual/behavior
// tunables stay in puzzleConfig.ts, same split as HazardPlacement/hazardConfig.
export type PuzzleElementPlacement =
  | { type: 'scanInteract'; x: number; y: number }
  | { type: 'sequenceSpot'; points: Point[] }
  | { type: 'trailDraw'; beaconPoints: Point[] }
  | { type: 'movingSpotDuration'; path: Point[] }
  | { type: 'pushPullObject'; x: number; y: number; targetX: number; targetY: number };

// One hand-authored config per level (CLAUDE.md's tech-stack contract --
// "Hand-authored TS/JSON level configs, not Tiled. One config file per
// level"). GameScene reads this instead of hardcoding placements inline, so
// a new level is a new file under src/levels/, not an edit to GameScene's
// create(). probeLocation/relayBeaconLocation/entryWormholeLocation/
// exitWormholeLocation are required every level (GDD §11.7); hazards,
// resupplyPoints, and puzzleElements may be empty arrays.
export interface LevelConfig {
  width: number;
  height: number;
  entryWormholeLocation: Point;
  exitWormholeLocation: Point;
  probeLocation: Point;
  relayBeaconLocation: Point;
  hazards: HazardPlacement[];
  resupplyPoints: ResupplyPlacement[];
  puzzleElements: PuzzleElementPlacement[];
}
