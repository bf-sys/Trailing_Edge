// Thin localStorage wrapper (GDD §11.9) — level-completion persistence for
// "Continue", plus (2026-08-28) an independent master-volume setting under
// its own key, not folded into SaveData below since it has no relation to
// level progress and no reason to share a lifecycle with it.
// Simplified storage shape ({ levelId }) since CheckpointManager is
// deferred: there's no mid-level snapshot to persist, "Continue" always
// resumes at the start of levelId.
//
// Hard rule (TS-enforced via module encapsulation, not a class-private
// field, since this is a singleton-style module rather than an instance):
// this is the only code allowed to touch localStorage directly. Call sites:
// GameScene's level-completion handler (saveProgress), TitleScene's
// Start/Continue flow (hasSaveData/loadProgress), BootScene and
// VolumeSlider (saveMasterVolume/loadMasterVolume).
const SAVE_KEY = 'trailing_edge_save';
const VOLUME_KEY = 'trailing_edge_master_volume';

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

export function saveMasterVolume(volume: number): void {
  localStorage.setItem(VOLUME_KEY, String(volume));
}

export function loadMasterVolume(): number | null {
  const raw = localStorage.getItem(VOLUME_KEY);
  if (raw === null) return null;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : null;
}
