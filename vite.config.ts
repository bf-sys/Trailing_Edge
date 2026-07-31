import { defineConfig } from 'vite';

export default defineConfig({
  // Game assets already live in assets/{ship,hazards,resupply,objectives,ui}/
  // per docs/phase1-manifest-and-tasks.md — serve that tree as-is at the web
  // root instead of duplicating it under public/.
  publicDir: 'assets',
  server: {
    port: 5173,
  },
  build: {
    outDir: 'dist',
  },
});
