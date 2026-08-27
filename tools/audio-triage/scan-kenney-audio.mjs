#!/usr/bin/env node
// Metadata/filename triage for local audio libraries against
// docs/reference/sfx-asset-list.md's Required/Nice-to-have SFX categories.
//
// This is NOT perceptual evaluation -- nothing here listens to a file. It
// only matches filenames (e.g. Kenney's own descriptive stems --
// "laserSmall_003.ogg", "impactMetal_heavy_002.ogg") against a keyword list
// per category, groups numbered variants of the same stem together, and
// produces a shortlist for a human listening pass. No files are moved,
// copied, or converted -- read-only against the source librar{y,ies}.
//
// Usage: node tools/audio-triage/scan-kenney-audio.mjs [sourceDir] [outFile] [--source=extraDir [--license="label"]] ...
// Defaults match this project owner's local Kenney library layout; both
// positional args are overridable since that path won't exist on another
// machine. Repeat `--source=DIR` to scan additional, non-default libraries
// in the same run -- their matches are merged into the same category tables
// (so a rerun with a new --source effectively appends new candidates rather
// than losing what a prior default-only run already found). A `--license=`
// immediately following a `--source=` records that root's actual terms
// (read from whatever license file/readme ships with that library) in the
// generated doc; a root with no `--license=` is called out as unverified --
// the default Kenney path is pre-verified CC0 and needs neither flag.
import { readdirSync, statSync, writeFileSync } from 'node:fs';
import { join, relative, extname, basename } from 'node:path';

const DEFAULT_SOURCE = 'C:\\Users\\bryan\\Dropbox\\Game Assets\\Kenney\\Audio';
const DEFAULT_OUT = join('docs', 'reference', 'sfx-sourcing-candidates.md');

const rawArgs = process.argv.slice(2);
const positional = [];
const extraRoots = [];
let pendingRoot = null;
for (const arg of rawArgs) {
  if (arg.startsWith('--source=')) {
    pendingRoot = { dir: arg.slice('--source='.length), licenseLabel: null, licenseNote: null };
    extraRoots.push(pendingRoot);
  } else if (arg.startsWith('--license=')) {
    if (pendingRoot) pendingRoot.licenseLabel = arg.slice('--license='.length);
  } else if (arg.startsWith('--note=')) {
    if (pendingRoot) pendingRoot.licenseNote = arg.slice('--note='.length);
  } else {
    positional.push(arg);
  }
}

const sourceDir = positional[0] ?? DEFAULT_SOURCE;
const outFile = positional[1] ?? DEFAULT_OUT;

// Each root is scanned independently; `licenseLabel` (null = unverified)
// gates the license language written into the generated doc.
const sourceRoots = [
  { dir: sourceDir, licenseLabel: sourceDir === DEFAULT_SOURCE ? 'Kenney CC0' : null },
  ...extraRoots,
];
const multiSource = sourceRoots.length > 1;

// Root label used to disambiguate packs when scanning multiple roots (e.g.
// two libraries that both happen to have a top-level "Audio" folder). Falls
// back to the last two path segments when bare basenames collide.
const rootBasenames = sourceRoots.map((r) => basename(r.dir));
for (const root of sourceRoots) {
  const dupes = rootBasenames.filter((b) => b === basename(root.dir)).length > 1;
  root.label = dupes
    ? root.dir.split(/[\\/]/).filter(Boolean).slice(-2).join('/')
    : basename(root.dir);
}

const AUDIO_EXTENSIONS = new Set(['.ogg', '.wav', '.mp3']);

// Packs with zero thematic overlap with this game (no combat/fighting-game
// announcer lines, no gambling) -- excluded from matching entirely rather
// than left to score zero everywhere, so they don't pad "unmatched" counts
// with files that were never going to be relevant.
const EXCLUDED_PACKS = new Set(['Casino Audio', 'Voiceover Pack', 'Voiceover Pack Fighter']);

