import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig({
  plugins: [react()],
  base: '/curved-piano-keys/',
  resolve: {
    alias: {
      'curved-piano-keys': path.resolve(__dirname, '../../src'),
      'curved-piano-keys/path-presets': path.resolve(__dirname, '../../src/pathPresets.ts'),
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
});
