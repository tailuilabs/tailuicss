#!/usr/bin/env node

// node_modules/tsup/assets/esm_shims.js
import path from "path";
import { fileURLToPath } from "url";
var getFilename = () => fileURLToPath(import.meta.url);
var getDirname = () => path.dirname(getFilename());
var __dirname = /* @__PURE__ */ getDirname();

// src/cli/index.ts
import { program } from "commander";
import fs2 from "fs";
import path3 from "path";
import readline from "readline";
import https from "https";

// src/config.ts
import fs from "fs";
import path2 from "path";
var CONFIG_FILE = "ui.config.json";
var DEFAULT_DIR = "ui";
function resolveConfig(options = {}) {
  const configPath = path2.join(process.cwd(), CONFIG_FILE);
  let config = null;
  if (fs.existsSync(configPath)) {
    try {
      config = JSON.parse(fs.readFileSync(configPath, "utf8"));
    } catch (e) {
      console.warn(`[TailUI] \u26A0\uFE0F  Failed to parse ${CONFIG_FILE}: ${e.message}`);
    }
  }
  let stylesDir;
  if (options.path) {
    stylesDir = options.path;
  } else if (config?.stylesDir) {
    stylesDir = config.stylesDir;
  } else {
    stylesDir = `./${DEFAULT_DIR}/styles`;
  }
  const resolved = path2.resolve(process.cwd(), stylesDir);
  if (!resolved.startsWith(process.cwd())) {
    console.warn(`[TailUI] \u26A0\uFE0F  stylesDir "${stylesDir}" resolves outside the project. Using default.`);
    stylesDir = `./${DEFAULT_DIR}/styles`;
  }
  return { stylesDir, configPath, config };
}

