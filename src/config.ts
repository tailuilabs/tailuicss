import fs from 'fs';
import path from 'path';

export const CONFIG_FILE = 'ui.config.json';
export const DEFAULT_DIR = 'ui';

export interface PluginOptions {
  path?: string;
  [key: string]: unknown;
}

export interface TailUIConfig {
  stylesDir?: string;
  [key: string]: unknown;
}

export interface ResolvedConfig {
  stylesDir: string;
  configPath: string;
  config: TailUIConfig | null;
}

/**
 * Resolve the TailUI styles directory.
 *
 * Priority:
 *   1. Explicit `options.path` (from plugin config)
 *   2. `stylesDir` from ui.config.json
 *   3. Default: ./ui/styles
 */
export function resolveConfig(options: PluginOptions = {}): ResolvedConfig {
  const configPath = path.join(process.cwd(), CONFIG_FILE);
  let config: TailUIConfig | null = null;

  if (fs.existsSync(configPath)) {
    try {
      config = JSON.parse(fs.readFileSync(configPath, 'utf8')) as TailUIConfig;
    } catch (e) {
      console.warn(`[TailUI] ⚠️  Failed to parse ${CONFIG_FILE}: ${(e as Error).message}`);
    }
  }

  let stylesDir: string;
  if (options.path) {
    stylesDir = options.path;
  } else if (config?.stylesDir) {
    stylesDir = config.stylesDir;
  } else {
    stylesDir = `./${DEFAULT_DIR}/styles`;
  }

  const resolved = path.resolve(process.cwd(), stylesDir);
  if (!resolved.startsWith(process.cwd())) {
    console.warn(`[TailUI] ⚠️  stylesDir "${stylesDir}" resolves outside the project. Using default.`);
    stylesDir = `./${DEFAULT_DIR}/styles`;
  }

  return { stylesDir, configPath, config };
}