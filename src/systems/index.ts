// Side-effect import barrel: each system module calls SystemRegistry.register(...)
// at load time. GameScene only ever imports this file and loops over
// SystemRegistry.all() — nobody hand-edits GameScene.create() to wire a system.
//
// Per CLAUDE.md: agents append an import line here as they add systems.
import './ExplorationController';
import './ProgressionManager';
