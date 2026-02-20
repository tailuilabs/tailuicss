import { defineConfig } from 'tsup';

export default defineConfig([
  // Plugin + Templates → ESM + CJS
  {
    entry: [
      'src/plugin/index.ts',
      'src/templates/index.ts',
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
  },

  // CLI → ESM only + shebang 
  {
    entry: {
      'cli/index': 'src/cli/index.ts', 
    },
    format: ['esm'],
    dts: false,
    splitting: false,
    sourcemap: true,
    minify: false,
    shims: false,
    banner: {
      js: '#!/usr/bin/env node',
    },
    outExtension() {
      return { js: '.js' };
    },
  },

  // PostCSS → CJS only ( PostCSS/Next.js)
  {
    entry: {
      'postcss/index': 'src/postcss/index.ts',
    },
    format: ['cjs'],
    dts: true,
    splitting: false,
    sourcemap: true,
    minify: false,
    shims: false,
    outExtension() {
      return { js: '.cjs' };
    },
    // Unwrap { default: fn } → fn directly required by PostCss
    esbuildOptions(options) {
      options.footer = {
        js: 'module.exports = module.exports.default ?? module.exports;\nmodule.exports.postcss = true;',
      };
    },
  },
]);