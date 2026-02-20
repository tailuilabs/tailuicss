/**
 * TailUI Migration — Orchestrator
 *
 * Coordinates scanning, matching, transforming, backup, and reporting.
 */

import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';

import { scanFile, findFiles } from './scanner';
import { findBestMatch } from './matcher';
import { applyReplacements, writeFile } from './transformer';
import { printReport, printFilePreview, printInteractiveItem } from './reporter';
import { createBackup, restoreBackup, listBackups } from './backup';

// --- Types & Interfaces ---

export interface MigrateOptions {
  target: string;
  all?: boolean;
  dryRun?: boolean;
  interactive?: boolean;
  force?: boolean;
  threshold?: number;
  undo?: boolean;
  ai?: boolean;
  aiConfig?: Record<string, any>;
}

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

export interface SkippedMatch {
  file: string;
  line: number;
  component: string;
  uiClass: string;
  score: number;
}

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

// --- Main Function ---

/**
 * Run the migration process.
 */
export async function migrate(options: MigrateOptions): Promise<void> {
  const projectRoot = process.cwd();

  // ── Handle --undo ──
  if (options.undo) {
    return handleUndo(projectRoot);
  }

  // ── Resolve target ──
  const targetPath = path.resolve(projectRoot, options.target);

  if (!fs.existsSync(targetPath)) {
    console.error(`  ❌ Target not found: ${options.target}`);
    process.exit(1);
  }

  const isDirectory = fs.statSync(targetPath).isDirectory();

  if (isDirectory && !options.all) {
    console.error(`  ❌ "${options.target}" is a directory. Use --all to migrate all files in it.`);
    console.error(`  Or use -f <file> to migrate a single file.`);
    process.exit(1);
  }

  // ── Collect files ──
  let files: string[];
  if (isDirectory) {
    files = findFiles(targetPath);
    if (files.length === 0) {
      console.log(`  ⚠️  No supported files found in ${options.target}`);
      return;
    }
    console.log(`\n  🔍 Scanning ${files.length} file${files.length > 1 ? 's' : ''} in ${options.target}...\n`);
  } else {
    files = [targetPath];
    console.log(`\n  🔍 Scanning ${path.basename(targetPath)}...\n`);
  }

  // ── Scan & Match ──
  const threshold = options.threshold || 60;
  const allReplacements = new Map<string, Replacement[]>();
  const allSkipped: SkippedMatch[] = [];

  let totalMatches = 0;
  let totalSkipped = 0;

  for (const file of files) {
    const classMatches = scanFile(file);
    const fileReplacements: Replacement[] = [];

    for (const classMatch of classMatches) {
      const match = findBestMatch(classMatch, threshold);

      if (match) {
        fileReplacements.push({
          file: classMatch.file,
          line: classMatch.line,
          original: classMatch.original,
          classString: classMatch.classString,
          newClassString: match.newClassString,
          startIndex: classMatch.startIndex,
          endIndex: classMatch.endIndex,
          component: match.component,
          uiClass: match.uiClass,
          uiVariants: match.uiVariants,
          score: match.score,
        });
        totalMatches++;
      } else {
        const lowMatch = findBestMatch(classMatch, 1);
        if (lowMatch && lowMatch.score > 0) {
          allSkipped.push({
            file: classMatch.file,
            line: classMatch.line,
            component: lowMatch.component,
            uiClass: lowMatch.uiClass,
            score: lowMatch.score,
          });
          totalSkipped++;
        }
      }
    }

    if (fileReplacements.length > 0) {
      allReplacements.set(file, fileReplacements);
    }
  }

  // ── No matches ──
  if (totalMatches === 0) {
    console.log('  ℹ️  No Tailwind patterns matching TailUI components were found.');
    if (totalSkipped > 0) {
      console.log(`  ${totalSkipped} potential match${totalSkipped > 1 ? 'es' : ''} were below the confidence threshold (${threshold}%).`);
      console.log(`  Try lowering the threshold with --threshold <number>.\n`);
    }
    return;
  }

  // ── Dry run mode ──
  if (options.dryRun) {
    for (const [filePath, replacements] of allReplacements) {
      printFilePreview(filePath, replacements);
    }
    printReport(buildStats(files, allReplacements, allSkipped, null), true);
    return;
  }

  // ── Interactive mode ──
  if (options.interactive) {
    const accepted = await runInteractive(allReplacements);
    if (accepted.size === 0) {
      console.log('\n  No changes applied.\n');
      return;
    }

    const filesToBackup = Array.from(accepted.keys());
    const backupDir = createBackup(filesToBackup, projectRoot);
    console.log(`\n  💾 Backup created: ${path.relative(projectRoot, backupDir)}`);

    for (const [filePath, replacements] of accepted) {
      const newContent = applyReplacements(filePath, replacements);
      writeFile(filePath, newContent);
      console.log(`  ☑️ Migrated: ${path.relative(projectRoot, filePath)} (${replacements.length} change${replacements.length > 1 ? 's' : ''})`);
    }

    printReport(buildStats(files, accepted, allSkipped, backupDir), false);
    return;
  }

  // ── Force / Default mode ──
  const filesToBackup = Array.from(allReplacements.keys());
  const backupDir = createBackup(filesToBackup, projectRoot);
  console.log(`  💾 Backup created: ${path.relative(projectRoot, backupDir)}`);

  for (const [filePath, replacements] of allReplacements) {
    const newContent = applyReplacements(filePath, replacements);
    writeFile(filePath, newContent);
    console.log(`  ☑️ Migrated: ${path.relative(projectRoot, filePath)} (${replacements.length} change${replacements.length > 1 ? 's' : ''})`);
  }

  printReport(buildStats(files, allReplacements, allSkipped, backupDir), false);
  console.log('  💡 Run `tailui migrate --undo` to revert changes.\n');
}

