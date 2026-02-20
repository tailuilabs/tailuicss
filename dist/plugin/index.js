import {
  resolveConfig
} from "../chunk-S7NR4S6U.js";
import "../chunk-SBOSXPYJ.js";

// src/plugin/index.ts
import plugin from "tailwindcss/plugin";
import fs from "fs";
import path from "path";
var tailuiPlugin = plugin.withOptions(
  (options = {}) => {
    const { stylesDir } = resolveConfig(options);
    return function({
      /* addUtilities, addComponents, etc. */
    }) {
      const fullPath = path.resolve(process.cwd(), stylesDir);
      if (!fs.existsSync(fullPath)) {
        console.warn(`[TailUI] \u26A0\uFE0F Styles directory not found: ${fullPath}`);
        console.warn(`[TailUI] Run "npx tailui init" to create it.`);
        return;
      }
      const files = fs.readdirSync(fullPath).filter((f) => f.startsWith("ui.") && f.endsWith(".css")).sort();
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
    const fullPath = path.resolve(process.cwd(), stylesDir);
    return {
      // On ajoute les fichiers CSS au "content" de Tailwind 
      // pour que les classes .ui-* ne soient pas supprimées par le Purge/JIT
      content: [path.join(fullPath, "ui.*.css")]
    };
  }
);
var plugin_default = tailuiPlugin;
export {
  plugin_default as default
};
//# sourceMappingURL=index.js.map