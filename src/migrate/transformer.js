/**
 * TailUI Migration — Transformer
 *
 * Applies migration replacements to file contents.
 * Handles both dry-run (preview) and actual write modes.
 */

const fs = require('fs');

/**
 * @typedef {Object} Replacement
 * @property {string}   file          - Absolute file path
 * @property {number}   line          - Line number
 * @property {string}   original      - Original full attribute string
 * @property {string}   classString   - Original class string
 * @property {string}   newClassString - Replacement class string
 * @property {number}   startIndex    - Start index of classString in file
 * @property {number}   endIndex      - End index of classString in file
 * @property {string}   component     - Matched TailUI component
 * @property {string}   uiClass       - Primary ui-* class
 * @property {string[]} uiVariants    - Detected variant classes
 * @property {number}   score         - Confidence score
 */

/**
 * Apply replacements to a file.
 * Replacements must be sorted by startIndex descending to avoid offset issues.
 *
 * @param {string} filePath
 * @param {Replacement[]} replacements
 * @returns {string} - The new file content
 */
function applyReplacements(filePath, replacements) {
  let content = fs.readFileSync(filePath, 'utf8');

  // Sort by startIndex descending so we replace from end to start
  const sorted = [...replacements].sort((a, b) => b.startIndex - a.startIndex);

  for (const rep of sorted) {
    content =
      content.substring(0, rep.startIndex) +
      rep.newClassString +
      content.substring(rep.endIndex);
  }

  return content;
}

/**
 * Write the transformed content to disk.
 *
 * @param {string} filePath
 * @param {string} content
 */
function writeFile(filePath, content) {
  fs.writeFileSync(filePath, content, 'utf8');
}

/**
 * Generate a diff-like preview for a single replacement.
 *
 * @param {Replacement} rep
 * @returns {string}
 */
function formatDiff(rep) {
  const lines = [];
  lines.push(`  ${rep.file}:${rep.line}`);
  lines.push(`  - ${rep.classString}`);
  lines.push(`  + ${rep.newClassString}`);
  lines.push(`  → ${rep.uiClass}${rep.uiVariants.length ? ' ' + rep.uiVariants.join(' ') : ''} (${rep.score}% confidence)`);
  return lines.join('\n');
}

module.exports = { applyReplacements, writeFile, formatDiff };
