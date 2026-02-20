// src/migrate/index.ts
import * as fs4 from "fs";
import * as path3 from "path";
import * as readline from "readline";

// src/migrate/scanner.ts
import * as fs from "fs";
import * as path from "path";
var SUPPORTED_EXTENSIONS = [
  ".jsx",
  ".tsx",
  ".js",
  ".ts",
  ".vue",
  ".svelte",
  ".astro",
  ".html",
  ".htm"
];
var CLASS_REGEXES = [
  /\bclass(?:Name)?\s*=\s*"([^"]*)"/g,
  /\bclass(?:Name)?\s*=\s*'([^']*)'/g,
  /\bclass(?:Name)?\s*=\s*\{"([^"]*)"\}/g,
  // Support className={"..."}
  /\bclass(?:Name)?\s*=\s*\{'([^']*)'\}/g,
  // Support className={'...'}
  /\bclass(?:Name)?\s*=\s*\{`([^`]*)`\}/g,
  // Support className={`...`}
  /:class\s*=\s*"'([^']*)'"/g,
  /class:list\s*=\s*\{\s*\[\s*"([^"]*)"/g
];
var DYNAMIC_CLASS_PATTERNS = [
  /\bclass(?:Name)?\s*=\s*\{[^}]*\bcn\s*\(/,
  /\bclass(?:Name)?\s*=\s*\{[^}]*\bclsx\s*\(/,
  /\bclass(?:Name)?\s*=\s*\{[^}]*\bcva\s*\(/,
  /\bclass(?:Name)?\s*=\s*\{[^}]*\btwMerge\s*\(/,
  /\bclass(?:Name)?\s*=\s*\{[^}]*\bclassNames\s*\(/,
  /\bclass(?:Name)?\s*=\s*\{`[^`]*\$\{/,
  /\bclass(?:Name)?\s*=\s*\{[^"'`}]+\?[^}]+:/,
  /\bclass(?:Name)?\s*=\s*\{`[^`]*\$\{/,
  // Détecte ${variable}
  /\bclass(?:Name)?\s*=\s*\{[^"'`}]+\?[^}]+:/
  // Détecte condition ? 'a' : 'b'
];
function scanFile(filePath) {
  const content = fs.readFileSync(filePath, "utf8");
  const matches = [];
  if (!content.includes("class")) return matches;
  for (const regex of CLASS_REGEXES) {
    const re = new RegExp(regex.source, regex.flags);
    let match;
    while ((match = re.exec(content)) !== null) {
      const classString = match[1];
      if (!classString || !classString.trim()) continue;
      const lineStart = content.lastIndexOf("\n", match.index) + 1;
      const lineEnd = content.indexOf("\n", match.index + match[0].length);
      const fullLine = content.substring(lineStart, lineEnd === -1 ? content.length : lineEnd);
      if (isDynamicClassExpression(fullLine)) continue;
      const classes = classString.split(/\s+/).filter(Boolean);
      if (classes.length < 2) continue;
      const beforeMatch = content.substring(0, match.index);
      const line = (beforeMatch.match(/\n/g) || []).length + 1;
      const lastNewline = beforeMatch.lastIndexOf("\n");
      const column = match.index - lastNewline - 1;
      const tag = detectTag(content, match.index);
      const attrs = detectAttrs(content, match.index);
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
        endIndex
      });
    }
  }
  return matches;
}
function findFiles(dirPath) {
  const results = [];
  const walk = (dir) => {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        const skipDirs = ["node_modules", ".git", ".next", ".nuxt", ".svelte-kit", "dist", "build", ".tailui-backup"];
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
function detectTag(content, classAttrIndex) {
  const lookback = content.substring(Math.max(0, classAttrIndex - 1e3), classAttrIndex);
  const tagMatch = lookback.match(/<(\w[\w-]*)\s[^>]*$/);
  return tagMatch ? tagMatch[1].toLowerCase() : "";
}
function detectAttrs(content, classAttrIndex) {
  const attrs = [];
  const lookback = content.substring(Math.max(0, classAttrIndex - 500), classAttrIndex);
  const openTagIdx = lookback.lastIndexOf("<");
  if (openTagIdx === -1) return attrs;
  const elementStart = Math.max(0, classAttrIndex - 500) + openTagIdx;
  const closeIdx = content.indexOf(">", classAttrIndex);
  if (closeIdx === -1) return attrs;
  const elementStr = content.substring(elementStart, closeIdx + 1);
  if (/\bonClick\b/i.test(elementStr)) attrs.push("onClick");
  if (/\bonclick\b/.test(elementStr)) attrs.push("onclick");
  const typeMatch = elementStr.match(/\btype\s*=\s*["'](\w+)["']/);
  if (typeMatch) attrs.push(`type="${typeMatch[1]}"`);
  const roleMatch = elementStr.match(/\brole\s*=\s*["'](\w+)["']/);
  if (roleMatch) attrs.push(`role="${roleMatch[1]}"`);
  if (/\baria-modal\b/.test(elementStr)) attrs.push("aria-modal");
  if (/\bplaceholder\b/.test(elementStr)) attrs.push("placeholder");
  return attrs;
}
function isDynamicClassExpression(line) {
  return DYNAMIC_CLASS_PATTERNS.some((re) => re.test(line));
}

// src/migrate/patterns.ts
var TAG_MAP = {
  button: "button",
  input: "input",
  textarea: "textarea",
  select: "select",
  label: null,
  // Ambiguous: resolved by attrs/classes
  a: null
  // Ambiguous: resolved by classes
};
var ATTR_RULES = [
  { attrs: ['role="dialog"', "aria-modal"], component: "modal", uiClass: "ui-modal", minAttrs: 1 },
  { attrs: ['role="alert"'], component: "alert", uiClass: "ui-alert", minAttrs: 1 },
  { attrs: ['role="progressbar"'], component: "progress", uiClass: "ui-progress", minAttrs: 1 },
  { attrs: ['role="menu"'], component: "dropdown-menu", uiClass: "ui-menu", minAttrs: 1 },
  { attrs: ['role="list"'], component: "list", uiClass: "ui-list", minAttrs: 1 },
  { attrs: ['role="status"'], component: "toast", uiClass: "ui-toast", minAttrs: 1 }
];
var COMPONENTS = {
  button: {
    uiClass: "ui-button",
    confirm: ["rounded", "font-", "px-", "py-", "inline-flex", "cursor-pointer", "bg-", "text-", "border"],
    confirmMin: 2,
    variants: [
      { name: "ui-primary", indicators: ["bg-blue-", "text-white"], min: 2 },
      { name: "ui-secondary", indicators: ["bg-gray-100", "bg-gray-200", "text-gray-", "border-gray-"], min: 2 },
      { name: "ui-danger", indicators: ["bg-red-", "text-white"], min: 2 },
      { name: "ui-ghost", indicators: ["bg-transparent", "hover:bg-gray-"], min: 2 },
      { name: "ui-outline", indicators: ["bg-transparent", "border-2", "border-current"], min: 2 }
    ]
  },
  input: {
    uiClass: "ui-input",
    confirm: ["border", "rounded", "px-", "py-", "outline-", "bg-", "text-"],
    confirmMin: 2,
    variants: [
      { name: "ui-error", indicators: ["border-red-", "text-red-"], min: 1 },
      { name: "ui-success", indicators: ["border-green-"], min: 1 }
    ]
  },
  textarea: {
    uiClass: "ui-textarea",
    confirm: ["border", "rounded", "px-", "py-", "resize-y", "resize-none", "bg-", "text-"],
    confirmMin: 2,
    variants: [
      { name: "ui-error", indicators: ["border-red-"], min: 1 },
      { name: "ui-success", indicators: ["border-green-"], min: 1 }
    ]
  },
  select: {
    uiClass: "ui-select",
    confirm: ["border", "rounded", "px-", "py-", "bg-", "text-", "appearance-none"],
    confirmMin: 1,
    variants: []
  },
  "link-button": {
    uiClass: "ui-button",
    confirm: ["rounded", "font-medium", "font-semibold", "font-bold", "px-", "py-", "inline-flex", "bg-"],
    confirmMin: 3,
    variants: [
      { name: "ui-primary", indicators: ["bg-blue-", "text-white"], min: 2 },
      { name: "ui-secondary", indicators: ["bg-gray-100", "bg-gray-200", "text-gray-"], min: 2 },
      { name: "ui-danger", indicators: ["bg-red-", "text-white"], min: 2 },
      { name: "ui-ghost", indicators: ["bg-transparent", "hover:bg-gray-"], min: 2 },
      { name: "ui-outline", indicators: ["bg-transparent", "border-2", "border-current"], min: 2 }
    ]
  },
  toggle: {
    uiClass: "ui-toggle",
    confirm: ["inline-flex", "items-center", "cursor-pointer", "gap-"],
    confirmMin: 3,
    variants: []
  },
  radio: {
    uiClass: "ui-radio",
    confirm: ["inline-flex", "items-center", "gap-", "cursor-pointer", "text-sm"],
    confirmMin: 3,
    variants: []
  },
  "file-input": {
    uiClass: "ui-file-input",
    confirm: ["border-2", "border-dashed", "rounded", "cursor-pointer"],
    confirmMin: 3,
    variants: []
  },
  modal: {
    uiClass: "ui-modal",
    confirm: ["bg-", "rounded", "shadow", "z-50", "max-w-"],
    confirmMin: 2,
    variants: []
  },
  alert: {
    uiClass: "ui-alert",
    confirm: ["flex", "items-start", "rounded", "border", "text-sm", "gap-3", "px-4", "py-3"],
    confirmMin: 3,
    variants: [
      { name: "ui-info", indicators: ["bg-blue-50", "border-blue-", "text-blue-"], min: 2 },
      { name: "ui-success", indicators: ["bg-green-50", "border-green-", "text-green-"], min: 2 },
      { name: "ui-warning", indicators: ["bg-yellow-50", "border-yellow-", "text-yellow-"], min: 2 },
      { name: "ui-danger", indicators: ["bg-red-50", "border-red-", "text-red-"], min: 2 }
    ]
  },
  progress: {
    uiClass: "ui-progress",
    confirm: ["w-full", "bg-gray-200", "rounded-full", "overflow-hidden"],
    confirmMin: 4,
    variants: []
  },
  "dropdown-menu": {
    uiClass: "ui-menu",
    confirm: ["absolute", "z-50", "bg-", "border", "rounded", "shadow-lg"],
    confirmMin: 5,
    variants: []
  },
  list: {
    uiClass: "ui-list",
    confirm: ["flex", "flex-col", "divide-y", "border", "rounded"],
    confirmMin: 3,
    variants: []
  },
  toast: {
    uiClass: "ui-toast",
    confirm: ["flex", "items-start", "rounded", "shadow-lg", "border", "text-sm"],
    confirmMin: 4,
    variants: [
      { name: "ui-success", indicators: ["bg-green-50", "border-green-", "text-green-"], min: 2 },
      { name: "ui-danger", indicators: ["bg-red-50", "border-red-", "text-red-"], min: 2 },
      { name: "ui-warning", indicators: ["bg-yellow-50", "border-yellow-", "text-yellow-"], min: 2 },
      { name: "ui-info", indicators: ["bg-blue-50", "border-blue-", "text-blue-"], min: 2 }
    ]
  },
  card: {
    uiClass: "ui-card",
    confirm: ["rounded", "border", "bg-", "overflow-hidden"],
    confirmMin: 3,
    variants: [
      { name: "ui-elevated", indicators: ["shadow-lg", "shadow-xl"], min: 1 },
      { name: "ui-flat", indicators: ["border-none", "shadow-none", "bg-gray-50"], min: 2 }
    ]
  },
  badge: {
    uiClass: "ui-badge",
    confirm: ["inline-flex", "items-center", "rounded-full", "text-xs", "font-medium"],
    confirmMin: 4,
    variants: [
      { name: "ui-primary", indicators: ["bg-blue-100", "text-blue-"], min: 1 },
      { name: "ui-success", indicators: ["bg-green-100", "text-green-"], min: 1 },
      { name: "ui-danger", indicators: ["bg-red-100", "text-red-"], min: 1 },
      { name: "ui-warning", indicators: ["bg-yellow-100", "text-yellow-"], min: 1 },
      { name: "ui-secondary", indicators: ["bg-gray-100", "text-gray-"], min: 2 }
    ]
  },
  avatar: {
    uiClass: "ui-avatar",
    confirm: ["rounded-full", "overflow-hidden", "inline-flex", "items-center", "justify-center"],
    confirmMin: 4,
    variants: []
  },
  overlay: {
    uiClass: "ui-overlay",
    confirm: ["fixed", "inset-0", "bg-", "z-40"],
    confirmMin: 3,
    variants: []
  }
};
var GENERIC_TAG_RULES = [
  "overlay",
  "dropdown-menu",
  "file-input",
  "progress",
  "avatar",
  "badge",
  "toast",
  "card",
  "alert",
  "list"
];
var PRESERVE_PATTERNS = [
  // Spacing
  /^m[trblxy]?-/,
  /^-m[trblxy]?-/,
  /^space-[xy]-/,
  /^-space-[xy]-/,
  // Sizing
  /^w-/,
  /^h-/,
  /^min-w-/,
  /^min-h-/,
  /^max-w-/,
  /^max-h-/,
  // Layout
  /^flex$/,
  /^flex-/,
  /^grid$/,
  /^grid-/,
  /^col-/,
  /^row-/,
  /^order-/,
  /^grow/,
  /^shrink/,
  // Positioning
  /^absolute$/,
  /^relative$/,
  /^fixed$/,
  /^sticky$/,
  /^static$/,
  /^top-/,
  /^right-/,
  /^bottom-/,
  /^left-/,
  /^inset-/,
  /^z-/,
  // Display
  /^block$/,
  /^inline$/,
  /^inline-block$/,
  /^hidden$/,
  /^visible$/,
  /^invisible$/,
  // Responsive prefixes
  /^(sm|md|lg|xl|2xl):/,
  // Container
  /^container$/,
  // Overflow
  /^overflow-/,
  // Aspect ratio
  /^aspect-/
];
function shouldPreserve(cls) {
  return PRESERVE_PATTERNS.some((re) => re.test(cls));
}

// src/migrate/matcher.ts
function getBaseClass(cls) {
  const parts = cls.split(":");
  return parts[parts.length - 1];
}
function matchPattern(base, pattern) {
  if (base === pattern) return true;
  if (pattern.endsWith("-") && base.startsWith(pattern)) return true;
  if (!pattern.includes("/") && !pattern.match(/\d$/)) {
    return base === pattern || base.startsWith(pattern + "-");
  }
  return false;
}
function findMatchingClass(classes, pattern) {
  return classes.find((cls) => matchPattern(getBaseClass(cls), pattern));
}
function findBestMatch(classMatch, threshold = 60) {
  const { classes, tag, attrs } = classMatch;
  if (tag && tag in TAG_MAP) {
    const componentKey = TAG_MAP[tag];
    if (componentKey) {
      const result = resolveComponent(componentKey, classes, "tag");
      if (result && result.score >= threshold) return result;
    }
    if (tag === "a") {
      const result = resolveComponent("link-button", classes, "tag");
      if (result && result.score >= threshold) return result;
    }
    if (tag === "label") {
      for (const key of ["toggle", "radio", "file-input"]) {
        const result = resolveComponent(key, classes, "tag");
        if (result && result.score >= threshold) return result;
      }
    }
  }
  if (attrs && attrs.length > 0) {
    for (const rule of ATTR_RULES) {
      let matched = 0;
      for (const attr of rule.attrs) {
        if (attrs.some((a) => a === attr || a.includes(attr))) {
          matched++;
        }
      }
      if (matched >= rule.minAttrs) {
        const result = resolveComponent(rule.component, classes, "attr");
        if (result && result.score >= threshold) return result;
      }
    }
  }
  if (!tag || !(tag in TAG_MAP)) {
    for (const componentKey of GENERIC_TAG_RULES) {
      const result = resolveComponent(componentKey, classes, "class");
      if (result && result.score >= threshold) return result;
    }
  }
  return null;
}
function resolveComponent(componentKey, classes, resolvedBy) {
  const def = COMPONENTS[componentKey];
  if (!def) return null;
  const initialConsumed = /* @__PURE__ */ new Set();
  let confirmed = 0;
  for (const pattern of def.confirm) {
    const found = findMatchingClass(classes, pattern);
    if (found) confirmed++;
  }
  if (confirmed < def.confirmMin) return null;
  for (const cls of classes) {
    const base = getBaseClass(cls);
    const isConfirm = def.confirm.some((p) => matchPattern(base, p));
    const isVariant = def.variants?.some((v) => v.indicators.some((p) => matchPattern(base, p)));
    if (isConfirm || isVariant) {
      initialConsumed.add(cls);
    }
  }
  const uiVariants = [];
  if (def.variants) {
    for (const variant of def.variants) {
      if (variant.indicators.some((ind) => findMatchingClass(classes, ind))) {
        uiVariants.push(variant.name);
      }
    }
  }
  let score = resolvedBy === "tag" ? 70 : resolvedBy === "attr" ? 65 : 40;
  score += Math.round(confirmed / def.confirm.length * 30);
  score = Math.min(score, 100);
  const preserved = [];
  const finalConsumed = new Set(initialConsumed);
  for (const cls of classes) {
    const base = getBaseClass(cls);
    if (shouldPreserve(base)) {
      preserved.push(cls);
      finalConsumed.delete(cls);
    } else if (!finalConsumed.has(cls)) {
      finalConsumed.add(cls);
    }
  }
  const uiClasses = [def.uiClass, ...uiVariants];
  const newClassString = [...uiClasses, ...preserved].join(" ");
  return {
    component: componentKey,
    uiClass: def.uiClass,
    uiVariants,
    score,
    consumed: Array.from(finalConsumed),
    preserved,
    newClassString,
    resolvedBy
  };
}

// src/migrate/transformer.ts
import * as fs2 from "fs";
function applyReplacements(filePath, replacements) {
  let content = fs2.readFileSync(filePath, "utf8");
  const sorted = [...replacements].sort((a, b) => b.startIndex - a.startIndex);
  for (const rep of sorted) {
    content = content.substring(0, rep.startIndex) + rep.newClassString + content.substring(rep.endIndex);
  }
  return content;
}
function writeFile(filePath, content) {
  fs2.writeFileSync(filePath, content, "utf8");
}

// src/migrate/reporter.ts
function printReport(stats, isDryRun) {
  const title = isDryRun ? "TailUI Migration Preview" : "TailUI Migration Report";
  console.log("");
  console.log(`  \u250C${"\u2500".repeat(47)}\u2510`);
  console.log(`  \u2502  ${title.padEnd(45)}\u2502`);
  console.log(`  \u251C${"\u2500".repeat(47)}\u2524`);
  console.log(`  \u2502  Files scanned:    ${String(stats.filesScanned).padEnd(26)}\u2502`);
  console.log(`  \u2502  Files modified:   ${String(stats.filesModified).padEnd(26)}\u2502`);
  console.log(`  \u2502  Migrations:       ${String(stats.totalMigrations).padEnd(26)}\u2502`);
  if (stats.totalSkipped > 0) {
    console.log(`  \u2502  Skipped:          ${String(stats.totalSkipped).padEnd(26)}\u2502`);
  }
  console.log(`  \u2502${" ".repeat(47)}\u2502`);
  const sortedComponents = Object.entries(stats.componentCounts).sort((a, b) => b[1] - a[1]);
  for (const [component, count] of sortedComponents) {
    const line = `  \u2713 ${component.padEnd(16)} ${count} replacement${count > 1 ? "s" : ""}`;
    console.log(`  \u2502${line.padEnd(47)}\u2502`);
  }
  const sortedSkipped = Object.entries(stats.skippedCounts).sort((a, b) => b[1] - a[1]);
  for (const [component, count] of sortedSkipped) {
    const line = `  \u26A0 ${component.padEnd(16)} ${count} skipped (low score)`;
    console.log(`  \u2502${line.padEnd(47)}\u2502`);
  }
  if (stats.unmatchedFiles.length > 0) {
    const line = `  \u2717 ${stats.unmatchedFiles.length} file${stats.unmatchedFiles.length > 1 ? "s" : ""} with no matches`;
    console.log(`  \u2502${line.padEnd(47)}\u2502`);
  }
  console.log(`  \u2502${" ".repeat(47)}\u2502`);
  if (!isDryRun && stats.backupDir) {
    const backupLine = `  Backup: ${stats.backupDir}`;
    const truncated = backupLine.length > 45 ? backupLine.substring(0, 42) + "..." : backupLine;
    console.log(`  \u2502${truncated.padEnd(47)}\u2502`);
  }
  if (isDryRun) {
    console.log(`  \u2502  Run without --dry-run to apply changes.${" ".repeat(3)}\u2502`);
  }
  console.log(`  \u2514${"\u2500".repeat(47)}\u2518`);
  console.log("");
}
function printFilePreview(filePath, replacements) {
  console.log(`
  \u{1F4C4} ${filePath}`);
  for (const rep of replacements) {
    console.log(`     L${rep.line}: ${rep.component} (${rep.score}%)`);
    console.log(`     \x1B[31m- ${truncate(rep.classString, 70)}\x1B[0m`);
    console.log(`     \x1B[32m+ ${truncate(rep.newClassString, 70)}\x1B[0m`);
  }
}
function printInteractiveItem(rep, index, total) {
  console.log(`
  [${index + 1}/${total}] ${rep.file}:${rep.line}`);
  console.log(`  Component: ${rep.uiClass}${rep.uiVariants.length ? " " + rep.uiVariants.join(" ") : ""} (${rep.score}% confidence)`);
  console.log(`  \x1B[31m- ${truncate(rep.classString, 70)}\x1B[0m`);
  console.log(`  \x1B[32m+ ${truncate(rep.newClassString, 70)}\x1B[0m`);
}
function truncate(str, maxLen) {
  if (str.length <= maxLen) return str;
  return str.substring(0, maxLen - 3) + "...";
}

// src/migrate/backup.ts
import fs3 from "fs";
import path2 from "path";
var BACKUP_ROOT = ".tailui-backup";
function createBackup(filePaths, projectRoot) {
  const timestamp = (/* @__PURE__ */ new Date()).toISOString().replace(/[:.]/g, "-").substring(0, 19);
  const backupDir = path2.join(projectRoot, BACKUP_ROOT, timestamp);
  for (const filePath of filePaths) {
    const relativePath = path2.relative(projectRoot, filePath);
    const backupPath = path2.join(backupDir, relativePath);
    const backupSubDir = path2.dirname(backupPath);
    if (!fs3.existsSync(backupSubDir)) {
      fs3.mkdirSync(backupSubDir, { recursive: true });
    }
    fs3.copyFileSync(filePath, backupPath);
  }
  const manifest = {
    timestamp,
    date: (/* @__PURE__ */ new Date()).toISOString(),
    files: filePaths.map((f) => path2.relative(projectRoot, f)),
    projectRoot
  };
  fs3.writeFileSync(
    path2.join(backupDir, ".manifest.json"),
    JSON.stringify(manifest, null, 2)
  );
  return backupDir;
}
function restoreBackup(projectRoot, backupTimestamp) {
  const backupRoot = path2.join(projectRoot, BACKUP_ROOT);
  if (!fs3.existsSync(backupRoot)) return null;
  let targetDir;
  if (backupTimestamp) {
    targetDir = path2.join(backupRoot, backupTimestamp);
    if (!fs3.existsSync(targetDir)) return null;
  } else {
    const backups = fs3.readdirSync(backupRoot).filter((d) => {
      const fullPath = path2.join(backupRoot, d);
      return fs3.statSync(fullPath).isDirectory() && d !== ".gitkeep";
    }).sort().reverse();
    if (backups.length === 0) return null;
    targetDir = path2.join(backupRoot, backups[0]);
  }
  const manifestPath = path2.join(targetDir, ".manifest.json");
  if (!fs3.existsSync(manifestPath)) return null;
  let manifest;
  try {
    manifest = JSON.parse(fs3.readFileSync(manifestPath, "utf8"));
  } catch {
    return null;
  }
  let restored = 0;
  for (const relativePath of manifest.files) {
    const backupFile = path2.join(targetDir, relativePath);
    const originalFile = path2.join(projectRoot, relativePath);
    if (fs3.existsSync(backupFile)) {
      const targetSubDir = path2.dirname(originalFile);
      if (!fs3.existsSync(targetSubDir)) {
        fs3.mkdirSync(targetSubDir, { recursive: true });
      }
      fs3.copyFileSync(backupFile, originalFile);
      restored++;
    }
  }
  return { restored, backupDir: targetDir };
}
function listBackups(projectRoot) {
  const backupRoot = path2.join(projectRoot, BACKUP_ROOT);
  if (!fs3.existsSync(backupRoot)) return [];
  const dirs = fs3.readdirSync(backupRoot).filter((d) => fs3.statSync(path2.join(backupRoot, d)).isDirectory()).sort().reverse();
  const backups = [];
  for (const dir of dirs) {
    const manifestPath = path2.join(backupRoot, dir, ".manifest.json");
    if (!fs3.existsSync(manifestPath)) continue;
    try {
      const manifest = JSON.parse(fs3.readFileSync(manifestPath, "utf8"));
      backups.push({
        timestamp: dir,
        date: manifest.date,
        fileCount: manifest.files.length
      });
    } catch {
    }
  }
  return backups;
}

// src/migrate/index.ts
async function migrate(options) {
  const projectRoot = process.cwd();
  if (options.undo) {
    return handleUndo(projectRoot);
  }
  const targetPath = path3.resolve(projectRoot, options.target);
  if (!fs4.existsSync(targetPath)) {
    console.error(`  \u274C Target not found: ${options.target}`);
    process.exit(1);
  }
  const isDirectory = fs4.statSync(targetPath).isDirectory();
  if (isDirectory && !options.all) {
    console.error(`  \u274C "${options.target}" is a directory. Use --all to migrate all files in it.`);
    console.error(`  Or use -f <file> to migrate a single file.`);
    process.exit(1);
  }
  let files;
  if (isDirectory) {
    files = findFiles(targetPath);
    if (files.length === 0) {
      console.log(`  \u26A0\uFE0F  No supported files found in ${options.target}`);
      return;
    }
    console.log(`
  \u{1F50D} Scanning ${files.length} file${files.length > 1 ? "s" : ""} in ${options.target}...
`);
  } else {
    files = [targetPath];
    console.log(`
  \u{1F50D} Scanning ${path3.basename(targetPath)}...
`);
  }
  const threshold = options.threshold || 60;
  const allReplacements = /* @__PURE__ */ new Map();
  const allSkipped = [];
  let totalMatches = 0;
  let totalSkipped = 0;
  for (const file of files) {
    const classMatches = scanFile(file);
    const fileReplacements = [];
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
          score: match.score
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
            score: lowMatch.score
          });
          totalSkipped++;
        }
      }
    }
    if (fileReplacements.length > 0) {
      allReplacements.set(file, fileReplacements);
    }
  }
  if (totalMatches === 0) {
    console.log("  \u2139\uFE0F  No Tailwind patterns matching TailUI components were found.");
    if (totalSkipped > 0) {
      console.log(`  ${totalSkipped} potential match${totalSkipped > 1 ? "es" : ""} were below the confidence threshold (${threshold}%).`);
      console.log(`  Try lowering the threshold with --threshold <number>.
`);
    }
    return;
  }
  if (options.dryRun) {
    for (const [filePath, replacements] of allReplacements) {
      printFilePreview(filePath, replacements);
    }
    printReport(buildStats(files, allReplacements, allSkipped, null), true);
    return;
  }
  if (options.interactive) {
    const accepted = await runInteractive(allReplacements);
    if (accepted.size === 0) {
      console.log("\n  No changes applied.\n");
      return;
    }
    const filesToBackup2 = Array.from(accepted.keys());
    const backupDir2 = createBackup(filesToBackup2, projectRoot);
    console.log(`
  \u{1F4BE} Backup created: ${path3.relative(projectRoot, backupDir2)}`);
    for (const [filePath, replacements] of accepted) {
      const newContent = applyReplacements(filePath, replacements);
      writeFile(filePath, newContent);
      console.log(`  \u2611\uFE0F Migrated: ${path3.relative(projectRoot, filePath)} (${replacements.length} change${replacements.length > 1 ? "s" : ""})`);
    }
    printReport(buildStats(files, accepted, allSkipped, backupDir2), false);
    return;
  }
  const filesToBackup = Array.from(allReplacements.keys());
  const backupDir = createBackup(filesToBackup, projectRoot);
  console.log(`  \u{1F4BE} Backup created: ${path3.relative(projectRoot, backupDir)}`);
  for (const [filePath, replacements] of allReplacements) {
    const newContent = applyReplacements(filePath, replacements);
    writeFile(filePath, newContent);
    console.log(`  \u2611\uFE0F Migrated: ${path3.relative(projectRoot, filePath)} (${replacements.length} change${replacements.length > 1 ? "s" : ""})`);
  }
  printReport(buildStats(files, allReplacements, allSkipped, backupDir), false);
  console.log("  \u{1F4A1} Run `tailui migrate --undo` to revert changes.\n");
}
async function runInteractive(allReplacements) {
  const accepted = /* @__PURE__ */ new Map();
  const allReps = [];
  for (const [, replacements] of allReplacements) {
    allReps.push(...replacements);
  }
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  const ask = (prompt) => new Promise((resolve2) => {
    rl.question(prompt, (answer) => resolve2(answer.trim().toLowerCase()));
  });
  let skipFile = null;
  for (let i = 0; i < allReps.length; i++) {
    const rep = allReps[i];
    if (skipFile === rep.file) continue;
    printInteractiveItem(rep, i, allReps.length);
    const answer = await ask("  Apply? [Y/n/s(kip file)/q(uit)] ");
    if (answer === "q" || answer === "quit") break;
    if (answer === "s" || answer === "skip") {
      skipFile = rep.file;
      console.log(`  \u23ED  Skipping remaining changes in ${path3.basename(rep.file)}`);
      continue;
    }
    if (answer === "n" || answer === "no") continue;
    if (!accepted.has(rep.file)) {
      accepted.set(rep.file, []);
    }
    accepted.get(rep.file).push(rep);
  }
  rl.close();
  return accepted;
}
function handleUndo(projectRoot) {
  const backups = listBackups(projectRoot);
  if (backups.length === 0) {
    console.log("  \u274C No backups found. Nothing to undo.\n");
    return;
  }
  console.log("\n  \u{1F4CB} Available backups:\n");
  backups.forEach((b, i) => {
    console.log(`    ${i + 1}. ${b.date} (${b.fileCount} file${b.fileCount > 1 ? "s" : ""})`);
  });
  const result = restoreBackup(projectRoot);
  if (result) {
    console.log(`
  \u2611\uFE0F Restored ${result.restored} file${result.restored > 1 ? "s" : ""} from backup.`);
    console.log(`  Backup: ${path3.relative(projectRoot, result.backupDir)}
`);
  } else {
    console.log("  \u274C Failed to restore backup.\n");
  }
}
function buildStats(files, replacementsMap, skipped, backupDir) {
  const componentCounts = {};
  const skippedCounts = {};
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
  const unmatchedFiles = files.filter((f) => !modifiedFiles.has(f));
  return {
    filesScanned: files.length,
    filesModified: modifiedFiles.size,
    totalMigrations,
    totalSkipped: skipped.length,
    componentCounts,
    skippedCounts,
    unmatchedFiles,
    backupDir: backupDir ? path3.relative(process.cwd(), backupDir) : ""
  };
}
export {
  migrate
};
//# sourceMappingURL=index.js.map