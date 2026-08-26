// Stateful anomaly detectors fed one game-state snapshot per tick (see
// agent.mjs's snapshot shape). Each check is written against this project's
// actual mechanics (src/objects/HazardZoneElement.ts, MovingHazardManager.ts,
// ShipSurvivalComponent.ts) rather than generic heuristics -- e.g. the
// double-hit check reads the real hitCooldownSeconds off window.tuning
// instead of a hardcoded guess, so it stays correct if the value is retuned.
//
// Scope, per explicit project-owner direction (2026-08-26, second run): a
// moving hazard's collider merely overlapping another collider's is NOT
// reported here -- that's a common, harmless visual occurrence in this kind
// of game, and an earlier version of this file that reported it purely
// flooded the report with level-010's Debris Field maze walls (built from
// deliberately overlapping tangent circles) and non-witnessed Meteoroid/wall
// crossings nobody ever played through. What actually matters is *play*
// impact: is the ship genuinely stuck/pinned (commanded to move, physically
// can't), and does an ability that's supposed to bypass solid colliders
// (teleport) leave the ship in a broken state afterward.
function distance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function round(n, digits = 1) {
  const f = 10 ** digits;
  return Math.round(n * f) / f;
}

// Rough ship half-extent (CLAUDE.md's knockback-clearance comment cites
// "~23-28px half-extent") -- used to decide how close to a level edge counts
// as "touching the boundary" the same way a hazard's radius decides contact.
const SHIP_HALF_EXTENT = 28;

export class Detectors {
  constructor(hazardTuning) {
    this.hazardTuning = hazardTuning ?? {};
    this.findings = [];

    this.currentLevelId = null;
    this.lastStructure = null;
    this.lastMeteoroidHitAtMs = null;
    this.posHistory = []; // rolling {t, x, y} window for checkStuck below
    this.stuckAlreadyReported = false;
    this.teleportProbe = null; // see armTeleportProbe/checkTeleportProbe
  }

  record(snap, errorType, location, context, severity, detail) {
    this.findings.push({
      timestamp: new Date().toISOString(),
      location: { x: round(location.x), y: round(location.y), levelId: snap.levelId },
      errorType,
      severity,
      gameContext: { ...context, sceneTimeMs: Math.round(snap.tMs) },
      detail,
    });
    // eslint-disable-next-line no-console
    console.log(`  [FOUND] (${severity}) ${errorType} @ (${round(location.x)}, ${round(location.y)}) -- ${detail}`);
  }

  ingest(snap) {
    if (!snap) return;

    if (snap.levelId !== this.currentLevelId) {
      this.currentLevelId = snap.levelId;
      this.lastMeteoroidHitAtMs = null;
      this.posHistory = [];
      this.stuckAlreadyReported = false;
      this.teleportProbe = null;
    }

    this.checkNonFinite(snap);
    this.checkOutOfBounds(snap);
    this.checkResourceRange(snap);
    this.checkDoubleHit(snap);
    this.checkStuck(snap);
    this.checkTeleportProbe(snap);

    this.lastStructure = snap.survival.currentStructure;
  }

  checkNonFinite(snap) {
    const { x, y, vx, vy } = snap.ship;
    if (![x, y, vx, vy].every(Number.isFinite)) {
      this.record(snap, 'Non-finite Ship State', { x, y }, { vx, vy }, 'high', 'Ship position/velocity contains NaN or Infinity.');
    }
    snap.hazards.forEach((h) => {
      if (![h.x, h.y].every(Number.isFinite)) {
        this.record(snap, 'Non-finite Hazard Position', { x: h.x, y: h.y }, { hazard: h.name }, 'high', `${h.name}'s position is NaN/Infinity.`);
      }
    });
  }

