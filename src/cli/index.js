#!/usr/bin/env node

const { program } = require('commander');
const fs = require('fs');
const path = require('path');
const readline = require('readline');
const https = require('https');
const { resolveConfig, CONFIG_FILE, DEFAULT_DIR } = require('../config');

const pkg = require('../../package.json');

// Catch unhandled promise rejections (async commands)
process.on('unhandledRejection', (err) => {
  console.error(`  ❌ Unexpected error: ${err.message || err}`);
  process.exit(1);
});

// ─── Constants ──────────────────────────────────────────────────

const STACKS = ['react', 'nextjs', 'vue', 'nuxt', 'svelte', 'sveltekit', 'angular', 'astro', 'html'];
const AI_PROVIDERS = ['openai', 'claude', 'gemini', 'mistral'];
const COMPONENT_NAME_RE = /^[a-z][a-z0-9-]*$/;
const TOKEN_NAME_RE = /^[a-z][a-z0-9-]*$/;

const AI_ENDPOINTS = {
  openai:  { url: 'https://api.openai.com/v1/chat/completions', model: 'gpt-4o' },
  claude:  { url: 'https://api.anthropic.com/v1/messages', model: 'claude-sonnet-4-20250514' },
  gemini:  { url: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent', model: 'gemini-pro' },
  mistral: { url: 'https://api.mistral.ai/v1/chat/completions', model: 'mistral-large-latest' },
};

const STACK_EXTENSIONS = {
  react: 'tsx', nextjs: 'tsx', vue: 'vue', nuxt: 'vue',
  svelte: 'svelte', sveltekit: 'svelte', angular: 'ts',
  astro: 'astro', html: 'html',
};

program
  .name('tailui')
  .description('TailUI — Semantic CSS layer on top of TailwindCSS')
  .version(pkg.version);

// ─── Helper: get styles dir from config ─────────────────────────

function getStylesDir(optionDir) {
  if (optionDir) return optionDir;
  const { stylesDir } = resolveConfig();
  return stylesDir;
}

function loadConfig() {
  const configPath = path.join(process.cwd(), CONFIG_FILE);
  if (!fs.existsSync(configPath)) return null;
  try {
    return JSON.parse(fs.readFileSync(configPath, 'utf8'));
  } catch (e) {
    console.error(`  ❌ Failed to parse ${CONFIG_FILE}: ${e.message}`);
    console.error(`  Fix the JSON syntax or delete the file and run: npx tailui init`);
    process.exit(1);
  }
}

function saveConfig(config) {
  const configPath = path.join(process.cwd(), CONFIG_FILE);
  try {
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2) + '\n');
  } catch (e) {
    console.error(`  ❌ Failed to write ${CONFIG_FILE}: ${e.message}`);
    process.exit(1);
  }
}

