import type { PluginCreator } from 'postcss';

interface TailUIPostCSSOptions {
  /** Override the styles directory path */
  path?: string;
}

/**
 * TailUI PostCSS Plugin
 *
 * Auto-injects all ui.*.css component styles before @tailwind components
 * so the dev never has to manage CSS import order manually.
 *
 * @example
 * // postcss.config.js
 * plugins: { '@tailui-css/core/postcss': {}, tailwindcss: {} }
 */
declare const tailuiPostCSS: PluginCreator<TailUIPostCSSOptions>;
export = tailuiPostCSS;
