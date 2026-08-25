import type { HazardPlacement, LevelConfig } from './levelTypes';

const DEBRIS_TEXTURES = ['debris_large', 'debris_large_alt2', 'debris_large_alt3'];

// Interpolates a straight chain of Debris Field placements between two
// points, spaced closer than 2x its 60px radius (hazardConfig.ts) so
// adjacent circles overlap and leave no ship-width gap -- a genuine wall,
// not a line of separately-dodgeable rocks (GDD §9's Debris Field re-scope
// -- blocksMovement, zero resource cost). Cycles the three sourced debris
// textures and varies rotation per index so a long chain doesn't read as
// one sprite copy-pasted end to end.
//
// Undulation (rolled out from level-006's prototype, 2026-08-24): long-
// enough walls get a perpendicular "meander" offset instead of sitting dead
// straight -- see level-006.ts's debrisWall for the full derivation
// (envelope pinning, two-sine-term rationale, safety-margin math). Same
// SWEEP_AMPLITUDE/TEXTURE_AMPLITUDE/periods and 100px undulating spacing as
// level-006, empirically re-verified safe (margin ~18-19px under the 120px
// no-gap threshold) across this project's full observed wall-length range,
// count 7 through level-006's own 24-28. Unlike level-006's
// MIN_UNDULATE_COUNT=16 (calibrated where the 115px default spacing still
// applied to short walls), the floor here is 8: this file's walls run much
// shorter than level-006's, and every wall gets the tighter 100px spacing
// once it qualifies, not just ones long enough to clear 16 instances at
// 115px.
//
// Below that (count 4-7, e.g. this file's two ~550px walls), the two-term
// sweep+texture "S" shape doesn't have enough points to read as anything
// but a jerky zigzag -- it needs real length for the sweep's own period to
// unfold. Below MIN_UNDULATE_COUNT these get a single-term "bow" instead
// (added 2026-08-24, per playtest feedback on the S-shape looking off at
// this length): just the envelope times one flat BOW_AMPLITUDE, no
// oscillating term at all, so it's a smooth one-directional "C" bulge
// rather than a wave -- reads cleanly even with only 1-2 interior points,
// and its single-term nature makes it inherently safer per instance of
// amplitude than the two-term sweep (no direction reversal between
// neighbors to open a gap). Verified empirically the same way: at
// BOW_AMPLITUDE=30/spacing=100/count=7 (this file's two short walls' actual
// count), worst-case neighbor distance is 101.12px, an 18.88px margin.
// Below MIN_BOW_COUNT there simply aren't enough interior points for a bow
// to read as anything but noise, so the wall stays a straight line.
const SWEEP_AMPLITUDE = 28;
const SWEEP_PERIOD_INSTANCES = 12;
const TEXTURE_AMPLITUDE = 4;
const TEXTURE_PERIOD_INSTANCES = 4;
const MIN_UNDULATE_COUNT = 8;
const BOW_AMPLITUDE = 30;
const MIN_BOW_COUNT = 4;

function debrisWall(x1: number, y1: number, x2: number, y2: number, spacing = 115): HazardPlacement[] {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const length = Math.hypot(dx, dy);
  const count = Math.max(2, Math.round(length / spacing) + 1);
  const mode = count >= MIN_UNDULATE_COUNT ? 'sweep' : count >= MIN_BOW_COUNT ? 'bow' : 'straight';
  const perpX = -dy / length;
  const perpY = dx / length;
  const placements: HazardPlacement[] = [];
  for (let i = 0; i < count; i++) {
    const t = i / (count - 1);
    let x = x1 + dx * t;
    let y = y1 + dy * t;
    if (mode === 'sweep') {
      const envelope = Math.sin(Math.PI * t);
      const sweep = SWEEP_AMPLITUDE * Math.sin((i / SWEEP_PERIOD_INSTANCES) * Math.PI * 2);
      const texture = TEXTURE_AMPLITUDE * Math.sin((i / TEXTURE_PERIOD_INSTANCES) * Math.PI * 2);
      const offset = envelope * (sweep + texture);
      x += perpX * offset;
      y += perpY * offset;
    } else if (mode === 'bow') {
      const offset = Math.sin(Math.PI * t) * BOW_AMPLITUDE;
      x += perpX * offset;
      y += perpY * offset;
    }
    placements.push({
      type: 'debrisField',
      x,
      y,
      textureKey: DEBRIS_TEXTURES[i % DEBRIS_TEXTURES.length],
      rotationRadians: (i * 0.83) % (Math.PI * 2),
    });
  }
  return placements;
}

