/**
 * TailUI Migration — Tag-First Pattern Definitions
 *
 * PHILOSOPHY: The HTML tag is the PRIMARY signal. We do NOT guess
 * what a component is from classes alone. The tag tells us what it IS,
 * the classes tell us which VARIANT it is.
 *
 * TAG_MAP: tag → component mapping (deterministic, no guessing)
 * ATTR_MAP: attribute → component mapping (for ambiguous tags like <div>)
 * CONFIRM_CLASSES: classes that confirm a tag-based match
 * VARIANT_RULES: classes that determine which .ui-* variant to apply
 */

// ─── TAG → COMPONENT (deterministic) ──────────────────────────
// These tags have a 1:1 mapping to a TailUI component.
// If the tag is <button>, it IS a button. Period.
const TAG_MAP = {
  button:   'button',
  input:    'input',
  textarea: 'textarea',
  select:   'select',
  label:    null,       // ambiguous: could be toggle, radio, or file-input — resolved by attrs/classes
  a:        null,       // ambiguous: could be button-like link — resolved by classes
};

// ─── ATTR → COMPONENT (for ambiguous tags) ─────────────────────
// When the tag is <div>, <span>, etc., attributes disambiguate.
const ATTR_RULES = [
  { attrs: ['role="dialog"', 'aria-modal'],  component: 'modal',    uiClass: 'ui-modal',    minAttrs: 1 },
  { attrs: ['role="alert"'],                 component: 'alert',    uiClass: 'ui-alert',    minAttrs: 1 },
  { attrs: ['role="progressbar"'],           component: 'progress', uiClass: 'ui-progress', minAttrs: 1 },
  { attrs: ['role="menu"'],                  component: 'dropdown-menu', uiClass: 'ui-menu', minAttrs: 1 },
  { attrs: ['role="list"'],                  component: 'list',     uiClass: 'ui-list',     minAttrs: 1 },
  { attrs: ['role="status"'],                component: 'toast',    uiClass: 'ui-toast',    minAttrs: 1 },
];

