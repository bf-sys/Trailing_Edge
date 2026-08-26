import Phaser from 'phaser';
import { survivalConfig } from '../config/survivalConfig';

// Event name strings match GDD §11.1 literally so future sessions (e.g.
// LevelObjectiveTracker's hard-fail wiring) can grep the doc and find the
// exact string this component emits.
export const SHIP_SURVIVAL_EVENTS = {
  ResourceChanged: 'onResourceChanged',
  StructureDepleted: 'onStructureDepleted',
  StructureHit: 'onStructureHit',
} as const;

export interface ResourceSnapshot {
  currentEnergy: number;
  maxEnergy: number;
  currentStructure: number;
  maxStructure: number;
}

// Added 2026-08-26 for ShipDamageFlash -- a purpose-built event for "a real
// hit landed," distinct from ResourceChanged (which fires on every mutation
// including regen ticks and repairs, carries no delta/source, and isn't a
// meaningful trigger for hit-feedback VFX on its own). atWorldPos is the
// hazard's own position at the moment of the hit (the only caller,
// HazardZoneElement, always has this) -- an approximate contact point, not
// a precise pixel; optional so a future non-hazard structure-cost source
// wouldn't be forced to fabricate one.
export interface StructureHitPayload {
  amount: number; // actual structure lost, after the 0-floor clamp -- may be less than the requested amount
  atWorldPos?: { x: number; y: number };
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
    // Starts empty, not full (2026-08-24, alongside EnergyNodeElement
    // pickups) -- no level requires energy on arrival, so starting full
    // just meant the first pickup or two of passive regen went unnoticed.
    // Structure still starts full -- only energy's start value changed.
    this.currentEnergy = 0;
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
  // fail trigger, not a gate to route around. atWorldPos (2026-08-26,
  // ShipDamageFlash) is display-only metadata passed straight through to
  // StructureHit -- it never affects the mechanical result.
  consumeStructure(amount: number, source: string, atWorldPos?: { x: number; y: number }): boolean {
    if (amount <= 0) return true;
    const wasAboveZero = this.currentStructure > 0;
    const before = this.currentStructure;
    this.currentStructure = Math.max(0, this.currentStructure - amount);
    const actualDelta = before - this.currentStructure;
    this.logDebug('structure', -amount, source);
    this.emitResourceChanged();
    if (actualDelta > 0) this.emit(SHIP_SURVIVAL_EVENTS.StructureHit, { amount: actualDelta, atWorldPos });
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

  // EnergyNodeElement pickups only (added 2026-08-24, alongside dropping
  // survivalConfig.energyRegenPerSecond 8 -> 2) -- energy's equivalent of
  // repairStructure above: a flat, immediate grant rather than a per-second
  // rate.
  rechargeEnergy(amount: number): void {
    if (amount <= 0 || this.currentEnergy >= this.maxEnergy) return;
    this.currentEnergy = Math.min(this.maxEnergy, this.currentEnergy + amount);
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
