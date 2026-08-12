import Phaser from 'phaser';
import { PuzzleElementBase } from '../objects/PuzzleElementBase';
import { ScanInteractElement } from '../objects/puzzle/ScanInteractElement';
import { SequenceSpotElement } from '../objects/puzzle/SequenceSpotElement';
import { TrailDrawElement } from '../objects/puzzle/TrailDrawElement';
import { MovingSpotDurationElement } from '../objects/puzzle/MovingSpotDurationElement';
import { PushPullObjectElement } from '../objects/puzzle/PushPullObjectElement';
import type { Point, PuzzleElementPlacement } from './levelTypes';

// Level-config -> live instance, one branch per PuzzleElementPlacement
// variant. Keeps GameScene from importing all five puzzle subtype classes
// directly -- it only needs this factory and PuzzleElementBase.
export function createPuzzleElement(scene: Phaser.Scene, placement: PuzzleElementPlacement): PuzzleElementBase {
  switch (placement.type) {
    case 'scanInteract':
      return new ScanInteractElement(scene, { x: placement.x, y: placement.y });
    case 'sequenceSpot':
      return new SequenceSpotElement(scene, { points: placement.points });
    case 'trailDraw':
      return new TrailDrawElement(scene, { beaconPoints: placement.beaconPoints });
    case 'movingSpotDuration':
      return new MovingSpotDurationElement(scene, { path: placement.path });
    case 'pushPullObject':
      return new PushPullObjectElement(scene, {
        x: placement.x,
        y: placement.y,
        targetX: placement.targetX,
        targetY: placement.targetY,
      });
  }
}

// Where HudOverlay's puzzle-site indicator should anchor for a given
// placement -- the element's own anchor point for single-point types, or
// the centroid of its authored points for multi-point types (matches the
// hand-picked marker positions GameScene used before this became
// data-driven -- e.g. sequenceSpot's 3-point array centroids to within a
// couple px of the old hardcoded marker).
export function puzzleSiteMarkerPosition(placement: PuzzleElementPlacement): Point {
  switch (placement.type) {
    case 'scanInteract':
    case 'pushPullObject':
      return { x: placement.x, y: placement.y };
    case 'sequenceSpot':
      return centroid(placement.points);
    case 'trailDraw':
      return centroid(placement.beaconPoints);
    case 'movingSpotDuration':
      return centroid(placement.path);
  }
}

function centroid(points: Point[]): Point {
  const sum = points.reduce((acc, p) => ({ x: acc.x + p.x, y: acc.y + p.y }), { x: 0, y: 0 });
  return { x: sum.x / points.length, y: sum.y / points.length };
}
