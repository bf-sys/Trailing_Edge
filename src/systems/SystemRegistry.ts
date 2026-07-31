export interface GameSystem {
  readonly key: string;
  init?(scene: Phaser.Scene): void;
  update?(time: number, delta: number): void;
}

const systems = new Map<string, GameSystem>();

export const SystemRegistry = {
  register(system: GameSystem): void {
    if (systems.has(system.key)) {
      throw new Error(`SystemRegistry: duplicate system key "${system.key}"`);
    }
    systems.set(system.key, system);
  },

  get(key: string): GameSystem | undefined {
    return systems.get(key);
  },

  all(): GameSystem[] {
    return Array.from(systems.values());
  },
};
