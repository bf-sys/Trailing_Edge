import { defineConfig } from 'vite';

export default defineConfig({
  // Relative asset references in the built output, not root-absolute --
  // required for itch.io, which serves HTML5 uploads from a non-root CDN
  // path (see docs/TODO.md's "itch.io packaged-build pipeline" section).
  base: './',
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