  checkOutOfBounds(snap) {
    const tol = 5;
    const { x, y } = snap.ship;
    if (x < -tol || x > snap.levelWidth + tol || y < -tol || y > snap.levelHeight + tol) {
      this.record(
        snap,
        'Ship Escaped Level Bounds',
        { x, y },
        { levelWidth: snap.levelWidth, levelHeight: snap.levelHeight },
        'high',
        `Ship position is outside the level's [0,${snap.levelWidth}]x[0,${snap.levelHeight}] bounds despite setCollideWorldBounds(true).`,
      );
    }
  }

  checkResourceRange(snap) {
    const { currentStructure, maxStructure, currentEnergy, maxEnergy } = snap.survival;
    const tol = 0.01;
    if (currentStructure < -tol || currentStructure > maxStructure + tol) {
      this.record(snap, 'Invalid Structure Value', snap.ship, snap.survival, 'high', `currentStructure=${currentStructure} outside valid [0, ${maxStructure}].`);
    }
    if (currentEnergy < -tol || currentEnergy > maxEnergy + tol) {
      this.record(snap, 'Invalid Energy Value', snap.ship, snap.survival, 'high', `currentEnergy=${currentEnergy} outside valid [0, ${maxEnergy}].`);
    }
  }

  // A fast Meteoroid passing very close can, per CLAUDE.md's own documented
  // known-unfixed edge case, land a second impact hit if the ship decelerates
  // to a stop right at the minimum-clearance margin -- applyImpactCost()'s
  // hitCooldownSeconds gate is supposed to prevent exactly this.
  checkDoubleHit(snap) {
    if (this.lastStructure === null) return;
    const delta = this.lastStructure - snap.survival.currentStructure;
    if (delta <= 0.5) return; // not damage (repair/restart-reset move the value the other way)

    const meteoroid = this.nearestHazardByName(snap, 'METEOROID');
    const isMeteoroidContact = meteoroid && distance(snap.ship, meteoroid) <= meteoroid.radius + 40;
    if (!isMeteoroidContact) return;

    if (this.lastMeteoroidHitAtMs !== null) {
      const dtSeconds = (snap.tMs - this.lastMeteoroidHitAtMs) / 1000;
      const cooldown = this.hazardTuning?.meteoroid?.hitCooldownSeconds ?? 1;
      if (dtSeconds < cooldown - 0.05) {
        this.record(
          snap,
          'Meteoroid Hit Landed Inside Its Own Cooldown Window',
          snap.ship,
          { dtSeconds: round(dtSeconds, 3), configuredCooldownSeconds: cooldown, structureDelta: round(delta) },
          'high',
          `Two structure-loss events attributed to Meteoroid contact landed ${round(dtSeconds, 2)}s apart -- inside the configured ${cooldown}s hitCooldownSeconds gate.`,
        );
      }
    }
    this.lastMeteoroidHitAtMs = snap.tMs;
  }

  // What's actually in contact with the ship's body right now -- every
  // blocksMovement hazard within contact range, PLUS the level boundary
  // itself (not a HazardZoneElement, so it needs its own synthetic check).
  // Shared by checkStuck below; this is the concrete "wedged against X and Y"
  // vocabulary the project owner asked for (Meteoroid+Debris Field,
  // Meteoroid+map edge, etc.), not just "touching something."
  contactList(snap) {
    const contacts = [];
    snap.hazards.forEach((h) => {
      if (h.blocksMovement && distance(snap.ship, h) <= h.radius + 30) {
        contacts.push({ kind: 'hazard', name: h.name, index: h.index });
      }
    });

    const margin = SHIP_HALF_EXTENT + 15;
    if (snap.ship.x <= margin) contacts.push({ kind: 'boundary', name: 'WEST BOUNDARY' });
    if (snap.ship.x >= snap.levelWidth - margin) contacts.push({ kind: 'boundary', name: 'EAST BOUNDARY' });
    if (snap.ship.y <= margin) contacts.push({ kind: 'boundary', name: 'NORTH BOUNDARY' });
    if (snap.ship.y >= snap.levelHeight - margin) contacts.push({ kind: 'boundary', name: 'SOUTH BOUNDARY' });

    return contacts;
  }

