/**
 * TailUI Migration — Backup & Undo System
 *
 * Creates timestamped backups of files before migration
 * and supports restoring them via --undo.
 */

const fs = require('fs');
const path = require('path');

const BACKUP_ROOT = '.tailui-backup';

/**
 * Create a backup of files before migration.
 * Stores them in .tailui-backup/<timestamp>/ preserving relative paths.
 *
 * @param {string[]} filePaths - Absolute paths of files to back up
 * @param {string} projectRoot - Project root directory
 * @returns {string} - The backup directory path
 */
function createBackup(filePaths, projectRoot) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
  const backupDir = path.join(projectRoot, BACKUP_ROOT, timestamp);

  for (const filePath of filePaths) {
    const relativePath = path.relative(projectRoot, filePath);
    const backupPath = path.join(backupDir, relativePath);

    // Ensure backup subdirectory exists
    const backupSubDir = path.dirname(backupPath);
    if (!fs.existsSync(backupSubDir)) {
      fs.mkdirSync(backupSubDir, { recursive: true });
    }

    // Copy file
    fs.copyFileSync(filePath, backupPath);
  }

  // Write a manifest file
  const manifest = {
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
 * @param {string} projectRoot - Project root directory
 * @param {string} [backupTimestamp] - Specific backup to restore (optional, defaults to latest)
 * @returns {{ restored: number, backupDir: string }|null}
 */
function restoreBackup(projectRoot, backupTimestamp) {
  const backupRoot = path.join(projectRoot, BACKUP_ROOT);

  if (!fs.existsSync(backupRoot)) {
    return null;
  }

  let targetDir;

  if (backupTimestamp) {
    targetDir = path.join(backupRoot, backupTimestamp);
    if (!fs.existsSync(targetDir)) {
      return null;
    }
  } else {
    // Find the most recent backup
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

  // Read manifest
  const manifestPath = path.join(targetDir, '.manifest.json');
  if (!fs.existsSync(manifestPath)) return null;

  let manifest;
  try {
    manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  } catch (e) {
    return null;
  }

  let restored = 0;

  for (const relativePath of manifest.files) {
    const backupFile = path.join(targetDir, relativePath);
    const originalFile = path.join(projectRoot, relativePath);

    if (fs.existsSync(backupFile)) {
      // Ensure target directory exists
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
 * @param {string} projectRoot
 * @returns {Array<{ timestamp: string, date: string, fileCount: number }>}
 */
function listBackups(projectRoot) {
  const backupRoot = path.join(projectRoot, BACKUP_ROOT);

  if (!fs.existsSync(backupRoot)) return [];

  const backups = [];
  const dirs = fs.readdirSync(backupRoot)
    .filter(d => {
      const fullPath = path.join(backupRoot, d);
      return fs.statSync(fullPath).isDirectory();
    })
    .sort()
    .reverse();

  for (const dir of dirs) {
    const manifestPath = path.join(backupRoot, dir, '.manifest.json');
    if (fs.existsSync(manifestPath)) {
      try {
        const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
        backups.push({
          timestamp: dir,
          date: manifest.date,
          fileCount: manifest.files.length,
        });
      } catch (e) {
        // Skip corrupt manifests
      }
    }
  }

  return backups;
}

module.exports = { createBackup, restoreBackup, listBackups, BACKUP_ROOT };
