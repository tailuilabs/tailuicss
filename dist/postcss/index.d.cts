import { PluginCreator } from 'postcss';

interface PluginOptions {
    path?: string;
    [key: string]: unknown;
}

/**
 * TailUI PostCSS Plugin (Zero-Config)
 *
 * Two jobs:
 * 1. Auto-injects all ui.*.css component styles before @tailwind components
 *    so the dev never has to manage CSS import order manually.
 * 2. Processes @style { ... } blocks in ui.*.css files.
 *
 * Resolves the styles directory from ui.config.json automatically.
 * The dev's CSS file just needs:
 *   @tailwind base;
 *   @tailwind components;
 *   @tailwind utilities;
 *
 * Usage in postcss.config.js:
 *   plugins: { '@tailuicss/core/postcss': {}, tailwindcss: {} }
 */
declare const tailuiPostcss: PluginCreator<PluginOptions>;

export { tailuiPostcss as default };
