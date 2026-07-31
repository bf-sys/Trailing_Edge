// Shared window.tuning namespace so multiple config modules (shipConfig,
// survivalConfig, ...) can each expose themselves for live console tuning in
// dev builds without one overwriting another.
type TuningRegistry = Record<string, unknown>;

declare global {
  interface Window {
    tuning?: TuningRegistry;
  }
}

export function registerTuning(key: string, config: unknown): void {
  if (!import.meta.env.DEV) return;
  window.tuning = { ...(window.tuning ?? {}), [key]: config };
}
