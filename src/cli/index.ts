#!/usr/bin/env node

import { program } from 'commander';
import fs from 'fs';
import path from 'path';
import readline from 'readline';
import https from 'https';
import { fileURLToPath } from 'url';
import { resolveConfig, CONFIG_FILE, DEFAULT_DIR } from '../config';
import { getTemplate, getAvailableComponents } from '../templates/index';
import { migrate } from '../migrate/index';

import { createRequire } from 'module';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const require = createRequire(import.meta.url);
const pkg = require('../../package.json') as { version: string };

// Catch unhandled promise rejections (async commands)
process.on('unhandledRejection', (err: unknown) => {
  const message = err instanceof Error ? err.message : String(err);
  console.error(`  ❌ Unexpected error: ${message}`);
  process.exit(1);
});

// ─── Types ──────────────────────────────────────────────────────

type Stack = 'react' | 'nextjs' | 'vue' | 'nuxt' | 'svelte' | 'sveltekit' | 'angular' | 'astro' | 'html';
type AIProvider = 'openai' | 'claude' | 'gemini' | 'mistral';

interface AIEndpoint {
  url: string;
  model: string;
}

interface AIConfig {
  provider: AIProvider;
  apiKey: string;
}

interface TailUIConfig {
  version?: string;
  stack?: Stack;
  directory?: string;
  stylesDir?: string;
  componentsDir?: string;
  ai?: AIConfig;
  components?: Record<string, string[]>;
  variables?: Record<string, string[]>;
  slots?: string[];
}

interface AngularTemplate {
  ts: () => string;
  html: () => string;
}

interface MigrateOptions {
  target?: string;
  all?: boolean;
  dryRun?: boolean;
  interactive?: boolean;
  force?: boolean;
  threshold?: number;
  undo?: boolean;
  ai?: boolean;
  aiConfig?: AIConfig | null;
}

// ─── Constants ──────────────────────────────────────────────────

const STACKS: Stack[] = ['react', 'nextjs', 'vue', 'nuxt', 'svelte', 'sveltekit', 'angular', 'astro', 'html'];
const AI_PROVIDERS: AIProvider[] = ['openai', 'claude', 'gemini', 'mistral'];
const COMPONENT_NAME_RE = /^[a-z][a-z0-9-]*$/;
const TOKEN_NAME_RE = /^[a-z][a-z0-9-]*$/;

const AI_ENDPOINTS: Record<AIProvider, AIEndpoint> = {
  openai:  { url: 'https://api.openai.com/v1/chat/completions', model: 'gpt-4o' },
  claude:  { url: 'https://api.anthropic.com/v1/messages', model: 'claude-sonnet-4-20250514' },
  gemini:  { url: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent', model: 'gemini-pro' },
  mistral: { url: 'https://api.mistral.ai/v1/chat/completions', model: 'mistral-large-latest' },
};

const STACK_EXTENSIONS: Record<Stack, string> = {
  react: 'tsx', nextjs: 'tsx', vue: 'vue', nuxt: 'vue',
  svelte: 'svelte', sveltekit: 'svelte', angular: 'ts',
  astro: 'astro', html: 'html',
};

program
  .name('tailui')
  .description('TailUI — Semantic CSS layer on top of TailwindCSS')
  .version(pkg.version);

// ─── Helper: get styles dir from config ─────────────────────────

function getStylesDir(optionDir?: string): string {
  if (optionDir) return optionDir;
  const { stylesDir } = resolveConfig();
  return stylesDir;
}

function loadConfig(): TailUIConfig | null {
  const configPath = path.join(process.cwd(), CONFIG_FILE);
  if (!fs.existsSync(configPath)) return null;
  try {
    return JSON.parse(fs.readFileSync(configPath, 'utf8')) as TailUIConfig;
  } catch (e) {
    console.error(`  ❌ Failed to parse ${CONFIG_FILE}: ${(e as Error).message}`);
    console.error(`  Fix the JSON syntax or delete the file and run: npx tailui init`);
    process.exit(1);
  }
}

function saveConfig(config: TailUIConfig): void {
  const configPath = path.join(process.cwd(), CONFIG_FILE);
  try {
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2) + '\n');
  } catch (e) {
    console.error(`  ❌ Failed to write ${CONFIG_FILE}: ${(e as Error).message}`);
    process.exit(1);
  }
}

