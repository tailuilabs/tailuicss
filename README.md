<div align="center">

# TailUI

**Stop writing 40 classes per element.**

A semantic CSS-first layer on top of Tailwind CSS.
Write `class="ui-button ui-primary"` instead of a wall of utility classes.

[![npm version](https://img.shields.io/npm/v/@tailuicss/core.svg?style=flat-square&color=0284c7)](https://www.npmjs.com/package/@tailuicss/core)
[![license](https://img.shields.io/npm/l/@tailuicss/core.svg?style=flat-square&color=0284c7)](https://github.com/tailuicss/tailui/blob/main/LICENSE)
[![tailwindcss](https://img.shields.io/badge/tailwindcss-%3E%3D3.4-0284c7?style=flat-square)](https://tailwindcss.com)
[![zero runtime](https://img.shields.io/badge/JS_runtime-0kb-10b981?style=flat-square)](.)

</div>

---

## The Problem

```html
<!-- This is what Tailwind looks like at scale -->
<button class="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium
  transition-all duration-200 cursor-pointer inline-flex items-center
  justify-center gap-2 text-sm hover:bg-blue-700 active:bg-blue-800
  shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed">
  Save Changes
</button>
```

## The Solution

```html
<!-- This is TailUI -->
<button class="ui-button ui-primary">Save Changes</button>
```

Same output. **~80% less markup.** Zero runtime. Pure CSS.

---

## Quick Start

### 1. Install

TailUI requires **Tailwind CSS** and **PostCSS** as peer dependencies. Install what you need:

**No Tailwind CSS yet?** Install everything:

```bash
npm install @tailuicss/core tailwindcss postcss autoprefixer
# or
pnpm add @tailuicss/core tailwindcss postcss autoprefixer
# or
yarn add @tailuicss/core tailwindcss postcss autoprefixer
```

**Tailwind CSS installed, but no PostCSS?** Add PostCSS:

```bash
npm install @tailuicss/core postcss
# or
pnpm add @tailuicss/core postcss
# or
yarn add @tailuicss/core postcss
```

**Tailwind CSS + PostCSS already installed?** Just add TailUI:

```bash
npm install @tailuicss/core
# or
pnpm add @tailuicss/core
# or
yarn add @tailuicss/core
```

### 2. Configure

```js
// tailwind.config.js
module.exports = {
  content: ["./src/**/*.{html,js,jsx,tsx}"],
  plugins: [require('@tailuicss/core')()],
};
```

```js
// postcss.config.js
module.exports = {
  plugins: {
    '@tailuicss/core/postcss': {},
    tailwindcss: {},
  },
};
```

Your CSS file stays standard — **no special import order needed**:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

> TailUI automatically injects component styles in the correct position. Zero manual configuration.

### 3. Use

```html
<button class="ui-button ui-primary">Save</button>
<button class="ui-button ui-danger ui-lg">Delete</button>

<div class="ui-card ui-elevated ui-hoverable">
  <div class="ui-header">Dashboard</div>
  <div class="ui-body">Content here</div>
  <div class="ui-footer">
    <button class="ui-button ui-primary ui-sm">Confirm</button>
  </div>
</div>
```

That's it. Three steps. No boilerplate.

---

## Why TailUI?

| | Tailwind (raw) | TailUI |
|---|---|---|
| **Markup** | 40+ classes per element | 2–4 semantic classes |
| **Readability** | `px-4 py-2 bg-blue-600...` | `ui-button ui-primary` |
| **JS runtime** | 0kb | 0kb |
| **Learning curve** | Memorize utilities | Read the class name |
| **DevTools** | Wall of classes | Clean `.ui-*` selectors |
| **Composition** | Manual | Free — combine any tokens |
| **Dark mode** | Per-element classes | One `data-theme` attribute |
| **Framework** | Any | Any |

---

## Components

TailUI ships with **20 production-ready components**:

| Component | Tokens |
|---|---|
| **Accordion** | `flush` · `separated` |
| **Alert** | `info` · `success` · `warning` · `danger` · `outlined` · `filled` |
| **Avatar** | `xs` · `sm` · `lg` · `xl` · `square` · `ring` |
| **Badge** | `primary` · `secondary` · `success` · `danger` · `warning` · `dot` · `square` |
| **Button** | `primary` · `secondary` · `danger` · `ghost` · `outline` · `sm` · `lg` · `xl` · `disabled` · `loading` · `full` · `icon` |
| **Card** | `elevated` · `outlined` · `flat` · `hoverable` · `interactive` · `compact` |
| **Carousel** | `fade` |
| **Dropdown** | `right` · `up` |
| **File Input** | `compact` · `error` · `disabled` |
| **Input** | `error` · `success` · `disabled` · `sm` · `lg` |
| **List** | `interactive` · `flush` · `compact` |
| **Modal** | `sm` · `lg` · `xl` · `full` · `centered` |
| **Progress** | `success` · `warning` · `danger` · `sm` · `lg` · `xl` · `striped` · `animated` · `labeled` |
| **Radio** | `horizontal` · `disabled` · `sm` · `lg` |
| **Rate** | `readonly` · `sm` · `lg` · `half` · `disabled` |
| **Select** | `error` · `disabled` · `sm` · `lg` · `multi` (with search) |
| **Textarea** | `error` · `success` · `disabled` · `noresize` · `auto` · `sm` · `lg` |
| **Toast** | `success` · `danger` · `warning` · `info` |
| **Toggle** | `success` · `danger` · `disabled` · `sm` · `lg` |
| **Tooltip** | `bottom` · `left` · `right` |

Every component includes **dark mode** support and follows the same `.ui-*` class pattern.

### Examples

```html
<!-- Button -->
<button class="ui-button ui-primary">Save</button>

<!-- Card -->
<div class="ui-card ui-elevated ui-hoverable">
  <div class="ui-header">Title</div>
  <div class="ui-body">Content</div>
</div>

<!-- Alert -->
<div class="ui-alert ui-success">
  <span class="ui-title">Success!</span>
  <span class="ui-message">Your changes have been saved.</span>
</div>

<!-- Toggle -->
<label class="ui-toggle">
  <input type="checkbox" />
  <span class="ui-track"></span>
  Dark mode
</label>

<!-- Progress -->
<div class="ui-progress ui-striped ui-animated">
  <div class="ui-bar" style="--ui-progress-value: 75%"></div>
</div>

<!-- Select -->
<div class="ui-select">
  <div class="ui-select-trigger">Choose...</div>
  <div class="ui-select-menu">
    <div class="ui-option">Option 1</div>
    <div class="ui-option ui-selected">Option 2</div>
  </div>
</div>
```

You can also create **any custom component** with `npx tailui create <name>`.

---

## How It Works

### The `.ui-*` Classes

```html
<div class="ui-card ui-elevated ui-hoverable">
```

- Each token maps to a **`.ui-<token>`** CSS class
- Tokens are **independent** — combine freely, no hierarchy
- Order **doesn't matter**
- Standard CSS classes — works everywhere, great DevTools support

### Token Types

| Type | Examples | Role |
|------|----------|------|
| **Component** | `card`, `button`, `input` | Primary identity |
| **Modifier** | `elevated`, `hoverable`, `compact` | Behavioral variation |
| **Slot** | `header`, `body`, `footer` | Sub-structure |
| **State** | `disabled`, `loading`, `error` | Semantic states |
| **Size** | `sm`, `lg`, `xl` | Size variants |

### CSS Selectors

```css
/* Base component */
.ui-card {
  @apply rounded-xl border bg-white overflow-hidden;
}

/* Modifier */
.ui-card.ui-elevated {
  @apply shadow-lg;
}

/* Combination */
.ui-card.ui-hoverable:hover {
  @apply shadow-2xl -translate-y-1;
}

/* Parent → child */
.ui-card:hover .ui-header {
  @apply text-blue-600;
}
```

### Dynamic Values with `@style`

For CSS custom properties alongside `@apply`:

```css
.ui-card {
  @apply rounded-lg border;
  @style {
    background: var(--ui-card-bg, white);
    transform: scale(var(--ui-card-scale, 1));
  }
}
```

```html
<!-- Static -->
<div class="ui-card" style="--ui-card-bg: #eff6ff;"></div>

<!-- Dynamic (React) -->
<div
  className="ui-card ui-elevated"
  style={{
    "--ui-card-bg": active ? "#020617" : "#fff",
    "--ui-card-scale": hovered ? "1.03" : "1",
  }}
/>
```

Variable convention: **`--ui-<component>-<property>`**

### Dark Mode

```html
<body data-theme="dark">
```

```css
[data-theme="dark"] .ui-card {
  @apply bg-gray-900 text-white border-gray-700;
}
```

No component changes needed. One attribute switches everything.

---

## CLI

### Initialize

```bash
$ npx tailui init

  Where should TailUI store components? (ui) my-design-system

  📁 Created: ./my-design-system/styles
  📄 Created: ui.config.json

  ✅ TailUI initialized!
```

The directory name is **your choice** — `ui`, `components`, `design-system`, whatever fits your project. TailUI stores the path in `ui.config.json` and all commands resolve it automatically.

You can also skip the prompt:

```bash
npx tailui init -d my-design-system
```

### Commands

```bash
npx tailui create button --variants primary,danger # Generate component
npx tailui add card hoverable                      # Add token
npx tailui add card header --type slot             # Add slot
npx tailui list                                    # Show all components
```

All commands read the styles directory from `ui.config.json` — no path flags needed.

---

## AI Component Generation

TailUI can generate **framework-specific components** using AI. The generated components use your TailUI `.ui-*` styles — no utility class soup.

### Setup

During `npx tailui init`, choose your stack and configure an AI provider:

| Provider | Models |
|---|---|
| **OpenAI** | GPT-4o |
| **Claude** | Claude Sonnet |
| **Gemini** | Gemini Pro |
| **Mistral** | Mistral Large |

Or configure later:

```bash
npx tailui config --set-ai openai --set-key sk-...
npx tailui config --set-stack react
```

### Generate

```bash
npx tailui generate button     # → src/components/ui/Button.tsx
npx tailui generate card       # → src/components/ui/Card.tsx
npx tailui generate modal      # → src/components/ui/Modal.tsx
```

The AI reads your existing CSS styles and generates a **typed, accessible component** that uses your `.ui-*` classes. Supports React, Vue, Svelte, Angular, Astro, and more.

> **Your API key is stored locally** in `ui.config.json`. Never commit it to git — add `ui.config.json` to `.gitignore` if it contains secrets.

---

## Migration

Already have a project full of Tailwind utility classes? **Migrate them automatically.**

```bash
# Preview changes (dry-run)
npx tailui migrate --all src/components --dry-run

# Migrate a single file
npx tailui migrate -f src/components/Button.tsx

# Migrate all files in a directory
npx tailui migrate --all src/components

# Interactive mode — confirm each change
npx tailui migrate --all src/components -i

# Undo the last migration
npx tailui migrate --undo
```

### How It Works

1. **Tag-first detection** — the HTML tag determines the component. `<button>` → `ui-button`, `<input>` → `ui-input`. No guessing.
2. **Attribute resolution** — ARIA attributes disambiguate generic tags (`role="alert"` → `ui-alert`)
3. **Class-based fallback** — for `<div>`, `<span>`, etc., classes confirm the component with high confidence thresholds
4. **Variant detection** — color and style variants are automatically detected (`ui-primary`, `ui-danger`, `ui-elevated`)
5. **Structural preservation** — spacing, layout, sizing, and positioning classes are kept (`mt-4`, `w-full`, `flex`)

### Safety

- **Dynamic classes are skipped** — `cn()`, `clsx()`, `cva()`, `twMerge()`, template literals with interpolation, and ternary expressions are never touched
- **Backup & undo** — every migration creates a timestamped backup in `.tailui-backup/`; restore with `--undo`
- **Confidence threshold** — only migrations above the threshold are applied (default: 60, configurable with `--threshold`)
- **Dev-only** — the migrate module is lazy-loaded by the CLI and never imported by the Tailwind or PostCSS plugins. Zero production bundle impact.

### Options

| Flag | Description |
|---|---|
| `-f <path>` | Migrate a single file |
| `--all` | Migrate all supported files in target directory |
| `--dry-run` | Preview changes without modifying files |
| `-i, --interactive` | Confirm each migration individually |
| `--force` | Apply all migrations without confirmation |
| `--threshold <0-100>` | Minimum confidence score (default: 60) |
| `--undo` | Restore files from the most recent backup |

---

## File Structure

```
your-project/
├─ <your-dir>/                 ← you choose the name
│  └─ styles/
│     ├─ ui.accordion.css
│     ├─ ui.alert.css
│     ├─ ui.avatar.css
│     ├─ ui.badge.css
│     ├─ ui.button.css
│     ├─ ui.card.css
│     ├─ ... (20 components)
│     └─ index.css
├─ src/components/ui/          ← AI-generated components go here
│  ├─ Button.tsx
│  ├─ Card.tsx
│  └─ ...
├─ ui.config.json              ← project config (stack, AI, paths)
├─ tailwind.config.js          ← add plugin here
└─ postcss.config.js           ← add plugin here
```

`ui.config.json`:

```json
{
  "version": "1.0.0",
  "stack": "react",
  "directory": "ui",
  "stylesDir": "./ui/styles",
  "componentsDir": "./src/components/ui",
  "ai": { "provider": "openai", "apiKey": "sk-..." },
  "components": { ... }
}
```

---

## Compatibility

| Environment | Support |
|---|---|
| HTML | ✅ |
| React / Next.js | ✅ |
| Vue / Nuxt | ✅ |
| Svelte / SvelteKit | ✅ |
| Angular | ✅ |
| Astro | ✅ |
| Web Components | ✅ |
| SSR / CSR / SSG | ✅ |
| Tailwind CSS 3.4+ | ✅ |

---

## Design Principles

1. **Composition is free** — No whitelist, no rigid hierarchy
2. **CSS is the source of truth** — No JavaScript runtime
3. **JS is never required** — But can drive CSS variables
4. **The system enhances the web** — It doesn't replace it
5. **The escape hatch is a feature** — `@style` + CSS custom properties

---

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.

```bash
git clone https://github.com/tailuicss/tailui.git
cd tailui
npm install
npm run dev    # Watch mode
npm run demo   # Build + open demo
```

---

## License

[MIT](LICENSE) — Built with love ❤️
