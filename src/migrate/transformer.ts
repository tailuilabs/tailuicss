/**
 * TailUI Migration — Transformer
 *
 * Applies migration replacements to file contents.
 * Handles both dry-run (preview) and actual write modes.
 */

import * as fs from 'fs';

/**
 * Interface representing a migration replacement.
 * (Note: This can also be imported from a shared types file)
 */
export interface Replacement {
  file: string;          // Absolute file path
  line: number;          // Line number
  original: string;      // Original full attribute string
  classString: string;   // Original class string
  newClassString: string; // Replacement class string
  startIndex: number;    // Start index of classString in file
  endIndex: number;      // End index of classString in file
  component: string;     // Matched TailUI component
  uiClass: string;       // Primary ui-* class
  uiVariants: string[];  // Detected variant classes
  score: number;         // Confidence score
}

/**
 * Apply replacements to a file's content.
 * Replacements are processed in reverse order (bottom-up) to 
 * maintain index integrity as the string length changes.
 *
 * @param filePath - Path to the file to transform
 * @param replacements - Array of replacements to apply
 * @returns The new file content
 */
export function applyReplacements(filePath: string, replacements: Replacement[]): string {
  let content: string = fs.readFileSync(filePath, 'utf8');

  // Sort by startIndex descending so we replace from end to start
  // to avoid shifting indices for subsequent replacements.
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
 * @param filePath - Destination path
 * @param content - Content to write
 */
export function writeFile(filePath: string, content: string): void {
  fs.writeFileSync(filePath, content, 'utf8');
}

/**
 * Generate a diff-like preview for a single replacement.
 *
 * @param rep - The replacement object to format
 * @returns A formatted string for terminal output
 */
export function formatDiff(rep: Replacement): string {
  const lines: string[] = [];
  lines.push(`  ${rep.file}:${rep.line}`);
  lines.push(`  - ${rep.classString}`);
  lines.push(`  + ${rep.newClassString}`);
  
  const variants = rep.uiVariants.length ? ' ' + rep.uiVariants.join(' ') : '';
  lines.push(`  → ${rep.uiClass}${variants} (${rep.score}% confidence)`);
  
  return lines.join('\n');
}