import { registerTuning } from './devTuning';
import { shipStatusArcConfig } from './shipStatusArcConfig';

// Blue/white glow + particle VFX for EnergyNodeElement (2026-08-24, user
// request). Reuses shipStatusArcConfig.energyColor -- the same blue the
// energy bar already uses -- so "this is about energy" stays one consistent
// hue across the HUD and the world, same reasoning resupplyVfxConfig
// already applied for structure/orange.
export const energyNodeVfxConfig = {
  color: shipStatusArcConfig.energyColor,
  hotColor: 0xffffff,
  textureSize: 20,

  // Base icon "breathing" pulse (scale+alpha tween, yoyo/repeat forever) --
  // makes a small stationary pickup easier to spot scattered across a level
  // that's often bigger than the viewport. No sourced art exists for this
  // pickup -- the generated glow texture IS the icon, not just its particle
  // trail (unlike thruster/resupply, which pair a generated glow with
  // separately-sourced base art).
  pulseScaleFrom: 0.85,
  pulseScaleTo: 1.15,
  pulseAlphaFrom: 0.75,
  pulseAlphaTo: 1,
  pulseDurationMs: 900,

  // Idle ambient sparkle -- small particles drifting slowly outward from the
  // node and fading, continuous while uncollected. Same soft-glow texture
  // pattern as ShipThrusterTrail/ResupplyPoint's spark emitters.
  sparkleLifespanMs: 700,
  sparkleSpeed: { min: 6, max: 18 },
  sparkleScaleStart: 0.5,
  sparkleScaleEnd: 0,
  sparkleAlphaStart: 0.8,
  sparkleFrequency: 90,

  // One-shot collection burst.
  burstCount: 14,
  burstSpeed: { min: 60, max: 140 },
  burstLifespanMs: 380,
  burstScaleStart: 0.9,
  burstScaleEnd: 0,
  burstAlphaStart: 1,

  depth: 6,
};

registerTuning('energyNodeVfx', energyNodeVfxConfig);
