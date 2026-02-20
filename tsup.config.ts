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

  // CLI → ESM uniquement + shebang garanti en première ligne
  {
    entry: ['src/cli/index.ts'],
    format: ['esm'],
    dts: false,               // Pas de types nécessaires pour le CLI
    splitting: false,
    sourcemap: true,
    minify: false,
    shims: false,             // Pas de shims CJS en ESM pur
    banner: {
      js: '#!/usr/bin/env node',
    },
    outExtension() {
      return { js: '.js' };
    },
  },

  // PostCSS → CJS uniquement (contrainte PostCSS/Next.js)
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
    // Unwrap { default: fn } → fn directement, requis par PostCSS
    esbuildOptions(options) {
      options.footer = {
        js: 'module.exports = module.exports.default ?? module.exports;\nmodule.exports.postcss = true;',
      };
    },
  },
]);