// ─── CREATE ────────────────────────────────────────────────────
program
  .command('create <component>')
  .description('Create a new UI component style file')
  .option('-d, --dir <path>', 'Override styles directory')
  .option('-v, --variants <variants>', 'Comma-separated list of variants', '')
  .action((component: string, options: { dir?: string; variants?: string }) => {
    if (!COMPONENT_NAME_RE.test(component)) {
      console.error(`  ❌ Invalid component name "${component}". Use lowercase letters, numbers, and hyphens (e.g. "my-button").`);
      process.exit(1);
    }

    const dir = getStylesDir(options.dir);
    const filePath = path.join(dir, `ui.${component}.css`);

    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`  - Created directory: ${dir}`);
    }

    if (fs.existsSync(filePath)) {
      console.log(`  ⚠️  Component "${component}" already exists at ${filePath}`);
      process.exit(0);
    }

    const variants = options.variants
      ? options.variants.split(',').map(v => v.trim()).filter(Boolean)
      : ['default'];

    const invalidVariant = variants.find(v => !TOKEN_NAME_RE.test(v));
    if (invalidVariant) {
      console.error(`  ❌ Invalid variant name "${invalidVariant}". Use lowercase letters, numbers, and hyphens.`);
      process.exit(1);
    }

    const template = generateTemplate(component, variants);
    fs.writeFileSync(filePath, template);
    console.log(` - Created: ${filePath}`);

    updateConfig(component, variants);
    updateIndex(dir, component);

    console.log(`\n  Usage:`);
    console.log(`    <div class="ui-${component}">`);
    variants.forEach(v => {
      console.log(`    <div class="ui-${component} ui-${v}">`);
    });
    console.log('');
  });

// ─── ADD ───────────────────────────────────────────────────────
program
  .command('add <component>')
  .description('Add a TailUI component to your project (CSS + framework component)')
  .option('--css-only', 'Only copy the CSS file, skip framework component generation')
  .option('--overwrite', 'Overwrite existing files')
  .action(async (component: string, options: { cssOnly?: boolean; overwrite?: boolean }) => {
    if (!COMPONENT_NAME_RE.test(component)) {
      console.error(`  ❌ Invalid component name "${component}". Use lowercase letters, numbers, and hyphens.`);
      process.exit(1);
    }

    const config = loadConfig();
    if (!config) {
      console.log('  ❌ No ui.config.json found. Run: npx tailui init');
      process.exit(1);
    }

    const availableComponents = getAvailableComponents();
    if (!availableComponents.includes(component)) {
      console.error(`  ❌ Component "${component}" not found in TailUI library.`);
      console.error(`  Available components: ${availableComponents.join(', ')}`);
      process.exit(1);
    }

    const stylesDir = config.stylesDir || './ui/styles';
    const componentsDir = config.componentsDir || './src/components/ui';
    const stack = config.stack || 'react';
    const isTypeScript = fs.existsSync(path.join(process.cwd(), 'tsconfig.json'));

    console.log(`\n  📦 Adding ${component} component...\n`);

    // ── Step 1: Copy CSS file ──
    const cssSourcePath = path.join(__dirname, '../../ui/styles', `ui.${component}.css`);
    const cssDestPath = path.join(stylesDir, `ui.${component}.css`);

    if (!fs.existsSync(cssSourcePath)) {
      console.error(`  ❌ CSS file not found: ${cssSourcePath}`);
      process.exit(1);
    }

    if (!fs.existsSync(stylesDir)) {
      fs.mkdirSync(stylesDir, { recursive: true });
      console.log(`  - Created: ${stylesDir}`);
    }

    if (fs.existsSync(cssDestPath) && !options.overwrite) {
      console.log(`  ⚠️  ${cssDestPath} already exists. Use --overwrite to replace.`);
    } else {
      fs.copyFileSync(cssSourcePath, cssDestPath);
      console.log(`  - Copied: ${cssDestPath}`);
      updateIndex(stylesDir, component);
    }

    // ── Step 2: Generate framework component ──
    if (!options.cssOnly) {
      if (!fs.existsSync(componentsDir)) {
        fs.mkdirSync(componentsDir, { recursive: true });
        console.log(`  - Created: ${componentsDir}`);
      }

      const ext = getExtension(stack, isTypeScript);
      const componentName = capitalize(component);

      if (stack === 'angular') {
        const template = getTemplate(component, stack, isTypeScript) as AngularTemplate | null;
        if (template && 'ts' in template && 'html' in template) {
          const tsPath = path.join(componentsDir, `${component}.component.ts`);
          const htmlPath = path.join(componentsDir, `${component}.component.html`);

          if (!fs.existsSync(tsPath) || options.overwrite) {
            fs.writeFileSync(tsPath, template.ts());
            console.log(`  - Generated: ${tsPath}`);
          } else {
            console.log(`  ⚠️  ${tsPath} already exists. Use --overwrite to replace.`);
          }

          if (!fs.existsSync(htmlPath) || options.overwrite) {
            fs.writeFileSync(htmlPath, template.html());
            console.log(`  - Generated: ${htmlPath}`);
          } else {
            console.log(`  ⚠️  ${htmlPath} already exists. Use --overwrite to replace.`);
          }
        } else {
          console.log(`  ℹ️  No Angular template for ${component}. CSS only.`);
        }
      } else {
        const template = getTemplate(component, stack, isTypeScript) as string | null;
        if (template) {
          const filePath = path.join(componentsDir, `${componentName}.${ext}`);
          if (!fs.existsSync(filePath) || options.overwrite) {
            fs.writeFileSync(filePath, template);
            console.log(`  - Generated: ${filePath}`);
          } else {
            console.log(`  ⚠️  ${filePath} already exists. Use --overwrite to replace.`);
          }
        } else {
          console.log(`  ℹ️  No ${stack} template for ${component}. CSS only.`);
        }
      }
    }

    // console.log(`\n  🎉 Done! Use the component:\n`);
    console.log(`\n  🎉 Done! `);
    if (stack === 'react' || stack === 'nextjs') {
      // console.log(`  import { ${capitalize(component)} } from "${componentsDir.replace('./', '@/')}/${capitalize(component)}";`);
    } else if (stack === 'vue' || stack === 'nuxt') {
      // console.log(`  <${capitalize(component)} />`);
    } else if (stack === 'svelte' || stack === 'sveltekit') {
      // console.log(`  import ${capitalize(component)} from "${componentsDir}/${capitalize(component)}.svelte";`);
    } else if (stack === 'angular') {
      // console.log(`  <ui-${component}></ui-${component}>`);
    } else {
      console.log(`  <div class="ui-${component}">...</div>`);
    }
    console.log('');
  });

