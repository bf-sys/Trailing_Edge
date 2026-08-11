import Phaser from 'phaser';
import { PuzzleElementBase } from '../PuzzleElementBase';
import { getPlayerShip } from '../../systems/ExplorationController';
import { puzzleConfig } from '../../config/puzzleConfig';

const BEACON_MARKER_TEXTURE_KEY = 'puzzle_beacon_marker';

function createBeaconMarkerTexture(scene: Phaser.Scene, radius: number, color: number): void {
  if (scene.textures.exists(BEACON_MARKER_TEXTURE_KEY)) return;

  const diameter = radius * 2;
  const graphics = scene.make.graphics({}, false);
  graphics.fillStyle(color, 1);
  graphics.fillCircle(radius, radius, radius);
  graphics.generateTexture(BEACON_MARKER_TEXTURE_KEY, diameter, diameter);
  graphics.destroy();
}

export interface TrailDrawConfig {
  beaconPoints: { x: number; y: number }[];
}

interface TrailPoint {
  x: number;
  y: number;
  t: number;
}

// Beacon Cluster (GDD §6/§9/§11.3) -- fly a loop that encircles every
// beacon point to solve. Records the ship's recent path into a rolling
// window (dropping points older than trailMaxAgeMs, so this reads as "your
// current loop," not your entire flight history), draws it live via
// Graphics, and tests encirclement with a standard ray-casting
// point-in-polygon check once the path's start/end are close enough to
// count as "closed."
export class TrailDrawElement extends PuzzleElementBase {
  private readonly beacons: Phaser.GameObjects.Image[];
  private readonly beaconPoints: { x: number; y: number }[];
  private readonly graphics: Phaser.GameObjects.Graphics;
  private readonly trail: TrailPoint[] = [];
  private lastSampleAtMs = -Infinity;

  constructor(scene: Phaser.Scene, config: TrailDrawConfig) {
    super();

    this.beaconPoints = config.beaconPoints;
    createBeaconMarkerTexture(scene, puzzleConfig.beaconMarkerRadius, puzzleConfig.beaconMarkerColor);
    this.beacons = this.beaconPoints.map((point) =>
      scene.add
        .image(point.x, point.y, BEACON_MARKER_TEXTURE_KEY)
        .setDisplaySize(puzzleConfig.beaconMarkerRadius * 2, puzzleConfig.beaconMarkerRadius * 2),
    );
    this.graphics = scene.add.graphics();
  }

  update(time: number, _delta: number): void {
    if (this.solved) return;
    const ship = getPlayerShip();
    if (!ship) return;

    if (time - this.lastSampleAtMs >= puzzleConfig.trailSampleIntervalMs) {
      this.lastSampleAtMs = time;
      this.trail.push({ x: ship.image.x, y: ship.image.y, t: time });
    }

    while (this.trail.length && time - this.trail[0].t > puzzleConfig.trailMaxAgeMs) {
      this.trail.shift();
    }

    this.redrawTrail();
    this.checkEncirclement();
  }

  private redrawTrail(): void {
    this.graphics.clear();
    if (this.trail.length < 2) return;

    this.graphics.lineStyle(2, puzzleConfig.trailColor, 0.8);
    this.graphics.beginPath();
    this.graphics.moveTo(this.trail[0].x, this.trail[0].y);
    for (let i = 1; i < this.trail.length; i++) this.graphics.lineTo(this.trail[i].x, this.trail[i].y);
    this.graphics.strokePath();
  }

  // Scans for ANY recent sub-loop that closes -- not just whether the whole
  // trail's first and last points happen to be close. A player who did
  // something else earlier in the rolling window (or, in this case, an
  // automated test driving other elements first) shouldn't prevent a loop
  // they just actually completed from registering; checking only the full
  // trail's endpoints missed exactly that case.
  private checkEncirclement(): void {
    const last = this.trail[this.trail.length - 1];
    if (!last) return;

    for (let start = 0; start <= this.trail.length - puzzleConfig.trailMinPointsForCheck; start++) {
      const candidate = this.trail[start];
      const gap = Phaser.Math.Distance.Between(candidate.x, candidate.y, last.x, last.y);
      if (gap > puzzleConfig.trailCloseLoopThreshold) continue;

      const loop = this.trail.slice(start);
      if (this.beaconPoints.every((beacon) => this.pointInPolygon(beacon, loop))) {
        this.onEncircled();
        return;
      }
    }
  }

  // Standard ray-casting point-in-polygon test, treating the trail as an
  // implicitly closed loop (last point connects back to the first).
  private pointInPolygon(point: { x: number; y: number }, polygon: { x: number; y: number }[]): boolean {
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const xi = polygon[i].x;
      const yi = polygon[i].y;
      const xj = polygon[j].x;
      const yj = polygon[j].y;
      const intersects = yi > point.y !== yj > point.y && point.x < ((xj - xi) * (point.y - yi)) / (yj - yi) + xi;
      if (intersects) inside = !inside;
    }
    return inside;
  }

  private onEncircled(): void {
    this.markSolved();
    this.beacons.forEach((beacon) => beacon.setTint(puzzleConfig.beaconSolvedColor));
    this.graphics.clear();
    this.graphics.lineStyle(2, puzzleConfig.beaconSolvedColor, 1);
    this.graphics.beginPath();
    this.graphics.moveTo(this.trail[0].x, this.trail[0].y);
    for (let i = 1; i < this.trail.length; i++) this.graphics.lineTo(this.trail[i].x, this.trail[i].y);
    this.graphics.closePath();
    this.graphics.strokePath();
  }
}
