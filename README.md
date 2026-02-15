<div align="center">

<img src="https://tailuicss.com/TailUI.png" alt="TailUI" width="120" />

# TailUI

**The semantic CSS layer for Tailwind CSS**

Stop writing 40 utility classes per element. Write `ui-button ui-primary` instead.

[![npm version](https://img.shields.io/npm/v/@tailuicss/core.svg?style=flat-square&color=0284c7)](https://www.npmjs.com/package/@tailuicss/core)
[![license](https://img.shields.io/npm/l/@tailuicss/core.svg?style=flat-square&color=0284c7)](https://github.com/tailuicss/tailui/blob/main/LICENSE)
[![tailwindcss](https://img.shields.io/badge/tailwindcss-%3E%3D3.4-0284c7?style=flat-square)](https://tailwindcss.com)
[![zero runtime](https://img.shields.io/badge/JS_runtime-0kb-10b981?style=flat-square)](.)

[Documentation](https://tailuicss.com/docs) · [Components](https://tailuicss.com/components) · [Examples](https://tailuicss.com/examples)

</div>

---

## Why TailUI?

```html
<!-- ❌ Before: Tailwind at scale -->
<button class="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium
  transition-all hover:bg-blue-700 active:bg-blue-800 shadow-sm
  disabled:opacity-50 disabled:cursor-not-allowed">
  Save
</button>

<!-- ✅ After: TailUI -->
<button class="ui-button ui-primary">Save</button>
```

**Same output. 80% less code. Zero runtime. Pure CSS.**

---

## Quick Start

```bash
npm install @tailuicss/core
```

```js
// tailwind.config.js
plugins: [require('@tailuicss/core')()]
```

```js
// postcss.config.js
plugins: {
  '@tailuicss/core/postcss': {},
  tailwindcss: {},
}
```

**That's it.** Start using `ui-button`, `ui-card`, `ui-input`, and [20 more components](https://tailuicss.com/components).

---

## Features

- 🎨 **20 production-ready components** — Button, Card, Modal, Input, Toast, and more
- 🌙 **Dark mode built-in** — One `data-theme="dark"` attribute switches everything
- 🔧 **Full Tailwind power** — Use `@apply`, CSS variables, and all Tailwind utilities
- 📦 **Framework agnostic** — React, Vue, Svelte, Angular, Astro, plain HTML
- 🤖 **AI generation** — Generate typed components with OpenAI, Claude, Gemini, or Mistral
- 🔄 **Migration CLI** — Convert existing Tailwind code to TailUI automatically
- ⚡ **Zero JS runtime** — Pure CSS, no bundle bloat

---

## Documentation

👉 **[Read the full documentation →](https://tailuicss.com/docs)**

- [Installation](https://tailuicss.com/docs/installation)
- [Configuration](https://tailuicss.com/docs/configuration)
- [Components](https://tailuicss.com/components)
- [Dark Mode](https://tailuicss.com/docs/dark-mode)
- [CLI Commands](https://tailuicss.com/docs/cli)
- [AI Generation](https://tailuicss.com/docs/ai-generation)
- [Migration Guide](https://tailuicss.com/docs/migration)

---

## AI & Editor Integration

TailUI provides a `llms.txt` file for AI assistants and code editors:

```
https://tailuicss.com/llms.txt
```

Add this to your Cursor rules, Windsurf, or any AI-powered editor for perfect TailUI code generation.

---

## License

[MIT](LICENSE)
