import plugin from 'tailwindcss/plugin';
import fs from 'fs';
import path from 'path';
 
import { resolveConfig, type PluginOptions } from '../config';

/**
 * TailUI — Tailwind CSS Plugin (Zero-Config)
 *
 * Automatically resolves the styles directory from ui.config.json
 * and adds it to Tailwind's content paths so .ui-* classes are
 * detected and not tree-shaken.
 */
const tailuiPlugin = plugin.withOptions(
  (options: PluginOptions = {}) => {
    const { stylesDir } = resolveConfig(options);

    return function ({ /* addUtilities, addComponents, etc. */ }) {
      const fullPath = path.resolve(process.cwd(), stylesDir);

      if (!fs.existsSync(fullPath)) {
        console.warn(`[TailUI] ⚠️ Styles directory not found: ${fullPath}`);
        console.warn(`[TailUI] Run "npx tailui init" to create it.`);
        return;
      }

      const files = fs
        .readdirSync(fullPath)
        .filter((f) => f.startsWith('ui.') && f.endsWith('.css'))
        .sort();

      if (files.length === 0) {
        console.warn(`[TailUI] ⚠️ No ui.*.css files found in ${fullPath}`);
        return;
      }

      // Log informatif lors du build Tailwind
      console.log(
        `[TailUI] ✅ Found ${files.length} component(s): ${files
          .map((f) => f.replace('ui.', '').replace('.css', ''))
          .join(', ')}`
      );
    };
  },
  (options: PluginOptions = {}) => {
    const { stylesDir } = resolveConfig(options);
    const fullPath = path.resolve(process.cwd(), stylesDir);

    return {
      // We add the CSS files to Tailwind's "content"
      // so that the .ui-* classes are not removed by the Purge/JIT
      content: [path.join(fullPath, 'ui.*.css')],
    };
  }
);

export default tailuiPlugin;