"use strict";Object.defineProperty(exports, "__esModule", {value: true}); function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var _chunkEDBUFYYKcjs = require('../chunk-EDBUFYYK.cjs');
require('../chunk-GS7T56RP.cjs');

// src/plugin/index.ts
var _plugin = require('tailwindcss/plugin'); var _plugin2 = _interopRequireDefault(_plugin);
var _fs = require('fs'); var _fs2 = _interopRequireDefault(_fs);
var _path = require('path'); var _path2 = _interopRequireDefault(_path);
var tailuiPlugin = _plugin2.default.withOptions(
  (options = {}) => {
    const { stylesDir } = _chunkEDBUFYYKcjs.resolveConfig.call(void 0, options);
    return function({
      /* addUtilities, addComponents, etc. */
    }) {
      const fullPath = _path2.default.resolve(process.cwd(), stylesDir);
      if (!_fs2.default.existsSync(fullPath)) {
        console.warn(`[TailUI] \u26A0\uFE0F Styles directory not found: ${fullPath}`);
        console.warn(`[TailUI] Run "npx tailui init" to create it.`);
        return;
      }
      const files = _fs2.default.readdirSync(fullPath).filter((f) => f.startsWith("ui.") && f.endsWith(".css")).sort();
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
    const { stylesDir } = _chunkEDBUFYYKcjs.resolveConfig.call(void 0, options);
    const fullPath = _path2.default.resolve(process.cwd(), stylesDir);
    return {
      // On ajoute les fichiers CSS au "content" de Tailwind 
      // pour que les classes .ui-* ne soient pas supprimées par le Purge/JIT
      content: [_path2.default.join(fullPath, "ui.*.css")]
    };
  }
);
var plugin_default = tailuiPlugin;


exports.default = plugin_default;
//# sourceMappingURL=index.cjs.map