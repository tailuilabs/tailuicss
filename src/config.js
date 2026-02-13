const fs = require('fs');
const path = require('path');

const CONFIG_FILE = 'ui.config.json';
const DEFAULT_DIR = 'ui';

/**
 * Resolve the TailUI styles directory.
 * 
 * Priority:
 *   1. Explicit `options.path` (from plugin config)
 *   2. `stylesDir` from ui.config.json
 *   3. Default: ./ui/styles
 * 
 * @param {object} options - Plugin or CLI options
 * @returns {{ stylesDir: string, configPath: string, config: object|null }}
 */
function resolveConfig(options = {}) {
  const configPath = path.join(process.cwd(), CONFIG_FILE);
  let config = null;

  if (fs.existsSync(configPath)) {
    try {
      config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    } catch (e) {
      console.warn(`[TailUI] ⚠️  Failed to parse ${CONFIG_FILE}: ${e.message}`);
    }
  }

  // Priority: explicit option > config file > default
  let stylesDir;
  if (options.path) {
    stylesDir = options.path;
  } else if (config && config.stylesDir) {
    stylesDir = config.stylesDir;
  } else {
    stylesDir = `./${DEFAULT_DIR}/styles`;
  }

  // Security: ensure stylesDir resolves within the project root
  const resolved = path.resolve(process.cwd(), stylesDir);
  if (!resolved.startsWith(process.cwd())) {
    console.warn(`[TailUI] ⚠️  stylesDir "${stylesDir}" resolves outside the project. Using default.`);
    stylesDir = `./${DEFAULT_DIR}/styles`;
  }

  return {
    stylesDir,
    configPath,
    config,
  };
}

module.exports = { resolveConfig, CONFIG_FILE, DEFAULT_DIR };