function getExtension(stack: string, isTypeScript: boolean): string {
  const extensions: Record<string, string> = {
    react: isTypeScript ? 'tsx' : 'jsx',
    nextjs: isTypeScript ? 'tsx' : 'jsx',
    vue: 'vue',
    nuxt: 'vue',
    svelte: 'svelte',
    sveltekit: 'svelte',
    angular: 'ts',
    astro: 'astro',
    html: 'html',
  };
  return extensions[stack] ?? (isTypeScript ? 'tsx' : 'jsx');
}

// ─── LIST ──────────────────────────────────────────────────────
program
  .command('list')
  .description('List all UI components and their tokens')
  .action(() => {
    const config = loadConfig();

    if (!config) {
      console.log('  ❌ No ui.config.json found. Run: npx tailui init');
      process.exit(1);
    }

    const components = config.components || {};

    console.log('\n  📦 TailUI Components\n');
    console.log(`  Stack: ${config.stack || 'not set'}`);
    console.log(`  Directory: ${config.directory || 'not set'}`);
    console.log(`  Components dir: ${config.componentsDir || 'not set'}`);
    console.log(`  AI: ${config.ai?.provider || 'not configured'}\n`);

    if (Object.keys(components).length === 0) {
      console.log('  No components found.\n');
      return;
    }

    for (const [name, tokens] of Object.entries(components)) {
      console.log(`  ${name}`);
      if (Array.isArray(tokens)) {
        tokens.forEach(t => console.log(`    ├─ ${t}`));
      }
      console.log('');
    }
  });

