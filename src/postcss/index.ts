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
    postcssPlugin: 'tailuicss',

    // We use Once with the second argument { result } to manage dependencies
    Once(root: Root, { result }) {
      // Resolving the absolute path to the styles directory
      const fullPath = path.resolve(process.cwd(), stylesDir);

      if (!fs.existsSync(fullPath)) {
        return;
      }


      // This allows the detection of the addition or deletion of ui.*.css files.
      result.messages.push({
        type: 'dir-dependency',
        dir: fullPath,
        parent: root.source?.input.file
      });

      // Collecting ui.*.css files
      const files = fs.readdirSync(fullPath)
        .filter(f => f.startsWith('ui.') && f.endsWith('.css'))
        .sort();

      if (files.length === 0) return;

      // Reading and saving each file as an individual dependency
      let allCSS = files
        .map(file => {
          const filePath = path.join(fullPath, file);

          // SIGNAL HMR: It is indicated that this specific file should be monitored
          // Without this, modifying the library's CSS will not trigger a refresh
          result.messages.push({
            type: 'dependency',
            file: filePath,
            parent: root.source?.input.file
          });

          return fs.readFileSync(filePath, 'utf8');
        })
        .join('\n');

      // Block processing @style (supports nested curly braces)
      allCSS = processStyleBlocks(allCSS);

      // Combined CSS parsing
      const parsed = postcss.parse(allCSS);

      // Searching for the @tailwind components directive
      let componentsRule: AtRule | null = null;
      root.walkAtRules('tailwind', (atRule) => {
        if (atRule.params === 'components') {
          componentsRule = atRule;
        }
      });

      if (componentsRule) {
        // Front injection @tailwind components
        parsed.nodes.slice().reverse().forEach(node => {
          (componentsRule as AtRule).before(node.clone());
        });
        
        // Discrete log in development to confirm the injection
        if (process.env.NODE_ENV !== 'production') {
          console.log(`[TailUI] ☑️ Injected ${files.length} component(s) with HMR enabled.`);
        }
      } else {
        console.warn(`[TailUI] ⚠️  No "@tailwind components" directive found. Styles were not injected.`);
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

    const braceStart = css.indexOf('{', idx);
    if (braceStart === -1) {
      result += css.slice(idx);
      break;
    }

    let depth = 1;
    let j = braceStart + 1;
    while (j < css.length && depth > 0) {
      if (css[j] === '{') depth++;
      else if (css[j] === '}') depth--;
      j++;
    }

    const inner = css.slice(braceStart + 1, j - 1).trim();
    result += inner;
    i = j;
  }

  return result;
}