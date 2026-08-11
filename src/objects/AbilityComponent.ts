import Phaser from 'phaser';
import { abilityConfig, type AbilityType } from '../config/abilityConfig';
import { ShipSurvivalComponent } from './ShipSurvivalComponent';
import { getProgressionManager } from '../systems/ProgressionManager';

export const ABILITY_EVENTS = {
  Activated: 'onAbilityActivated',
  ActivationFailed: 'onAbilityActivationFailed',
} as const;

// Composed onto PlayerShip (GDD §11.4), rebuilt fresh every attempt like
// ShipSurvivalComponent -- but unlock state itself is NOT owned here, it's
// delegated to ProgressionManager (a durable system that survives hard-fail
// scene.restart()), so a fresh AbilityComponent each attempt never resets
// what's actually been unlocked. Cooldowns are per-attempt state and are
// correctly wiped by that same reconstruction -- no reason to persist them.
export class AbilityComponent extends Phaser.Events.EventEmitter {
  private readonly cooldownReadyAtMs = new Map<AbilityType, number>();

  constructor(private readonly survival: ShipSurvivalComponent) {
    super();
  }

  isUnlocked(type: AbilityType): boolean {
    return getProgressionManager().isUnlocked(type);
  }

  // Read-only query for HudOverlay's ability-icon cooldown sweep -- HUD
  // queries, it doesn't gate, per the existing display-only contract.
  getCooldownRemainingMs(type: AbilityType, nowMs: number): number {
    const readyAt = this.cooldownReadyAtMs.get(type) ?? 0;
    return Math.max(0, readyAt - nowMs);
  }

  // Dual gate (GDD §7/§11.4): unlock, then cooldown, then energy -- either
  // cost may be authored as 0, either gate no-ops at 0. All-or-nothing, no
  // partial spend, matching ShipSurvivalComponent.consumeEnergy's contract.
  tryActivate(type: AbilityType, nowMs: number): boolean {
    if (!this.isUnlocked(type)) return this.fail(type, 'locked');

    const cost = abilityConfig[type];
    const readyAt = this.cooldownReadyAtMs.get(type) ?? 0;
    if (nowMs < readyAt) return this.fail(type, 'cooldown');

    if (!this.survival.consumeEnergy(cost.energyCost, `ability:${type}`)) return this.fail(type, 'energy');

    this.cooldownReadyAtMs.set(type, nowMs + cost.cooldownSeconds * 1000);
    this.logDebug(type, 'activated');
    this.emit(ABILITY_EVENTS.Activated, type);
    return true;
  }

  private fail(type: AbilityType, reason: string): false {
    this.logDebug(type, `failed (${reason})`);
    this.emit(ABILITY_EVENTS.ActivationFailed, type);
    return false;
  }

  private logDebug(type: AbilityType, message: string): void {
    if (!import.meta.env.DEV) return;
    console.debug(`[ability] ${type} ${message}`);
  }
}