// ─── INIT ──────────────────────────────────────────────────────
program
  .command('init')
  .description('Initialize TailUI in the current project')
  .option('-d, --dir <name>', 'Directory name (skip prompt)')
  .option('-s, --stack <stack>', 'Framework stack (skip prompt)')
  .action(async (options: { dir?: string; stack?: string }) => {
    const configPath = path.join(process.cwd(), CONFIG_FILE);

    if (fs.existsSync(configPath)) {
      const existing = loadConfig();
      if (existing) {
        console.log(`\n  ⚠️  TailUI is already initialized.`);
        console.log(`  Directory: ${existing.stylesDir}`);
        console.log(`  Stack: ${existing.stack || 'not set'}`);
        console.log(`  Config: ${CONFIG_FILE}\n`);
        return;
      }
    }

    console.log('\n  🎨 TailUI Setup\n');

    // ── Step 1: Stack ──
    let stack: string;
    if (options.stack && STACKS.includes(options.stack as Stack)) {
      stack = options.stack;
    } else {
      console.log('  What is your project stack?\n');
      STACKS.forEach((s, i) => console.log(`    ${i + 1}. ${s}`));
      console.log(`    0. other\n`);

      const stackChoice = await askQuestion('  Enter number (1)', '1');
      const idx = parseInt(stackChoice, 10);
      if (idx === 0) {
        stack = await askQuestion('  Enter your stack name:', 'html');
      } else if (idx >= 1 && idx <= STACKS.length) {
        stack = STACKS[idx - 1];
      } else {
        stack = STACKS[0];
      }
    }
    console.log(`  → Stack: ${stack}\n`);

    // ── Step 2: Styles directory ──
    let dirName: string;
    if (options.dir) {
      dirName = options.dir;
    } else {
      dirName = await askQuestion(
        `  Where should TailUI store styles? (${DEFAULT_DIR})`,
        DEFAULT_DIR
      );
    }
    dirName = dirName.replace(/[^a-zA-Z0-9_\-./]/g, '').trim() || DEFAULT_DIR;
    const stylesDir = `./${dirName}/styles`;

    const resolvedStylesDir = path.resolve(process.cwd(), stylesDir);
    if (!resolvedStylesDir.startsWith(process.cwd())) {
      console.error(`  ❌ Styles directory must be within the project.`);
      process.exit(1);
    }
    console.log(`  → Styles: ${stylesDir}\n`);

    // ── Step 3: Components directory ──
    const defaultComponentsDir = `./src/components/ui`;
    let componentsDir = await askQuestion(
      `  Where should generated components be placed? (${defaultComponentsDir})`,
      defaultComponentsDir
    );
    componentsDir = componentsDir.replace(/[^a-zA-Z0-9_\-./]/g, '').trim() || defaultComponentsDir;

    const resolvedComponentsDir = path.resolve(process.cwd(), componentsDir);
    if (!resolvedComponentsDir.startsWith(process.cwd())) {
      console.error(`  ❌ Components directory must be within the project.`);
      process.exit(1);
    }
    console.log(`  → Components: ${componentsDir}\n`);

    // ── Step 4: AI configuration (optional) ──
    const configureAI = await askQuestion('  Configure AI for component generation? (y/N)', 'n');

    let ai: AIConfig | null = null;
    if (configureAI.toLowerCase() === 'y') {
      console.log('\n  Choose your AI provider:\n');
      AI_PROVIDERS.forEach((p, i) => console.log(`    ${i + 1}. ${p}`));
      console.log('');

      const providerChoice = await askQuestion('  Enter number (1)', '1');
      const pIdx = parseInt(providerChoice, 10);
      const provider: AIProvider = (pIdx >= 1 && pIdx <= AI_PROVIDERS.length)
        ? AI_PROVIDERS[pIdx - 1]
        : AI_PROVIDERS[0];

      const apiKey = await askQuestion(`  Enter your ${provider} API key:`, '');

      if (apiKey) {
        ai = { provider, apiKey };
        console.log(`  → AI: ${provider} \n`);
      } else {
        console.log('  → AI: skipped (no key provided)\n');
      }
    }

    // ── Check existing directory ──
    if (fs.existsSync(dirName) && fs.readdirSync(dirName).length > 0) {
      const overwrite = await askQuestion(
        `  ⚠️  Directory "${dirName}" already exists. Use it anyway? (y/N)`,
        'n'
      );
      if (overwrite.toLowerCase() !== 'y') {
        console.log('  Aborted.\n');
        return;
      }
    }

    // ── Create directories ──
    if (!fs.existsSync(stylesDir)) {
      fs.mkdirSync(stylesDir, { recursive: true });
      console.log(`  - Created: ${stylesDir}`);
    }

    if (!fs.existsSync(componentsDir)) {
      fs.mkdirSync(componentsDir, { recursive: true });
      console.log(`  - Created: ${componentsDir}`);
    }

    const indexPath = path.join(stylesDir, 'index.css');
    if (!fs.existsSync(indexPath)) {
      fs.writeFileSync(indexPath, `/* TailUI — Component Styles Entry Point */\n`);
      console.log(`  - Created: ${indexPath}`);
    }

    // ── Create config ──
    const config: TailUIConfig = {
      version: '2.3.0',
      stack: stack as Stack,
      directory: dirName,
      stylesDir,
      componentsDir,
      ...(ai ? { ai } : {}),
      components: {},
      variables: {},
    };
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    console.log(`  - Created: ${CONFIG_FILE}`);

    if (ai) {
      const gitignorePath = path.join(process.cwd(), '.gitignore');
      if (fs.existsSync(gitignorePath)) {
        const gitignoreContent = fs.readFileSync(gitignorePath, 'utf8');
        if (!gitignoreContent.includes(CONFIG_FILE)) {
          fs.appendFileSync(gitignorePath, `\n# TailUI config (contains API key)\n${CONFIG_FILE}\n`);
          console.log(`  🔒 Added ${CONFIG_FILE} to .gitignore (API key protection)`);
        }
      } else {
        fs.writeFileSync(gitignorePath, `# TailUI config (contains API key)\n${CONFIG_FILE}\n`);
        console.log(`  🔒 Created .gitignore with ${CONFIG_FILE} (API key protection)`);
      }
    }

    console.log('\n  🎉 TailUI initialized!\n');
    console.log('  Next steps:\n');
    console.log('    1. Add to tailwind.config.js:');
    console.log(`       plugins: [require('@tailuicss/core')()]`);
    console.log('');
    console.log('    2. Add to postcss.config.js:');
    console.log(`       plugins: { '@tailuicss/core/postcss': {}, tailwindcss: {} }`);
    console.log('');
    console.log('    3. Your CSS file just needs:');
    console.log('       @tailwind base;');
    console.log('       @tailwind components;');
    console.log('       @tailwind utilities;');
    console.log('');
    if (ai) {
      console.log('    4. Generate a component with AI:');
      console.log('       npx tailui generate button');
    } else {
      console.log('    4. Create your first component:');
      console.log('       npx tailui create button --variants primary,secondary,danger');
    }
    console.log('');
  });

