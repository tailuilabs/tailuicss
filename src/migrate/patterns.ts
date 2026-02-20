/**
 * TailUI Migration — Tag-First Pattern Definitions
 */

// --- Types & Interfaces ---

export interface VariantDefinition {
  name: string;
  indicators: string[];
  min: number;
}

export interface ComponentDefinition {
  uiClass: string;
  confirm: string[];
  confirmMin: number;
  variants: VariantDefinition[];
}

export interface AttrRule {
  attrs: string[];
  component: string;
  uiClass: string;
  minAttrs: number;
}

// --- TAG → COMPONENT Mapping ---

export const TAG_MAP: Record<string, string | null> = {
  button:   'button',
  input:    'input',
  textarea: 'textarea',
  select:   'select',
  label:    null,       // Ambiguous: resolved by attrs/classes
  a:        null,       // Ambiguous: resolved by classes
};

// --- ATTR → COMPONENT Mapping ---

export const ATTR_RULES: AttrRule[] = [
  { attrs: ['role="dialog"', 'aria-modal'],  component: 'modal',    uiClass: 'ui-modal',    minAttrs: 1 },
  { attrs: ['role="alert"'],                 component: 'alert',    uiClass: 'ui-alert',    minAttrs: 1 },
  { attrs: ['role="progressbar"'],           component: 'progress', uiClass: 'ui-progress', minAttrs: 1 },
  { attrs: ['role="menu"'],                  component: 'dropdown-menu', uiClass: 'ui-menu', minAttrs: 1 },
  { attrs: ['role="list"'],                  component: 'list',     uiClass: 'ui-list',     minAttrs: 1 },
  { attrs: ['role="status"'],                component: 'toast',    uiClass: 'ui-toast',    minAttrs: 1 },
];

// --- COMPONENT DEFINITIONS ---

export const COMPONENTS: Record<string, ComponentDefinition> = {
  button: {
    uiClass: 'ui-button',
    confirm: ['rounded', 'font-', 'px-', 'py-', 'inline-flex', 'cursor-pointer', 'bg-', 'text-', 'border'],
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
    confirm: ['border', 'rounded', 'px-', 'py-', 'outline-', 'bg-', 'text-'],
    confirmMin: 2,
    variants: [
      { name: 'ui-error',   indicators: ['border-red-', 'text-red-'],   min: 1 },
      { name: 'ui-success', indicators: ['border-green-'],              min: 1 },
    ],
  },

  textarea: {
    uiClass: 'ui-textarea',
    confirm: ['border', 'rounded', 'px-', 'py-', 'resize-y', 'resize-none', 'bg-', 'text-'],
    confirmMin: 2,
    variants: [
      { name: 'ui-error',   indicators: ['border-red-'],   min: 1 },
      { name: 'ui-success', indicators: ['border-green-'], min: 1 },
    ],
  },

  select: {
    uiClass: 'ui-select',
    confirm: ['border', 'rounded', 'px-', 'py-', 'bg-', 'text-', 'appearance-none'],
    confirmMin: 1,
    variants: [],
  },

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

  modal: {
    uiClass: 'ui-modal',
    confirm: ['bg-', 'rounded', 'shadow', 'z-50', 'max-w-'],
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
    confirm: ['absolute', 'z-50', 'bg-', 'border', 'rounded', 'shadow-lg'],
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

  card: {
    uiClass: 'ui-card',
    confirm: ['rounded', 'border', 'bg-', 'overflow-hidden'],
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
    confirm: ['fixed', 'inset-0', 'bg-', 'z-40'],
    confirmMin: 3,
    variants: [],
  },
};

// --- GENERIC TAG RULES ---

export const GENERIC_TAG_RULES: string[] = [
  'overlay',
  'dropdown-menu',
  'file-input',
  'progress',
  'avatar',
  'badge',
  'toast',
  'card',
  'alert',
  'list',
];

// --- PRESERVATION LOGIC ---

export const PRESERVE_PATTERNS: RegExp[] = [
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
  // Responsive prefixes
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
export function shouldPreserve(cls: string): boolean {
  return PRESERVE_PATTERNS.some(re => re.test(cls));
}