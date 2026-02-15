# Changelog

All notable changes to TailUI will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] — 2025-06-20

### Added

- **`tailui migrate` command** — automatically convert Tailwind utility classes to semantic `.ui-*` classes
  - **Tag-first detection**: HTML tag is the primary signal (`<button>` → `ui-button`, `<input>` → `ui-input`). No guessing.
  - **Attribute resolution**: ARIA attributes disambiguate generic tags (`role="alert"` → `ui-alert`, `role="dialog"` → `ui-modal`)
  - **Class-based fallback**: for `<div>`, `<span>`, etc. — requires high class confidence
  - **Variant detection**: automatically detects color/style variants (`ui-primary`, `ui-danger`, `ui-elevated`, etc.)
  - **Structural class preservation**: spacing, layout, sizing, and positioning classes are kept alongside `.ui-*` classes
  - **Dynamic class skipping**: `cn()`, `clsx()`, `cva()`, `twMerge()`, template literal interpolations, and ternaries are safely skipped
  - **Dry-run mode** (`--dry-run`): preview all changes without modifying files
  - **Interactive mode** (`-i`): confirm each migration individually
  - **Force mode** (`--force`): apply all migrations without confirmation
  - **Confidence threshold** (`--threshold <0-100>`): control minimum match score (default: 60)
  - **Backup & undo**: timestamped backups in `.tailui-backup/`, restore with `--undo`
  - **Single file** (`-f <path>`) or **directory** (`--all <dir>`) migration
- **Dev-only architecture**: the migrate module is lazy-loaded by the CLI and never imported by the Tailwind or PostCSS plugins — zero production bundle impact

### Changed

- CLI now has **7 commands** (added `migrate`)

---

## [1.0.0] — 2026-02-11

### Added

- **20 production-ready components**: accordion, alert, avatar, badge, button, card, carousel, dropdown, file-input, input, list, modal, progress, radio, rate, select, textarea, toast, toggle, tooltip
- **AI component generation** — `tailui generate <component>` creates typed, accessible framework components using OpenAI, Claude, Gemini, or Mistral
- **Zero-config PostCSS plugin** — auto-injects styles before `@tailwind components`, no manual import order needed
- **Tailwind plugin** — auto-registers content paths, prevents tree-shaking
- **CLI** with 6 commands:
  - `tailui init` — interactive scaffold with stack selection, directory name, AI config
  - `tailui create <component>` — generate component CSS with variants
  - `tailui add <component> <token>` — add tokens to existing components
  - `tailui list` — display all registered components and tokens
  - `tailui generate <component>` — AI-powered framework component generation
  - `tailui config` — view or update configuration (stack, AI provider, API key)
- **Stack-aware init** — choose React, Next.js, Vue, Nuxt, Svelte, SvelteKit, Angular, Astro, or HTML
- **Flexible directory naming** — choose `ui/`, `components/`, `design-system/`, or any name; stored in `ui.config.json`
- **Centralized config** — `ui.config.json` stores directory path, stack, AI settings; all CLI commands and plugins resolve it automatically
- **`.ui-*` class selectors** — standard CSS classes for maximum compatibility
- **`@style` directive** — CSS custom properties alongside `@apply`
- **Dark mode** via `[data-theme="dark"]` selectors on all 20 components
- **Free composition** — tokens combine without hierarchy (`class="ui-card ui-elevated ui-hoverable"`)
- **Token types**: component, modifier, slot, state, size
- **CSS variable convention**: `--ui-<component>-<property>`
- **Framework agnostic**: HTML, React, Vue, Svelte, Angular, Astro, Web Components
- **SSR & CSR** compatible — zero JavaScript runtime

### Components

| Component | Key Tokens |
|---|---|
| **Accordion** | `flush`, `separated` |
| **Alert** | `info`, `success`, `warning`, `danger`, `outlined`, `filled` |
| **Avatar** | `xs`, `sm`, `lg`, `xl`, `square`, `ring` + status indicators |
| **Badge** | `primary`, `secondary`, `success`, `danger`, `warning`, `dot`, `square` |
| **Button** | `primary`, `secondary`, `danger`, `ghost`, `outline`, `sm`–`xl`, `disabled`, `loading`, `full`, `icon` |
| **Card** | `elevated`, `outlined`, `flat`, `hoverable`, `interactive`, `compact` |
| **Carousel** | `fade` + navigation dots/arrows |
| **Dropdown** | `right`, `up` + menu items, dividers, headers |
| **File Input** | `compact`, `error`, `disabled`, drag-and-drop zone |
| **Input** | `error`, `success`, `disabled`, `sm`, `lg` + label, helper |
| **List** | `interactive`, `flush`, `compact` + leading/trailing slots |
| **Modal** | `sm`–`full`, `centered` + overlay |
| **Progress** | `success`, `warning`, `danger`, `sm`–`xl`, `striped`, `animated`, `labeled` |
| **Radio** | `horizontal`, `disabled`, `sm`, `lg` |
| **Rate** | `readonly`, `sm`, `lg`, `half`, `disabled` |
| **Select** | `error`, `disabled`, `sm`, `lg`, `multi` + search input |
| **Textarea** | `error`, `success`, `disabled`, `noresize`, `auto`, `sm`, `lg` |
| **Toast** | `success`, `danger`, `warning`, `info` + positioning |
| **Toggle** | `success`, `danger`, `disabled`, `sm`, `lg` |
| **Tooltip** | `bottom`, `left`, `right` + arrow positioning |
