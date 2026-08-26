// Targeted repro script (not part of the general adversarial loop) for a
// specific bug report from the project owner (2026-08-26): running to the
// right map edge at roughly the incoming Meteoroid's y-level, slightly above
// its midline, gets the ship pinned against the boundary -- and afterward
// the Meteoroid itself goes immobile, even once the ship moves away.
//
// Test Level (level-000, src/levels/level-000.ts) places its one Meteoroid
// at (300, 900), heading east (hazardConfig.ts's default headingRadians: 0)
// at 280px/s, in a 2400x1350 level -- small enough, and the first leg
// predictable enough (a dead-straight horizontal line at y=900 until
// MovingHazardManager wraps it past x=2456), to aim at precisely rather than
// guess-and-restart like the manual repro. This sweeps a range of y-offsets
// around that midline, each in a fresh page load (a real Test Level entry
// from Title, not a restart -- gives the Meteoroid a clean (300, 900) start
// every trial), and logs a fine-grained ship+Meteoroid trace through the
// contact window and several seconds after, looking specifically for the
// Meteoroid's velocity/position freezing rather than continuing east or
// eventually wrapping.
import { chromium } from 'playwright';
import { spawn, execSync } from 'node:child_process';
import { writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..', '..');

const METEOROID_SPAWN = { x: 300, y: 900 };
const METEOROID_SPEED = 280;
const LEVEL_WIDTH = 2400;
const LEVEL_HEIGHT = 1350;
const RIGHT_EDGE_TARGET_X = LEVEL_WIDTH - 15; // hug the boundary, same idea as the manual repro
const POLL_MS = 90;
const TRIAL_DURATION_MS = 13000; // ~7.5s for the Meteoroid to cross at 280px/s, + ~5s observation

// y-offsets to sweep, "above the midline" (smaller y, per the project
// owner's own guess) weighted more heavily, plus a few below and dead-center
// for comparison.
const Y_OFFSETS = [-45, -35, -25, -15, -5, 0, 10, 20];

function startDevServer(preferredPort) {
  return new Promise((resolve, reject) => {
    const child = spawn(`npx vite --port ${preferredPort}`, { cwd: projectRoot, shell: true });
    let resolved = false;
    let buffer = '';
    const onData = (data) => {
      buffer += data.toString();
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
      /* already gone */
    }
  } else {
    try {
      child.kill('SIGKILL');
    } catch {
      /* already gone */
    }
  }
}

async function enterTestLevel(page) {
  await page.waitForFunction(() => window.game && window.game.scene.isActive('TitleScene'), null, { timeout: 30000 });
  const btn = await page.evaluate(() => {
    const title = window.game.scene.getScene('TitleScene');
    const match = title.children.list.find((c) => c.type === 'Text' && c.text === 'Test Level');
    return match ? { x: match.x, y: match.y } : null;
  });
  if (!btn) throw new Error('Could not find TitleScene\'s "Test Level" button.');
  await page.mouse.click(btn.x, btn.y);
  await page.waitForFunction(() => window.getPlayerShip && window.getPlayerShip(), null, { timeout: 15000 });

  await page.evaluate(() => {
    window.__repro = {};
    window.__repro.snapshot = function snapshot() {
      const scene = window.game.scene.getScene('GameScene');
      const ship = window.getPlayerShip();
      if (!scene || !ship) return null;
      const body = ship.image.body;
      const meteoroid = (scene.hazards || []).find((h) => h.getDisplayName() === 'METEOROID');
      const metPos = meteoroid ? meteoroid.getPosition() : null;
      const metBody = meteoroid ? meteoroid['zone'].body : null;
      return {
        tMs: scene.time.now,
        ship: { x: ship.image.x, y: ship.image.y, vx: body.velocity.x, vy: body.velocity.y },
        survival: ship.survival.snapshot(),
        meteoroid: metPos && metBody ? { x: metPos.x, y: metPos.y, vx: metBody.velocity.x, vy: metBody.velocity.y } : null,
        camera: { scrollX: scene.cameras.main.scrollX, scrollY: scene.cameras.main.scrollY },
      };
    };
  });
}

async function runTrial(page, yOffset) {
  const targetY = METEOROID_SPAWN.y + yOffset;
  console.log(`\n=== Trial: right-edge y=${targetY} (offset ${yOffset >= 0 ? '+' : ''}${yOffset} from Meteoroid's y=${METEOROID_SPAWN.y} midline) ===`);

  await page.goto(page.url().split('#')[0], { waitUntil: 'load' });
  await enterTestLevel(page);

  // Move to the right edge at the target y immediately, same as the manual
  // repro ("run immediately to the right map edge").
  const snap0 = await page.evaluate(() => window.__repro.snapshot());
  const sx = RIGHT_EDGE_TARGET_X - snap0.camera.scrollX;
  const sy = targetY - snap0.camera.scrollY;
  await page.mouse.click(Math.max(2, Math.min(1278, sx)), Math.max(2, Math.min(718, sy)));

  const trace = [];
  const startedAt = Date.now();
  while (Date.now() - startedAt < TRIAL_DURATION_MS) {
    const snap = await page.evaluate(() => window.__repro.snapshot());
    if (snap) trace.push(snap);
    await page.waitForTimeout(POLL_MS);
  }

  // Once the observation window is over, deliberately try to move the ship
  // away -- the manual repro's own diagnostic ("when the player moves away
  // the meteoroid stays immobile") specifically depends on this step.
  const last = trace[trace.length - 1];
  if (last) {
    const awayX = last.ship.x - 300 - last.camera.scrollX;
    const awayY = last.ship.y - last.camera.scrollY;
    await page.mouse.click(Math.max(2, Math.min(1278, awayX)), Math.max(2, Math.min(718, awayY)));
    for (let i = 0; i < 15; i++) {
      const snap = await page.evaluate(() => window.__repro.snapshot());
      if (snap) trace.push(snap);
      await page.waitForTimeout(POLL_MS);
    }
  }

  return analyzeTrial(yOffset, targetY, trace);
}

function analyzeTrial(yOffset, targetY, trace) {
  const withMeteoroid = trace.filter((s) => s.meteoroid);
  if (withMeteoroid.length === 0) {
    return { yOffset, targetY, verdict: 'no-meteoroid-data', trace };
  }

  const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  const contactSamples = withMeteoroid.filter((s) => dist(s.ship, s.meteoroid) <= 56 + 35);
  const firstContact = contactSamples[0];
  const lastContact = contactSamples[contactSamples.length - 1];

  // "Stalled" = Meteoroid speed near zero for a sustained tail of the trace,
  // well after it should have either kept moving east at 280px/s or been
  // wrapped by MovingHazardManager back onto the perimeter (which would
  // reappear moving, not motionless).
  const tail = withMeteoroid.slice(-10);
  const tailSpeeds = tail.map((s) => Math.hypot(s.meteoroid.vx, s.meteoroid.vy));
  const tailAvgSpeed = tailSpeeds.reduce((a, b) => a + b, 0) / tailSpeeds.length;
  const tailPositions = tail.map((s) => s.meteoroid);
  const tailMaxDrift = Math.max(...tailPositions.map((p) => dist(p, tailPositions[0])));

  const meteoroidStalled = tailAvgSpeed < 20 && tailMaxDrift < 15;

  // Did the ship subsequently move noticeably away from where it was during
  // contact (the "player moves away" half of the report)?
  const shipMovedAwayAfter = trace.length > 0 && firstContact ? dist(trace[trace.length - 1].ship, firstContact.ship) > 80 : false;

  const verdict = contactSamples.length === 0 ? 'no-contact' : meteoroidStalled ? 'METEOROID STALLED' : 'contact-but-meteoroid-kept-moving';

  console.log(`  contact samples: ${contactSamples.length}, meteoroid tail avg speed: ${tailAvgSpeed.toFixed(1)}px/s, tail drift: ${tailMaxDrift.toFixed(1)}px`);
  console.log(`  ship moved away after: ${shipMovedAwayAfter}`);
  console.log(`  VERDICT: ${verdict}`);

  return {
    yOffset,
    targetY,
    verdict,
    contactCount: contactSamples.length,
    firstContact: firstContact ? { tMs: firstContact.tMs, ship: firstContact.ship, meteoroid: firstContact.meteoroid } : null,
    lastContact: lastContact ? { tMs: lastContact.tMs, ship: lastContact.ship, meteoroid: lastContact.meteoroid } : null,
    tailAvgSpeed,
    tailMaxDrift,
    shipMovedAwayAfter,
    trace,
  };
}

async function main() {
  console.log('Meteoroid/boundary stall repro sweep -- Test Level (level-000)');
  const { child: devServer, port } = await startDevServer(5210);
  console.log(`Dev server ready on port ${port}.`);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const page = await context.newPage();
  const consoleErrors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });
  page.on('pageerror', (err) => consoleErrors.push(String(err)));

  const results = [];
  try {
    await page.goto(`http://localhost:${port}/`);
    for (const yOffset of Y_OFFSETS) {
      const result = await runTrial(page, yOffset);
      results.push(result);
    }
  } finally {
    await browser.close();
    stopDevServer(devServer);
  }

  const outPath = path.join(__dirname, 'reports', `repro-meteoroid-boundary-stall-${new Date().toISOString().replace(/[:.]/g, '-')}.json`);
  mkdirSync(path.dirname(outPath), { recursive: true });
  writeFileSync(outPath, JSON.stringify({ consoleErrors, results }, null, 2));

  console.log('\n=== Summary ===');
  results.forEach((r) => console.log(`  y-offset ${r.yOffset >= 0 ? '+' : ''}${r.yOffset} (y=${r.targetY}): ${r.verdict}`));
  console.log(`\nFull trace data: ${outPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
