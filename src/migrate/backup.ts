import fs from 'fs';
import path from 'path';

export const BACKUP_ROOT = '.tailui-backup';

interface Manifest {
  timestamp: string;
  date: string;
  files: string[];
  projectRoot: string;
}

interface RestoreResult {
  restored: number;
  backupDir: string;
}

interface BackupEntry {
  timestamp: string;
  date: string;
  fileCount: number;
}

/**
 * Create a backup of files before migration.
 * Stores them in .tailui-backup/<timestamp>/ preserving relative paths.
 *
 * @param filePaths - Absolute paths of files to back up
 * @param projectRoot - Project root directory
 * @returns The backup directory path
 */
export function createBackup(filePaths: string[], projectRoot: string): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
  const backupDir = path.join(projectRoot, BACKUP_ROOT, timestamp);

  for (const filePath of filePaths) {
    const relativePath = path.relative(projectRoot, filePath);
    const backupPath = path.join(backupDir, relativePath);

    const backupSubDir = path.dirname(backupPath);
    if (!fs.existsSync(backupSubDir)) {
      fs.mkdirSync(backupSubDir, { recursive: true });
    }

    fs.copyFileSync(filePath, backupPath);
  }

  const manifest: Manifest = {
    timestamp,
    date: new Date().toISOString(),
    files: filePaths.map(f => path.relative(projectRoot, f)),
    projectRoot,
  };

  fs.writeFileSync(
    path.join(backupDir, '.manifest.json'),
    JSON.stringify(manifest, null, 2)
  );

  return backupDir;
}

/**
 * Restore files from the most recent backup.
 *
 * @param projectRoot - Project root directory
 * @param backupTimestamp - Specific backup to restore (optional, defaults to latest)
 * @returns Restore result or null if no backup found
 */
export function restoreBackup(projectRoot: string, backupTimestamp?: string): RestoreResult | null {
  const backupRoot = path.join(projectRoot, BACKUP_ROOT);

  if (!fs.existsSync(backupRoot)) return null;

  let targetDir: string;

  if (backupTimestamp) {
    targetDir = path.join(backupRoot, backupTimestamp);
    if (!fs.existsSync(targetDir)) return null;
  } else {
    const backups = fs.readdirSync(backupRoot)
      .filter(d => {
        const fullPath = path.join(backupRoot, d);
        return fs.statSync(fullPath).isDirectory() && d !== '.gitkeep';
      })
      .sort()
      .reverse();

    if (backups.length === 0) return null;
    targetDir = path.join(backupRoot, backups[0]);
  }

  const manifestPath = path.join(targetDir, '.manifest.json');
  if (!fs.existsSync(manifestPath)) return null;

  let manifest: Manifest;
  try {
    manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8')) as Manifest;
  } catch {
    return null;
  }

  let restored = 0;

  for (const relativePath of manifest.files) {
    const backupFile = path.join(targetDir, relativePath);
    const originalFile = path.join(projectRoot, relativePath);

    if (fs.existsSync(backupFile)) {
      const targetSubDir = path.dirname(originalFile);
      if (!fs.existsSync(targetSubDir)) {
        fs.mkdirSync(targetSubDir, { recursive: true });
      }

      fs.copyFileSync(backupFile, originalFile);
      restored++;
    }
  }

  return { restored, backupDir: targetDir };
}

/**
 * List all available backups.
 *
 * @param projectRoot - Project root directory
 * @returns Array of backup entries
 */
export function listBackups(projectRoot: string): BackupEntry[] {
  const backupRoot = path.join(projectRoot, BACKUP_ROOT);

  if (!fs.existsSync(backupRoot)) return [];

  const dirs = fs.readdirSync(backupRoot)
    .filter(d => fs.statSync(path.join(backupRoot, d)).isDirectory())
    .sort()
    .reverse();

  const backups: BackupEntry[] = [];

  for (const dir of dirs) {
    const manifestPath = path.join(backupRoot, dir, '.manifest.json');
    if (!fs.existsSync(manifestPath)) continue;

    try {
      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8')) as Manifest;
      backups.push({
        timestamp: dir,
        date: manifest.date,
        fileCount: manifest.files.length,
      });
    } catch {
      // Skip corrupt manifests
    }
  }

  return backups;
}