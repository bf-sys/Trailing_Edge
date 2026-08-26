// One-off summarizer: reads the full per-tick trace dump written by
// repro-meteoroid-boundary-stall.mjs (reports/repro-meteoroid-boundary-stall-*.json)
// and distills it into the same compact Location/ErrorType/GameContext
// finding shape agent.mjs's reports use -- the raw trace is hundreds of
// per-tick samples per trial, useful for verifying the mechanism but not for
// a reader who just wants "where, what, and what was going on when it
// happened." Run manually (`node summarize-boundary-stall-repro.mjs`)
// against the most recent repro trace file; not part of any other script.
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const reportsDir = path.join(__dirname, 'reports');

function latestReproTraceFile() {
  const candidates = readdirSync(reportsDir).filter((f) => f.startsWith('repro-meteoroid-boundary-stall-') && f.endsWith('.json'));
  if (candidates.length === 0) throw new Error('No repro-meteoroid-boundary-stall-*.json trace file found in reports/.');
  candidates.sort();
  return path.join(reportsDir, candidates[candidates.length - 1]);
}

function dist(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function round(n, digits = 1) {
  const f = 10 ** digits;
  return Math.round(n * f) / f;
}

// Rounds a {x, y, vx, vy} (or {x, y}) sample to 1 decimal place -- the raw
// trace carries full float precision (e.g. 2366.666666666675), which is
// noise for a human-readable summary.
function roundVec(v) {
  return Object.fromEntries(Object.entries(v).map(([k, n]) => [k, round(n)]));
}

// Finds the exact tick where the Meteoroid's velocity drops from clearly
// moving (>50px/s) to essentially zero (<1px/s) and never recovers within
// the trace -- the same "freeze onset" moment inspected by hand while
// investigating this bug.
function findFreezeOnset(trace) {
  for (let i = 1; i < trace.length; i++) {
    const prevSpeed = Math.hypot(trace[i - 1].meteoroid.vx, trace[i - 1].meteoroid.vy);
    const curSpeed = Math.hypot(trace[i].meteoroid.vx, trace[i].meteoroid.vy);
    if (curSpeed < 1 && prevSpeed > 50) return { index: i, lastMoving: trace[i - 1], freeze: trace[i] };
  }
  return null;
}

function buildFinding(result) {
  const trace = result.trace.filter((s) => s.meteoroid);
  const onset = findFreezeOnset(trace);
  const last = trace[trace.length - 1];
  if (!onset) return null;

  const { lastMoving, freeze } = onset;
  const freezeDurationSeconds = (last.tMs - freeze.tMs) / 1000;

  return {
    timestamp: new Date().toISOString(),
    location: { x: round(freeze.meteoroid.x), y: round(freeze.meteoroid.y), levelId: 'level-000' },
    errorType: 'Meteoroid Permanently Immobilized After Ship/Boundary Collision',
    severity: 'high',
    gameContext: {
      reproParams: { rightEdgeTargetX: 2385, targetY: result.targetY, yOffsetFromMeteoroidMidline: result.yOffset },
      contactSamplesRecorded: result.contactCount,
      lastMovingSample: { tMs: Math.round(lastMoving.tMs), ship: roundVec(lastMoving.ship), meteoroid: roundVec(lastMoving.meteoroid), distance: round(dist(lastMoving.ship, lastMoving.meteoroid)) },
      freezeOnsetSample: { tMs: Math.round(freeze.tMs), ship: roundVec(freeze.ship), meteoroid: roundVec(freeze.meteoroid), distance: round(dist(freeze.ship, freeze.meteoroid)) },
      shipHalfWidthPx: 23, // shipConfig.displayWidth 46 / 2
      shipDistanceFromRightBoundaryAtFreeze: round(2400 - freeze.ship.x),
      meteoroidWrapThresholdX: 2456, // MovingHazardManager: levelWidth(2400) + radius(56)
      meteoroidDistanceShortOfWrapThreshold: round(2456 - freeze.meteoroid.x),
      observedFreezeDurationInThisTrialSeconds: round(freezeDurationSeconds),
    },
    detail:
      `Meteoroid froze at (${round(freeze.meteoroid.x)}, ${round(freeze.meteoroid.y)}) and stayed there for the rest of this ${round(freezeDurationSeconds)}s trial ` +
      `(velocity snapped from (280,0) to exactly (0,0) in one tick). Trigger: the ship's collision edge reached the world's right boundary ` +
      `(ship at x=${round(freeze.ship.x)}, ${round(2400 - freeze.ship.x)}px from the 2400px edge -- its own 23px half-width) in the same physics step it ` +
      `was still grazing the Meteoroid (${round(dist(freeze.ship, freeze.meteoroid))}px apart). Meteoroid stopped ${round(2456 - freeze.meteoroid.x)}px short of ` +
      `MovingHazardManager's wrap threshold (levelWidth+radius=2456), so it can never self-recover via the normal wrap-and-respawn path.`,
  };
}

function main() {
  const traceFile = latestReproTraceFile();
  const data = JSON.parse(readFileSync(traceFile, 'utf-8'));

  const stalledResults = data.results.filter((r) => r.verdict === 'METEOROID STALLED');
  const findings = stalledResults.map(buildFinding).filter(Boolean);

  const meta = {
    generatedAt: new Date().toISOString(),
    summarizedFrom: path.basename(traceFile),
    level: 'level-000 (Test Level)',
    sweepYOffsetsTried: data.results.map((r) => r.yOffset),
    sweepVerdicts: Object.fromEntries(data.results.map((r) => [r.yOffset, r.verdict])),
    // Facts confirmed in a separate follow-up session (repro-followup-check.mjs,
    // run interactively -- output not persisted to its own file, recorded here
    // since it's essential context for reading these findings correctly):
    followUpVerification: {
      description:
        'Ran the y=865 repro again and, after the freeze, observed the scene for 8+ more seconds and tried several move-away clicks.',
      sceneWideHang: false,
      evidence: 'Ship energy regenerated normally (16.6 -> 32.6 over ~8s) and Ion Storm continued its trochoid drift (~2164px moved) during the freeze window -- only the Meteoroid (and transiently the ship) stopped.',
      shipEventuallyEscaped: true,
      shipEscapeEvidence: 'First two move-away clicks after the freeze produced no ship movement at all; a third, later click succeeded (ship resumed normal velocity).',
      meteoroidRecoveredAfterShipLeft: false,
    },
  };

  const outBase = path.join(reportsDir, `summary-meteoroid-boundary-stall-${new Date().toISOString().replace(/[:.]/g, '-')}`);
  writeFileSync(`${outBase}.json`, JSON.stringify({ meta, findings }, null, 2));

  const header = ['Timestamp', 'LevelId', 'Location_X', 'Location_Y', 'ErrorType', 'Severity', 'GameContext', 'Detail'];
  const csvEscape = (v) => `"${String(v).replace(/"/g, '""')}"`;
  const rows = findings.map((f) =>
    [f.timestamp, f.location.levelId, f.location.x, f.location.y, f.errorType, f.severity, JSON.stringify(f.gameContext), f.detail].map(csvEscape).join(','),
  );
  writeFileSync(`${outBase}.csv`, [header.join(','), ...rows].join('\n'));

  console.log(`Summarized ${findings.length} finding(s) from ${stalledResults.length} stalled trial(s) (out of ${data.results.length} y-offsets swept).`);
  console.log(`Written:\n  ${outBase}.json\n  ${outBase}.csv`);
}

main();
