import type { Config } from 'tailwindcss';

interface TailUIPluginOptions {
  /** Override the styles directory path */
  path?: string;
}

interface TailUIPlugin {
  handler: (api: any) => void;
  config: Partial<Config>;
}

/**
 * TailUI — Tailwind CSS Plugin
 *
 * Automatically resolves the styles directory from ui.config.json
 * and adds it to Tailwind's content paths so .ui-* classes are
 * detected and not tree-shaken.
 *
 * @example
 * // tailwind.config.ts
 * import tailui from '@tailuicss/core';
 * export default {
 *   plugins: [tailui()],
 * }
 *
 * @example
 * // tailwind.config.js
 * plugins: [require('@tailuicss/core')()]
 */
declare const tailui: (options?: TailUIPluginOptions) => TailUIPlugin;
export = tailui;