// ─── GENERATE (AI) ─────────────────────────────────────────────
program
  .command('generate <component>')
  .description('Generate a framework component with AI using TailUI styles')
  .option('-s, --stack <stack>', 'Override stack from config')
  .action(async (component: string, options: { stack?: string }) => {
    if (!COMPONENT_NAME_RE.test(component)) {
      console.error(`  ❌ Invalid component name "${component}". Use lowercase letters, numbers, and hyphens.`);
      process.exit(1);
    }

    const config = loadConfig();

    if (!config) {
      console.log('  ❌ No ui.config.json found. Run: npx tailui init');
      process.exit(1);
    }

    if (!config.ai?.apiKey) {
      console.log('  ❌ AI not configured. Run: npx tailui init');
      console.log('  Or add manually to ui.config.json:');
      console.log('    "ai": { "provider": "openai", "apiKey": "sk-..." }');
      process.exit(1);
    }

    const stack = options.stack || config.stack || 'react';
    const provider = config.ai.provider;
    const apiKey = config.ai.apiKey;
    const componentsDir = config.componentsDir || './src/components/ui';
    const stylesDir = config.stylesDir || './ui/styles';
    const ext = STACK_EXTENSIONS[stack as Stack] || 'tsx';

    const cssPath = path.join(stylesDir, `ui.${component}.css`);
    let cssContent = '';
    if (fs.existsSync(cssPath)) {
      cssContent = fs.readFileSync(cssPath, 'utf8');
    }

    console.log(`\n  🤖 Generating ${component} component for ${stack}...`);
    console.log(`  Provider: ${provider}\n`);

    const prompt = buildPrompt(component, stack, cssContent, config);

    try {
      const code = await callAI(provider, apiKey, prompt);

      if (!fs.existsSync(componentsDir)) {
        fs.mkdirSync(componentsDir, { recursive: true });
      }

      const fileName = `${capitalize(component)}.${ext}`;
      const filePath = path.join(componentsDir, fileName);

      if (fs.existsSync(filePath)) {
        const overwrite = await askQuestion(
          `  ⚠️  ${fileName} already exists. Overwrite? (y/N)`,
          'n'
        );
        if (overwrite.toLowerCase() !== 'y') {
          console.log('  Aborted.\n');
          return;
        }
      }

      fs.writeFileSync(filePath, code);
      console.log(` -  Generated: ${filePath}`);
      console.log(`\n  The component uses TailUI .ui-* classes from your styles.`);
      console.log(`  Import it in your project and start using it!\n`);
    } catch (err) {
      console.error(`  ❌ AI generation failed: ${(err as Error).message}`);
      console.error('  Check your API key and network connection.\n');
      process.exit(1);
    }
  });

