// Adversarial QA agent (class assignment) -- drives the running Trailing
// Edge game via Playwright and actively tries to break it, rather than
// playing it normally. Cycles through movement/interaction/boundary-probing
// behaviors, feeds every polled game-state snapshot through detectors.mjs's
// checks, and writes a structured JSON + CSV report.
//
// Reuses this project's own established pattern for driving the game
// headlessly (see .claude/agents/level-evaluator-agent.md's "Reachability
// and safety" section): Playwright + the dev-only console hooks main.ts/
// ExplorationController.ts/devTuning.ts already expose for exactly this
// purpose (window.game, window.getPlayerShip, window.getExplorationController,
// window.tuning). Run against `npm run dev` (DEV mode) only -- these hooks
// don't exist in a production build.
import { chromium } from 'playwright';
import { spawn, execSync } from 'node:child_process';
import { writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Detectors } from './detectors.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..', '..');

function parseArgs(argv) {
  const opts = {
    level: 'level-006',
    durationSeconds: 180,
    port: 5199,
    tickMs: 350,
    headed: false,
    out: null,
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--level') opts.level = argv[++i];
    else if (a === '--duration') opts.durationSeconds = Number(argv[++i]);
    else if (a === '--port') opts.port = Number(argv[++i]);
    else if (a === '--tick-ms') opts.tickMs = Number(argv[++i]);
    else if (a === '--headed') opts.headed = true;
    else if (a === '--out') opts.out = argv[++i];
    else throw new Error(`Unknown argument: ${a}`);
  }
  if (!opts.out) {
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    opts.out = path.join(__dirname, 'reports', `report-${opts.level}-${stamp}`);
  }
  return opts;
}