// src/cli/index.ts
import { createRequire } from "module";
var require2 = createRequire(import.meta.url);
var pkg = require2("../../package.json");
process.on("unhandledRejection", (err) => {
  const message = err instanceof Error ? err.message : String(err);
  console.error(`  \u274C Unexpected error: ${message}`);
  process.exit(1);
});
var STACKS = ["react", "nextjs", "vue", "nuxt", "svelte", "sveltekit", "angular", "astro", "html"];
var AI_PROVIDERS = ["openai", "claude", "gemini", "mistral"];
var COMPONENT_NAME_RE = /^[a-z][a-z0-9-]*$/;
var TOKEN_NAME_RE = /^[a-z][a-z0-9-]*$/;
var AI_ENDPOINTS = {
  openai: { url: "https://api.openai.com/v1/chat/completions", model: "gpt-4o" },
  claude: { url: "https://api.anthropic.com/v1/messages", model: "claude-sonnet-4-20250514" },
  gemini: { url: "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent", model: "gemini-pro" },
  mistral: { url: "https://api.mistral.ai/v1/chat/completions", model: "mistral-large-latest" }
};
var STACK_EXTENSIONS = {
  react: "tsx",
  nextjs: "tsx",
  vue: "vue",
  nuxt: "vue",
  svelte: "svelte",
  sveltekit: "svelte",
  angular: "ts",
  astro: "astro",
  html: "html"
};
program.name("tailui").description("TailUI \u2014 Semantic CSS layer on top of TailwindCSS").version(pkg.version);
function getStylesDir(optionDir) {
  if (optionDir) return optionDir;
  const { stylesDir } = resolveConfig();
  return stylesDir;
}
function loadConfig() {
  const configPath = path3.join(process.cwd(), CONFIG_FILE);
  if (!fs2.existsSync(configPath)) return null;
  try {
    return JSON.parse(fs2.readFileSync(configPath, "utf8"));
  } catch (e) {
    console.error(`  \u274C Failed to parse ${CONFIG_FILE}: ${e.message}`);
    console.error(`  Fix the JSON syntax or delete the file and run: npx tailui init`);
    process.exit(1);
  }
}
function saveConfig(config) {
  const configPath = path3.join(process.cwd(), CONFIG_FILE);
  try {
    fs2.writeFileSync(configPath, JSON.stringify(config, null, 2) + "\n");
  } catch (e) {
    console.error(`  \u274C Failed to write ${CONFIG_FILE}: ${e.message}`);
    process.exit(1);
  }
}
program.command("create <component>").description("Create a new UI component style file").option("-d, --dir <path>", "Override styles directory").option("-v, --variants <variants>", "Comma-separated list of variants", "").action((component, options) => {
  if (!COMPONENT_NAME_RE.test(component)) {
    console.error(`  \u274C Invalid component name "${component}". Use lowercase letters, numbers, and hyphens (e.g. "my-button").`);
    process.exit(1);
  }
  const dir = getStylesDir(options.dir);
  const filePath = path3.join(dir, `ui.${component}.css`);
  if (!fs2.existsSync(dir)) {
    fs2.mkdirSync(dir, { recursive: true });
    console.log(`  \u{1F4C1} Created directory: ${dir}`);
  }
  if (fs2.existsSync(filePath)) {
    console.log(`  \u26A0\uFE0F  Component "${component}" already exists at ${filePath}`);
    process.exit(0);
  }
  const variants = options.variants ? options.variants.split(",").map((v) => v.trim()).filter(Boolean) : ["default"];
  const invalidVariant = variants.find((v) => !TOKEN_NAME_RE.test(v));
  if (invalidVariant) {
    console.error(`  \u274C Invalid variant name "${invalidVariant}". Use lowercase letters, numbers, and hyphens.`);
    process.exit(1);
  }
  const template = generateTemplate(component, variants);
  fs2.writeFileSync(filePath, template);
  console.log(`  \u2705 Created: ${filePath}`);
  updateConfig(component, variants);
  updateIndex(dir, component);
  console.log(`
  Usage:`);
  console.log(`    <div class="ui-${component}">`);
  variants.forEach((v) => {
    console.log(`    <div class="ui-${component} ui-${v}">`);
  });
  console.log("");
});
program.command("add <component>").description("Add a TailUI component to your project (CSS + framework component)").option("--css-only", "Only copy the CSS file, skip framework component generation").option("--overwrite", "Overwrite existing files").action(async (component, options) => {
  if (!COMPONENT_NAME_RE.test(component)) {
    console.error(`  \u274C Invalid component name "${component}". Use lowercase letters, numbers, and hyphens.`);
    process.exit(1);
  }
  const config = loadConfig();
  if (!config) {
    console.log("  \u274C No ui.config.json found. Run: npx tailui init");
    process.exit(1);
  }
  const { getTemplate, getAvailableComponents } = require2("../templates");
  const availableComponents = getAvailableComponents();
  if (!availableComponents.includes(component)) {
    console.error(`  \u274C Component "${component}" not found in TailUI library.`);
    console.error(`  Available components: ${availableComponents.join(", ")}`);
    process.exit(1);
  }
  const stylesDir = config.stylesDir || "./ui/styles";
  const componentsDir = config.componentsDir || "./src/components/ui";
  const stack = config.stack || "react";
  const isTypeScript = fs2.existsSync(path3.join(process.cwd(), "tsconfig.json"));
  console.log(`
  \u{1F4E6} Adding ${component} component...
`);
  const cssSourcePath = path3.join(__dirname, "../../ui/styles", `ui.${component}.css`);
  const cssDestPath = path3.join(stylesDir, `ui.${component}.css`);
  if (!fs2.existsSync(cssSourcePath)) {
    console.error(`  \u274C CSS file not found: ${cssSourcePath}`);
    process.exit(1);
  }
  if (!fs2.existsSync(stylesDir)) {
    fs2.mkdirSync(stylesDir, { recursive: true });
    console.log(`  \u{1F4C1} Created: ${stylesDir}`);
  }
  if (fs2.existsSync(cssDestPath) && !options.overwrite) {
    console.log(`  \u26A0\uFE0F  ${cssDestPath} already exists. Use --overwrite to replace.`);
  } else {
    fs2.copyFileSync(cssSourcePath, cssDestPath);
    console.log(`  \u2705 Copied: ${cssDestPath}`);
    updateIndex(stylesDir, component);
  }
  if (!options.cssOnly) {
    if (!fs2.existsSync(componentsDir)) {
      fs2.mkdirSync(componentsDir, { recursive: true });
      console.log(`  \u{1F4C1} Created: ${componentsDir}`);
    }
    const ext = getExtension(stack, isTypeScript);
    const componentName = capitalize(component);
    if (stack === "angular") {
      const template = getTemplate(component, stack, isTypeScript);
      if (template && "ts" in template && "html" in template) {
        const tsPath = path3.join(componentsDir, `${component}.component.ts`);
        const htmlPath = path3.join(componentsDir, `${component}.component.html`);
        if (fs2.existsSync(tsPath) && !options.overwrite) {
          console.log(`  \u26A0\uFE0F  ${tsPath} already exists. Use --overwrite to replace.`);
        } else {
          fs2.writeFileSync(tsPath, template.ts());
          console.log(`  \u2705 Generated: ${tsPath}`);
        }
        if (fs2.existsSync(htmlPath) && !options.overwrite) {
          console.log(`  \u26A0\uFE0F  ${htmlPath} already exists. Use --overwrite to replace.`);
        } else {
          fs2.writeFileSync(htmlPath, template.html());
          console.log(`  \u2705 Generated: ${htmlPath}`);
        }
      } else {
        console.log(`  \u2139\uFE0F  No Angular template for ${component}. CSS only.`);
      }
    } else {
      const template = getTemplate(component, stack, isTypeScript);
      if (template) {
        const fileName = `${componentName}.${ext}`;
        const filePath = path3.join(componentsDir, fileName);
        if (fs2.existsSync(filePath) && !options.overwrite) {
          console.log(`  \u26A0\uFE0F  ${filePath} already exists. Use --overwrite to replace.`);
        } else {
          fs2.writeFileSync(filePath, template);
          console.log(`  \u2705 Generated: ${filePath}`);
        }
      } else {
        console.log(`  \u2139\uFE0F  No ${stack} template for ${component}. CSS only.`);
      }
    }
  }
  console.log(`
  \u{1F389} Done! Use the component:
`);
  if (stack === "react" || stack === "nextjs") {
    console.log(`  import { ${capitalize(component)} } from "${componentsDir.replace("./", "@/")}/${capitalize(component)}";`);
  } else if (stack === "vue" || stack === "nuxt") {
    console.log(`  <${capitalize(component)} />`);
  } else if (stack === "svelte" || stack === "sveltekit") {
    console.log(`  import ${capitalize(component)} from "${componentsDir}/${capitalize(component)}.svelte";`);
  } else if (stack === "angular") {
    console.log(`  <ui-${component}></ui-${component}>`);
  } else {
    console.log(`  <div class="ui-${component}">...</div>`);
  }
  console.log("");
});
function getExtension(stack, isTypeScript) {
  const extensions = {
    react: isTypeScript ? "tsx" : "jsx",
    nextjs: isTypeScript ? "tsx" : "jsx",
    vue: "vue",
    nuxt: "vue",
    svelte: "svelte",
    sveltekit: "svelte",
    angular: "ts",
    astro: "astro",
    html: "html"
  };
  return extensions[stack] ?? (isTypeScript ? "tsx" : "jsx");
}
program.command("list").description("List all UI components and their tokens").action(() => {
  const config = loadConfig();
  if (!config) {
    console.log("  \u274C No ui.config.json found. Run: npx tailui init");
    process.exit(1);
  }
  const components = config.components || {};
  console.log("\n  \u{1F4E6} TailUI Components\n");
  console.log(`  Stack: ${config.stack || "not set"}`);
  console.log(`  Directory: ${config.directory || "not set"}`);
  console.log(`  Components dir: ${config.componentsDir || "not set"}`);
  console.log(`  AI: ${config.ai?.provider || "not configured"}
`);
  if (Object.keys(components).length === 0) {
    console.log("  No components found.\n");
    return;
  }
  for (const [name, tokens] of Object.entries(components)) {
    console.log(`  ${name}`);
    if (Array.isArray(tokens)) {
      tokens.forEach((t) => console.log(`    \u251C\u2500 ${t}`));
    }
    console.log("");
  }
});
program.command("init").description("Initialize TailUI in the current project").option("-d, --dir <name>", "Directory name (skip prompt)").option("-s, --stack <stack>", "Framework stack (skip prompt)").action(async (options) => {
  const configPath = path3.join(process.cwd(), CONFIG_FILE);
  if (fs2.existsSync(configPath)) {
    const existing = loadConfig();
    if (existing) {
      console.log(`
  \u26A0\uFE0F  TailUI is already initialized.`);
      console.log(`  Directory: ${existing.stylesDir}`);
      console.log(`  Stack: ${existing.stack || "not set"}`);
      console.log(`  Config: ${CONFIG_FILE}
`);
      return;
    }
  }
  console.log("\n  \u{1F3A8} TailUI Setup\n");
  let stack;
  if (options.stack && STACKS.includes(options.stack)) {
    stack = options.stack;
  } else {
    console.log("  What is your project stack?\n");
    STACKS.forEach((s, i) => console.log(`    ${i + 1}. ${s}`));
    console.log(`    0. other
`);
    const stackChoice = await askQuestion("  Enter number (1)", "1");
    const idx = parseInt(stackChoice, 10);
    if (idx === 0) {
      stack = await askQuestion("  Enter your stack name:", "html");
    } else if (idx >= 1 && idx <= STACKS.length) {
      stack = STACKS[idx - 1];
    } else {
      stack = STACKS[0];
    }
  }
  console.log(`  \u2192 Stack: ${stack}
`);
  let dirName;
  if (options.dir) {
    dirName = options.dir;
  } else {
    dirName = await askQuestion(
      `  Where should TailUI store styles? (${DEFAULT_DIR})`,
      DEFAULT_DIR
    );
  }
  dirName = dirName.replace(/[^a-zA-Z0-9_\-./]/g, "").trim() || DEFAULT_DIR;
  const stylesDir = `./${dirName}/styles`;
  const resolvedStylesDir = path3.resolve(process.cwd(), stylesDir);
  if (!resolvedStylesDir.startsWith(process.cwd())) {
    console.error(`  \u274C Styles directory must be within the project.`);
    process.exit(1);
  }
  console.log(`  \u2192 Styles: ${stylesDir}
`);
  const defaultComponentsDir = `./src/components/ui`;
  let componentsDir = await askQuestion(
    `  Where should generated components be placed? (${defaultComponentsDir})`,
    defaultComponentsDir
  );
  componentsDir = componentsDir.replace(/[^a-zA-Z0-9_\-./]/g, "").trim() || defaultComponentsDir;
  const resolvedComponentsDir = path3.resolve(process.cwd(), componentsDir);
  if (!resolvedComponentsDir.startsWith(process.cwd())) {
    console.error(`  \u274C Components directory must be within the project.`);
    process.exit(1);
  }
  console.log(`  \u2192 Components: ${componentsDir}
`);
  const configureAI = await askQuestion("  Configure AI for component generation? (y/N)", "n");
  let ai = null;
  if (configureAI.toLowerCase() === "y") {
    console.log("\n  Choose your AI provider:\n");
    AI_PROVIDERS.forEach((p, i) => console.log(`    ${i + 1}. ${p}`));
    console.log("");
    const providerChoice = await askQuestion("  Enter number (1)", "1");
    const pIdx = parseInt(providerChoice, 10);
    const provider = pIdx >= 1 && pIdx <= AI_PROVIDERS.length ? AI_PROVIDERS[pIdx - 1] : AI_PROVIDERS[0];
    const apiKey = await askQuestion(`  Enter your ${provider} API key:`, "");
    if (apiKey) {
      ai = { provider, apiKey };
      console.log(`  \u2192 AI: ${provider} \u2705
`);
    } else {
      console.log("  \u2192 AI: skipped (no key provided)\n");
    }
  }
  if (fs2.existsSync(dirName) && fs2.readdirSync(dirName).length > 0) {
    const overwrite = await askQuestion(
      `  \u26A0\uFE0F  Directory "${dirName}" already exists. Use it anyway? (y/N)`,
      "n"
    );
    if (overwrite.toLowerCase() !== "y") {
      console.log("  Aborted.\n");
      return;
    }
  }
  if (!fs2.existsSync(stylesDir)) {
    fs2.mkdirSync(stylesDir, { recursive: true });
    console.log(`  \u{1F4C1} Created: ${stylesDir}`);
  }
  if (!fs2.existsSync(componentsDir)) {
    fs2.mkdirSync(componentsDir, { recursive: true });
    console.log(`  \u{1F4C1} Created: ${componentsDir}`);
  }
  const indexPath = path3.join(stylesDir, "index.css");
  if (!fs2.existsSync(indexPath)) {
    fs2.writeFileSync(indexPath, `/* TailUI \u2014 Component Styles Entry Point */
`);
    console.log(`  \u{1F4C4} Created: ${indexPath}`);
  }
  const config = {
    version: "1.0.0",
    stack,
    directory: dirName,
    stylesDir,
    componentsDir,
    ...ai ? { ai } : {},
    components: {},
    variables: {}
  };
  fs2.writeFileSync(configPath, JSON.stringify(config, null, 2));
  console.log(`  \u{1F4C4} Created: ${CONFIG_FILE}`);
  if (ai) {
    const gitignorePath = path3.join(process.cwd(), ".gitignore");
    if (fs2.existsSync(gitignorePath)) {
      const gitignoreContent = fs2.readFileSync(gitignorePath, "utf8");
      if (!gitignoreContent.includes(CONFIG_FILE)) {
        fs2.appendFileSync(gitignorePath, `
# TailUI config (contains API key)
${CONFIG_FILE}
`);
        console.log(`  \u{1F512} Added ${CONFIG_FILE} to .gitignore (API key protection)`);
      }
    } else {
      fs2.writeFileSync(gitignorePath, `# TailUI config (contains API key)
${CONFIG_FILE}
`);
      console.log(`  \u{1F512} Created .gitignore with ${CONFIG_FILE} (API key protection)`);
    }
  }
  console.log("\n  \u2705 TailUI initialized!\n");
  console.log("  Next steps:\n");
  console.log("    1. Add to tailwind.config.js:");
  console.log(`       plugins: [require('@tailuicss/core')()]`);
  console.log("");
  console.log("    2. Add to postcss.config.js:");
  console.log(`       plugins: { '@tailuicss/core/postcss': {}, tailwindcss: {} }`);
  console.log("");
  console.log("    3. Your CSS file just needs:");
  console.log("       @tailwind base;");
  console.log("       @tailwind components;");
  console.log("       @tailwind utilities;");
  console.log("");
  if (ai) {
    console.log("    4. Generate a component with AI:");
    console.log("       npx tailui generate button");
  } else {
    console.log("    4. Create your first component:");
    console.log("       npx tailui create button --variants primary,secondary,danger");
  }
  console.log("");
});
program.command("generate <component>").description("Generate a framework component with AI using TailUI styles").option("-s, --stack <stack>", "Override stack from config").action(async (component, options) => {
  if (!COMPONENT_NAME_RE.test(component)) {
    console.error(`  \u274C Invalid component name "${component}". Use lowercase letters, numbers, and hyphens.`);
    process.exit(1);
  }
  const config = loadConfig();
  if (!config) {
    console.log("  \u274C No ui.config.json found. Run: npx tailui init");
    process.exit(1);
  }
  if (!config.ai?.apiKey) {
    console.log("  \u274C AI not configured. Run: npx tailui init");
    console.log("  Or add manually to ui.config.json:");
    console.log('    "ai": { "provider": "openai", "apiKey": "sk-..." }');
    process.exit(1);
  }
  const stack = options.stack || config.stack || "react";
  const provider = config.ai.provider;
  const apiKey = config.ai.apiKey;
  const componentsDir = config.componentsDir || "./src/components/ui";
  const stylesDir = config.stylesDir || "./ui/styles";
  const ext = STACK_EXTENSIONS[stack] || "tsx";
  const cssPath = path3.join(stylesDir, `ui.${component}.css`);
  let cssContent = "";
  if (fs2.existsSync(cssPath)) {
    cssContent = fs2.readFileSync(cssPath, "utf8");
  }
  console.log(`
  \u{1F916} Generating ${component} component for ${stack}...`);
  console.log(`  Provider: ${provider}
`);
  const prompt = buildPrompt(component, stack, cssContent, config);
  try {
    const code = await callAI(provider, apiKey, prompt);
    if (!fs2.existsSync(componentsDir)) {
      fs2.mkdirSync(componentsDir, { recursive: true });
    }
    const fileName = `${capitalize(component)}.${ext}`;
    const filePath = path3.join(componentsDir, fileName);
    if (fs2.existsSync(filePath)) {
      const overwrite = await askQuestion(
        `  \u26A0\uFE0F  ${fileName} already exists. Overwrite? (y/N)`,
        "n"
      );
      if (overwrite.toLowerCase() !== "y") {
        console.log("  Aborted.\n");
        return;
      }
    }
    fs2.writeFileSync(filePath, code);
    console.log(`  \u2705 Generated: ${filePath}`);
    console.log(`
  The component uses TailUI .ui-* classes from your styles.`);
    console.log(`  Import it in your project and start using it!
`);
  } catch (err) {
    console.error(`  \u274C AI generation failed: ${err.message}`);
    console.error("  Check your API key and network connection.\n");
    process.exit(1);
  }
});
program.command("config").description("View or update TailUI configuration").option("--set-ai <provider>", "Set AI provider (openai, claude, gemini, mistral)").option("--set-key <key>", "Set AI API key").option("--set-stack <stack>", "Set project stack").action((options) => {
  const config = loadConfig();
  if (!config) {
    console.log("  \u274C No ui.config.json found. Run: npx tailui init");
    process.exit(1);
  }
  let changed = false;
  if (options.setStack) {
    if (!STACKS.includes(options.setStack)) {
      console.error(`  \u274C Invalid stack "${options.setStack}". Must be one of: ${STACKS.join(", ")}`);
      process.exit(1);
    }
    config.stack = options.setStack;
    changed = true;
    console.log(`  \u2705 Stack set to: ${options.setStack}`);
  }
  if (options.setAi) {
    if (!AI_PROVIDERS.includes(options.setAi)) {
      console.error(`  \u274C Invalid AI provider "${options.setAi}". Must be one of: ${AI_PROVIDERS.join(", ")}`);
      process.exit(1);
    }
    if (!config.ai) config.ai = { provider: options.setAi, apiKey: "" };
    config.ai.provider = options.setAi;
    changed = true;
    console.log(`  \u2705 AI provider set to: ${options.setAi}`);
  }
  if (options.setKey) {
    if (!config.ai) config.ai = { provider: "openai", apiKey: "" };
    config.ai.apiKey = options.setKey;
    changed = true;
    console.log(`  \u2705 AI API key updated`);
    const gitignorePath = path3.join(process.cwd(), ".gitignore");
    if (fs2.existsSync(gitignorePath)) {
      const gitignoreContent = fs2.readFileSync(gitignorePath, "utf8");
      if (!gitignoreContent.includes(CONFIG_FILE)) {
        fs2.appendFileSync(gitignorePath, `
# TailUI config (contains API key)
${CONFIG_FILE}
`);
        console.log(`  \u{1F512} Added ${CONFIG_FILE} to .gitignore (API key protection)`);
      }
    }
  }
  if (changed) {
    saveConfig(config);
    console.log(`  \u{1F4DD} Saved: ${CONFIG_FILE}
`);
  } else {
    console.log("\n  \u2699\uFE0F  TailUI Configuration\n");
    console.log(`  Stack:          ${config.stack || "not set"}`);
    console.log(`  Directory:      ${config.directory || "not set"}`);
    console.log(`  Styles dir:     ${config.stylesDir || "not set"}`);
    console.log(`  Components dir: ${config.componentsDir || "not set"}`);
    console.log(`  AI provider:    ${config.ai?.provider || "not configured"}`);
    console.log(`  AI key:         ${config.ai?.apiKey ? "\u2022\u2022\u2022\u2022" + config.ai.apiKey.slice(-4) : "not set"}`);
    console.log("");
  }
});
program.command("migrate [target]").description("Migrate Tailwind utility classes to TailUI .ui-* semantic classes").option("-f, --file <path>", "Migrate a single file").option("--all", "Migrate all supported files in the target directory").option("--dry-run", "Preview changes without modifying files").option("-i, --interactive", "Confirm each migration interactively").option("--force", "Apply all migrations without confirmation").option("--threshold <number>", "Minimum confidence score (0\u2013100, default 60)", "60").option("--undo", "Restore files from the most recent backup").action(async (target, options) => {
  const { migrate } = require2("../migrate");
  if (options.undo) {
    return migrate({ undo: true });
  }
  const resolvedTarget = options.file || target;
  if (!resolvedTarget) {
    console.error("  \u274C Please specify a target file or directory.");
    console.error("");
    console.error("  Usage:");
    console.error("    tailui migrate -f <file>           Migrate a single file");
    console.error("    tailui migrate --all <directory>    Migrate all files in a directory");
    console.error("    tailui migrate --undo               Restore from backup");
    console.error("");
    console.error("  Examples:");
    console.error("    tailui migrate -f src/components/Button.tsx");
    console.error("    tailui migrate --all src/components");
    console.error("    tailui migrate --all src/components --dry-run");
    console.error("    tailui migrate --all src/components -i");
    console.error("");
    process.exit(1);
  }
  const threshold = parseInt(options.threshold ?? "60", 10);
  if (isNaN(threshold) || threshold < 0 || threshold > 100) {
    console.error("  \u274C Threshold must be a number between 0 and 100.");
    process.exit(1);
  }
  let aiConfig = null;
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
    aiConfig
  });
});
function buildPrompt(component, stack, cssContent, config = {}) {
  const componentName = capitalize(component);
  const cssContext = cssContent ? `
Here are the existing TailUI CSS styles for this component:
\`\`\`css
${cssContent}
\`\`\`
Use the .ui-* classes defined above.` : `
Use TailUI .ui-${component} classes (e.g. class="ui-${component} ui-primary").`;
  let tokensContext = "";
  const tokens = config.components?.[component];
  if (Array.isArray(tokens) && tokens.length > 0) {
    tokensContext = `
Available variants/tokens for this component: ${tokens.map((t) => `ui-${t}`).join(", ")}`;
    tokensContext += `
Expose these as typed props (e.g. variant, size, state).`;
  }
  let slotsContext = "";
  const slots = config.slots;
  if (Array.isArray(slots) && slots.length > 0) {
    const usedSlots = cssContent ? slots.filter((s) => cssContent.includes(`.ui-${s}`)) : [];
    if (usedSlots.length > 0) {
      slotsContext = `
This component uses the following sub-element slots: ${usedSlots.map((s) => `.ui-${s}`).join(", ")}`;
      slotsContext += `
Render these as named children/sections in the component (e.g. header, body, footer slots).`;
    }
  }
  let varsContext = "";
  const vars = config.variables?.[component];
  if (Array.isArray(vars) && vars.length > 0) {
    varsContext = `
This component supports CSS custom properties: ${vars.join(", ")}`;
    varsContext += `
Expose these as optional style props.`;
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
    html: `Create a pure HTML snippet for the ${componentName} component with example usage.`
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
function callAI(provider, apiKey, prompt) {
  return new Promise((resolve, reject) => {
    const endpoint = AI_ENDPOINTS[provider];
    if (!endpoint) {
      return reject(new Error(`Unknown AI provider: ${provider}`));
    }
    let body;
    let headers;
    let requestUrl = endpoint.url;
    if (provider === "claude") {
      body = JSON.stringify({
        model: endpoint.model,
        max_tokens: 4096,
        messages: [{ role: "user", content: prompt }]
      });
      headers = {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01"
      };
    } else if (provider === "gemini") {
      body = JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      });
      headers = { "Content-Type": "application/json" };
      requestUrl = `${endpoint.url}?key=${apiKey}`;
    } else {
      body = JSON.stringify({
        model: endpoint.model,
        messages: [{ role: "user", content: prompt }],
        max_tokens: 4096,
        temperature: 0.3
      });
      headers = {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      };
    }
    const url = new URL(requestUrl);
    const reqOptions = {
      hostname: url.hostname,
      path: url.pathname + url.search,
      method: "POST",
      headers
    };
    const req = https.request(reqOptions, (res) => {
      let data = "";
      res.on("data", (chunk) => data += chunk);
      res.on("end", () => {
        if ((res.statusCode ?? 0) >= 400) {
          const hint = res.statusCode === 401 ? " (invalid API key?)" : res.statusCode === 429 ? " (rate limited \u2014 try again later)" : res.statusCode === 403 ? " (forbidden \u2014 check API key permissions)" : "";
          return reject(new Error(`${provider} API returned HTTP ${res.statusCode}${hint}: ${data.substring(0, 200)}`));
        }
        try {
          const json = JSON.parse(data);
          let content;
          if (provider === "claude") {
            content = json.content?.[0]?.text;
          } else if (provider === "gemini") {
            content = json.candidates?.[0]?.content?.parts?.[0]?.text;
          } else {
            content = json.choices?.[0]?.message?.content;
          }
          if (!content) {
            return reject(new Error(`Empty response from ${provider}: ${data.substring(0, 200)}`));
          }
          const codeMatch = content.match(/```(?:\w+)?\n([\s\S]*?)```/);
          resolve(codeMatch ? codeMatch[1].trim() : content.trim());
        } catch (e) {
          reject(new Error(`Failed to parse ${provider} response: ${e.message}`));
        }
      });
    });
    req.on("error", reject);
    req.write(body);
    req.end();
  });
}
function askQuestion(prompt, defaultValue) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  return new Promise((resolve) => {
    rl.question(`${prompt} `, (answer) => {
      rl.close();
      resolve(answer.trim() || defaultValue);
    });
  });
}
function generateTemplate(component, variants) {
  let css = `@layer components {
`;
  css += `  /* Base */
`;
  css += `  .ui-${component} {
`;
  css += `    @apply ;
`;
  css += `  }
`;
  variants.forEach((variant) => {
    css += `
  /* ${capitalize(variant)} */
`;
    css += `  .ui-${component}.ui-${variant} {
`;
    css += `    @apply ;
`;
    css += `  }
`;
  });
  css += `}
`;
  return css;
}
function updateConfig(component, tokens) {
  const config = loadConfig() ?? {};
  if (!config.components) config.components = {};
  config.components[component] = tokens;
  saveConfig(config);
  console.log(`  \u{1F4DD} Updated: ${CONFIG_FILE}`);
}
function updateIndex(dir, component) {
  const indexPath = path3.join(dir, "index.css");
  const importLine = `@import "./ui.${component}.css";`;
  if (fs2.existsSync(indexPath)) {
    const content = fs2.readFileSync(indexPath, "utf8");
    if (!content.includes(importLine)) {
      fs2.appendFileSync(indexPath, `${importLine}
`);
      console.log(`  \u{1F4DD} Updated: ${indexPath}`);
    }
  }
}
function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
program.parse();
//# sourceMappingURL=index.js.map