// ─── CONFIG ────────────────────────────────────────────────────
program
  .command('config')
  .description('View or update TailUI configuration')
  .option('--set-ai <provider>', 'Set AI provider (openai, claude, gemini, mistral)')
  .option('--set-key <key>', 'Set AI API key')
  .option('--set-stack <stack>', 'Set project stack')
  .action((options: { setAi?: string; setKey?: string; setStack?: string }) => {
    const config = loadConfig();

    if (!config) {
      console.log('  ❌ No ui.config.json found. Run: npx tailui init');
      process.exit(1);
    }

    let changed = false;

    if (options.setStack) {
      if (!STACKS.includes(options.setStack as Stack)) {
        console.error(`  ❌ Invalid stack "${options.setStack}". Must be one of: ${STACKS.join(', ')}`);
        process.exit(1);
      }
      config.stack = options.setStack as Stack;
      changed = true;
      console.log(`  -  Stack set to: ${options.setStack}`);
    }

    if (options.setAi) {
      if (!AI_PROVIDERS.includes(options.setAi as AIProvider)) {
        console.error(`  ❌ Invalid AI provider "${options.setAi}". Must be one of: ${AI_PROVIDERS.join(', ')}`);
        process.exit(1);
      }
      if (!config.ai) config.ai = { provider: options.setAi as AIProvider, apiKey: '' };
      config.ai.provider = options.setAi as AIProvider;
      changed = true;
      console.log(`  -  AI provider set to: ${options.setAi}`);
    }

    if (options.setKey) {
      if (!config.ai) config.ai = { provider: 'openai', apiKey: '' };
      config.ai.apiKey = options.setKey;
      changed = true;
      console.log(`  -  AI API key updated`);

      const gitignorePath = path.join(process.cwd(), '.gitignore');
      if (fs.existsSync(gitignorePath)) {
        const gitignoreContent = fs.readFileSync(gitignorePath, 'utf8');
        if (!gitignoreContent.includes(CONFIG_FILE)) {
          fs.appendFileSync(gitignorePath, `\n# TailUI config (contains API key)\n${CONFIG_FILE}\n`);
          console.log(`  🔒 Added ${CONFIG_FILE} to .gitignore (API key protection)`);
        }
      }
    }

    if (changed) {
      saveConfig(config);
      console.log(`  - Saved: ${CONFIG_FILE}\n`);
    } else {
      console.log('\n  ⚙️  TailUI Configuration\n');
      console.log(`  Stack:          ${config.stack || 'not set'}`);
      console.log(`  Directory:      ${config.directory || 'not set'}`);
      console.log(`  Styles dir:     ${config.stylesDir || 'not set'}`);
      console.log(`  Components dir: ${config.componentsDir || 'not set'}`);
      console.log(`  AI provider:    ${config.ai?.provider || 'not configured'}`);
      console.log(`  AI key:         ${config.ai?.apiKey ? '••••' + config.ai.apiKey.slice(-4) : 'not set'}`);
      console.log('');
    }
  });

