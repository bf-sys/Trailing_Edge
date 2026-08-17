import { LEVEL_000 } from './level-000';
import { LEVEL_001 } from './level-001';
import { LEVEL_002 } from './level-002';
import { LEVEL_003 } from './level-003';
import { LEVEL_004 } from './level-004';
import type { LevelConfig } from './levelTypes';

// Content agents append their level's file + entry here, per
// docs/.claude/agents/content-agent.md's "one hand-authored file per
// level" convention (CLAUDE.md tech stack). Never referenced directly by
// levelId string elsewhere -- go through getLevelConfig().
const LEVELS: Record<string, LevelConfig> = {
  'level-000': LEVEL_000,
  'level-001': LEVEL_001,
  'level-002': LEVEL_002,
  'level-003': LEVEL_003,
  'level-004': LEVEL_004,
};

export function getLevelConfig(levelId: string): LevelConfig {
  const config = LEVELS[levelId];
  if (!config) {
    throw new Error(`[levels] unknown levelId: ${levelId}`);
  }
  return config;
}
