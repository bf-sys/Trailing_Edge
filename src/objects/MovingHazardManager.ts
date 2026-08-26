import type { HazardZoneElement } from './HazardZoneElement';
import type { LevelObjectiveTracker } from './LevelObjectiveTracker';
import { movingHazardConfig } from '../config/movingHazardConfig';
import { getPlayerShip } from '../systems/ExplorationController';

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
// it's aimed through a point derived from LevelObjectiveTracker's current
// target (getCurrentObjectiveTarget()), offset by a random jitter
// (movingHazardConfig.objectiveJitterRadius) so it's not a deterministic,
// exact beeline. That biases a respawned hazard's straight-line path to
// statistically cross the area the player is most likely traveling through
// right now, without guaranteeing a hit.
//
// Route bias (2026-08-25, user request -- "presence" pass, part 1 of 2; part
// 2 was a straight-line-arrival orbit loiter, tried the same day and reverted
// same day -- it made hazards visibly loop/veer in ways that read as buggy
// rather than deliberate, per direct playtest feedback. Kept: the pre-jitter
// point below is no longer always the objective's exact location -- it's
// sampled somewhere along the live segment from the player's *current*
// position to the objective (pickAimPoint()/pointAlongRoute() below), so aim
// points land throughout the corridor the player is actually traveling
// instead of clustering tightly at the destination.
export class MovingHazardManager {
  // Stall-detection safety net (2026-08-26) -- keyed per-hazard-instance,
  // reset whenever a hazard visibly moves or gets repositioned. See
  // isStalled()'s comment and movingHazardConfig.ts's stallDisplacementThresholdPx/
  // stallTimeoutSeconds for what this covers and why.
  private readonly lastPosition = new Map<HazardZoneElement, { x: number; y: number }>();
  private readonly stallElapsedMs = new Map<HazardZoneElement, number>();

  constructor(
    private readonly hazards: HazardZoneElement[],
    private readonly tracker: LevelObjectiveTracker,
    private readonly levelWidth: number,
    private readonly levelHeight: number,
  ) {}

  // deltaMs (GameScene.update()'s own delta) drives the stall timer below --
  // needed since this method's own call frequency is the only clock
  // available to it (no Scene/Clock reference is threaded through here).
  update(deltaMs: number): void {
    this.hazards.forEach((hazard) => {
      if (this.isOutOfBounds(hazard)) {
        this.respawn(hazard);
        this.resetStallTracking(hazard);
        return;
      }
      if (this.isStalled(hazard, deltaMs)) {
        this.respawn(hazard);
        this.resetStallTracking(hazard);
      }
    });
  }

  // A 'linear'/'trochoid' hazard is never supposed to sit still -- if one
  // has moved less than stallDisplacementThresholdPx for
  // stallTimeoutSeconds straight, treat it the same as drifting out of
  // bounds: this is the safety-net half of the 2026-08-26 fix for a
  // confirmed engine-level freeze (HazardZoneElement.update()'s own comment
  // has the full mechanism -- a glancing ship/hazard collision landing in
  // the same physics step as the ship's own world-bounds clamp could zero
  // both bodies' velocity). HazardZoneElement.update() now redrives
  // 'linear' velocity every frame, which should already prevent this from
  // ever persisting long enough to trip this check -- this exists as
  // defense-in-depth against any other not-yet-discovered way a hazard's
  // motion could get wedged, not as the primary fix.
  private isStalled(hazard: HazardZoneElement, deltaMs: number): boolean {
    const pos = hazard.getPosition();
    const last = this.lastPosition.get(hazard);
    this.lastPosition.set(hazard, pos);

    if (!last) return false; // first tick seeing this hazard -- nothing to compare against yet

    const moved = Math.hypot(pos.x - last.x, pos.y - last.y);
    if (moved >= movingHazardConfig.stallDisplacementThresholdPx) {
      this.stallElapsedMs.set(hazard, 0);
      return false;
    }

    const elapsedMs = (this.stallElapsedMs.get(hazard) ?? 0) + deltaMs;
    this.stallElapsedMs.set(hazard, elapsedMs);
    return elapsedMs >= movingHazardConfig.stallTimeoutSeconds * 1000;
  }

  private resetStallTracking(hazard: HazardZoneElement): void {
    this.lastPosition.set(hazard, hazard.getPosition());
    this.stallElapsedMs.set(hazard, 0);
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
    const aimPoint = this.pickAimPoint();
    const spawnPoint = this.randomPerimeterPoint();
    const headingRadians = Math.atan2(aimPoint.y - spawnPoint.y, aimPoint.x - spawnPoint.x);

    hazard.reposition(spawnPoint.x, spawnPoint.y, headingRadians);
  }

  // Pre-jitter point sampled along the player->objective segment (see the
  // class comment's route-bias section), then jittered the same way the
  // pure-objective version always was. Falls back to the plain objective
  // target if there's no ship yet (shouldn't happen in practice -- GameScene
  // spawns the ship before constructing this manager -- but getPlayerShip()
  // returns undefined until it does, so this is defensive, not load-bearing).
  private pickAimPoint(): { x: number; y: number } {
    const target = this.tracker.getCurrentObjectiveTarget();
    const ship = getPlayerShip();
    const base = ship ? this.pointAlongRoute(ship.image.x, ship.image.y, target.x, target.y) : target;

    const jitterAngle = Math.random() * Math.PI * 2;
    const jitterDist = Math.random() * movingHazardConfig.objectiveJitterRadius;
    return {
      x: base.x + Math.cos(jitterAngle) * jitterDist,
      y: base.y + Math.sin(jitterAngle) * jitterDist,
    };
  }

  private pointAlongRoute(fromX: number, fromY: number, toX: number, toY: number): { x: number; y: number } {
    const { routeBiasMin, routeBiasMax } = movingHazardConfig;
    const t = routeBiasMin + Math.random() * (routeBiasMax - routeBiasMin);
    return { x: fromX + (toX - fromX) * t, y: fromY + (toY - fromY) * t };
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
