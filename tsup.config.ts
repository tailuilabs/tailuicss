import { defineConfig } from 'tsup';

export default defineConfig({
  entry: [
    'src/plugin/index.ts',
    'src/cli/index.ts',
    'src/postcss/index.ts',
    'src/templates/index.ts'
  ],
  format: ['cjs', 'esm'],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  minify: false,
  shims: true,
  outExtension({ format }) {
    return {
      js: format === 'cjs' ? '.cjs' : '.js',
    };
  },
});