// ─── MIGRATE ──────────────────────────────────────────────────
program
  .command('migrate [target]')
  .description('Migrate Tailwind utility classes to TailUI .ui-* semantic classes')
  .option('-f, --file <path>', 'Migrate a single file')
  .option('--all', 'Migrate all supported files in the target directory')
  .option('--dry-run', 'Preview changes without modifying files')
  .option('-i, --interactive', 'Confirm each migration interactively')
  .option('--force', 'Apply all migrations without confirmation')
  .option('--threshold <number>', 'Minimum confidence score (0–100, default 60)', '60')
  .option('--undo', 'Restore files from the most recent backup')
  .action(async (target: string | undefined, options: {
    file?: string;
    all?: boolean;
    dryRun?: boolean;
    interactive?: boolean;
    force?: boolean;
    threshold?: string;
    undo?: boolean;
  }) => {
    const { migrate } = require('../migrate') as { migrate: (opts: MigrateOptions) => Promise<void> };

    if (options.undo) {
      return migrate({ undo: true });
    }

    const resolvedTarget = options.file || target;

    if (!resolvedTarget) {
      console.error('  ❌ Please specify a target file or directory.');
      console.error('');
      console.error('  Usage:');
      console.error('    tailui migrate -f <file>           Migrate a single file');
      console.error('    tailui migrate --all <directory>    Migrate all files in a directory');
      console.error('    tailui migrate --undo               Restore from backup');
      console.error('');
      console.error('  Examples:');
      console.error('    tailui migrate -f src/components/Button.tsx');
      console.error('    tailui migrate --all src/components');
      console.error('    tailui migrate --all src/components --dry-run');
      console.error('    tailui migrate --all src/components -i');
      console.error('');
      process.exit(1);
    }

    const threshold = parseInt(options.threshold ?? '60', 10);
    if (isNaN(threshold) || threshold < 0 || threshold > 100) {
      console.error('  ❌ Threshold must be a number between 0 and 100.');
      process.exit(1);
    }

    let aiConfig: AIConfig | null = null;
    const config = loadConfig();
    if (config?.ai?.apiKey) {
      aiConfig = config.ai;
    }

    await migrate({
      target: resolvedTarget,
      all: !!options.all,
      dryRun: !!options.dryRun,
      interactive: !!options.interactive,
      force: !!options.force,
      threshold,
      undo: false,
      ai: false,
      aiConfig,
    });
  });

// ─── AI HELPERS ─────────────────────────────────────────────────

function buildPrompt(component: string, stack: string, cssContent: string, config: TailUIConfig = {}): string {
  const componentName = capitalize(component);

  const cssContext = cssContent
    ? `\nHere are the existing TailUI CSS styles for this component:\n\`\`\`css\n${cssContent}\n\`\`\`\nUse the .ui-* classes defined above.`
    : `\nUse TailUI .ui-${component} classes (e.g. class="ui-${component} ui-primary").`;

  let tokensContext = '';
  const tokens = config.components?.[component];
  if (Array.isArray(tokens) && tokens.length > 0) {
    tokensContext = `\nAvailable variants/tokens for this component: ${tokens.map(t => `ui-${t}`).join(', ')}`;
    tokensContext += `\nExpose these as typed props (e.g. variant, size, state).`;
  }

  let slotsContext = '';
  const slots = config.slots;
  if (Array.isArray(slots) && slots.length > 0) {
    const usedSlots = cssContent
      ? slots.filter(s => cssContent.includes(`.ui-${s}`))
      : [];
    if (usedSlots.length > 0) {
      slotsContext = `\nThis component uses the following sub-element slots: ${usedSlots.map(s => `.ui-${s}`).join(', ')}`;
      slotsContext += `\nRender these as named children/sections in the component (e.g. header, body, footer slots).`;
    }
  }

  let varsContext = '';
  const vars = config.variables?.[component];
  if (Array.isArray(vars) && vars.length > 0) {
    varsContext = `\nThis component supports CSS custom properties: ${vars.join(', ')}`;
    varsContext += `\nExpose these as optional style props.`;
  }

  const stackInstructions: Record<string, string> = {
    react: `Create a React (TSX) functional component named ${componentName}. Use TypeScript with proper props interface. Export as default.`,
    nextjs: `Create a Next.js (TSX) component named ${componentName}. Add "use client" if needed. Use TypeScript with proper props interface. Export as default.`,
    vue: `Create a Vue 3 SFC (.vue) component named ${componentName}. Use <script setup lang="ts"> with defineProps.`,
    nuxt: `Create a Nuxt 3 SFC (.vue) component named ${componentName}. Use <script setup lang="ts"> with defineProps.`,
    svelte: `Create a Svelte component named ${componentName}. Use TypeScript with export let for props.`,
    sveltekit: `Create a SvelteKit component named ${componentName}. Use TypeScript with export let for props.`,
    angular: `Create an Angular standalone component named ${componentName}Component. Use TypeScript with @Input() decorators.`,
    astro: `Create an Astro component named ${componentName}. Use frontmatter for props.`,
    html: `Create a pure HTML snippet for the ${componentName} component with example usage.`,
  };

  const instruction = stackInstructions[stack] ?? stackInstructions.react;

  return `You are a senior frontend developer. Generate a production-ready UI component.

${instruction}
${cssContext}${tokensContext}${slotsContext}${varsContext}

Requirements:
- Use TailUI .ui-* CSS classes for styling (NOT inline Tailwind utility classes)
- Include all common props (variants, sizes, disabled, etc.)
- Include proper TypeScript types where applicable
- Make it accessible (aria attributes, keyboard navigation)
- Include JSDoc/comments for the component
- Output ONLY the component code, no explanations

Component: ${componentName}`;
}

