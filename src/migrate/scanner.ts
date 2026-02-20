/**
 * TailUI Migration — File Scanner
 *
 * Parses source files (JSX, TSX, Vue, Svelte, HTML, Astro, Angular)
 * and extracts class attribute locations with their Tailwind classes.
 */

import * as fs from 'fs';
import * as path from 'path';

/**
 * Supported file extensions
 */
export const SUPPORTED_EXTENSIONS: string[] = [
  '.jsx', '.tsx', '.js', '.ts',
  '.vue', '.svelte', '.astro',
  '.html', '.htm',
];

/**
 * Interface representing a detected class attribute in a source file.
 */
export interface ClassMatch {
  file: string;        // Absolute file path
  line: number;        // 1-indexed line number
  column: number;      // 0-indexed column of the class attribute start
  original: string;    // The full original attribute (e.g. className="px-4...")
  classString: string; // The class string content (e.g. "px-4 py-2 ...")
  classes: string[];   // Array of individual class names
  tag: string;         // Detected HTML tag (e.g. 'button', 'div')
  attrs: string[];     // Detected attributes on the element
  startIndex: number;  // Character index of classString start in file
  endIndex: number;    // Character index of classString end in file
}

/**
 * Regex patterns for extracting STATIC class attributes only.
 */
const CLASS_REGEXES: RegExp[] = [
  /\bclass(?:Name)?\s*=\s*"([^"]*)"/g,
  /\bclass(?:Name)?\s*=\s*'([^']*)'/g,
  /\bclass(?:Name)?\s*=\s*\{"([^"]*)"\}/g, // Support className={"..."}
  /\bclass(?:Name)?\s*=\s*\{'([^']*)'\}/g, // Support className={'...'}
  /\bclass(?:Name)?\s*=\s*\{`([^`]*)`\}/g, // Support className={`...`}
  /:class\s*=\s*"'([^']*)'"/g,
  /class:list\s*=\s*\{\s*\[\s*"([^"]*)"/g,
];

/**
 * Patterns that indicate dynamic class expressions — we SKIP these entirely.
 */
const DYNAMIC_CLASS_PATTERNS: RegExp[] = [
  /\bclass(?:Name)?\s*=\s*\{[^}]*\bcn\s*\(/,
  /\bclass(?:Name)?\s*=\s*\{[^}]*\bclsx\s*\(/,
  /\bclass(?:Name)?\s*=\s*\{[^}]*\bcva\s*\(/,
  /\bclass(?:Name)?\s*=\s*\{[^}]*\btwMerge\s*\(/,
  /\bclass(?:Name)?\s*=\s*\{[^}]*\bclassNames\s*\(/,
  /\bclass(?:Name)?\s*=\s*\{`[^`]*\$\{/,
  /\bclass(?:Name)?\s*=\s*\{[^"'`}]+\?[^}]+:/,
  /\bclass(?:Name)?\s*=\s*\{`[^`]*\$\{/,       // Détecte ${variable}
  /\bclass(?:Name)?\s*=\s*\{[^"'`}]+\?[^}]+:/, // Détecte condition ? 'a' : 'b'
];

const TAG_REGEX = /<(\w[\w-]*)\s[^>]*$/;

/**
 * Scan a single file and return all class attribute matches.
 */
export function scanFile(filePath: string): ClassMatch[] {
  const content = fs.readFileSync(filePath, 'utf8');
  const matches: ClassMatch[] = [];

  if (!content.includes('class')) return matches;

  for (const regex of CLASS_REGEXES) {
    const re = new RegExp(regex.source, regex.flags);
    let match: RegExpExecArray | null;

    while ((match = re.exec(content)) !== null) {
      const classString = match[1];
      if (!classString || !classString.trim()) continue;

      const lineStart = content.lastIndexOf('\n', match.index) + 1;
      const lineEnd = content.indexOf('\n', match.index + match[0].length);
      const fullLine = content.substring(lineStart, lineEnd === -1 ? content.length : lineEnd);
      
      if (isDynamicClassExpression(fullLine)) continue;

      const classes = classString.split(/\s+/).filter(Boolean);
      
      if (classes.length < 2) continue;

      const beforeMatch = content.substring(0, match.index);
      const line = (beforeMatch.match(/\n/g) || []).length + 1;
      const lastNewline = beforeMatch.lastIndexOf('\n');
      const column = match.index - lastNewline - 1;

      const tag = detectTag(content, match.index);
      const attrs = detectAttrs(content, match.index);

      const fullMatch = match[0];
      const classStringOffset = fullMatch.indexOf(classString);
      const startIndex = match.index + classStringOffset;
      const endIndex = startIndex + classString.length;

      matches.push({
        file: filePath, line, column, original: fullMatch,
        classString, classes, tag, attrs, startIndex, endIndex,
      });
    }
  }

  return matches;
}

/**
 * Scan a directory recursively for supported files.
 */
export function findFiles(dirPath: string): string[] {
  const results: string[] = [];

  const walk = (dir: string): void => {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        const skipDirs = ['node_modules', '.git', '.next', '.nuxt', '.svelte-kit', 'dist', 'build', '.tailui-backup'];
        if (skipDirs.includes(entry.name)) continue;
        walk(fullPath);
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name).toLowerCase();
        if (SUPPORTED_EXTENSIONS.includes(ext)) {
          results.push(fullPath);
        }
      }
    }
  };

  walk(dirPath);
  return results;
}

/**
 * Detect the HTML tag name for the element.
 */
function detectTag(content: string, classAttrIndex: number): string {
  const lookback = content.substring(Math.max(0, classAttrIndex - 1000), classAttrIndex);
  const tagMatch = lookback.match(/<(\w[\w-]*)\s[^>]*$/);
  return tagMatch ? tagMatch[1].toLowerCase() : '';
}

/**
 * Detect other attributes on the element to improve matching confidence.
 */
function detectAttrs(content: string, classAttrIndex: number): string[] {
  const attrs: string[] = [];

  const lookback = content.substring(Math.max(0, classAttrIndex - 500), classAttrIndex);
  const openTagIdx = lookback.lastIndexOf('<');
  if (openTagIdx === -1) return attrs;

  const elementStart = Math.max(0, classAttrIndex - 500) + openTagIdx;
  const closeIdx = content.indexOf('>', classAttrIndex);
  if (closeIdx === -1) return attrs;

  const elementStr = content.substring(elementStart, closeIdx + 1);

  // Attribute checks
  if (/\bonClick\b/i.test(elementStr)) attrs.push('onClick');
  if (/\bonclick\b/.test(elementStr)) attrs.push('onclick');

  const typeMatch = elementStr.match(/\btype\s*=\s*["'](\w+)["']/);
  if (typeMatch) attrs.push(`type="${typeMatch[1]}"`);

  const roleMatch = elementStr.match(/\brole\s*=\s*["'](\w+)["']/);
  if (roleMatch) attrs.push(`role="${roleMatch[1]}"`);

  if (/\baria-modal\b/.test(elementStr)) attrs.push('aria-modal');
  if (/\bplaceholder\b/.test(elementStr)) attrs.push('placeholder');

  return attrs;
}

/**
 * Validation to skip dynamic class logic.
 */
function isDynamicClassExpression(line: string): boolean {
  return DYNAMIC_CLASS_PATTERNS.some(re => re.test(line));
}