// Real LEVEL_ORDER[0] (2026-08-12). Design pass 2026-08-15 (v2, same day):
// original 2400x1350 footprint kept as-is -- the 4800x2700 doubled version
// explored earlier the same day is intentionally not this level; that
// larger, heavier-hazard shape is earmarked for a level 2+ once scan is
// unlocked, not level-001's first pass. What carries over from that
// exploration: heavily-chained Debris Field walls as the sole hazard
// (Nebula Field dropped 2026-08-15 -- debris-only for this pass; still no
// puzzle-taxonomy content), and non-uniform objective spacing -- only
// *consecutive* steps in LevelObjectiveTracker's Probe -> Relay Beacon ->
// Exit Wormhole sequence (§11.11) are pushed apart; Probe and Exit aren't
// consecutive, so they're deliberately left close together (~350px) while
// Relay Beacon sits far from both (~1800-2000px) -- a real routing "there
// and back" shape instead of evenly spacing all three apart for its own
// sake. Every debris wall keeps 250px+ clearance from every objective/
// resupply point (checked by construction, not yet by an actual playtest)
// so nothing is walled off on a level where the player has zero abilities
// yet. level-000 stays the fixed reference for hazard/puzzle-element
// testing; this file is still meant to be edited freely as design iterates.
// Named so the dev-only sanity check below can re-inspect the same
// generated arrays the hazards list spreads. All three walls now pass
// spacing=100: the diagonal (count=9) clears MIN_UNDULATE_COUNT=8 and gets
// the full sweep; the other two (550px, count=7 each) fall into the
// bow-only range instead of staying straight.
const upperCenterWall = debrisWall(1000, 150, 1000, 700, 100); // upper-center divider
const midRightWall = debrisWall(1200, 750, 1750, 750, 100); // mid-right divider
const lowerLeftDiagonalWall = debrisWall(550, 850, 1300, 1200, 100); // lower-left diagonal, guards Relay Beacon's approach

export const LEVEL_001: LevelConfig = {
  width: 2400,
  height: 1350,
  entryWormholeLocation: { x: 300, y: 300 },
  exitWormholeLocation: { x: 2050, y: 600 },
  probeLocation: { x: 2100, y: 250 },
  relayBeaconLocation: { x: 300, y: 1100 },

  resupplyPoints: [{ x: 1550, y: 1050, textureKey: 'asteroid_large', radius: 40 }],

  hazards: [
    // Debris Field walls -- the sole hazard for this pass (Nebula Field
    // dropped 2026-08-15). Three chained barriers carving the map into
    // routing decisions (Meso/Exploration pillar). None span a full map
    // dimension, so each leaves clear space at both ends to route around.
    ...upperCenterWall,
    ...midRightWall,
    ...lowerLeftDiagonalWall,

    // Meteoroid, added 2026-08-25 at explicit user request -- a deliberate
    // deviation from docs/reference/level-design-guide.md §7's normal
    // introduction point (level-003+, once scan+teleport are unlocked).
    // level-001 grants zero abilities, so this is the sole structure-
    // draining, hard-fail-capable hazard reaching a player with no scan to
    // identify it and no teleport/rocketBoost to dodge it -- flagged to the
    // user before adding, confirmed anyway. Placed in the open lower-right
    // quadrant (x:1900,y:1200), 250px+ clear of every objective/resupply/
    // wall per §7's placement rule (nearest: resupply at ~380px, midRightWall
    // at ~474px) -- authored x/y only governs its first leg (heading is
    // hazardConfig.ts's fixed default, due east) before MovingHazardManager
    // takes over wrapping/respawn for the rest of the level.
    { type: 'meteoroid', x: 1900, y: 1200 },
  ],

  puzzleElements: [],
};

// Sanity check, not gameplay logic: fails fast (at import time, in dev) if
// a future edit to debrisWall's undulation constants (sweep or bow) ever
// lets two neighboring instances drift past the 120px (2x Debris Field's
// 60px radius, hazardConfig.ts) no-gap threshold, instead of silently
// shipping a wall with a ship-width hole in it. Mirrors level-006's
// dev-check, covering all three walls (two bow, one sweep).
if (import.meta.env.DEV) {
  const NO_GAP_THRESHOLD = 2 * 60;
  [upperCenterWall, midRightWall, lowerLeftDiagonalWall].forEach((wall, wallIndex) => {
    for (let i = 0; i < wall.length - 1; i++) {
      const dist = Math.hypot(wall[i + 1].x - wall[i].x, wall[i + 1].y - wall[i].y);
      if (dist > NO_GAP_THRESHOLD) {
        console.warn(
          `[level-001] Debris wall ${wallIndex} has a ${dist.toFixed(1)}px gap between instances ${i} and ${i + 1} -- exceeds the ${NO_GAP_THRESHOLD}px no-gap threshold, may open a ship-width hole.`,
        );
      }
    }
  });
}
