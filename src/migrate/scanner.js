/**
 * TailUI Migration — File Scanner
 *
 * Parses source files (JSX, TSX, Vue, Svelte, HTML, Astro, Angular)
 * and extracts class attribute locations with their Tailwind classes.
 */

const fs = require('fs');
const path = require('path');

// Supported file extensions
const SUPPORTED_EXTENSIONS = [
  '.jsx', '.tsx', '.js', '.ts',
  '.vue', '.svelte', '.astro',
  '.html', '.htm',
];

/**
 * Regex patterns for extracting STATIC class attributes only.
 * We deliberately skip dynamic expressions (cn(), clsx(), cva(), ternaries).
 */
const CLASS_REGEXES = [
  // className="..." or class="..."  (JSX / HTML) — static strings only
  /\bclass(?:Name)?\s*=\s*"([^"]*)"/g,
  // className='...' or class='...'
  /\bclass(?:Name)?\s*=\s*'([^']*)'/g,
  // :class="'...'"  (Vue shorthand with static string)
  /:class\s*=\s*"'([^']*)'"/g,
  // class:list={["..."]}  (Astro)
  /class:list\s*=\s*\{\s*\[\s*"([^"]*)"/g,
];

/**
 * Patterns that indicate dynamic class expressions — we SKIP these entirely.
 * These are common in React/Vue/Svelte projects.
 */
