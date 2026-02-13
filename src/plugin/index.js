const plugin = require('tailwindcss/plugin');
const fs = require('fs');
const path = require('path');
const { resolveConfig } = require('../config');

/**
 * TailUI — Tailwind CSS Plugin (Zero-Config)
 * 
 * Automatically resolves the styles directory from ui.config.json
 * and adds it to Tailwind's content paths so .ui-* classes are
 * detected and not tree-shaken.
 * 
 * The actual CSS injection is handled by the TailUI PostCSS plugin
 * (require('@tailui-css/core/postcss')) which auto-injects styles in the
 * correct position relative to @tailwind directives.
 * 
 * Setup:
 *   // tailwind.config.js
 *   plugins: [require('@tailui-css/core')()]
 */
module.exports = plugin.withOptions(function (options = {}) {
  const { stylesDir } = resolveConfig(options);

  return function () {
    const fullPath = path.resolve(process.cwd(), stylesDir);

    if (!fs.existsSync(fullPath)) {
      console.warn(`[TailUI] Styles directory not found: ${fullPath}`);
      console.warn(`[TailUI] Run "npx tailui init" to create it.`);
      return;
    }

    const files = fs.readdirSync(fullPath)
      .filter(f => f.startsWith('ui.') && f.endsWith('.css'))
      .sort();

    if (files.length === 0) {
      console.warn(`[TailUI] No ui.*.css files found in ${fullPath}`);
      return;
    }

    console.log(`[TailUI] ✅ Found ${files.length} component(s): ${files.map(f => f.replace('ui.', '').replace('.css', '')).join(', ')}`);
  };
}, function (options = {}) {
  const { stylesDir } = resolveConfig(options);
  const fullPath = path.resolve(process.cwd(), stylesDir);

  return {
    content: [
      path.join(fullPath, '**/*.css'),
    ],
  };
});
