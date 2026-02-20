// src/plugin/index.ts
import plugin from "tailwindcss/plugin";
import fs2 from "fs";
import path2 from "path";

// src/config.ts
import fs from "fs";
import path from "path";
var CONFIG_FILE = "ui.config.json";
var DEFAULT_DIR = "ui";
function resolveConfig(options = {}) {
  const configPath = path.join(process.cwd(), CONFIG_FILE);
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
  const resolved = path.resolve(process.cwd(), stylesDir);
  if (!resolved.startsWith(process.cwd())) {
    console.warn(`[TailUI] \u26A0\uFE0F  stylesDir "${stylesDir}" resolves outside the project. Using default.`);
    stylesDir = `./${DEFAULT_DIR}/styles`;
  }
  return { stylesDir, configPath, config };
}

// src/plugin/index.ts
var tailuiPlugin = plugin.withOptions(
  (options = {}) => {
    const { stylesDir } = resolveConfig(options);
    return function({
      /* addUtilities, addComponents, etc. */
    }) {
      const fullPath = path2.resolve(process.cwd(), stylesDir);
      if (!fs2.existsSync(fullPath)) {
        console.warn(`[TailUI] \u26A0\uFE0F Styles directory not found: ${fullPath}`);
        console.warn(`[TailUI] Run "npx tailui init" to create it.`);
        return;
      }
      const files = fs2.readdirSync(fullPath).filter((f) => f.startsWith("ui.") && f.endsWith(".css")).sort();
      if (files.length === 0) {
        console.warn(`[TailUI] \u26A0\uFE0F No ui.*.css files found in ${fullPath}`);
        return;
      }
      console.log(
        `[TailUI] \u2705 Found ${files.length} component(s): ${files.map((f) => f.replace("ui.", "").replace(".css", "")).join(", ")}`
      );
    };
  },
  (options = {}) => {
    const { stylesDir } = resolveConfig(options);
    const fullPath = path2.resolve(process.cwd(), stylesDir);
    return {
      // On ajoute les fichiers CSS au "content" de Tailwind 
      // pour que les classes .ui-* ne soient pas supprimées par le Purge/JIT
      content: [path2.join(fullPath, "ui.*.css")]
    };
  }
);
var plugin_default = tailuiPlugin;
export {
  plugin_default as default
};
//# sourceMappingURL=index.js.map