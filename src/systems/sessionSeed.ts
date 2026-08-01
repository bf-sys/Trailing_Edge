// A per-page-load random seed, used to seed deterministic-per-level RNGs
// (e.g. BackgroundSetPieces) without touching localStorage. SaveManager
// (Phase 2a, not built yet) is the only code CLAUDE.md's architecture
// contract allows to touch localStorage directly, so this stays in-memory
// only for now -- in the current absence of SaveManager/Continue, a full
// page reload is already the only way to start a genuinely new "playthrough",
// which is exactly the boundary this is meant to reshuffle on.
//
// When SaveManager/Continue land, this is the one piece of state that
// should move under SaveManager's ownership, so a resumed session keeps its
// original seed instead of reshuffling on reload.
let sessionSeed: number | undefined;

export function getSessionSeed(): number {
  if (sessionSeed === undefined) {
    sessionSeed = Math.floor(Math.random() * 2 ** 31);
  }
  return sessionSeed;
}
