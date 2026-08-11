import Phaser from 'phaser';
import { SystemRegistry, type GameSystem } from './SystemRegistry';
import { abilityUnlockOrder, type AbilityType } from '../config/abilityConfig';

export const PROGRESSION_EVENTS = {
  AbilityUnlocked: 'onAbilityUnlocked',
} as const;

// Durable, session-long owner of unlockedAbilities (GDD §11.5). A
// SystemRegistry singleton whose init() is intentionally a no-op for this
// state -- init() reruns on every GameScene.create(), including hard-fail
// restarts, and unlocked abilities must not reset when a level restarts
// (only ShipSurvivalComponent's resources and position do). AbilityComponent
// is rebuilt fresh each attempt but delegates isUnlocked() here rather than
// owning its own copy, resolving the overlap between §11.4/§11.5 both
// describing "owns unlockedAbilities" -- ProgressionManager is the one
// source of truth; gameplay code only ever talks to ship.ability.
export class ProgressionManager extends Phaser.Events.EventEmitter implements GameSystem {
  readonly key = 'progression';

  private readonly unlocked = new Set<AbilityType>();

  init(): void {
    // Deliberately does nothing -- see class comment.
  }

  isUnlocked(type: AbilityType): boolean {
    return this.unlocked.has(type);
  }

  // Auto-grant in fixed order (2026-08-10 decision, no unlock-choice UI).
  // Called from GameScene's level-completion handler (Phase 2a step 4).
  // Returns null once every ability is already unlocked.
  grantNextAbility(): AbilityType | null {
    const next = abilityUnlockOrder.find((type) => !this.unlocked.has(type));
    if (!next) return null;
    this.unlocked.add(next);
    this.emit(PROGRESSION_EVENTS.AbilityUnlocked, next);
    return next;
  }
}

const progressionManager = new ProgressionManager();
SystemRegistry.register(progressionManager);

// Other systems/objects (AbilityComponent, HudOverlay's ability icons) look
// it up here rather than constructing their own instance -- same pattern as
// ExplorationController's getPlayerShip().
export function getProgressionManager(): ProgressionManager {
  return progressionManager;
}

// Dev-only debug handle, same convention as main.ts's window.game.
if (import.meta.env.DEV) {
  (window as unknown as { getProgressionManager: typeof getProgressionManager }).getProgressionManager =
    getProgressionManager;
}
