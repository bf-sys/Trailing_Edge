// Pure canvas drawing for the level viewer -- no DOM/event-handling here,
// see main.ts for that. Takes a resolved LevelConfig (already-expanded
// hazards array -- local per-level generator helpers like level-001.ts's
// debrisWall() have already run by the time getLevelConfig() returns it, so
// nothing here needs to special-case how a placement was produced) plus the
// current pan/zoom View and category visibility set, and draws once.
import { hazardConfig } from '../../src/config/hazardConfig';
import { puzzleConfig } from '../../src/config/puzzleConfig';
import type { HazardPlacement, LevelConfig, Point, PuzzleElementPlacement } from '../../src/levels/levelTypes';
import {
  HAZARD_COLORS,
  OBJECTIVE_COLORS,
  PUSH_PULL_TARGET_COLOR,
  PUZZLE_COLORS,
  RESUPPLY_COLOR,
} from './colors';

export interface View {
  scale: number;
  x: number; // screen-space offset of world (0,0)
  y: number;
}

export function worldToScreen(view: View, p: Point): Point {
  return { x: p.x * view.scale + view.x, y: p.y * view.scale + view.y };
}

export function screenToWorld(view: View, p: Point): Point {
  return { x: (p.x - view.x) / view.scale, y: (p.y - view.y) / view.scale };
}

export function fitView(level: LevelConfig, canvasWidth: number, canvasHeight: number): View {
  const margin = 0.92;
  const scale = Math.min((canvasWidth / level.width) * margin, (canvasHeight / level.height) * margin);
  return {
    scale,
    x: (canvasWidth - level.width * scale) / 2,
    y: (canvasHeight - level.height * scale) / 2,
  };
}

export interface Visibility {
  isVisible(key: string): boolean;
}

// Picks a "nice" world-unit grid step so a level's bounds show roughly
// 6-14 grid lines per axis regardless of its footprint (level-001's 2400px
// vs. level-008's 6750px) -- purely a readability aid for eyeballing
// distances/clearances against level-design-guide.md's precedent numbers
// (e.g. the 250px+ clearance floor, the 65-76% consecutive-objective band).
const GRID_STEPS = [50, 100, 200, 250, 500, 1000, 2000, 2500, 5000, 10000];
function pickGridStep(worldSpan: number): number {
  for (const step of GRID_STEPS) {
    if (worldSpan / step <= 14) return step;
  }
  return GRID_STEPS[GRID_STEPS.length - 1];
}

export function draw(
  ctx: CanvasRenderingContext2D,
  canvasWidth: number,
  canvasHeight: number,
  level: LevelConfig,
  view: View,
  vis: Visibility
): void {
  ctx.save();
  ctx.clearRect(0, 0, canvasWidth, canvasHeight);
  ctx.fillStyle = '#05060a';
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);

  drawGrid(ctx, level, view);
  drawBounds(ctx, level, view);

  for (const hazard of level.hazards) {
    if (!vis.isVisible(`hazard:${hazard.type}`)) continue;
    drawHazard(ctx, hazard, view);
  }

  if (vis.isVisible('resupply')) {
    for (const rp of level.resupplyPoints) {
      drawResupply(ctx, rp, view);
    }
  }

  for (const el of level.puzzleElements) {
    if (!vis.isVisible(`puzzle:${el.type}`)) continue;
    drawPuzzleElement(ctx, el, view);
  }

  if (vis.isVisible('obj:route')) {
    drawObjectiveRoute(ctx, level, view);
  }

  drawObjective(ctx, level.entryWormholeLocation, 'Entry', OBJECTIVE_COLORS.entry, view, vis.isVisible('obj:entry'));
  drawObjective(ctx, level.probeLocation, 'Probe', OBJECTIVE_COLORS.probe, view, vis.isVisible('obj:probe'));
  drawObjective(
    ctx,
    level.relayBeaconLocation,
    'Relay Beacon',
    OBJECTIVE_COLORS.beacon,
    view,
    vis.isVisible('obj:beacon')
  );
  drawObjective(ctx, level.exitWormholeLocation, 'Exit', OBJECTIVE_COLORS.exit, view, vis.isVisible('obj:exit'));

  ctx.restore();
}

function drawGrid(ctx: CanvasRenderingContext2D, level: LevelConfig, view: View): void {
  const stepX = pickGridStep(level.width);
  const stepY = pickGridStep(level.height);
  ctx.save();
  ctx.strokeStyle = '#1a1e28';
  ctx.lineWidth = 1;
  ctx.font = '10px monospace';
  ctx.fillStyle = '#3a4152';

  for (let x = 0; x <= level.width; x += stepX) {
    const a = worldToScreen(view, { x, y: 0 });
    const b = worldToScreen(view, { x, y: level.height });
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
    ctx.fillText(String(x), a.x + 3, a.y + 11);
  }
  for (let y = 0; y <= level.height; y += stepY) {
    const a = worldToScreen(view, { x: 0, y });
    const b = worldToScreen(view, { x: level.width, y });
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
    ctx.fillText(String(y), a.x + 3, a.y - 3);
  }
  ctx.restore();
}

