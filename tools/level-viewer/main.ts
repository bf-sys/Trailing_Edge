// Standalone, read-only level visualizer. Reads level content straight from
// the real src/levels + src/config modules (all Phaser-free at runtime --
// LevelConfig/HazardPlacement/etc. only ever *type*-import from
// HazardZoneElement.ts, and hazardConfig.ts/puzzleConfig.ts's own runtime
// imports are just registerTuning(), a harmless window.tuning side effect --
// so no game bootstrap, canvas-in-canvas Phaser instance, or asset loading
// is needed here). This file only *reads* getAllLevelIds()/getLevelConfig()
// -- no SystemRegistry registration, no scene wiring, no writes back to any
// level file. See CLAUDE.md's level-viewer task note for the read-only/
// no-core-contract-touching constraints this tool is built under.
import { getAllLevelIds, getLevelConfig } from '../../src/levels';
import type { LevelConfig } from '../../src/levels/levelTypes';
import {
  HAZARD_COLORS,
  HAZARD_LABELS,
  HAZARD_TYPES,
  OBJECTIVE_COLORS,
  PUZZLE_COLORS,
  PUZZLE_LABELS,
  PUZZLE_TYPES,
  RESUPPLY_COLOR,
} from './colors';
import { draw, fitView, screenToWorld, type View, type Visibility } from './render';

const canvas = document.getElementById('canvas') as HTMLCanvasElement;
const ctx = canvas.getContext('2d')!;
const wrap = document.getElementById('canvasWrap') as HTMLDivElement;
const select = document.getElementById('levelSelect') as HTMLSelectElement;
const metaEl = document.getElementById('meta') as HTMLSpanElement;
const coordEl = document.getElementById('coord') as HTMLDivElement;
const legendEl = document.getElementById('legend') as HTMLDivElement;
const resetBtn = document.getElementById('resetView') as HTMLButtonElement;

const hiddenKeys = new Set<string>();
const visibility: Visibility = { isVisible: (key) => !hiddenKeys.has(key) };

let currentLevel: LevelConfig;
let view: View = { scale: 1, x: 0, y: 0 };
let dragging = false;
let dragLast = { x: 0, y: 0 };

// ---- level selection ----
function populateLevelSelect(): void {
  const ids = getAllLevelIds().sort();
  for (const id of ids) {
    const opt = document.createElement('option');
    opt.value = id;
    opt.textContent = id;
    select.appendChild(opt);
  }
}

function loadLevel(id: string): void {
  currentLevel = getLevelConfig(id);
  metaEl.textContent = `${currentLevel.width} × ${currentLevel.height}px  ·  ${currentLevel.hazards.length} hazards  ·  ${currentLevel.puzzleElements.length} puzzle elements`;
  buildLegend();
  resetView();
}

function resetView(): void {
  resizeCanvas();
  view = fitView(currentLevel, canvas.clientWidth, canvas.clientHeight);
  render();
}

// ---- legend ----
function countHazard(type: string): number {
  return currentLevel.hazards.filter((h) => h.type === type).length;
}
function countPuzzle(type: string): number {
  return currentLevel.puzzleElements.filter((p) => p.type === type).length;
}

function legendRow(
  key: string,
  color: string,
  label: string,
  count: number | null,
  shape: 'circle' | 'square' | 'path' = 'circle'
): HTMLDivElement {
  const row = document.createElement('div');
  row.className = 'legend-row' + (count === 0 ? ' zero' : '');

  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.checked = !hiddenKeys.has(key);
  checkbox.addEventListener('change', () => {
    if (checkbox.checked) hiddenKeys.delete(key);
    else hiddenKeys.add(key);
    render();
  });

  const swatch = document.createElement('span');
  swatch.className = `swatch ${shape}`;
  swatch.style.background = shape === 'path' ? 'transparent' : color;
  swatch.style.borderColor = color;

  const labelEl = document.createElement('span');
  labelEl.className = 'legend-label';
  labelEl.textContent = label;

  row.append(checkbox, swatch, labelEl);

  if (count !== null) {
    const countEl = document.createElement('span');
    countEl.className = 'legend-count';
    countEl.textContent = String(count);
    row.append(countEl);
  }

  row.addEventListener('click', (e) => {
    if (e.target === checkbox) return;
    checkbox.checked = !checkbox.checked;
    checkbox.dispatchEvent(new Event('change'));
  });

  return row;
}

function sectionHeader(text: string): HTMLHeadingElement {
  const h = document.createElement('h2');
  h.textContent = text;
  return h;
}

