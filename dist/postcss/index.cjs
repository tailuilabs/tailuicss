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

// src/postcss/index.ts
var postcss_exports = {};
__export(postcss_exports, {
  default: () => postcss_default
});
module.exports = __toCommonJS(postcss_exports);
var import_fs2 = __toESM(require("fs"), 1);
var import_path2 = __toESM(require("path"), 1);
var import_postcss = __toESM(require("postcss"), 1);

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

// src/postcss/index.ts
var tailuiPostcss = (options = {}) => {
  const { stylesDir } = resolveConfig(options);
  return {
    postcssPlugin: "tailuicss",
    // We use Once with the second argument { result } to manage dependencies
    Once(root, { result }) {
      const fullPath = import_path2.default.resolve(process.cwd(), stylesDir);
      if (!import_fs2.default.existsSync(fullPath)) {
        return;
      }
      result.messages.push({
        type: "dir-dependency",
        dir: fullPath,
        parent: root.source?.input.file
      });
      const files = import_fs2.default.readdirSync(fullPath).filter((f) => f.startsWith("ui.") && f.endsWith(".css")).sort();
      if (files.length === 0) return;
      let allCSS = files.map((file) => {
        const filePath = import_path2.default.join(fullPath, file);
        result.messages.push({
          type: "dependency",
          file: filePath,
          parent: root.source?.input.file
        });
        return import_fs2.default.readFileSync(filePath, "utf8");
      }).join("\n");
      allCSS = processStyleBlocks(allCSS);
      const parsed = import_postcss.default.parse(allCSS);
      let componentsRule = null;
      root.walkAtRules("tailwind", (atRule) => {
        if (atRule.params === "components") {
          componentsRule = atRule;
        }
      });
      if (componentsRule) {
        parsed.nodes.slice().reverse().forEach((node) => {
          componentsRule.before(node.clone());
        });
        if (process.env.NODE_ENV !== "production") {
          console.log(`[TailUI] \u2611\uFE0F Injected ${files.length} component(s) with HMR enabled.`);
        }
      } else {
        console.warn(`[TailUI] \u26A0\uFE0F  No "@tailwind components" directive found. Styles were not injected.`);
      }
    }
  };
};
tailuiPostcss.postcss = true;
var postcss_default = tailuiPostcss;
function processStyleBlocks(css) {
  let result = "";
  let i = 0;
  while (i < css.length) {
    const idx = css.indexOf("@style", i);
    if (idx === -1) {
      result += css.slice(i);
      break;
    }
    result += css.slice(i, idx);
    const braceStart = css.indexOf("{", idx);
    if (braceStart === -1) {
      result += css.slice(idx);
      break;
    }
    let depth = 1;
    let j = braceStart + 1;
    while (j < css.length && depth > 0) {
      if (css[j] === "{") depth++;
      else if (css[j] === "}") depth--;
      j++;
    }
    const inner = css.slice(braceStart + 1, j - 1).trim();
    result += inner;
    i = j;
  }
  return result;
}
//# sourceMappingURL=index.cjs.map