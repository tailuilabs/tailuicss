// src/postcss/index.ts
import fs2 from "fs";
import path2 from "path";
import postcss from "postcss";

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

// src/postcss/index.ts
var tailuiPostcss = (options = {}) => {
  const { stylesDir } = resolveConfig(options);
  return {
    postcssPlugin: "tailuicss",
    // We use Once with the second argument { result } to manage dependencies
    Once(root, { result }) {
      const fullPath = path2.resolve(process.cwd(), stylesDir);
      if (!fs2.existsSync(fullPath)) {
        return;
      }
      result.messages.push({
        type: "dir-dependency",
        dir: fullPath,
        parent: root.source?.input.file
      });
      const files = fs2.readdirSync(fullPath).filter((f) => f.startsWith("ui.") && f.endsWith(".css")).sort();
      if (files.length === 0) return;
      let allCSS = files.map((file) => {
        const filePath = path2.join(fullPath, file);
        result.messages.push({
          type: "dependency",
          file: filePath,
          parent: root.source?.input.file
        });
        return fs2.readFileSync(filePath, "utf8");
      }).join("\n");
      allCSS = processStyleBlocks(allCSS);
      const parsed = postcss.parse(allCSS);
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
export {
  postcss_default as default
};
//# sourceMappingURL=index.js.map