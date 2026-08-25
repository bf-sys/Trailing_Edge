import Phaser from 'phaser';
import { EnergyNodeElement } from './EnergyNodeElement';
import type { HazardZoneElement } from './HazardZoneElement';
import type { LevelObjectiveTracker } from './LevelObjectiveTracker';
import type { Point } from '../levels/levelTypes';
import { energyNodeConfig, computeEnergyNodePoolSize } from '../config/energyNodeConfig';

// Owns the fixed pool of EnergyNodeElement pickups for one level (2026-08-24
// energy-node feature). Same GameScene-owned, reset-per-create(), not-a-
// SystemRegistry-singleton lifecycle as MovingHazardManager, since node
// positions/cooldowns have no reason to survive a hard-fail restart. Wraps a
// fixed set of instances (sized via computeEnergyNodePoolSize -- scales with
// this level's area, 2026-08-25) rather than destroying/creating on pickup --
// same "wrap, don't replace" choice MovingHazardManager made for hazards.
//
// Placement (both the initial scatter and every respawn) is rejection-
// sampled against two keep-outs: never inside a blocksMovement hazard's own
// footprint, and never within entryKeepOutRadius of the level's Entry
// Wormhole. A respawn additionally biases toward the current objective --
// the same aim-a-point-near-the-target-plus-jitter idea
// MovingHazardManager uses for a hazard's respawn heading, except here the
// jittered point IS the landing position (a scatter radius), not a
// direction to travel through -- capped by maxNodesNearObjective so that
// bias can't pile an unbounded number of nodes on one spot (see
// pickRespawnPosition below).
export class EnergyNodeManager {
  private readonly nodes: EnergyNodeElement[] = [];

  constructor(
    scene: Phaser.Scene,
    private readonly hazards: HazardZoneElement[],
    private readonly tracker: LevelObjectiveTracker,
    private readonly entryWormholeLocation: Point,
    private readonly levelWidth: number,
    private readonly levelHeight: number,
  ) {
    const poolSize = computeEnergyNodePoolSize(levelWidth, levelHeight);
    for (let i = 0; i < poolSize; i++) {
      this.nodes.push(new EnergyNodeElement(scene, this.pickScatterPosition()));
    }
  }

  update(time: number, delta: number): void {
    this.nodes.forEach((node) => {
      node.update(time, delta);
      if (node.isReadyToRespawn()) {
        const position = this.pickRespawnPosition();
        node.respawnAt(position.x, position.y);
      }
    });
  }

  private pickScatterPosition(): Point {
    for (let attempt = 0; attempt < energyNodeConfig.placementAttempts; attempt++) {
      const candidate = { x: Math.random() * this.levelWidth, y: Math.random() * this.levelHeight };
      if (this.isValidPlacement(candidate)) return candidate;
    }
    // Degrade gracefully rather than loop forever -- clamped inside the edge
    // margin so even the unchecked fallback never lands flush against a wall.
    return this.clampToEdgeMargin(Math.random() * this.levelWidth, Math.random() * this.levelHeight);
  }

  // Uniform-in-disk sampling (sqrt of a uniform radius fraction) around the
  // current objective target, same technique ResupplyPoint.pickImpactPoint()
  // uses -- a plain `Math.random() * radius` would cluster points toward the
  // center instead of spreading evenly across the disk.
  //
  // Capped by maxNodesNearObjective (2026-08-25): every node in the pool
  // biases toward the same single objective, so on a large, scaled-up pool
  // a player lingering near one objective could otherwise cause a
  // comically dense pickup cluster to accumulate there over time. Checked
  // fresh on every call (a live count, not a running tally), so it
  // self-corrects as nodes move away and needs no reset when the objective
  // changes.
  private pickRespawnPosition(): Point {
    const target = this.tracker.getCurrentObjectiveTarget();
    const nodesNearObjective = this.nodes.filter(
      (node) =>
        node.isLive() &&
        Phaser.Math.Distance.Between(node.getPosition().x, node.getPosition().y, target.x, target.y) <=
          energyNodeConfig.respawnJitterRadius,
    ).length;
    if (nodesNearObjective >= energyNodeConfig.maxNodesNearObjective) {
      return this.pickScatterPosition();
    }

    for (let attempt = 0; attempt < energyNodeConfig.placementAttempts; attempt++) {
      const r = energyNodeConfig.respawnJitterRadius * Math.sqrt(Math.random());
      const angle = Math.random() * Math.PI * 2;
      const candidate = this.clampToEdgeMargin(target.x + Math.cos(angle) * r, target.y + Math.sin(angle) * r);
      if (this.isValidPlacement(candidate)) return candidate;
    }
    // Fallback clamps the target itself into the margin too -- an objective
    // authored close to a level edge shouldn't produce an edge-flush node.
    return this.clampToEdgeMargin(target.x, target.y);
  }

  // Old behavior clamped a jittered respawn candidate straight to [0, width]/
  // [0, height] -- landing a node exactly on the boundary whenever the
  // current objective sat near an edge (respawn bias points toward the
  // objective, not away from map edges). Clamping into
  // energyNodeConfig.edgeMargin instead of the raw bound keeps every
  // placement -- scatter, respawn, and both fallbacks -- visibly clear of
  // the wall.
  private clampToEdgeMargin(x: number, y: number): Point {
    const { edgeMargin } = energyNodeConfig;
    return {
      x: Phaser.Math.Clamp(x, edgeMargin, this.levelWidth - edgeMargin),
      y: Phaser.Math.Clamp(y, edgeMargin, this.levelHeight - edgeMargin),
    };
  }

  private isValidPlacement(point: Point): boolean {
    const { edgeMargin } = energyNodeConfig;
    if (
      point.x < edgeMargin ||
      point.x > this.levelWidth - edgeMargin ||
      point.y < edgeMargin ||
      point.y > this.levelHeight - edgeMargin
    ) {
      return false;
    }

    const distanceToEntry = Phaser.Math.Distance.Between(
      point.x,
      point.y,
      this.entryWormholeLocation.x,
      this.entryWormholeLocation.y,
    );
    if (distanceToEntry < energyNodeConfig.entryKeepOutRadius) return false;

    return this.hazards.every((hazard) => {
      if (!hazard.getBlocksMovement()) return true;
      const hazardPosition = hazard.getPosition();
      const shape = hazard.getShape();
      const hazardRadius = shape.kind === 'circle' ? shape.radius : Math.max(shape.width, shape.height) / 2;
      const distance = Phaser.Math.Distance.Between(point.x, point.y, hazardPosition.x, hazardPosition.y);
      return distance > hazardRadius + energyNodeConfig.radius + energyNodeConfig.hazardKeepOutBuffer;
    });
  }
}