function startDevServer(preferredPort) {
  return new Promise((resolve, reject) => {
    // A single command string with shell:true (rather than an args array,
    // which node --trace-deprecation flags as DEP0190) -- fine here since
    // preferredPort is this script's own numeric CLI arg, not untrusted input.
    const child = spawn(`npx vite --port ${preferredPort}`, {
      cwd: projectRoot,
      shell: true,
    });
    let resolved = false;
    let buffer = '';
    const onData = (data) => {
      buffer += data.toString();
      // Vite colors its stdout with ANSI escape codes interleaved *inside*
      // the URL itself (e.g. "http://localhost:" <esc> "5199" <esc> "/"),
      // so they have to be stripped before the URL regex can match at all.
      const clean = buffer.replace(/\x1b\[[0-9;]*m/g, '');
      const match = clean.match(/Local:\s+https?:\/\/localhost:(\d+)/);
      if (match && !resolved) {
        resolved = true;
        resolve({ child, port: Number(match[1]) });
      }
    };
    child.stdout.on('data', onData);
    child.stderr.on('data', onData);
    child.on('exit', (code) => {
      if (!resolved) reject(new Error(`dev server exited early (code ${code}). Output:\n${buffer}`));
    });
    setTimeout(() => {
      if (!resolved) reject(new Error(`dev server did not report a listening URL within 20s. Output so far:\n${buffer}`));
    }, 20000);
  });
}

function stopDevServer(child) {
  if (!child || child.killed) return;
  if (process.platform === 'win32') {
    try {
      execSync(`taskkill /PID ${child.pid} /T /F`, { stdio: 'ignore' });
    } catch {
      // already gone
    }
  } else {
    try {
      child.kill('SIGKILL');
    } catch {
      // already gone
    }
  }
}

// ---- behaviors ------------------------------------------------------------
// Three families, matching the assignment's required categories. Weighted so
// the loop mostly explores generically (movement/interaction), with a
// deliberately elevated share going to the three behaviors aimed at actual
// play-impact scenarios (2026-08-26 refocus, per project-owner direction):
// getting the ship physically wedged between a Meteoroid and a Debris Field,
// wedged between a Meteoroid and the map boundary, and deliberately
// teleporting into a solid hazard to see what happens on the way out.
const BEHAVIORS = [
  { name: 'randomMovement', weight: 18, fn: behaviorRandomMovement },
  { name: 'edgeMovement', weight: 10, fn: behaviorEdgeMovement },
  { name: 'abilityMash', weight: 8, fn: behaviorAbilityMash },
  { name: 'pauseProbe', weight: 5, fn: behaviorPauseProbe },
  { name: 'outOfBoundsInjection', weight: 8, fn: behaviorOutOfBounds },
  { name: 'meteoroidPinchSeek', weight: 20, fn: behaviorMeteoroidPinchSeek },
  { name: 'meteoroidBoundaryPinchSeek', weight: 16, fn: behaviorMeteoroidBoundaryPinchSeek },
  { name: 'teleportIntoDebrisField', weight: 15, fn: behaviorTeleportIntoDebrisField },
];

function pickBehavior() {
  const total = BEHAVIORS.reduce((s, b) => s + b.weight, 0);
  let r = Math.random() * total;
  for (const b of BEHAVIORS) {
    r -= b.weight;
    if (r <= 0) return b;
  }
  return BEHAVIORS[0];
}

async function behaviorRandomMovement({ page }) {
  const x = 20 + Math.random() * 1240;
  const y = 20 + Math.random() * 680;
  await page.mouse.click(x, y);
}

const EDGE_POINTS = [
  [4, 360],
  [1276, 360],
  [640, 4],
  [640, 716],
  [4, 4],
  [1276, 4],
  [4, 716],
  [1276, 716],
];

async function behaviorEdgeMovement({ page, state }) {
  const [x, y] = EDGE_POINTS[state.edgeCycleIndex % EDGE_POINTS.length];
  state.edgeCycleIndex++;
  await page.mouse.click(x, y);
}

async function behaviorAbilityMash({ page }) {
  const key = ['1', '2', '3'][Math.floor(Math.random() * 3)];
  await page.keyboard.press(key);
  if (key === '2') {
    // teleport arms on press and needs a left-click to confirm the blink --
    // firing one immediately doubles as probing "confirm while still aiming"
    await page.waitForTimeout(80);
    await page.mouse.click(20 + Math.random() * 1240, 20 + Math.random() * 680);
  }
}

async function behaviorPauseProbe({ page, detectors }) {
  // Both comparison snapshots are taken strictly *after* window.game
  // confirms GameScene.isPaused() -- and strictly *before* resuming --
  // rather than bracketing the press itself. Snapshotting around the press
  // instead would fold in a few milliseconds of real, still-running gameplay
  // on either side of the actual pause/resume edges, showing up as a false
  // "state changed while paused" position/resource delta that's really just
  // this script's own measurement window, not the game failing to freeze.
  await page.keyboard.press('Escape');
  await page.waitForFunction(() => window.game.scene.isPaused('GameScene'), null, { timeout: 2000 }).catch(() => {});
  const duringStart = await page.evaluate(() => window.__aqaSnapshot());
  await page.waitForTimeout(200 + Math.random() * 500);
  const duringEnd = await page.evaluate(() => window.__aqaSnapshot());
  await page.keyboard.press('Escape'); // PauseScene's own keydown-ESC resumes
  await page.waitForFunction(() => !window.game.scene.isPaused('GameScene'), null, { timeout: 2000 }).catch(() => {});
  detectors.checkPauseFreeze(duringStart, duringEnd);
}

async function behaviorOutOfBounds({ page, snap }) {
  if (!snap) return;
  // Bypasses screen->world translation entirely (a real mouse click can't
  // reach a world point outside the level once the camera is bounds-clamped)
  // by emitting a synthetic pointerdown straight at the scene's input
  // pipeline, same "TypeScript's private isn't enforced at runtime" access
  // pattern level-evaluator-agent.md's own driver script uses.
  await page.evaluate(
    ({ w, h }) => {
      const scene = window.game.scene.getScene('GameScene');
      if (!scene) return;
      const side = Math.floor(Math.random() * 4);
      const beyond = 3000;
      let worldX;
      let worldY;
      if (side === 0) {
        worldX = -beyond;
        worldY = Math.random() * h;
      } else if (side === 1) {
        worldX = w + beyond;
        worldY = Math.random() * h;
      } else if (side === 2) {
        worldX = Math.random() * w;
        worldY = -beyond;
      } else {
        worldX = Math.random() * w;
        worldY = h + beyond;
      }
      const pointer = { worldX, worldY, leftButtonDown: () => true };
      scene.input.emit('pointerdown', pointer);
      scene.input.emit('pointerup', pointer);
    },
    { w: snap.levelWidth, h: snap.levelHeight },
  );
}

// The user's own flagged area of concern: Meteoroid x another blocksMovement
// object (Debris Field, level boundary) x the player, all at once. Steers
// toward the gap between the nearest Meteoroid and the nearest other static
// blocker, or toward the Meteoroid itself when nothing else is close, on the
// theory that a wrap-driven respawn (never checked against wall/boundary
// geometry -- MovingHazardManager.ts) is where a physical pinch is most
// likely to actually occur.
//
// Two refinements over "click where the meteoroid is right now": (1) it
// extrapolates the meteoroid's position forward using its own measured
// velocity (snap.hazards[].vx/vy, set by the main loop below) by roughly how
// long the ship will take to get there, since at 280px/s a plain
// point-and-click is aimed at empty space by the time the ship arrives; (2)
// it stays "sticky" on the same meteoroid across several consecutive picks
// of this behavior (state.pinchStickyIndex/pinchStickyCallsLeft) instead of
// re-rolling a new random target every time this behavior comes up in the
// weighted lottery, so repeated re-aiming actually converges on one moving
// target rather than chasing a different one each call.
const ASSUMED_SHIP_TRAVEL_SPEED = 220; // px/s, a mid-accel-ramp estimate -- shipConfig.maxSpeed is 260

async function behaviorMeteoroidPinchSeek({ page, snap, state }) {
  if (!snap) return { noTarget: true };
  const meteoroids = snap.hazards.filter((h) => h.name === 'METEOROID');
  if (meteoroids.length === 0) return { noTarget: true };

  let met;
  if (state.pinchStickyCallsLeft > 0 && meteoroids.some((h) => h.index === state.pinchStickyIndex)) {
    met = meteoroids.find((h) => h.index === state.pinchStickyIndex);
    state.pinchStickyCallsLeft--;
  } else {
    met = meteoroids[Math.floor(Math.random() * meteoroids.length)];
    state.pinchStickyIndex = met.index;
    state.pinchStickyCallsLeft = 3;
  }

  const distToShip = Math.hypot(met.x - snap.ship.x, met.y - snap.ship.y);
  const leadSeconds = Math.min(2.5, distToShip / ASSUMED_SHIP_TRAVEL_SPEED);
  const predicted = { x: met.x + (met.vx ?? 0) * leadSeconds, y: met.y + (met.vy ?? 0) * leadSeconds };

  const blockers = snap.hazards.filter((h) => h.blocksMovement && h.name !== 'METEOROID');
  const nearest = blockers.map((b) => ({ b, d: Math.hypot(b.x - predicted.x, b.y - predicted.y) })).sort((a, z) => a.d - z.d)[0];

  const targetWorld = nearest && nearest.d < 500 ? { x: (predicted.x + nearest.b.x) / 2, y: (predicted.y + nearest.b.y) / 2 } : predicted;

  const sx = targetWorld.x - snap.camera.scrollX;
  const sy = targetWorld.y - snap.camera.scrollY;
  await page.mouse.click(Math.max(2, Math.min(1278, sx)), Math.max(2, Math.min(718, sy)));
}

// The other half of the project owner's flagged concern: pinned against the
// map boundary rather than a Debris Field. Same velocity-extrapolation idea
// as behaviorMeteoroidPinchSeek, but aims at the level edge nearest the
// meteoroid's predicted path instead of the nearest other hazard -- puts the
// ship on the wall side of an oncoming Meteoroid, on purpose. Uses its own
// sticky-target slot so it doesn't fight behaviorMeteoroidPinchSeek's.
async function behaviorMeteoroidBoundaryPinchSeek({ page, snap, state }) {
  if (!snap) return { noTarget: true };
  const meteoroids = snap.hazards.filter((h) => h.name === 'METEOROID');
  if (meteoroids.length === 0) return { noTarget: true };

  let met;
  if (state.boundaryStickyCallsLeft > 0 && meteoroids.some((h) => h.index === state.boundaryStickyIndex)) {
    met = meteoroids.find((h) => h.index === state.boundaryStickyIndex);
    state.boundaryStickyCallsLeft--;
  } else {
    met = meteoroids[Math.floor(Math.random() * meteoroids.length)];
    state.boundaryStickyIndex = met.index;
    state.boundaryStickyCallsLeft = 3;
  }

  const distToShip = Math.hypot(met.x - snap.ship.x, met.y - snap.ship.y);
  const leadSeconds = Math.min(2.5, distToShip / ASSUMED_SHIP_TRAVEL_SPEED);
  const predicted = { x: met.x + (met.vx ?? 0) * leadSeconds, y: met.y + (met.vy ?? 0) * leadSeconds };

  const distances = {
    x0: predicted.x,
    x1: snap.levelWidth - predicted.x,
    y0: predicted.y,
    y1: snap.levelHeight - predicted.y,
  };
  const nearestEdge = Object.entries(distances).sort((a, z) => a[1] - z[1])[0][0];

  const inset = 40; // aim just off the wall, not exactly on top of it
  const targetWorld = { ...predicted };
  if (nearestEdge === 'x0') targetWorld.x = inset;
  else if (nearestEdge === 'x1') targetWorld.x = snap.levelWidth - inset;
  else if (nearestEdge === 'y0') targetWorld.y = inset;
  else targetWorld.y = snap.levelHeight - inset;

  const sx = targetWorld.x - snap.camera.scrollX;
  const sy = targetWorld.y - snap.camera.scrollY;
  await page.mouse.click(Math.max(2, Math.min(1278, sx)), Math.max(2, Math.min(718, sy)));
}

// The teleport-specific concern: teleport is documented (CLAUDE.md) to pass
// through blocksMovement colliders via a plain setPosition() call. Picks a
// blocksMovement hazard within teleport's maxRange (a hair under it, to stay
// clear of clampToTeleportRange()'s clamping-edge ambiguity) and confirms a
// blink straight at its center, then arms detectors.checkTeleportProbe() to
// watch what happens to the ship over the next couple of seconds.
async function behaviorTeleportIntoDebrisField({ page, snap, detectors }) {
  if (!snap) return { noTarget: true };
  const blockers = snap.hazards.filter((h) => h.blocksMovement);
  if (blockers.length === 0) return { noTarget: true };

  const inRange = blockers
    .map((b) => ({ b, d: Math.hypot(b.x - snap.ship.x, b.y - snap.ship.y) }))
    .filter((x) => x.d <= 340) // abilityConfig.teleport.maxRange is 350
    .sort((a, z) => a.d - z.d);
  if (inRange.length === 0) return { noTarget: true };
  const target = inRange[0].b;

  // Tops up energy via the ship's own public rechargeEnergy() (the same
  // method EnergyNodeElement pickups use) right before attempting. This
  // behavior is specifically isolating "does teleporting into a solid
  // collider break anything," not simulating normal energy economy --
  // without this, teleport's 30-energy cost combined with ships starting
  // each level at 0 energy and abilityMash's random draws on the same pool
  // meant this behavior's attempts almost never actually had enough energy
  // to fire (observed: 1 confirmed landing out of 39 attempts in an earlier
  // run), starving the exact mechanic this tool is supposed to stress.
  // tryActivate()'s cooldownSeconds gate is left untouched -- that's an
  // ability-level rule worth respecting, not a resource economy artifact.
  await page.evaluate(() => {
    const ship = window.getPlayerShip();
    if (ship) ship.survival.rechargeEnergy(999);
  });

  await page.keyboard.press('2'); // arm teleport (tryActivate's cooldown gate fires on confirm below)
  await page.waitForTimeout(60);

  const sx = target.x - snap.camera.scrollX;
  const sy = target.y - snap.camera.scrollY;
  await page.mouse.click(Math.max(2, Math.min(1278, sx)), Math.max(2, Math.min(718, sy)));

  detectors.armTeleportProbe(target.x, target.y, target.index, target.name);
}

// ---- setup ------------------------------------------------------------
async function waitForTitleScene(page) {
  await page.waitForFunction(() => window.game && window.game.scene.isActive('TitleScene'), null, { timeout: 30000 });
}

async function jumpToLevel(page, levelId) {
  const suffix = levelId.replace('level-', '');
  const btn = await page.evaluate((s) => {
    const title = window.game.scene.getScene('TitleScene');
    const match = title.children.list.find((c) => c.type === 'Text' && c.text === s);
    return match ? { x: match.x, y: match.y } : null;
  }, suffix);
  if (!btn) throw new Error(`Could not find TitleScene's "Dev: Jump to Level" button for ${levelId} (is it in LEVEL_ORDER?).`);
  await page.mouse.click(btn.x, btn.y);
  await page.waitForFunction(() => window.getPlayerShip && window.getPlayerShip(), null, { timeout: 15000 });
}

async function installSnapshotHelper(page) {
  await page.evaluate(() => {
    window.__aqaSnapshot = function aqaSnapshot() {
      const scene = window.game.scene.getScene('GameScene');
      const ship = window.getPlayerShip();
      if (!scene || !ship) return null;
      const explo = window.getExplorationController ? window.getExplorationController() : null;
      const body = ship.image.body;
      const camera = scene.cameras.main;
      const hazards = (scene.hazards || []).map((h, i) => {
        const pos = h.getPosition();
        const shape = h.getShape();
        return {
          index: i,
          name: h.getDisplayName(),
          x: pos.x,
          y: pos.y,
          radius: shape.kind === 'circle' ? shape.radius : Math.max(shape.width, shape.height) / 2,
          blocksMovement: h.getBlocksMovement(),
        };
      });
      return {
        tMs: scene.time.now,
        levelId: scene.levelId,
        levelWidth: scene.levelWidth,
        levelHeight: scene.levelHeight,
        camera: { scrollX: camera.scrollX, scrollY: camera.scrollY },
        ship: { x: ship.image.x, y: ship.image.y, vx: body.velocity.x, vy: body.velocity.y },
        target: explo ? explo.target : null,
        survival: ship.survival.snapshot(),
        hazards,
      };
    };
  });
}

// ---- report -----------------------------------------------------------
function writeReport(findings, meta, outBase) {
  mkdirSync(path.dirname(outBase), { recursive: true });

  const jsonPath = `${outBase}.json`;
  writeFileSync(jsonPath, JSON.stringify({ meta, findings }, null, 2));

  const header = ['Timestamp', 'LevelId', 'Location_X', 'Location_Y', 'ErrorType', 'Severity', 'GameContext', 'Detail'];
  const csvEscape = (v) => `"${String(v).replace(/"/g, '""')}"`;
  const rows = findings.map((f) =>
    [f.timestamp, f.location.levelId, f.location.x, f.location.y, f.errorType, f.severity, JSON.stringify(f.gameContext), f.detail].map(csvEscape).join(','),
  );
  const csvPath = `${outBase}.csv`;
  writeFileSync(csvPath, [header.join(','), ...rows].join('\n'));

  return { jsonPath, csvPath };
}

// ---- main ---------------------------------------------------------------
async function main() {
  const opts = parseArgs(process.argv.slice(2));
  console.log(`Adversarial QA run: level=${opts.level} duration=${opts.durationSeconds}s tickMs=${opts.tickMs}`);

  console.log('Starting dev server...');
  const { child: devServer, port } = await startDevServer(opts.port);
  console.log(`Dev server ready on port ${port}.`);

  const browser = await chromium.launch({ headless: !opts.headed });
  const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const page = await context.newPage();

  const consoleErrors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push({ atIso: new Date().toISOString(), text: msg.text() });
  });
  page.on('pageerror', (err) => consoleErrors.push({ atIso: new Date().toISOString(), text: String(err) }));

  const detectors = new Detectors(null);
  const state = {
    edgeCycleIndex: 0,
    pinchStickyIndex: null,
    pinchStickyCallsLeft: 0,
    boundaryStickyIndex: null,
    boundaryStickyCallsLeft: 0,
  };
  let behaviorErrorCount = 0;
  let prevSnap = null;
  const behaviorCounts = Object.fromEntries(BEHAVIORS.map((b) => [b.name, 0]));
  const behaviorNoTargetCounts = Object.fromEntries(BEHAVIORS.map((b) => [b.name, 0]));

  try {
    await page.goto(`http://localhost:${port}/`);
    await waitForTitleScene(page);

    const hazardTuning = await page.evaluate(() => (window.tuning ? window.tuning.hazard : null));
    detectors.hazardTuning = hazardTuning ?? {};

    console.log(`Jumping to ${opts.level}...`);
    await jumpToLevel(page, opts.level);
    await installSnapshotHelper(page);

    const startedAt = Date.now();
    const endAt = startedAt + opts.durationSeconds * 1000;
    let tickCount = 0;

    while (Date.now() < endAt) {
      const snap = await page.evaluate(() => window.__aqaSnapshot());

      // Per-hazard velocity via finite difference against the previous tick
      // -- used by behaviorMeteoroidPinchSeek's lead-time extrapolation.
      // Not carried across a level change (a fresh hazard array at
      // different indices/positions would produce meaningless deltas).
      if (snap) {
        const samePrevLevel = prevSnap && prevSnap.levelId === snap.levelId;
        const dt = samePrevLevel ? (snap.tMs - prevSnap.tMs) / 1000 : 0;
        snap.hazards.forEach((h) => {
          const prevH = samePrevLevel ? prevSnap.hazards[h.index] : null;
          if (prevH && dt > 0) {
            h.vx = (h.x - prevH.x) / dt;
            h.vy = (h.y - prevH.y) / dt;
          } else {
            h.vx = 0;
            h.vy = 0;
          }
        });
      }
      prevSnap = snap;

      detectors.ingest(snap);

      const behavior = pickBehavior();
      behaviorCounts[behavior.name]++;
      try {
        const result = await behavior.fn({ page, snap, state, detectors });
        if (result && result.noTarget) behaviorNoTargetCounts[behavior.name]++;
      } catch (err) {
        behaviorErrorCount++;
        console.warn(`  [behavior error] ${behavior.name}: ${err.message}`);
      }

      tickCount++;
      await page.waitForTimeout(opts.tickMs);
    }

    console.log(`Run complete: ${tickCount} ticks, ${detectors.findings.length} findings, ${consoleErrors.length} console errors, ${behaviorErrorCount} behavior-execution errors.`);

    const meta = {
      generatedAt: new Date().toISOString(),
      level: opts.level,
      durationSeconds: opts.durationSeconds,
      tickMs: opts.tickMs,
      tickCount,
      hazardTuning,
      consoleErrors,
      behaviorErrorCount,
      behaviorWeights: Object.fromEntries(BEHAVIORS.map((b) => [b.name, b.weight])),
      behaviorCounts,
      behaviorNoTargetCounts,
      barelyMovedTickCount: detectors.diagBarelyMovedCount ?? 0,
      confirmedTeleportIntoHazardCount: detectors.diagTeleportConfirmedCount ?? 0,
    };

    const { jsonPath, csvPath } = writeReport(detectors.findings, meta, opts.out);
    console.log(`Report written:\n  ${jsonPath}\n  ${csvPath}`);

    const bySeverity = detectors.findings.reduce((acc, f) => {
      acc[f.severity] = (acc[f.severity] ?? 0) + 1;
      return acc;
    }, {});
    console.log('Findings by severity:', bySeverity);
    console.log('Behavior counts:', behaviorCounts);
    console.log('Behavior no-target counts (picked but nothing to act on):', behaviorNoTargetCounts);
    console.log(`Confirmed teleport-into-hazard landings: ${detectors.diagTeleportConfirmedCount ?? 0} (out of ${behaviorCounts.teleportIntoDebrisField - behaviorNoTargetCounts.teleportIntoDebrisField} attempts with a target in range)`);
  } finally {
    await browser.close();
    stopDevServer(devServer);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