function drawBounds(ctx: CanvasRenderingContext2D, level: LevelConfig, view: View): void {
  const topLeft = worldToScreen(view, { x: 0, y: 0 });
  ctx.save();
  ctx.strokeStyle = '#525a6e';
  ctx.lineWidth = 2;
  ctx.strokeRect(topLeft.x, topLeft.y, level.width * view.scale, level.height * view.scale);
  ctx.restore();
}

function drawHazard(ctx: CanvasRenderingContext2D, placement: HazardPlacement, view: View): void {
  const cfg = hazardConfig[placement.type];
  const center = worldToScreen(view, { x: placement.x, y: placement.y });
  const color = HAZARD_COLORS[placement.type];
  const rotation = placement.rotationRadians ?? 0;

  ctx.save();
  ctx.fillStyle = color + '8c'; // ~55% alpha, matches hazardConfig placeholder alpha convention
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;

  if (cfg.shape.kind === 'circle') {
    const r = cfg.shape.radius * view.scale;
    ctx.beginPath();
    ctx.arc(center.x, center.y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  } else {
    const w = cfg.shape.width * view.scale;
    const h = cfg.shape.height * view.scale;
    ctx.translate(center.x, center.y);
    ctx.rotate(rotation);
    ctx.fillRect(-w / 2, -h / 2, w, h);
    ctx.strokeRect(-w / 2, -h / 2, w, h);
  }

  // blocksMovement hazards (Debris Field) get a solid-obstacle hatch mark so
  // the "this is a collider, not a drain zone" distinction reads even
  // without consulting the legend text (CLAUDE.md's blocksMovement bullet).
  if (cfg.blocksMovement) {
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    const r = cfg.shape.kind === 'circle' ? cfg.shape.radius * view.scale : Math.min(cfg.shape.width, cfg.shape.height) * view.scale * 0.5;
    ctx.beginPath();
    ctx.moveTo(center.x - r * 0.5, center.y - r * 0.5);
    ctx.lineTo(center.x + r * 0.5, center.y + r * 0.5);
    ctx.stroke();
  }

  ctx.restore();
}

function drawResupply(
  ctx: CanvasRenderingContext2D,
  rp: { x: number; y: number; radius: number },
  view: View
): void {
  const center = worldToScreen(view, rp);
  const r = rp.radius * view.scale;
  ctx.save();
  ctx.fillStyle = RESUPPLY_COLOR + '55';
  ctx.strokeStyle = RESUPPLY_COLOR;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(center.x, center.y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

function drawObjective(
  ctx: CanvasRenderingContext2D,
  p: Point,
  label: string,
  color: string,
  view: View,
  visible: boolean
): void {
  if (!visible) return;
  const s = worldToScreen(view, p);
  const size = 9;
  ctx.save();
  ctx.fillStyle = color;
  ctx.strokeStyle = '#05060a';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(s.x, s.y - size);
  ctx.lineTo(s.x + size, s.y);
  ctx.lineTo(s.x, s.y + size);
  ctx.lineTo(s.x - size, s.y);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.font = 'bold 12px sans-serif';
  ctx.fillStyle = '#e8e8ec';
  ctx.strokeStyle = '#05060a';
  ctx.lineWidth = 3;
  ctx.lineJoin = 'round';
  ctx.strokeText(label, s.x + size + 4, s.y + 4);
  ctx.fillText(label, s.x + size + 4, s.y + 4);
  ctx.restore();
}

// LevelObjectiveTracker's real, strictly-linear sequence (Entry (spawn, not
// tracked) -> Probe -> Relay Beacon -> Exit Wormhole -- level-design-guide.md
// §3). Drawn as a thin dashed guide so a reviewer can eyeball the
// consecutive-pair "far apart" / non-consecutive-pair "close" shape §3
// describes without measuring by hand.
function drawObjectiveRoute(ctx: CanvasRenderingContext2D, level: LevelConfig, view: View): void {
  const pts = [level.entryWormholeLocation, level.probeLocation, level.relayBeaconLocation, level.exitWormholeLocation];
  ctx.save();
  ctx.strokeStyle = '#5b6274';
  ctx.lineWidth = 1.5;
  ctx.setLineDash([6, 6]);
  ctx.beginPath();
  pts.forEach((p, i) => {
    const s = worldToScreen(view, p);
    if (i === 0) ctx.moveTo(s.x, s.y);
    else ctx.lineTo(s.x, s.y);
  });
  ctx.stroke();
  ctx.restore();
}

function drawPath(ctx: CanvasRenderingContext2D, points: Point[], view: View, color: string, closed: boolean): void {
  if (points.length < 2) return;
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.setLineDash([5, 4]);
  ctx.beginPath();
  points.forEach((p, i) => {
    const s = worldToScreen(view, p);
    if (i === 0) ctx.moveTo(s.x, s.y);
    else ctx.lineTo(s.x, s.y);
  });
  if (closed) ctx.closePath();
  ctx.stroke();
  ctx.restore();
}

function drawPuzzleElement(ctx: CanvasRenderingContext2D, el: PuzzleElementPlacement, view: View): void {
  const color = PUZZLE_COLORS[el.type];

  switch (el.type) {
    case 'scanInteract': {
      drawMarkerWithRing(ctx, { x: el.x, y: el.y }, puzzleConfig.scanInteractRadius, color, view);
      break;
    }
    case 'sequenceSpot': {
      // Sequence, not a loop -- the player must trigger these in order, so
      // draw an open, directional path and number each spot.
      if (el.points.length === 0) {
        // Edge case: an empty points array is technically valid against the
        // PuzzleElementPlacement type (points: Point[]) even though a
        // real SequenceSpotElement needs at least one spot to mean anything.
        // Nothing to draw for the path/markers below; the type-level guard
        // just prevents a crash if a generator ever emits one.
        break;
      }
      drawPath(ctx, el.points, view, color, false);
      el.points.forEach((p, i) => drawMarkerWithLabel(ctx, p, puzzleConfig.sequenceSpotRadius, color, view, String(i + 1)));
      break;
    }
    case 'trailDraw': {
      // Encirclement mechanic -- draw the beacon markers as a closed loop,
      // representing the boundary the player's flown trail needs to enclose.
      if (el.beaconPoints.length === 0) break;
      drawPath(ctx, el.beaconPoints, view, color, el.beaconPoints.length > 2);
      el.beaconPoints.forEach((p) => drawMarkerWithRing(ctx, p, puzzleConfig.beaconMarkerRadius, color, view));
      break;
    }
    case 'movingSpotDuration': {
      // Patrol path -- open polyline; the spot itself starts at path[0].
      if (el.path.length === 0) break;
      drawPath(ctx, el.path, view, color, false);
      el.path.forEach((p, i) =>
        i === 0
          ? drawMarkerWithRing(ctx, p, puzzleConfig.movingSpotRadius, color, view)
          : drawMarkerWithLabel(ctx, p, 5, color, view, '')
      );
      break;
    }
    case 'pushPullObject': {
      drawMarkerWithRing(ctx, { x: el.x, y: el.y }, puzzleConfig.pushPullInteractRadius, color, view);
      const target = { x: el.targetX, y: el.targetY };
      const s1 = worldToScreen(view, { x: el.x, y: el.y });
      const s2 = worldToScreen(view, target);
      ctx.save();
      ctx.strokeStyle = PUSH_PULL_TARGET_COLOR;
      ctx.setLineDash([4, 4]);
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(s1.x, s1.y);
      ctx.lineTo(s2.x, s2.y);
      ctx.stroke();
      ctx.restore();
      drawMarkerWithRing(ctx, target, puzzleConfig.pushPullSolveRadius, PUSH_PULL_TARGET_COLOR, view);
      break;
    }
  }
}

function drawMarkerWithRing(
  ctx: CanvasRenderingContext2D,
  p: Point,
  radiusWorld: number,
  color: string,
  view: View
): void {
  const s = worldToScreen(view, p);
  const r = radiusWorld * view.scale;
  ctx.save();
  ctx.strokeStyle = color + 'aa';
  ctx.lineWidth = 1;
  ctx.setLineDash([3, 3]);
  ctx.beginPath();
  ctx.arc(s.x, s.y, r, 0, Math.PI * 2);
  ctx.stroke();

  ctx.setLineDash([]);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(s.x, s.y, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawMarkerWithLabel(
  ctx: CanvasRenderingContext2D,
  p: Point,
  radiusWorld: number,
  color: string,
  view: View,
  label: string
): void {
  const s = worldToScreen(view, p);
  const r = Math.max(3, radiusWorld * view.scale);
  ctx.save();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(s.x, s.y, r, 0, Math.PI * 2);
  ctx.fill();
  if (label) {
    ctx.font = 'bold 11px sans-serif';
    ctx.fillStyle = '#05060a';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, s.x, s.y);
  }
  ctx.restore();
}
