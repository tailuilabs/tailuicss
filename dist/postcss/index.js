import {
  resolveConfig
} from "../chunk-S7NR4S6U.js";
import "../chunk-SBOSXPYJ.js";

// src/postcss/index.ts
import fs from "fs";
import path from "path";
import postcss from "postcss";
var plugin = (options = {}) => {
  const { stylesDir } = resolveConfig(options);
  return {
    postcssPlugin: "tailui",
    Once(root) {
      const fullPath = path.resolve(process.cwd(), stylesDir);
      if (!fs.existsSync(fullPath)) {
        return;
      }
      const files = fs.readdirSync(fullPath).filter((f) => f.startsWith("ui.") && f.endsWith(".css")).sort();
      if (files.length === 0) return;
      let allCSS = files.map((file) => fs.readFileSync(path.join(fullPath, file), "utf8")).join("\n");
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
        console.log(`[TailUI] \u2705 Injected ${files.length} component(s): ${files.map((f) => f.replace("ui.", "").replace(".css", "")).join(", ")}`);
      } else {
        console.warn(`[TailUI] \u26A0\uFE0F  No "@tailwind components" directive found. Styles were not injected.`);
        console.warn(`[TailUI] Make sure your CSS file contains: @tailwind base; @tailwind components; @tailwind utilities;`);
      }
    }
  };
};
plugin.postcss = true;
var postcss_default = plugin;
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