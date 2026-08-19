import { defineConfig } from 'vite';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));

// Standalone Vite config for the level viewer dev tool (CLAUDE.md's "own
// Vite entry HTML page ... addressable/runnable independently of the actual
// game"). Deliberately its own config with its own root rather than adding
// a second rollupOptions.input entry to the root vite.config.ts -- keeps
// this a genuinely separate, easy-to-delete tool instead of an edit to the
// game's shared build config. Only reads from ../../src (levels/config data
// modules, all Phaser-free at runtime -- see main.ts's import comment); does
// not import or serve anything from the game's own index.html/main.ts.
export default defineConfig({
  root: here,
  server: {
    port: 5174,
  },
  build: {
    outDir: path.resolve(here, '../../dist-level-viewer'),
    emptyOutDir: true,
  },
});
