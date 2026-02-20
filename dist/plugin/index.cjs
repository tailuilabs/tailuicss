"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/plugin/index.ts
var plugin_exports = {};
__export(plugin_exports, {
  default: () => plugin_default
});
module.exports = __toCommonJS(plugin_exports);
var import_plugin = __toESM(require("tailwindcss/plugin"), 1);
var import_fs2 = __toESM(require("fs"), 1);
var import_path2 = __toESM(require("path"), 1);

// src/config.ts
var import_fs = __toESM(require("fs"), 1);
var import_path = __toESM(require("path"), 1);
var CONFIG_FILE = "ui.config.json";
var DEFAULT_DIR = "ui";
function resolveConfig(options = {}) {
  const configPath = import_path.default.join(process.cwd(), CONFIG_FILE);
  let config = null;
  if (import_fs.default.existsSync(configPath)) {
    try {
      config = JSON.parse(import_fs.default.readFileSync(configPath, "utf8"));
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
  const resolved = import_path.default.resolve(process.cwd(), stylesDir);
  if (!resolved.startsWith(process.cwd())) {
    console.warn(`[TailUI] \u26A0\uFE0F  stylesDir "${stylesDir}" resolves outside the project. Using default.`);
    stylesDir = `./${DEFAULT_DIR}/styles`;
  }
  return { stylesDir, configPath, config };
}

// src/plugin/index.ts
var tailuiPlugin = import_plugin.default.withOptions(
  (options = {}) => {
    const { stylesDir } = resolveConfig(options);
    return function({
      /* addUtilities, addComponents, etc. */
    }) {
      const fullPath = import_path2.default.resolve(process.cwd(), stylesDir);
      if (!import_fs2.default.existsSync(fullPath)) {
        console.warn(`[TailUI] \u26A0\uFE0F Styles directory not found: ${fullPath}`);
        console.warn(`[TailUI] Run "npx tailui init" to create it.`);
        return;
      }
      const files = import_fs2.default.readdirSync(fullPath).filter((f) => f.startsWith("ui.") && f.endsWith(".css")).sort();
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
    const fullPath = import_path2.default.resolve(process.cwd(), stylesDir);
    return {
      // On ajoute les fichiers CSS au "content" de Tailwind 
      // pour que les classes .ui-* ne soient pas supprimées par le Purge/JIT
      content: [import_path2.default.join(fullPath, "ui.*.css")]
    };
  }
);
var plugin_default = tailuiPlugin;
//# sourceMappingURL=index.cjs.map