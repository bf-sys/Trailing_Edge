// One-off follow-up to repro-meteoroid-boundary-stall.mjs's y=865 finding:
// once the ship+Meteoroid freeze, is the whole Scene hung, or are these two
// bodies specifically deadlocked while everything else keeps ticking? Checks
// energy regen (a passive, movement-independent process) and every other
// hazard's position, and tries several distinct move-away clicks rather than
// just one.
import { chromium } from 'playwright';
import { spawn, execSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..', '..');

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
      if (!resolved) reject(new Error('dev server did not start in time'));
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

async function main() {
  const { child: devServer, port } = await startDevServer(5211);
  console.log(`Dev server ready on port ${port}.`);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const page = await context.newPage();
  const consoleErrors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });
  page.on('pageerror', (err) => consoleErrors.push(String(err)));

  try {
    await page.goto(`http://localhost:${port}/`);
    await page.waitForFunction(() => window.game && window.game.scene.isActive('TitleScene'), null, { timeout: 30000 });
    const btn = await page.evaluate(() => {
      const title = window.game.scene.getScene('TitleScene');
      const match = title.children.list.find((c) => c.type === 'Text' && c.text === 'Test Level');
      return match ? { x: match.x, y: match.y } : null;
    });
    await page.mouse.click(btn.x, btn.y);
    await page.waitForFunction(() => window.getPlayerShip && window.getPlayerShip(), null, { timeout: 15000 });

    await page.evaluate(() => {
      window.__snap = () => {
        const scene = window.game.scene.getScene('GameScene');
        const ship = window.getPlayerShip();
        const body = ship.image.body;
        const hazards = (scene.hazards || []).map((h) => ({ name: h.getDisplayName(), ...h.getPosition() }));
        return {
          tMs: scene.time.now,
          gameLoopFrame: window.game.loop.frame,
          ship: { x: ship.image.x, y: ship.image.y, vx: body.velocity.x, vy: body.velocity.y },
          survival: ship.survival.snapshot(),
          hazards,
          camera: { scrollX: scene.cameras.main.scrollX, scrollY: scene.cameras.main.scrollY },
        };
      };
    });

    // Same repro as the y=865 stall trial: run straight to the right edge at
    // the offset that stalled.
    const s0 = await page.evaluate(() => window.__snap());
    await page.mouse.click(1280 - 15 - s0.camera.scrollX, 865 - s0.camera.scrollY);

    console.log('Waiting for contact + freeze (~8s)...');
    await page.waitForTimeout(8500);

    const frozen = await page.evaluate(() => window.__snap());
    console.log('State right after expected freeze:', JSON.stringify(frozen, null, 2));

    // Wait several more seconds doing nothing, tracking energy (passive
    // regen -- survivalConfig.energyRegenPerSecond -- should tick up
    // regardless of ship/hazard motion if the Scene's update() is still
    // running at all) and every hazard's position (a still-moving Ion Storm
    // would prove the freeze is scoped to just this ship+Meteoroid pair).
    const samples = [];
    for (let i = 0; i < 20; i++) {
      samples.push(await page.evaluate(() => window.__snap()));
      await page.waitForTimeout(400);
    }

    console.log('\nEnergy over ~8s of doing nothing (passive regen check):');
    samples.forEach((s) => {
      const line = `  t=${Math.round(s.tMs)} frame=${s.gameLoopFrame} energy=${s.survival.currentEnergy.toFixed(2)} ship=(${s.ship.x.toFixed(1)},${s.ship.y.toFixed(1)}) v=(${s.ship.vx.toFixed(1)},${s.ship.vy.toFixed(1)})`;
      console.log(line);
    });

    console.log('\nOther hazard positions, first vs. last sample:');
    const firstHaz = samples[0].hazards;
    const lastHaz = samples[samples.length - 1].hazards;
    firstHaz.forEach((h, i) => {
      const moved = Math.hypot(h.x - lastHaz[i].x, h.y - lastHaz[i].y);
      console.log(`  ${h.name}: (${h.x.toFixed(0)},${h.y.toFixed(0)}) -> (${lastHaz[i].x.toFixed(0)},${lastHaz[i].y.toFixed(0)}), moved ${moved.toFixed(1)}px`);
    });

    // Now try several distinct move-away clicks to different locations, not
    // just one, to see if ANY input can break the ship free.
    console.log('\nTrying several distinct move-away clicks...');
    const tries = [
      { x: 800, y: 400 },
      { x: 200, y: 1200 },
      { x: 1200, y: 675 },
    ];
    for (const t of tries) {
      const s = await page.evaluate(() => window.__snap());
      await page.mouse.click(t.x - s.camera.scrollX, t.y - s.camera.scrollY);
      await page.waitForTimeout(700);
      const after = await page.evaluate(() => window.__snap());
      console.log(`  clicked world(${t.x},${t.y}) -> ship now (${after.ship.x.toFixed(1)},${after.ship.y.toFixed(1)}) v=(${after.ship.vx.toFixed(1)},${after.ship.vy.toFixed(1)})`);
    }

    console.log('\nConsole errors captured:', consoleErrors);
  } finally {
    await browser.close();
    stopDevServer(devServer);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
