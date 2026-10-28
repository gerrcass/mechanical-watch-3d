import { defineConfig } from 'vite';

// Relative base so the same artefact works at a project path or a custom domain.
// Chunk size is dominated by Three.js; the exhibit's own code stays small.
export default defineConfig({
  base: './',
  build: {
    target: 'es2022',
    assetsInlineLimit: 4096,
    chunkSizeWarningLimit: 900,
  },
  server: { port: 5173, strictPort: true },
});
