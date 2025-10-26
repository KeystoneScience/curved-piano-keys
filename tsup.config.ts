import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    pathPresets: 'src/pathPresets.ts',
  },
  format: ['esm', 'cjs'],
  dts: true,
  sourcemap: true,
  clean: true,
  target: 'es2019',
  platform: 'browser',
  external: ['react'],
  outExtension({ format }) {
    return format === 'esm' ? '.mjs' : '.cjs';
  },
});