/**
 * Run interactive mode — prompt user for each replacement.
 */
async function runInteractive(allReplacements: Map<string, Replacement[]>): Promise<Map<string, Replacement[]>> {
  const accepted = new Map<string, Replacement[]>();
  const allReps: Replacement[] = [];

  for (const [, replacements] of allReplacements) {
    allReps.push(...replacements);
  }

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const ask = (prompt: string): Promise<string> => new Promise(resolve => {
    rl.question(prompt, answer => resolve(answer.trim().toLowerCase()));
  });

  let skipFile: string | null = null;

  for (let i = 0; i < allReps.length; i++) {
    const rep = allReps[i];
    if (skipFile === rep.file) continue;

    printInteractiveItem(rep, i, allReps.length);
    const answer = await ask('  Apply? [Y/n/s(kip file)/q(uit)] ');

    if (answer === 'q' || answer === 'quit') break;

    if (answer === 's' || answer === 'skip') {
      skipFile = rep.file;
      console.log(`  ⏭  Skipping remaining changes in ${path.basename(rep.file)}`);
      continue;
    }

    if (answer === 'n' || answer === 'no') continue;

    if (!accepted.has(rep.file)) {
      accepted.set(rep.file, []);
    }
    accepted.get(rep.file)!.push(rep);
  }

  rl.close();
  return accepted;
}

/**
 * Handle --undo: restore from the most recent backup.
 */
function handleUndo(projectRoot: string): void {
  const backups = listBackups(projectRoot);

  if (backups.length === 0) {
    console.log('  ❌ No backups found. Nothing to undo.\n');
    return;
  }

  console.log('\n  📋 Available backups:\n');
  backups.forEach((b: any, i: number) => {
    console.log(`    ${i + 1}. ${b.date} (${b.fileCount} file${b.fileCount > 1 ? 's' : ''})`);
  });

  const result = restoreBackup(projectRoot);

  if (result) {
    console.log(`\n  ☑️ Restored ${result.restored} file${result.restored > 1 ? 's' : ''} from backup.`);
    console.log(`  Backup: ${path.relative(projectRoot, result.backupDir)}\n`);
  } else {
    console.log('  ❌ Failed to restore backup.\n');
  }
}

/**
 * Build statistics object for the report.
 */
function buildStats(
  files: string[], 
  replacementsMap: Map<string, Replacement[]>, 
  skipped: SkippedMatch[], 
  backupDir: string | null
): MigrationStats {
  const componentCounts: Record<string, number> = {};
  const skippedCounts: Record<string, number> = {};
  let totalMigrations = 0;

  for (const [, replacements] of replacementsMap) {
    for (const rep of replacements) {
      const key = rep.uiClass;
      componentCounts[key] = (componentCounts[key] || 0) + 1;
      totalMigrations++;
    }
  }

  for (const skip of skipped) {
    const key = skip.uiClass;
    skippedCounts[key] = (skippedCounts[key] || 0) + 1;
  }

  const modifiedFiles = new Set(replacementsMap.keys());
  const unmatchedFiles = files.filter(f => !modifiedFiles.has(f));

  return {
    filesScanned: files.length,
    filesModified: modifiedFiles.size,
    totalMigrations,
    totalSkipped: skipped.length,
    componentCounts,
    skippedCounts,
    unmatchedFiles,
    backupDir: backupDir ? path.relative(process.cwd(), backupDir) : '',
  };
}