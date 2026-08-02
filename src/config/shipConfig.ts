import { registerTuning } from './devTuning';

// Click-to-move, non-Newtonian (GDD §4): the ship always ends up exactly on
// the clicked point and stops — no drift/overshoot, no counter-steering.
// acceleration/deceleration only shape ramp-up/ramp-down feel, per the
// Reynolds "arrive" behavior in ExplorationController.
export const shipConfig = {
  maxSpeed: 260, // px/s
  acceleration: 700, // px/s^2, ramping up toward maxSpeed
  deceleration: 900, // px/s^2, ramping down while inside arrivalRadius
  arrivalRadius: 48, // px from target where slowing begins
  stopRadius: 4, // px from target at which the ship snaps to a full stop
  spriteFacingOffsetRadians: Math.PI / 2, // ship_base art faces up, not right
  // Authored on-screen size, set via setDisplaySize() rather than
  // setScale() -- CLAUDE.md's asset/gameplay-size decoupling rule.
  // ship_base.png's native resolution can change (it already has once,
  // 2026-08-01's AI-generated art is ~4.5x the old placeholder's pixel
  // size) without this needing to change to match.
  displayWidth: 46,
  displayHeight: 56,
};

registerTuning('ship', shipConfig);
