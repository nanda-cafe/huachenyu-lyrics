import { defineConfig } from 'vite';

export default defineConfig({
  // The repo is served from https://<user>.github.io/<repo>/ on GitHub
  // Pages, so the build needs relative asset paths. Override with
  // --base=/ locally if you prefer testing at the domain root.
  base: process.env.VITE_BASE || './',
  // `public/data` is generated from `data/` by scripts/copy-data.js
  // (run automatically via the predev/prebuild npm hooks) so that
  // `data/` stays the single source of truth contributors edit.
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
});