// Category list mirrors docs/reference/sfx-asset-list.md's §1 (Required)
// and a chosen subset of §2 (Nice-to-have) worth candidate-matching now.
// `keywords` are matched as case-insensitive substrings against the
// filename with all non-alphanumeric characters stripped (so
// "impactMetal_heavy_002.ogg" normalizes to "impactmetalheavy002" and a
// "impactmetalheavy" keyword hits it).
const CATEGORIES = [
  // --- 1. Required ---
  { section: '1.1 Ship & movement', id: 'click-to-move confirm', keywords: ['click', 'confirmation', 'confirm', 'blip'] },
  { section: '1.1 Ship & movement', id: 'thruster / movement loop', keywords: ['thrusterfire', 'thruster', 'engine', 'spaceengine'] },
  { section: '1.2 Hazard contact', id: 'Debris Field collision thud', keywords: ['impactstone', 'impactplank', 'impactgeneric', 'rockhit', 'stonehit', 'thud'] },
  { section: '1.2 Hazard contact', id: 'generic energy-drain tick/hum', keywords: ['zap', 'laser', 'phaser', 'forcefield', 'lowfrequency'] },
  { section: '1.2 Hazard contact', id: 'generic structure-hit stinger', keywords: ['impactmetalheavy', 'impactplateheavy', 'impactglassheavy', 'impactpunchheavy'] },
  { section: '1.2 Hazard contact', id: 'Meteoroid impact + knockback whoosh', keywords: ['explosioncrunch', 'explosion', 'woosh', 'impactplateheavy'] },
  { section: '1.3 Survival & fail state', id: 'hard-fail / restart stinger', keywords: ['gameover', 'lowdown', 'error', 'saddescend', 'sadtown'] },
  { section: '1.4 Core-loop objects', id: 'Probe discovery chime', keywords: ['powerup', 'pickup', 'confirmation', 'bong'] },
  { section: '1.4 Core-loop objects', id: 'Relay Beacon reached chime', keywords: ['confirmation', 'bong', 'beep', 'powerup'] },
  { section: '1.4 Core-loop objects', id: 'Exit Wormhole "opens" cue', keywords: ['dooropen', 'unlock', 'switch', 'open'] },
  { section: '1.4 Core-loop objects', id: 'Exit Wormhole transition / level-complete', keywords: ['phasejump', 'highup', 'powerup', 'warp'] },
  { section: '1.5 Resupply', id: 'repair tick/loop', keywords: ['metalclick', 'metalpot', 'tone', 'toggle'] },
  { section: '1.6 Energy Node pickups', id: 'pickup collect chime', keywords: ['powerup', 'pickup', 'handlecoins', 'confirmation'] },
  { section: '1.7 Abilities', id: 'Scan activation ping', keywords: ['highup', 'phaserup', 'bong', 'tone'] },
  { section: '1.7 Abilities', id: 'Teleport arm tone', keywords: ['phasejump', 'forcefield', 'tone'] },
  { section: '1.7 Abilities', id: 'Teleport blink sound', keywords: ['phasejump', 'zap', 'warp'] },
  { section: '1.7 Abilities', id: 'Rocket Boost burst', keywords: ['thrusterfire', 'engine', 'woosh'] },
  { section: '1.8 UI / menu', id: 'menu click', keywords: ['click', 'confirmation', 'back', 'close'] },
  { section: '1.8 UI / menu', id: 'pause open/close', keywords: ['pause', 'close', 'open', 'switch'] },
  { section: '1.8 UI / menu', id: 'ability unlocked fanfare', keywords: ['jingleshit', 'jinglespizzicato', 'powerup', 'fanfare'] },
  { section: '1.9 Music', id: 'ambient background loop', keywords: ['spacecadet', 'infinitedescent', 'flowingrocks', 'ambient', 'drone'] },

  // --- 2. Nice-to-have (subset worth candidate-matching now) ---
  { section: '2.1 Hazard identity', id: 'Ion Storm crackle loop', keywords: ['crackle', 'static', 'forcefield', 'zap'] },
  { section: '2.1 Hazard identity', id: 'Nebula Field drone loop', keywords: ['lowfrequency', 'drone', 'hum'] },
  { section: '2.1 Hazard identity', id: 'Solar Flare pre-burst warning tone', keywords: ['alarm', 'warning', 'highup', 'beep'] },
  { section: '2.1 Hazard identity', id: 'Solar Flare pulse/burst sound', keywords: ['explosion', 'forcefield', 'burst'] },
  { section: '2.2 Puzzle elements', id: 'Signal Array step tone', keywords: ['tone', 'beep', 'twotone', 'threetone'] },
  { section: '2.2 Puzzle elements', id: 'Scan Target/Marker interact chime', keywords: ['confirmation', 'bong', 'powerup'] },
  { section: '2.2 Puzzle elements', id: 'Comet tracking hum', keywords: ['lowfrequency', 'hum', 'engine'] },
  { section: '2.2 Puzzle elements', id: 'Cargo Pod push/pull scrape', keywords: ['platesslide', 'stonedrag', 'cloth', 'drag'] },
  { section: '2.2 Puzzle elements', id: 'Beacon Cluster trail-progress tone', keywords: ['tone', 'beep', 'click'] },
  { section: '2.2 Puzzle elements', id: 'shared puzzle-solved fanfare', keywords: ['jingleshit', 'jinglespizzicato', 'powerup'] },
  { section: '2.3 Ability & object polish', id: 'Tractor Beam engage/pull', keywords: ['forcefield', 'hum', 'engine'] },
  { section: '2.3 Ability & object polish', id: 'Entry Wormhole ambient hum', keywords: ['lowfrequency', 'hum', 'ambient'] },
];