// ─── CREATE ────────────────────────────────────────────────────
program
  .command('create <component>')
  .description('Create a new UI component style file')
  .option('-d, --dir <path>', 'Override styles directory')
  .option('-v, --variants <variants>', 'Comma-separated list of variants', '')
  .action((component, options) => {
    if (!COMPONENT_NAME_RE.test(component)) {
      console.error(`  ❌ Invalid component name "${component}". Use lowercase letters, numbers, and hyphens (e.g. "my-button").`);
      process.exit(1);
    }

    const dir = getStylesDir(options.dir);
    const filePath = path.join(dir, `ui.${component}.css`);

    // Ensure directory exists
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`  📁 Created directory: ${dir}`);
    }

    // Check if file already exists
    if (fs.existsSync(filePath)) {
      console.log(`  ⚠️  Component "${component}" already exists at ${filePath}`);
      process.exit(0);
    }

    // Parse and validate variants
    const variants = options.variants
      ? options.variants.split(',').map(v => v.trim()).filter(Boolean)
      : ['default'];

    const invalidVariant = variants.find(v => !TOKEN_NAME_RE.test(v));
    if (invalidVariant) {
      console.error(`  ❌ Invalid variant name "${invalidVariant}". Use lowercase letters, numbers, and hyphens.`);
      process.exit(1);
    }

    // Generate template
    const template = generateTemplate(component, variants);
    fs.writeFileSync(filePath, template);
    console.log(`  ✅ Created: ${filePath}`);

    // Update config
    updateConfig(component, variants);

    // Update index.css
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
  .command('add <component> <token>')
  .description('Add a new token (variant/slot/modifier) to a component')
  .option('-d, --dir <path>', 'Override styles directory')
  .option('-t, --type <type>', 'Token type: variant, slot, modifier', 'variant')
  .action((component, token, options) => {
    if (!COMPONENT_NAME_RE.test(component)) {
      console.error(`  ❌ Invalid component name "${component}". Use lowercase letters, numbers, and hyphens.`);
      process.exit(1);
    }
    if (!TOKEN_NAME_RE.test(token)) {
      console.error(`  ❌ Invalid token name "${token}". Use lowercase letters, numbers, and hyphens.`);
      process.exit(1);
    }

    const dir = getStylesDir(options.dir);
    const filePath = path.join(dir, `ui.${component}.css`);

    if (!fs.existsSync(filePath)) {
      console.log(`  ❌ Component "${component}" not found. Run: tailui create ${component}`);
      process.exit(1);
    }

    const VALID_TOKEN_TYPES = ['variant', 'slot', 'modifier'];
    const type = options.type;
    if (!VALID_TOKEN_TYPES.includes(type)) {
      console.error(`  ❌ Invalid token type "${type}". Must be one of: ${VALID_TOKEN_TYPES.join(', ')}`);
      process.exit(1);
    }

    let snippet = '';

    switch (type) {
      case 'slot':
        snippet = `\n  .ui-${token} {\n    @apply ;\n  }\n`;
        break;
      case 'modifier':
        snippet = `\n  .ui-${token} {\n    @apply ;\n  }\n`;
        break;
      case 'variant':
      default:
        snippet = `\n  .ui-${component}.ui-${token} {\n    @apply ;\n  }\n`;
        break;
    }

    // Insert before the last closing brace
    let content = fs.readFileSync(filePath, 'utf8');
    const lastBrace = content.lastIndexOf('}');
    if (lastBrace !== -1) {
      content = content.substring(0, lastBrace) + snippet + content.substring(lastBrace);
    }

    fs.writeFileSync(filePath, content);
    console.log(`  ✅ Added ${type} "${token}" to ${component}`);

    // Update config
    addTokenToConfig(component, token);
  });

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
    console.log(`  Directory: ${config.stylesDir || 'unknown'}`);
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
  .action(async (options) => {
    const configPath = path.join(process.cwd(), CONFIG_FILE);

    // Check if already initialized
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
    let stack;
    if (options.stack && STACKS.includes(options.stack)) {
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
    let dirName;
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

    // Security: ensure stylesDir stays within the project
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

    // Security: ensure componentsDir stays within the project
    const resolvedComponentsDir = path.resolve(process.cwd(), componentsDir);
    if (!resolvedComponentsDir.startsWith(process.cwd())) {
      console.error(`  ❌ Components directory must be within the project.`);
      process.exit(1);
    }
    console.log(`  → Components: ${componentsDir}\n`);

    // ── Step 4: AI configuration (optional) ──
    const configureAI = await askQuestion(
      '  Configure AI for component generation? (y/N)',
      'n'
    );

    let ai = null;
    if (configureAI.toLowerCase() === 'y') {
      console.log('\n  Choose your AI provider:\n');
      AI_PROVIDERS.forEach((p, i) => console.log(`    ${i + 1}. ${p}`));
      console.log('');

      const providerChoice = await askQuestion('  Enter number (1)', '1');
      const pIdx = parseInt(providerChoice, 10);
      const provider = (pIdx >= 1 && pIdx <= AI_PROVIDERS.length)
        ? AI_PROVIDERS[pIdx - 1]
        : AI_PROVIDERS[0];

      const apiKey = await askQuestion(`  Enter your ${provider} API key:`, '');

      if (apiKey) {
        ai = { provider, apiKey };
        console.log(`  → AI: ${provider} ✅\n`);
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
      console.log(`  📁 Created: ${stylesDir}`);
    }

    if (!fs.existsSync(componentsDir)) {
      fs.mkdirSync(componentsDir, { recursive: true });
      console.log(`  📁 Created: ${componentsDir}`);
    }

    // Create index.css
    const indexPath = path.join(stylesDir, 'index.css');
    if (!fs.existsSync(indexPath)) {
      fs.writeFileSync(indexPath, `/* TailUI — Component Styles Entry Point */\n`);
      console.log(`  📄 Created: ${indexPath}`);
    }

    // ── Create config ──
    const config = {
      version: '1.0.0',
      stack,
      directory: dirName,
      stylesDir,
      componentsDir,
      ai: ai || undefined,
      components: {},
      variables: {},
    };
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    console.log(`  📄 Created: ${CONFIG_FILE}`);

    // Protect API key: add ui.config.json to .gitignore if AI is configured
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

    console.log('\n  ✅ TailUI initialized!\n');
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
  .action(async (component, options) => {
    if (!COMPONENT_NAME_RE.test(component)) {
      console.error(`  ❌ Invalid component name "${component}". Use lowercase letters, numbers, and hyphens.`);
      process.exit(1);
    }

    const config = loadConfig();

    if (!config) {
      console.log('  ❌ No ui.config.json found. Run: npx tailui init');
      process.exit(1);
    }

    if (!config.ai || !config.ai.apiKey) {
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
    const ext = STACK_EXTENSIONS[stack] || 'tsx';

    // Read the CSS file if it exists
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

      // Ensure output directory exists
      if (!fs.existsSync(componentsDir)) {
        fs.mkdirSync(componentsDir, { recursive: true });
      }

      const fileName = `${capitalize(component)}.${ext}`;
      const filePath = path.join(componentsDir, fileName);

      // Check if file already exists
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
      console.log(`  ✅ Generated: ${filePath}`);
      console.log(`\n  The component uses TailUI .ui-* classes from your styles.`);
      console.log(`  Import it in your project and start using it!\n`);
    } catch (err) {
      console.error(`  ❌ AI generation failed: ${err.message}`);
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
  .action((options) => {
    const config = loadConfig();

    if (!config) {
      console.log('  ❌ No ui.config.json found. Run: npx tailui init');
      process.exit(1);
    }

    let changed = false;

    if (options.setStack) {
      if (!STACKS.includes(options.setStack)) {
        console.error(`  ❌ Invalid stack "${options.setStack}". Must be one of: ${STACKS.join(', ')}`);
        process.exit(1);
      }
      config.stack = options.setStack;
      changed = true;
      console.log(`  ✅ Stack set to: ${options.setStack}`);
    }

    if (options.setAi) {
      if (!AI_PROVIDERS.includes(options.setAi)) {
        console.error(`  ❌ Invalid AI provider "${options.setAi}". Must be one of: ${AI_PROVIDERS.join(', ')}`);
        process.exit(1);
      }
      if (!config.ai) config.ai = {};
      config.ai.provider = options.setAi;
      changed = true;
      console.log(`  ✅ AI provider set to: ${options.setAi}`);
    }

    if (options.setKey) {
      if (!config.ai) config.ai = {};
      config.ai.apiKey = options.setKey;
      changed = true;
      console.log(`  ✅ AI API key updated`);

      // Protect API key in .gitignore
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
      console.log(`  📝 Saved: ${CONFIG_FILE}\n`);
    } else {
      // Display current config
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

// ─── AI HELPERS ─────────────────────────────────────────────────

function buildPrompt(component, stack, cssContent, config = {}) {
  const componentName = capitalize(component);
  let cssContext = '';
  if (cssContent) {
    cssContext = `\nHere are the existing TailUI CSS styles for this component:\n\`\`\`css\n${cssContent}\n\`\`\`\nUse the .ui-* classes defined above.`;
  } else {
    cssContext = `\nUse TailUI .ui-${component} classes (e.g. class="ui-${component} ui-primary").`;
  }

  // Enrich with tokens (variants) from config
  let tokensContext = '';
  const tokens = config.components?.[component];
  if (Array.isArray(tokens) && tokens.length > 0) {
    tokensContext = `\nAvailable variants/tokens for this component: ${tokens.map(t => `ui-${t}`).join(', ')}`;
    tokensContext += `\nExpose these as typed props (e.g. variant, size, state).`;
  }

  // Enrich with slots from config
  let slotsContext = '';
  const slots = config.slots;
  if (Array.isArray(slots) && slots.length > 0) {
    // Extract slots actually used in the CSS
    const usedSlots = cssContent
      ? slots.filter(s => cssContent.includes(`.ui-${s}`))
      : [];
    if (usedSlots.length > 0) {
      slotsContext = `\nThis component uses the following sub-element slots: ${usedSlots.map(s => `.ui-${s}`).join(', ')}`;
      slotsContext += `\nRender these as named children/sections in the component (e.g. header, body, footer slots).`;
    }
  }

  // Enrich with CSS variables from config
  let varsContext = '';
  const vars = config.variables?.[component];
  if (Array.isArray(vars) && vars.length > 0) {
    varsContext = `\nThis component supports CSS custom properties: ${vars.join(', ')}`;
    varsContext += `\nExpose these as optional style props.`;
  }

  const stackInstructions = {
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

  const instruction = stackInstructions[stack] || stackInstructions.react;

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

function callAI(provider, apiKey, prompt) {
  return new Promise((resolve, reject) => {
    const endpoint = AI_ENDPOINTS[provider];
    if (!endpoint) {
      return reject(new Error(`Unknown AI provider: ${provider}`));
    }

    let body, headers, requestUrl = endpoint.url;

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
      // Gemini uses query param for key — use local var to avoid mutating the constant
      requestUrl = `${endpoint.url}?key=${apiKey}`;
    } else {
      // OpenAI / Mistral compatible
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
    const options = {
      hostname: url.hostname,
      path: url.pathname + url.search,
      method: 'POST',
      headers,
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        // Check HTTP status before parsing
        if (res.statusCode >= 400) {
          const hint = res.statusCode === 401 ? ' (invalid API key?)'
            : res.statusCode === 429 ? ' (rate limited — try again later)'
            : res.statusCode === 403 ? ' (forbidden — check API key permissions)'
            : '';
          return reject(new Error(`${provider} API returned HTTP ${res.statusCode}${hint}: ${data.substring(0, 200)}`));
        }

        try {
          const json = JSON.parse(data);

          let content;
          if (provider === 'claude') {
            content = json.content?.[0]?.text;
          } else if (provider === 'gemini') {
            content = json.candidates?.[0]?.content?.parts?.[0]?.text;
          } else {
            content = json.choices?.[0]?.message?.content;
          }

          if (!content) {
            return reject(new Error(`Empty response from ${provider}: ${data.substring(0, 200)}`));
          }

          // Extract code from markdown code blocks if present
          const codeMatch = content.match(/```(?:\w+)?\n([\s\S]*?)```/);
          resolve(codeMatch ? codeMatch[1].trim() : content.trim());
        } catch (e) {
          reject(new Error(`Failed to parse ${provider} response: ${e.message}`));
        }
      });
    });

    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

// ─── HELPERS ───────────────────────────────────────────────────

function askQuestion(prompt, defaultValue) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(`${prompt} `, (answer) => {
      rl.close();
      resolve(answer.trim() || defaultValue);
    });
  });
}

function generateTemplate(component, variants) {
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

function updateConfig(component, tokens) {
  let config = loadConfig() || {};

  if (!config.components) config.components = {};
  config.components[component] = tokens;

  saveConfig(config);
  console.log(`  📝 Updated: ${CONFIG_FILE}`);
}

function addTokenToConfig(component, token) {
  const config = loadConfig();
  if (!config) return;

  if (!config.components) config.components = {};
  if (!config.components[component]) config.components[component] = [];

  if (!config.components[component].includes(token)) {
    config.components[component].push(token);
    saveConfig(config);
    console.log(`  📝 Updated: ${CONFIG_FILE}`);
  }
}

function updateIndex(dir, component) {
  const indexPath = path.join(dir, 'index.css');
  const importLine = `@import "./ui.${component}.css";`;

  if (fs.existsSync(indexPath)) {
    const content = fs.readFileSync(indexPath, 'utf8');
    if (!content.includes(importLine)) {
      fs.appendFileSync(indexPath, `${importLine}\n`);
      console.log(`  📝 Updated: ${indexPath}`);
    }
  }
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

program.parse();