// ─── COMPONENT DEFINITIONS ─────────────────────────────────────
// Each component defines:
//   - uiClass:     the .ui-* class to apply
//   - confirm:     classes that MUST be present (at least confirmMin of them)
//   - confirmMin:  minimum number of confirm classes needed
//   - variants:    sub-patterns for variant detection
const COMPONENTS = {
  button: {
    uiClass: 'ui-button',
    confirm: ['rounded', 'font-medium', 'font-semibold', 'font-bold', 'px-', 'py-', 'inline-flex', 'cursor-pointer'],
    confirmMin: 2,
    variants: [
      { name: 'ui-primary',   indicators: ['bg-blue-', 'text-white'],                          min: 2 },
      { name: 'ui-secondary', indicators: ['bg-gray-100', 'bg-gray-200', 'text-gray-', 'border-gray-'], min: 2 },
      { name: 'ui-danger',    indicators: ['bg-red-', 'text-white'],                           min: 2 },
      { name: 'ui-ghost',     indicators: ['bg-transparent', 'hover:bg-gray-'],                min: 2 },
      { name: 'ui-outline',   indicators: ['bg-transparent', 'border-2', 'border-current'],    min: 2 },
    ],
  },

  input: {
    uiClass: 'ui-input',
    confirm: ['border', 'rounded', 'px-', 'py-', 'outline-none', 'bg-white', 'text-sm'],
    confirmMin: 2,
    variants: [
      { name: 'ui-error',   indicators: ['border-red-', 'text-red-'],   min: 1 },
      { name: 'ui-success', indicators: ['border-green-'],              min: 1 },
    ],
  },

  textarea: {
    uiClass: 'ui-textarea',
    confirm: ['border', 'rounded', 'px-', 'py-', 'resize-y', 'resize-none'],
    confirmMin: 2,
    variants: [
      { name: 'ui-error',   indicators: ['border-red-'],   min: 1 },
      { name: 'ui-success', indicators: ['border-green-'], min: 1 },
    ],
  },

  select: {
    uiClass: 'ui-select',
    confirm: ['border', 'rounded', 'px-', 'py-', 'bg-white', 'appearance-none'],
    confirmMin: 1,
    variants: [],
  },

  // ─── <a> resolved as button when it has button-like classes ──
  'link-button': {
    uiClass: 'ui-button',
    confirm: ['rounded', 'font-medium', 'font-semibold', 'font-bold', 'px-', 'py-', 'inline-flex', 'bg-'],
    confirmMin: 3,
    variants: [
      { name: 'ui-primary',   indicators: ['bg-blue-', 'text-white'],                          min: 2 },
      { name: 'ui-secondary', indicators: ['bg-gray-100', 'bg-gray-200', 'text-gray-'],        min: 2 },
      { name: 'ui-danger',    indicators: ['bg-red-', 'text-white'],                           min: 2 },
      { name: 'ui-ghost',     indicators: ['bg-transparent', 'hover:bg-gray-'],                min: 2 },
      { name: 'ui-outline',   indicators: ['bg-transparent', 'border-2', 'border-current'],    min: 2 },
    ],
  },

  // ─── <label> resolved by inner content / classes ─────────────
  toggle: {
    uiClass: 'ui-toggle',
    confirm: ['inline-flex', 'items-center', 'cursor-pointer', 'gap-'],
    confirmMin: 3,
    variants: [],
  },

  radio: {
    uiClass: 'ui-radio',
    confirm: ['inline-flex', 'items-center', 'gap-', 'cursor-pointer', 'text-sm'],
    confirmMin: 3,
    variants: [],
  },

  'file-input': {
    uiClass: 'ui-file-input',
    confirm: ['border-2', 'border-dashed', 'rounded', 'cursor-pointer'],
    confirmMin: 3,
    variants: [],
  },

  // ─── Attribute-resolved components (for <div>, etc.) ─────────
  modal: {
    uiClass: 'ui-modal',
    confirm: ['bg-white', 'rounded', 'shadow', 'z-50', 'max-w-'],
    confirmMin: 2,
    variants: [],
  },

  alert: {
    uiClass: 'ui-alert',
    confirm: ['flex', 'items-start', 'rounded', 'border', 'text-sm', 'gap-3', 'px-4', 'py-3'],
    confirmMin: 3,
    variants: [
      { name: 'ui-info',    indicators: ['bg-blue-50', 'border-blue-', 'text-blue-'],       min: 2 },
      { name: 'ui-success', indicators: ['bg-green-50', 'border-green-', 'text-green-'],    min: 2 },
      { name: 'ui-warning', indicators: ['bg-yellow-50', 'border-yellow-', 'text-yellow-'], min: 2 },
      { name: 'ui-danger',  indicators: ['bg-red-50', 'border-red-', 'text-red-'],          min: 2 },
    ],
  },

  progress: {
    uiClass: 'ui-progress',
    confirm: ['w-full', 'bg-gray-200', 'rounded-full', 'overflow-hidden'],
    confirmMin: 4,
    variants: [],
  },

  'dropdown-menu': {
    uiClass: 'ui-menu',
    confirm: ['absolute', 'z-50', 'bg-white', 'border', 'rounded', 'shadow-lg'],
    confirmMin: 5,
    variants: [],
  },

  list: {
    uiClass: 'ui-list',
    confirm: ['flex', 'flex-col', 'divide-y', 'border', 'rounded'],
    confirmMin: 3,
    variants: [],
  },

  toast: {
    uiClass: 'ui-toast',
    confirm: ['flex', 'items-start', 'rounded', 'shadow-lg', 'border', 'text-sm'],
    confirmMin: 4,
    variants: [
      { name: 'ui-success', indicators: ['bg-green-50', 'border-green-', 'text-green-'],    min: 2 },
      { name: 'ui-danger',  indicators: ['bg-red-50', 'border-red-', 'text-red-'],          min: 2 },
      { name: 'ui-warning', indicators: ['bg-yellow-50', 'border-yellow-', 'text-yellow-'], min: 2 },
      { name: 'ui-info',    indicators: ['bg-blue-50', 'border-blue-', 'text-blue-'],       min: 2 },
    ],
  },

  // ─── Class-only fallbacks for generic tags (<div>, <span>) ───
  // These require STRONG class signals since the tag is ambiguous.
  card: {
    uiClass: 'ui-card',
    confirm: ['rounded', 'border', 'bg-white', 'overflow-hidden'],
    confirmMin: 3,
    variants: [
      { name: 'ui-elevated', indicators: ['shadow-lg', 'shadow-xl'],                 min: 1 },
      { name: 'ui-flat',     indicators: ['border-none', 'shadow-none', 'bg-gray-50'], min: 2 },
    ],
  },

  badge: {
    uiClass: 'ui-badge',
    confirm: ['inline-flex', 'items-center', 'rounded-full', 'text-xs', 'font-medium'],
    confirmMin: 4,
    variants: [
      { name: 'ui-primary',   indicators: ['bg-blue-100', 'text-blue-'],     min: 1 },
      { name: 'ui-success',   indicators: ['bg-green-100', 'text-green-'],   min: 1 },
      { name: 'ui-danger',    indicators: ['bg-red-100', 'text-red-'],       min: 1 },
      { name: 'ui-warning',   indicators: ['bg-yellow-100', 'text-yellow-'], min: 1 },
      { name: 'ui-secondary', indicators: ['bg-gray-100', 'text-gray-'],     min: 2 },
    ],
  },

  avatar: {
    uiClass: 'ui-avatar',
    confirm: ['rounded-full', 'overflow-hidden', 'inline-flex', 'items-center', 'justify-center'],
    confirmMin: 4,
    variants: [],
  },

  overlay: {
    uiClass: 'ui-overlay',
    confirm: ['fixed', 'inset-0', 'bg-black', 'z-40'],
    confirmMin: 3,
    variants: [],
  },
};