function buildLegend(): void {
  legendEl.innerHTML = '';

  legendEl.append(sectionHeader('Core objectives'));
  legendEl.append(legendRow('obj:entry', OBJECTIVE_COLORS.entry, 'Entry Wormhole', null, 'square'));
  legendEl.append(legendRow('obj:probe', OBJECTIVE_COLORS.probe, 'Probe', null, 'square'));
  legendEl.append(legendRow('obj:beacon', OBJECTIVE_COLORS.beacon, 'Relay Beacon', null, 'square'));
  legendEl.append(legendRow('obj:exit', OBJECTIVE_COLORS.exit, 'Exit Wormhole', null, 'square'));
  legendEl.append(legendRow('obj:route', '#5b6274', 'Objective route', null, 'path'));
  const routeNote = document.createElement('div');
  routeNote.id = 'objectivePath';
  routeNote.textContent = 'Sequence: Entry → Probe → Relay Beacon → Exit';
  legendEl.append(routeNote);

  legendEl.append(sectionHeader('Hazards'));
  for (const type of HAZARD_TYPES) {
    legendEl.append(legendRow(`hazard:${type}`, HAZARD_COLORS[type], HAZARD_LABELS[type], countHazard(type)));
  }

  legendEl.append(sectionHeader('Resupply'));
  legendEl.append(legendRow('resupply', RESUPPLY_COLOR, 'AsteroidField', currentLevel.resupplyPoints.length));

  legendEl.append(sectionHeader('Puzzle elements'));
  for (const type of PUZZLE_TYPES) {
    legendEl.append(legendRow(`puzzle:${type}`, PUZZLE_COLORS[type], PUZZLE_LABELS[type], countPuzzle(type), 'path'));
  }
}

// ---- canvas sizing / rendering ----
function resizeCanvas(): void {
  const dpr = window.devicePixelRatio || 1;
  const w = wrap.clientWidth;
  const h = wrap.clientHeight;
  canvas.width = Math.round(w * dpr);
  canvas.height = Math.round(h * dpr);
  canvas.style.width = `${w}px`;
  canvas.style.height = `${h}px`;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function render(): void {
  draw(ctx, canvas.clientWidth, canvas.clientHeight, currentLevel, view, visibility);
}

// ---- pan / zoom ----
canvas.addEventListener('wheel', (e) => {
  e.preventDefault();
  const rect = canvas.getBoundingClientRect();
  const mouse = { x: e.clientX - rect.left, y: e.clientY - rect.top };
  const before = screenToWorld(view, mouse);
  const factor = e.deltaY < 0 ? 1.12 : 1 / 1.12;
  view.scale = Math.min(20, Math.max(0.01, view.scale * factor));
  const after = worldToScreenScaleOnly(before);
  view.x += mouse.x - after.x;
  view.y += mouse.y - after.y;
  render();
});

function worldToScreenScaleOnly(p: { x: number; y: number }): { x: number; y: number } {
  return { x: p.x * view.scale + view.x, y: p.y * view.scale + view.y };
}

canvas.addEventListener('mousedown', (e) => {
  dragging = true;
  dragLast = { x: e.clientX, y: e.clientY };
  canvas.classList.add('dragging');
});
window.addEventListener('mouseup', () => {
  dragging = false;
  canvas.classList.remove('dragging');
});
window.addEventListener('mousemove', (e) => {
  if (dragging) {
    view.x += e.clientX - dragLast.x;
    view.y += e.clientY - dragLast.y;
    dragLast = { x: e.clientX, y: e.clientY };
    render();
  }

  const rect = canvas.getBoundingClientRect();
  if (e.clientX >= rect.left && e.clientX <= rect.right && e.clientY >= rect.top && e.clientY <= rect.bottom) {
    const world = screenToWorld(view, { x: e.clientX - rect.left, y: e.clientY - rect.top });
    coordEl.textContent = `x: ${Math.round(world.x)}, y: ${Math.round(world.y)}`;
  }
});

resetBtn.addEventListener('click', resetView);
select.addEventListener('change', () => loadLevel(select.value));

let resizeTimer: number | undefined;
window.addEventListener('resize', () => {
  window.clearTimeout(resizeTimer);
  resizeTimer = window.setTimeout(() => {
    resizeCanvas();
    render();
  }, 60);
});

// ---- boot ----
populateLevelSelect();
const initialId = select.options[0]?.value ?? 'level-001';
select.value = initialId;
loadLevel(initialId);