function callAI(provider: AIProvider, apiKey: string, prompt: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const endpoint = AI_ENDPOINTS[provider];
    if (!endpoint) {
      return reject(new Error(`Unknown AI provider: ${provider}`));
    }

    let body: string;
    let headers: Record<string, string>;
    let requestUrl = endpoint.url;

    if (provider === 'claude') {
      body = JSON.stringify({
        model: endpoint.model,
        max_tokens: 4096,
        messages: [{ role: 'user', content: prompt }],
      });
      headers = {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      };
    } else if (provider === 'gemini') {
      body = JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
      });
      headers = { 'Content-Type': 'application/json' };
      requestUrl = `${endpoint.url}?key=${apiKey}`;
    } else {
      body = JSON.stringify({
        model: endpoint.model,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 4096,
        temperature: 0.3,
      });
      headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      };
    }

    const url = new URL(requestUrl);
    const reqOptions: https.RequestOptions = {
      hostname: url.hostname,
      path: url.pathname + url.search,
      method: 'POST',
      headers,
    };

    const req = https.request(reqOptions, (res) => {
      let data = '';
      res.on('data', (chunk: Buffer) => data += chunk);
      res.on('end', () => {
        if ((res.statusCode ?? 0) >= 400) {
          const hint = res.statusCode === 401 ? ' (invalid API key?)'
            : res.statusCode === 429 ? ' (rate limited — try again later)'
            : res.statusCode === 403 ? ' (forbidden — check API key permissions)'
            : '';
          return reject(new Error(`${provider} API returned HTTP ${res.statusCode}${hint}: ${data.substring(0, 200)}`));
        }

        try {
          const json = JSON.parse(data) as Record<string, unknown>;

          let content: string | undefined;
          if (provider === 'claude') {
            content = (json.content as Array<{ text: string }>)?.[0]?.text;
          } else if (provider === 'gemini') {
            content = (json as { candidates?: Array<{ content?: { parts?: Array<{ text: string }> } }> })
              .candidates?.[0]?.content?.parts?.[0]?.text;
          } else {
            content = (json as { choices?: Array<{ message?: { content: string } }> })
              .choices?.[0]?.message?.content;
          }

          if (!content) {
            return reject(new Error(`Empty response from ${provider}: ${data.substring(0, 200)}`));
          }

          const codeMatch = content.match(/```(?:\w+)?\n([\s\S]*?)```/);
          resolve(codeMatch ? codeMatch[1].trim() : content.trim());
        } catch (e) {
          reject(new Error(`Failed to parse ${provider} response: ${(e as Error).message}`));
        }
      });
    });

    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

// ─── HELPERS ───────────────────────────────────────────────────

function askQuestion(prompt: string, defaultValue: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(`${prompt} `, (answer: string) => {
      rl.close();
      resolve(answer.trim() || defaultValue);
    });
  });
}

function generateTemplate(component: string, variants: string[]): string {
  let css = `@layer components {\n`;
  css += `  /* Base */\n`;
  css += `  .ui-${component} {\n`;
  css += `    @apply ;\n`;
  css += `  }\n`;

  variants.forEach(variant => {
    css += `\n  /* ${capitalize(variant)} */\n`;
    css += `  .ui-${component}.ui-${variant} {\n`;
    css += `    @apply ;\n`;
    css += `  }\n`;
  });

  css += `}\n`;
  return css;
}

function updateConfig(component: string, tokens: string[]): void {
  const config = loadConfig() ?? {};
  if (!config.components) config.components = {};
  config.components[component] = tokens;
  saveConfig(config);
  console.log(`  - Updated: ${CONFIG_FILE}`);
}

function updateIndex(dir: string, component: string): void {
  const indexPath = path.join(dir, 'index.css');
  const importLine = `@import "./ui.${component}.css";`;

  if (fs.existsSync(indexPath)) {
    const content = fs.readFileSync(indexPath, 'utf8');
    if (!content.includes(importLine)) {
      fs.appendFileSync(indexPath, `${importLine}\n`);
      console.log(`  - Updated: ${indexPath}`);
    }
  }
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

program.parse();