function normalize(name) {
  return name.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function stemOf(normalized) {
  return normalized.replace(/\d+$/, '');
}

function walk(dir, pack, root, out) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) {
      walk(full, pack, root, out);
    } else if (AUDIO_EXTENSIONS.has(extname(entry).toLowerCase())) {
      out.push({ full, pack, root, filename: entry });
    }
  }
}

function main() {
  const files = [];
  for (const root of sourceRoots) {
    for (const packDir of readdirSync(root.dir)) {
      if (EXCLUDED_PACKS.has(packDir)) continue;
      const full = join(root.dir, packDir);
      if (!statSync(full).isDirectory()) continue;
      // Disambiguate pack names only when scanning multiple roots, so a
      // single-root run's output (and the "Pack" values within it) stays
      // byte-identical to before this multi-source support was added.
      const label = multiSource ? `${root.label} / ${packDir}` : packDir;
      walk(full, label, root, files);
    }
  }

  console.error(`Scanned ${files.length} audio files across ${new Set(files.map((f) => f.pack)).size} packs and ${sourceRoots.length} source root(s) (excluded: ${[...EXCLUDED_PACKS].join(', ')}).`);

  const matchedFileSet = new Set();
  const results = CATEGORIES.map((cat) => {
    const catKeywords = cat.keywords.map(normalize);
    const groups = new Map(); // stemKey -> { pack, examples: [], count }
    for (const f of files) {
      const base = basename(f.filename, extname(f.filename));
      const norm = normalize(base);
      if (!catKeywords.some((kw) => norm.includes(kw))) continue;
      matchedFileSet.add(f.full);
      const stem = stemOf(norm) || norm;
      const key = `${f.pack}::${stem}`;
      if (!groups.has(key)) {
        groups.set(key, { pack: f.pack, stem, examples: [], count: 0 });
      }
      const g = groups.get(key);
      g.count += 1;
      if (g.examples.length < 2) g.examples.push(relative(f.root.dir, f.full));
    }
    const rows = [...groups.values()].sort((a, b) => b.count - a.count || a.stem.localeCompare(b.stem));
    return { ...cat, rows };
  });

  // Per-pack coverage: how many files in each scanned pack matched *something*,
  // so it's visible which packs are pulling weight vs. sitting unused.
  const packTotals = new Map();
  const packMatched = new Map();
  const packLicenseLabel = new Map();
  for (const f of files) {
    packTotals.set(f.pack, (packTotals.get(f.pack) ?? 0) + 1);
    if (matchedFileSet.has(f.full)) packMatched.set(f.pack, (packMatched.get(f.pack) ?? 0) + 1);
    packLicenseLabel.set(f.pack, f.root.licenseLabel);
  }

  const unverifiedRoots = sourceRoots.filter((r) => !r.licenseLabel);

  const lines = [];
  lines.push('# SFX Sourcing Candidates — Local Audio Library Triage');
  lines.push('');
  lines.push('Generated by `tools/audio-triage/scan-kenney-audio.mjs` against:');
  for (const root of sourceRoots) {
    lines.push(`- \`${root.dir}\`${root.licenseLabel ? ` (${root.licenseLabel}, verified)` : ' (license NOT verified)'}`);
    if (root.licenseNote) lines.push(`  ${root.licenseNote}`);
  }
  lines.push('');
  lines.push('**This is filename/keyword triage, not perceptual evaluation** — nothing here');
  lines.push('listened to a file. Each row below is a *candidate pool* narrowed from the full');
  lines.push('librar' + (multiSource ? 'ies' : 'y') + ' for a human listening pass, grouped by category from');
  lines.push('`docs/reference/sfx-asset-list.md` §1/§2. Numbered variants of the same base');
  lines.push('sound (e.g. `click_001.ogg`\u2013`click_005.ogg`) are collapsed into one row with a');
  lines.push('variant count — go listen to the whole numbered set for a given stem, not just');
  lines.push('the one example path shown, since variants (Kenney or otherwise) can differ');
  lines.push('meaningfully from one to the next. The default Kenney library is CC0 (verified');
  lines.push('via each pack\'s `License.txt` — no attribution required, though `ATTRIBUTION.md`');
  lines.push('should still get a courtesy credit line once files are actually pulled in,');
  lines.push('matching existing project practice for Kenney art packs).');
  if (unverifiedRoots.length > 0) {
    lines.push('');
    lines.push('**License NOT verified for these additional source(s) — check each pack\'s own');
    lines.push('license/readme before pulling any file into the project:**');
    for (const root of unverifiedRoots) {
      lines.push(`- \`${root.dir}\``);
    }
  }
  lines.push('');
  lines.push('Rerun with the same source(s) after adding/removing packs there, or add a new');
  lines.push('source via `--source=DIR --license="label"` to merge its matches into these');
  lines.push('same category tables (omit `--license=` if that library\'s terms haven\'t been');
  lines.push('checked yet):');
  lines.push('`node tools/audio-triage/scan-kenney-audio.mjs ' + `"${DEFAULT_SOURCE}" "${DEFAULT_OUT}"` + ' --source=DIR2 --license="..." --source=DIR3`.');
  lines.push('');
  lines.push('---');
  lines.push('');
  lines.push('## Pack coverage');
  lines.push('');
  lines.push('| Pack | Files scanned | Files matching >=1 category | License |');
  lines.push('|---|---|---|---|');
  for (const [pack, total] of [...packTotals.entries()].sort((a, b) => b[1] - a[1])) {
    const license = packLicenseLabel.get(pack) ?? 'unverified';
    lines.push(`| ${pack} | ${total} | ${packMatched.get(pack) ?? 0} | ${license} |`);
  }
  lines.push('');
  lines.push(`Excluded from scanning entirely (no thematic overlap — fighting-game announcer`);
  lines.push(`lines, casino sounds): ${[...EXCLUDED_PACKS].join(', ')}.`);
  lines.push('');
  lines.push('---');
  lines.push('');

  let currentSection = null;
  for (const cat of results) {
    if (cat.section !== currentSection) {
      currentSection = cat.section;
      lines.push(`## ${currentSection}`);
      lines.push('');
    }
    lines.push(`### ${cat.id}`);
    lines.push('');
    if (cat.rows.length === 0) {
      lines.push('*No filename matches in this library — source elsewhere or broaden keywords.*');
      lines.push('');
      continue;
    }
    lines.push('| Pack | Stem | Variants | Example path(s) |');
    lines.push('|---|---|---|---|');
    for (const row of cat.rows.slice(0, 10)) {
      lines.push(`| ${row.pack} | \`${row.stem}\` | ${row.count} | ${row.examples.map((e) => `\`${e}\``).join(', ')} |`);
    }
    if (cat.rows.length > 10) {
      lines.push('');
      lines.push(`*(+${cat.rows.length - 10} more matching stem(s) not shown — see pack folder directly.)*`);
    }
    lines.push('');
  }

  writeFileSync(outFile, lines.join('\n') + '\n', 'utf8');
  console.error(`Wrote ${outFile}`);
}

main();
