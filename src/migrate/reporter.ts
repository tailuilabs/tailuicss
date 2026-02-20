/**
 * TailUI Migration — Reporter
 *
 * Generates formatted migration reports for the terminal.
 */

/**
 * @typedef {Object} MigrationStats
 * @property {number} filesScanned
 * @property {number} filesModified
 * @property {number} totalMigrations
 * @property {number} totalSkipped
 * @property {Object<string, number>} componentCounts  - { 'ui-button': 12, ... }
 * @property {Object<string, number>} skippedCounts    - { 'ui-modal': 3, ... }
 * @property {string[]} unmatchedFiles                  - Files with no matches
 * @property {string} backupDir                         - Backup directory path
 */
export interface MigrationStats {
  filesScanned: number;
  filesModified: number;
  totalMigrations: number;
  totalSkipped: number;
  componentCounts: Record<string, number>;
  skippedCounts: Record<string, number>;
  unmatchedFiles: string[];
  backupDir: string;
}

/**
 * Interface pour représenter un remplacement (équivalent au JSDoc Replacement)
 */
export interface Replacement {
  file: string;
  line: number;
  original: string;
  classString: string;
  newClassString: string;
  startIndex: number;
  endIndex: number;
  component: string;
  uiClass: string;
  uiVariants: string[];
  score: number;
}

/**
 * Print the full migration report.
 *
 * @param {MigrationStats} stats
 * @param {boolean} isDryRun
 */
export function printReport(stats: MigrationStats, isDryRun: boolean): void {
  const title = isDryRun ? 'TailUI Migration Preview' : 'TailUI Migration Report';

  console.log('');
  console.log(`  ┌${'─'.repeat(47)}┐`);
  console.log(`  │  ${title.padEnd(45)}│`);
  console.log(`  ├${'─'.repeat(47)}┤`);
  console.log(`  │  Files scanned:    ${String(stats.filesScanned).padEnd(26)}│`);
  console.log(`  │  Files modified:   ${String(stats.filesModified).padEnd(26)}│`);
  console.log(`  │  Migrations:       ${String(stats.totalMigrations).padEnd(26)}│`);

  if (stats.totalSkipped > 0) {
    console.log(`  │  Skipped:          ${String(stats.totalSkipped).padEnd(26)}│`);
  }

  console.log(`  │${' '.repeat(47)}│`);

  // Component breakdown
  const sortedComponents = Object.entries(stats.componentCounts)
    .sort((a, b) => b[1] - a[1]);

  for (const [component, count] of sortedComponents) {
    const line = `  ✓ ${component.padEnd(16)} ${count} replacement${count > 1 ? 's' : ''}`;
    console.log(`  │${line.padEnd(47)}│`);
  }

  // Skipped components
  const sortedSkipped = Object.entries(stats.skippedCounts)
    .sort((a, b) => b[1] - a[1]);

  for (const [component, count] of sortedSkipped) {
    const line = `  ⚠ ${component.padEnd(16)} ${count} skipped (low score)`;
    console.log(`  │${line.padEnd(47)}│`);
  }

  // Unmatched
  if (stats.unmatchedFiles.length > 0) {
    const line = `  ✗ ${stats.unmatchedFiles.length} file${stats.unmatchedFiles.length > 1 ? 's' : ''} with no matches`;
    console.log(`  │${line.padEnd(47)}│`);
  }

  console.log(`  │${' '.repeat(47)}│`);

  if (!isDryRun && stats.backupDir) {
    const backupLine = `  Backup: ${stats.backupDir}`;
    // Truncate if too long
    const truncated = backupLine.length > 45
      ? backupLine.substring(0, 42) + '...'
      : backupLine;
    console.log(`  │${truncated.padEnd(47)}│`);
  }

  if (isDryRun) {
    console.log(`  │  Run without --dry-run to apply changes.${' '.repeat(3)}│`);
  }

  console.log(`  └${'─'.repeat(47)}┘`);
  console.log('');
}

/**
 * Print a single file's migration preview.
 *
 * @param {string} filePath
 * @param {Replacement[]} replacements
 */
export function printFilePreview(filePath: string, replacements: Replacement[]): void {
  console.log(`\n  📄 ${filePath}`);
  for (const rep of replacements) {
    console.log(`     L${rep.line}: ${rep.component} (${rep.score}%)`);
    console.log(`     \x1b[31m- ${truncate(rep.classString, 70)}\x1b[0m`);
    console.log(`     \x1b[32m+ ${truncate(rep.newClassString, 70)}\x1b[0m`);
  }
}

/**
 * Print interactive prompt info for a replacement.
 *
 * @param {Replacement} rep
 * @param {number} index
 * @param {number} total
 */
export function printInteractiveItem(rep: Replacement, index: number, total: number): void {
  console.log(`\n  [${index + 1}/${total}] ${rep.file}:${rep.line}`);
  console.log(`  Component: ${rep.uiClass}${rep.uiVariants.length ? ' ' + rep.uiVariants.join(' ') : ''} (${rep.score}% confidence)`);
  console.log(`  \x1b[31m- ${truncate(rep.classString, 70)}\x1b[0m`);
  console.log(`  \x1b[32m+ ${truncate(rep.newClassString, 70)}\x1b[0m`);
}

/**
 * Truncate a string with ellipsis.
 * * @param {string} str
 * @param {number} maxLen
 */
function truncate(str: string, maxLen: number): string {
  if (str.length <= maxLen) return str;
  return str.substring(0, maxLen - 3) + '...';
}