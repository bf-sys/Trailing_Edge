// Thin localStorage wrapper (GDD §11.9) — persistence for "Continue" only.
// Simplified storage shape ({ levelId }) since CheckpointManager is
// deferred: there's no mid-level snapshot to persist, "Continue" always
// resumes at the start of levelId.
//
// Hard rule (TS-enforced via module encapsulation, not a class-private
// field, since this is a singleton-style module rather than an instance):
// this is the only code allowed to touch localStorage directly. One call
// site: GameScene's level-completion handler.
const SAVE_KEY = 'trailing_edge_save';

export interface SaveData {
  levelId: string;
}

export function saveProgress(levelId: string): void {
  localStorage.setItem(SAVE_KEY, JSON.stringify({ levelId }));
}

export function loadProgress(): SaveData | null {
  const raw = localStorage.getItem(SAVE_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as SaveData;
  } catch {
    return null;
  }
}

export function hasSaveData(): boolean {
  return loadProgress() !== null;
}
