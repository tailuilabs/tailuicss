"use strict";Object.defineProperty(exports, "__esModule", {value: true}); function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var _chunkEDBUFYYKcjs = require('../chunk-EDBUFYYK.cjs');
require('../chunk-GS7T56RP.cjs');

// src/postcss/index.ts
var _fs = require('fs'); var _fs2 = _interopRequireDefault(_fs);
var _path = require('path'); var _path2 = _interopRequireDefault(_path);
var _postcss = require('postcss'); var _postcss2 = _interopRequireDefault(_postcss);
var plugin = (options = {}) => {
  const { stylesDir } = _chunkEDBUFYYKcjs.resolveConfig.call(void 0, options);
  return {
    postcssPlugin: "tailui",
    Once(root) {
      const fullPath = _path2.default.resolve(process.cwd(), stylesDir);
      if (!_fs2.default.existsSync(fullPath)) {
        return;
      }
      const files = _fs2.default.readdirSync(fullPath).filter((f) => f.startsWith("ui.") && f.endsWith(".css")).sort();
      if (files.length === 0) return;
      let allCSS = files.map((file) => _fs2.default.readFileSync(_path2.default.join(fullPath, file), "utf8")).join("\n");
      allCSS = processStyleBlocks(allCSS);
      const parsed = _postcss2.default.parse(allCSS);
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


exports.default = postcss_default;
//# sourceMappingURL=index.cjs.map