const DYNAMIC_CLASS_PATTERNS = [
  /\bclass(?:Name)?\s*=\s*\{[^}]*\bcn\s*\(/,       // cn(...)
  /\bclass(?:Name)?\s*=\s*\{[^}]*\bclsx\s*\(/,      // clsx(...)
  /\bclass(?:Name)?\s*=\s*\{[^}]*\bcva\s*\(/,        // cva(...)
  /\bclass(?:Name)?\s*=\s*\{[^}]*\btwMerge\s*\(/,    // twMerge(...)
  /\bclass(?:Name)?\s*=\s*\{[^}]*\bclassNames\s*\(/, // classNames(...)
  /\bclass(?:Name)?\s*=\s*\{`[^`]*\$\{/,             // template literal with interpolation
  /\bclass(?:Name)?\s*=\s*\{[^"'`}]+\?[^}]+:/,       // ternary expression
];

/**
 * Tag detection regex — captures the tag name before a class attribute.
 * We look backwards from the class attribute position.
 */
const TAG_REGEX = /<(\w[\w-]*)\s[^>]*$/;

/**
 * Attribute detection — captures common attributes near the element.
 */
const ATTR_PATTERNS = [
  /\bonClick\b/i,
  /\bonclick\b/,
  /\btype\s*=\s*["'](\w+)["']/g,
  /\brole\s*=\s*["'](\w+)["']/g,
  /\baria-modal\b/,
  /\bplaceholder\b/,
];

/**
 * @typedef {Object} ClassMatch
 * @property {string} file        - Absolute file path
 * @property {number} line        - 1-indexed line number
 * @property {number} column      - 0-indexed column of the class attribute start
 * @property {string} original    - The full original attribute (e.g. className="px-4 py-2 ...")
 * @property {string} classString - The class string content (e.g. "px-4 py-2 ...")
 * @property {string[]} classes   - Array of individual class names
 * @property {string} tag         - Detected HTML tag (e.g. 'button', 'div')
 * @property {string[]} attrs     - Detected attributes on the element
 * @property {number} startIndex  - Character index of classString start in file
 * @property {number} endIndex    - Character index of classString end in file
 */

/**
 * Scan a single file and return all class attribute matches.
 *
 * @param {string} filePath - Absolute path to the file
 * @returns {ClassMatch[]}
 */
function scanFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const matches = [];

  // Pre-check: skip files that are clearly not using Tailwind classes
  if (!content.includes('class')) return matches;

  for (const regex of CLASS_REGEXES) {
    // Reset regex state
    const re = new RegExp(regex.source, regex.flags);
    let match;

    while ((match = re.exec(content)) !== null) {
      const classString = match[1];
      if (!classString || !classString.trim()) continue;

      // Skip dynamic class expressions near this match
      const lineStart = content.lastIndexOf('\n', match.index) + 1;
      const lineEnd = content.indexOf('\n', match.index + match[0].length);
      const fullLine = content.substring(lineStart, lineEnd === -1 ? content.length : lineEnd);
      if (isDynamicClassExpression(fullLine)) continue;

      const classes = classString.split(/\s+/).filter(Boolean);
      if (classes.length === 0) continue;

      // Skip if too few classes (likely not a full component)
      if (classes.length < 3) continue;

      // Skip if already using ui-* classes
      if (classes.some(c => c.startsWith('ui-'))) continue;

      // Calculate line number
      const beforeMatch = content.substring(0, match.index);
      const line = (beforeMatch.match(/\n/g) || []).length + 1;
      const lastNewline = beforeMatch.lastIndexOf('\n');
      const column = match.index - lastNewline - 1;

      // Detect tag
      const tag = detectTag(content, match.index);

      // Detect attributes on the element
      const attrs = detectAttrs(content, match.index);

      // Calculate the exact position of the class string (inside quotes)
      const fullMatch = match[0];
      const classStringOffset = fullMatch.indexOf(classString);
      const startIndex = match.index + classStringOffset;
      const endIndex = startIndex + classString.length;

      matches.push({
        file: filePath,
        line,
        column,
        original: fullMatch,
        classString,
        classes,
        tag,
        attrs,
        startIndex,
        endIndex,
      });
    }
  }

  return matches;
}

/**
 * Scan a directory recursively for supported files.
 *
 * @param {string} dirPath - Absolute path to the directory
 * @returns {string[]} - Array of absolute file paths
 */
function findFiles(dirPath) {
  const results = [];

  function walk(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      // Skip common non-source directories
      if (entry.isDirectory()) {
        if (['node_modules', '.git', '.next', '.nuxt', '.svelte-kit', 'dist', 'build', '.tailui-backup'].includes(entry.name)) {
          continue;
        }
        walk(fullPath);
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name).toLowerCase();
        if (SUPPORTED_EXTENSIONS.includes(ext)) {
          results.push(fullPath);
        }
      }
    }
  }

  walk(dirPath);
  return results;
}

/**
 * Detect the HTML tag name for the element containing the class attribute.
 */
function detectTag(content, classAttrIndex) {
  // Look backwards up to 500 chars for the opening tag
  const lookback = content.substring(Math.max(0, classAttrIndex - 500), classAttrIndex);
  const tagMatch = lookback.match(TAG_REGEX);
  return tagMatch ? tagMatch[1].toLowerCase() : '';
}

/**
 * Detect attributes on the element containing the class attribute.
 * We extract a window around the class attribute to find the full element.
 */
function detectAttrs(content, classAttrIndex) {
  const attrs = [];

  // Find the element boundaries (look back for <tag, forward for > or />)
  const lookback = content.substring(Math.max(0, classAttrIndex - 500), classAttrIndex);
  const openTagIdx = lookback.lastIndexOf('<');
  if (openTagIdx === -1) return attrs;

  const elementStart = Math.max(0, classAttrIndex - 500) + openTagIdx;
  const closeIdx = content.indexOf('>', classAttrIndex);
  if (closeIdx === -1) return attrs;

  const elementStr = content.substring(elementStart, closeIdx + 1);

  // Check for onClick
  if (/\bonClick\b/i.test(elementStr)) attrs.push('onClick');
  if (/\bonclick\b/.test(elementStr)) attrs.push('onclick');

  // Check type attribute
  const typeMatch = elementStr.match(/\btype\s*=\s*["'](\w+)["']/);
  if (typeMatch) attrs.push(`type="${typeMatch[1]}"`);

  // Check role attribute
  const roleMatch = elementStr.match(/\brole\s*=\s*["'](\w+)["']/);
  if (roleMatch) attrs.push(`role="${roleMatch[1]}"`);

  // Check aria-modal
  if (/\baria-modal\b/.test(elementStr)) attrs.push('aria-modal');

  // Check placeholder
  if (/\bplaceholder\b/.test(elementStr)) attrs.push('placeholder');

  return attrs;
}

/**
 * Check if a line contains a dynamic class expression that we should skip.
 */
function isDynamicClassExpression(line) {
  return DYNAMIC_CLASS_PATTERNS.some(re => re.test(line));
}

module.exports = { scanFile, findFiles, SUPPORTED_EXTENSIONS };