  // The real play-impact check: is the ship's *position* actually stuck over
  // a sustained window, regardless of what ExplorationController's target
  // bookkeeping is doing. An earlier version of this gated on "has a pending
  // move target far away + near-zero instantaneous speed," which turned out
  // to almost never fire in practice for two game-mechanic reasons: (1)
  // Meteoroid's cancelTargetOnContact clears the target at the exact moment
  // contact happens -- the very fix the game uses for one stuck failure mode
  // also defeats a target-based detector; (2) Arcade lets a ship slide along
  // a static collider's surface (only the perpendicular velocity component
  // is blocked), so speed rarely drops to near-zero even while touching a
  // wall. Tracking real position history sidesteps both: if the ship hasn't
  // actually gone anywhere in ~1.8s while touching solid geometry, that's a
  // trap, independent of target state or instantaneous velocity.
  checkStuck(snap) {
    this.posHistory.push({ t: snap.tMs, x: snap.ship.x, y: snap.ship.y });
    const windowMs = 1800;
    while (this.posHistory.length > 1 && snap.tMs - this.posHistory[0].t > windowMs) this.posHistory.shift();

    const oldest = this.posHistory[0];
    const windowSpanMs = snap.tMs - oldest.t;
    if (windowSpanMs < windowMs * 0.8) return; // not enough history yet to judge

    const netDisplacement = distance(snap.ship, oldest);
    let maxStep = 0;
    for (let i = 1; i < this.posHistory.length; i++) {
      maxStep = Math.max(maxStep, distance(this.posHistory[i], this.posHistory[i - 1]));
    }
    // Both a low net displacement AND a low max single-sample step -- net
    // alone would also match "wandered away and came back," which isn't stuck.
    const barelyMoved = netDisplacement < 20 && maxStep < 15;
    // Surfaced in the report's meta (barelyMovedTickCount) -- lets a reader
    // judge how much this run actually exercised the "is it stuck" question
    // at all, separate from how many times it turned into a reported finding
    // (barelyMoved-but-touching-nothing is common and not reported below).
    this.diagBarelyMovedCount = (this.diagBarelyMovedCount ?? 0) + (barelyMoved ? 1 : 0);

    if (!barelyMoved) {
      this.stuckAlreadyReported = false;
      return;
    }
    if (this.stuckAlreadyReported) return;

    const contacts = this.contactList(snap);
    if (contacts.length === 0) return; // motionless but touching nothing -- idle/between commands, not a trap

    const hasMovingHazard = contacts.some((c) => c.kind === 'hazard' && c.name === 'METEOROID');
    const hasBoundary = contacts.some((c) => c.kind === 'boundary');
    const severity = contacts.length >= 2 || hasMovingHazard || hasBoundary ? 'high' : 'medium';

    this.record(
      snap,
      'Ship Pinned / Stuck Against Solid Geometry',
      snap.ship,
      { windowSeconds: round(windowSpanMs / 1000), netDisplacement: round(netDisplacement), contacts: contacts.map((c) => c.name) },
      severity,
      `Ship has moved only ${round(netDisplacement)}px over the last ${round(windowSpanMs / 1000)}s while in contact with ${contacts.map((c) => c.name).join(' + ')} -- looks trapped, not just idle between commands.`,
    );
    this.stuckAlreadyReported = true;
  }

  // Arms a short observation window right after the driver deliberately
  // teleports the ship into a blocksMovement hazard's collision radius
  // (teleport is documented, in CLAUDE.md, to pass through solid colliders
  // via a plain setPosition() call -- the interesting question isn't whether
  // that "works," it's what happens to the ship's physics body afterward,
  // now overlapping an immovable Arcade body from the inside).
  armTeleportProbe(targetX, targetY, targetHazardIndex, targetHazardName) {
    this.teleportProbe = { targetX, targetY, targetHazardIndex, targetHazardName, confirmedAtMs: null };
  }