// ─── CLASS-BASED FALLBACK RULES ────────────────────────────────
// For generic tags (<div>, <span>, <section>, <article>) where no
// attribute gives us a clear signal, we try these patterns IN ORDER.
// Higher specificity patterns come first. Each requires a HIGH confirmMin.
const GENERIC_TAG_RULES = [
  // Very specific patterns first (all require 4+ confirm classes)
  'overlay',        // fixed inset-0 bg-black z-40
  'dropdown-menu',  // absolute z-50 bg-white border rounded shadow-lg (4 min)
  'file-input',     // border-2 border-dashed rounded cursor-pointer
  'progress',       // w-full bg-gray-200 rounded-full overflow-hidden (ALL 4 required)
  // High specificity (4+ confirmMin)
  'avatar',         // rounded-full overflow-hidden inline-flex items-center justify-center (4 min)
  'badge',          // inline-flex items-center rounded-full text-xs font-medium (4 min)
  'toast',          // flex items-start rounded shadow-lg border text-sm (4 min)
  // Medium specificity (3 confirmMin)
  'card',           // rounded border bg-white overflow-hidden
  'alert',          // flex items-start rounded border text-sm
  'list',           // flex flex-col divide-y border rounded
];

/**
 * Classes that are considered "structural" / contextual and should be
 * preserved alongside the .ui-* class after migration.
 */
const PRESERVE_PATTERNS = [
  // Spacing
  /^m[trblxy]?-/,
  /^-m[trblxy]?-/,
  /^space-[xy]-/,
  /^-space-[xy]-/,
  // Sizing
  /^w-/, /^h-/, /^min-w-/, /^min-h-/, /^max-w-/, /^max-h-/,
  // Layout
  /^flex$/, /^flex-/, /^grid$/, /^grid-/, /^col-/, /^row-/,
  /^order-/, /^grow/, /^shrink/,
  // Positioning
  /^absolute$/, /^relative$/, /^fixed$/, /^sticky$/, /^static$/,
  /^top-/, /^right-/, /^bottom-/, /^left-/, /^inset-/, /^z-/,
  // Display
  /^block$/, /^inline$/, /^inline-block$/, /^hidden$/, /^visible$/, /^invisible$/,
  // Responsive prefixes (keep all responsive variants)
  /^(sm|md|lg|xl|2xl):/,
  // Container
  /^container$/,
  // Overflow
  /^overflow-/,
  // Aspect ratio
  /^aspect-/,
];

/**
 * Check if a Tailwind class should be preserved (not consumed by migration).
 */
function shouldPreserve(cls) {
  return PRESERVE_PATTERNS.some(re => re.test(cls));
}

module.exports = {
  TAG_MAP,
  ATTR_RULES,
  COMPONENTS,
  GENERIC_TAG_RULES,
  PRESERVE_PATTERNS,
  shouldPreserve,
};
