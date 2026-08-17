import type { HazardZoneElement } from './HazardZoneElement';
import type { LevelObjectiveTracker } from './LevelObjectiveTracker';
import { movingHazardConfig } from '../config/movingHazardConfig';

// Keeps 'linear' movementPattern hazards (Ion Storm, Meteoroid -- the only
// two hazardConfig.ts entries using that pattern) inside a level instead of
// letting them drift off into the world bounds and never come back
// (GDD §9/§11.3). GameScene owns one of these per level, same lifecycle as
// this.hazards/this.resupplyPoints -- reset each create(), not a
// SystemRegistry singleton, since moving-hazard state has no reason to
// survive a hard-fail restart the way ProgressionManager's unlocks do.
//
// Design (2026-08-17, chosen over a destroy/respawn pool -- see the
// conversation this followed): wrap, don't replace. Each managed
// HazardZoneElement is a fixed instance for the whole level; when its
// position drifts past the level bounds (by more than its own radius, so
// it's fully offscreen first), it's repositioned to a fresh point on the
// level's perimeter with a new heading, via HazardZoneElement.reposition().
// Same object, same array, same length, the whole level -- so
// HazardScanOverlay's "one label per hazard, created once" assumption
// (see its class comment) never has to change.
//
// Objective-biasing: the new heading isn't a uniformly random direction --
// it's aimed through a point near LevelObjectiveTracker's current target
// (getCurrentObjectiveTarget(), the same read-only getter HudOverlay's
// off-screen marker already polls), offset by a random jitter
// (movingHazardConfig.objectiveJitterRadius) so it's not a deterministic,
// exact beeline. That biases a respawned hazard's straight-line path to
// statistically cross the area the player is most likely traveling through
// right now, without guaranteeing a hit.
export class MovingHazardManager {
  constructor(
    private readonly hazards: HazardZoneElement[],
    private readonly tracker: LevelObjectiveTracker,
    private readonly levelWidth: number,
    private readonly levelHeight: number,
  ) {}

  update(): void {
    this.hazards.forEach((hazard) => {
      if (this.isOutOfBounds(hazard)) this.respawn(hazard);
    });
  }

  private isOutOfBounds(hazard: HazardZoneElement): boolean {
    const { x, y } = hazard.getPosition();
    const radius = this.radiusOf(hazard);
    return x < -radius || x > this.levelWidth + radius || y < -radius || y > this.levelHeight + radius;
  }

  private radiusOf(hazard: HazardZoneElement): number {
    const shape = hazard.getShape();
    return shape.kind === 'circle' ? shape.radius : Math.max(shape.width, shape.height) / 2;
  }

  private respawn(hazard: HazardZoneElement): void {
    const target = this.tracker.getCurrentObjectiveTarget();
    const jitterAngle = Math.random() * Math.PI * 2;
    const jitterDist = Math.random() * movingHazardConfig.objectiveJitterRadius;
    const aimPoint = {
      x: target.x + Math.cos(jitterAngle) * jitterDist,
      y: target.y + Math.sin(jitterAngle) * jitterDist,
    };

    const spawnPoint = this.randomPerimeterPoint();
    const headingRadians = Math.atan2(aimPoint.y - spawnPoint.y, aimPoint.x - spawnPoint.x);

    hazard.reposition(spawnPoint.x, spawnPoint.y, headingRadians);
  }

  // Unweighted per-edge pick (not perimeter-length-weighted) -- exact
  // uniformity across a non-square level doesn't matter for this purpose,
  // and the simpler version is easier to read/tune.
  private randomPerimeterPoint(): { x: number; y: number } {
    const edge = Math.floor(Math.random() * 4);
    switch (edge) {
      case 0:
        return { x: Math.random() * this.levelWidth, y: 0 }; // top
      case 1:
        return { x: this.levelWidth, y: Math.random() * this.levelHeight }; // right
      case 2:
        return { x: Math.random() * this.levelWidth, y: this.levelHeight }; // bottom
      default:
        return { x: 0, y: Math.random() * this.levelHeight }; // left
    }
  }
}
