import Phaser from 'phaser';
import { survivalConfig } from '../config/survivalConfig';

// Event name strings match GDD §11.1 literally so future sessions (e.g.
// LevelObjectiveTracker's hard-fail wiring) can grep the doc and find the
// exact string this component emits.
export const SHIP_SURVIVAL_EVENTS = {
  ResourceChanged: 'onResourceChanged',
  StructureDepleted: 'onStructureDepleted',
} as const;

export interface ResourceSnapshot {
  currentEnergy: number;
  maxEnergy: number;
  currentStructure: number;
  maxStructure: number;
}

// Structure is the fail resource; energy just gates ability use (GDD §5,
// §11.1). Composed onto PlayerShip — no puzzle element, hazard, or ability
// may read/write currentEnergy/currentStructure directly, only through the
// methods below.
export class ShipSurvivalComponent extends Phaser.Events.EventEmitter {
  private currentEnergy: number;
  private readonly maxEnergy: number;
  private currentStructure: number;
  private readonly maxStructure: number;

  constructor() {
    super();
    this.maxEnergy = survivalConfig.maxEnergy;
    this.currentEnergy = this.maxEnergy;
    this.maxStructure = survivalConfig.maxStructure;
    this.currentStructure = this.maxStructure;
  }

  // All-or-nothing gate: abilities either can afford the cost or can't, no
  // partial spend. Energy-draining hazards reuse this too — once a player is
  // already at 0 energy, further drain requests just no-op rather than fail
  // the level (energy has no failure side effect, GDD §5/§11.1).
  consumeEnergy(amount: number, source: string): boolean {
    if (amount <= 0) return true;
    if (this.currentEnergy < amount) return false;
    this.currentEnergy -= amount;
    this.logDebug('energy', -amount, source);
    this.emitResourceChanged();
    return true;
  }

  // Unlike consumeEnergy, this always applies (clamped at 0) — structure
  // damage can never be "denied," since hitting exactly 0 is the intended
  // fail trigger, not a gate to route around.
  consumeStructure(amount: number, source: string): boolean {
    if (amount <= 0) return true;
    const wasAboveZero = this.currentStructure > 0;
    this.currentStructure = Math.max(0, this.currentStructure - amount);
    this.logDebug('structure', -amount, source);
    this.emitResourceChanged();
    if (wasAboveZero && this.currentStructure === 0) {
      this.emit(SHIP_SURVIVAL_EVENTS.StructureDepleted);
    }
    return this.currentStructure > 0;
  }

  // Called every update tick at the authored passive rate — no resupply
  // object involved (GDD §11.1).
  regenEnergy(deltaMs: number): void {
    if (this.currentEnergy >= this.maxEnergy) return;
    const regen = survivalConfig.energyRegenPerSecond * (deltaMs / 1000);
    this.currentEnergy = Math.min(this.maxEnergy, this.currentEnergy + regen);
    this.emitResourceChanged();
  }

  // Resupply-point objects only (GDD §11.1/§11.6).
  repairStructure(amount: number): void {
    if (amount <= 0 || this.currentStructure >= this.maxStructure) return;
    this.currentStructure = Math.min(this.maxStructure, this.currentStructure + amount);
    this.emitResourceChanged();
  }

  snapshot(): ResourceSnapshot {
    return {
      currentEnergy: this.currentEnergy,
      maxEnergy: this.maxEnergy,
      currentStructure: this.currentStructure,
      maxStructure: this.maxStructure,
    };
  }

  private emitResourceChanged(): void {
    this.emit(SHIP_SURVIVAL_EVENTS.ResourceChanged, this.snapshot());
  }

  private logDebug(resource: 'energy' | 'structure', delta: number, source: string): void {
    if (!import.meta.env.DEV) return;
    console.debug(`[survival] ${resource} ${delta} from ${source}`);
  }
}