  checkTeleportProbe(snap) {
    const probe = this.teleportProbe;
    if (!probe) return;

    const distToTarget = distance(snap.ship, { x: probe.targetX, y: probe.targetY });

    if (probe.confirmedAtMs === null) {
      // First tick after arming: did the teleport actually land near the
      // target, or did tryActivate() silently no-op (on cooldown / not
      // enough energy / not yet unlocked)? If it didn't fire, there's
      // nothing to observe.
      if (distToTarget < 80) {
        probe.confirmedAtMs = snap.tMs;
        this.diagTeleportConfirmedCount = (this.diagTeleportConfirmedCount ?? 0) + 1;
      } else {
        this.teleportProbe = null;
      }
      return;
    }

    const elapsedSeconds = (snap.tMs - probe.confirmedAtMs) / 1000;
    const speed = Math.hypot(snap.ship.vx, snap.ship.vy);

    // No legitimate mechanic in this game produces a speed anywhere near
    // this (max: rocketBoost's 520, Meteoroid knockback's 260) -- a spike
    // this large right after landing inside a solid body's collider would
    // point at an Arcade separation response firing much harder than
    // intended once it discovers the ship embedded inside an immovable body.
    if (speed > 650) {
      this.record(
        snap,
        'Teleport Into Solid Hazard Produced Anomalous Ejection Speed',
        snap.ship,
        { speed: round(speed), targetHazard: probe.targetHazardName, elapsedSeconds: round(elapsedSeconds) },
        'high',
        `Ship velocity spiked to ${round(speed)}px/s ${round(elapsedSeconds, 2)}s after teleporting into ${probe.targetHazardName}'s collision radius -- well above any legitimate ability speed in this game.`,
      );
      this.teleportProbe = null;
      return;
    }

    if (elapsedSeconds > 1.5) {
      const stillInsideHazard = distToTarget < 65;
      if (stillInsideHazard && speed < 15) {
        this.record(
          snap,
          'Teleport Into Solid Hazard Left Ship Trapped',
          snap.ship,
          { targetHazard: probe.targetHazardName, elapsedSeconds: round(elapsedSeconds) },
          'high',
          `Ship teleported into ${probe.targetHazardName}'s collision radius and is still there, essentially motionless, ${round(elapsedSeconds)}s later -- teleport bypasses the collider going in, but nothing seems to be pushing the ship back out.`,
        );
      }
      this.teleportProbe = null;
    }
  }

  // Compares a snapshot taken while confirmed-paused at the start of an
  // ESC-pause window against one taken while still confirmed-paused right
  // before resuming -- GameScene.update() (and therefore every hazard/
  // ability/survival tick) should be fully frozen the whole time.
  checkPauseFreeze(before, after) {
    if (!before || !after) return;
    const posDelta = distance(before.ship, after.ship);
    const structDelta = Math.abs(before.survival.currentStructure - after.survival.currentStructure);
    const energyDelta = Math.abs(before.survival.currentEnergy - after.survival.currentEnergy);
    if (posDelta > 4 || structDelta > 0.5 || energyDelta > 0.5) {
      this.record(
        after,
        'State Changed While Paused',
        before.ship,
        { posDelta: round(posDelta), structDelta: round(structDelta), energyDelta: round(energyDelta) },
        'medium',
        'Ship position/resources changed by a non-trivial amount across an ESC-pause/ESC-resume cycle, when GameScene.update() should be fully frozen while PauseScene is active.',
      );
    }
  }

  nearestHazardByName(snap, name) {
    const matches = snap.hazards.filter((h) => h.name === name);
    if (matches.length === 0) return null;
    return matches.reduce((best, h) => (distance(snap.ship, h) < distance(snap.ship, best) ? h : best));
  }
}

export { distance, round };
