import fs from 'fs';
import path from 'path';
import postcss, { PluginCreator, Root, AtRule } from 'postcss';
import { resolveConfig, PluginOptions } from '../config';

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
const plugin: PluginCreator<PluginOptions> = (options: PluginOptions = {}) => {
  const { stylesDir } = resolveConfig(options);

  return {
    postcssPlugin: 'tailui',

    Once(root: Root) {
      const fullPath = path.resolve(process.cwd(), stylesDir);

      if (!fs.existsSync(fullPath)) {
        return;
      }

      // Collect all ui.*.css files
      const files = fs.readdirSync(fullPath)
        .filter(f => f.startsWith('ui.') && f.endsWith('.css'))
        .sort();

      if (files.length === 0) return;

      // Read and concatenate all CSS content
      let allCSS = files
        .map(file => fs.readFileSync(path.join(fullPath, file), 'utf8'))
        .join('\n');

      // Process @style blocks before parsing (supports nested braces)
      allCSS = processStyleBlocks(allCSS);

      // Parse the combined CSS into a PostCSS AST
      const parsed = postcss.parse(allCSS);

      // Find @tailwind components directive
      let componentsRule: AtRule | null = null;
      root.walkAtRules('tailwind', (atRule) => {
        if (atRule.params === 'components') {
          componentsRule = atRule;
        }
      });

      if (componentsRule) {
        // Insert all parsed nodes before @tailwind components
        parsed.nodes.slice().reverse().forEach(node => {
          (componentsRule as AtRule).before(node.clone());
        });
        console.log(`[TailUI] ✅ Injected ${files.length} component(s): ${files.map(f => f.replace('ui.', '').replace('.css', '')).join(', ')}`);
      } else {
        console.warn(`[TailUI] ⚠️  No "@tailwind components" directive found. Styles were not injected.`);
        console.warn(`[TailUI] Make sure your CSS file contains: @tailwind base; @tailwind components; @tailwind utilities;`);
      }
    },
  };
};

plugin.postcss = true;

export default plugin;

/**
 * Process @style { ... } blocks, supporting nested braces.
 * Extracts the inner content and replaces the @style wrapper.
 */
function processStyleBlocks(css: string): string {
  let result = '';
  let i = 0;

  while (i < css.length) {
    const idx = css.indexOf('@style', i);
    if (idx === -1) {
      result += css.slice(i);
      break;
    }

    result += css.slice(i, idx);

    // Find the opening brace
    const braceStart = css.indexOf('{', idx);
    if (braceStart === -1) {
      result += css.slice(idx);
      break;
    }

    // Count braces to find matching close
    let depth = 1;
    let j = braceStart + 1;
    while (j < css.length && depth > 0) {
      if (css[j] === '{') depth++;
      else if (css[j] === '}') depth--;
      j++;
    }

    // Extract inner content (between outermost braces)
    const inner = css.slice(braceStart + 1, j - 1).trim();
    result += inner;
    i = j;
  }

  return result;
}