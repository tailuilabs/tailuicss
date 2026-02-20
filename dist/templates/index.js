// src/templates/index.ts
var COMPONENTS = {
  button: {
    variants: ["primary", "secondary", "danger", "ghost", "outline"],
    sizes: ["sm", "lg", "xl"],
    props: ["variant", "size", "disabled", "loading", "fullWidth", "children"]
  },
  card: {
    variants: ["elevated", "outlined", "flat", "hoverable", "interactive", "compact"],
    slots: ["header", "body", "footer"],
    props: ["variant", "hoverable", "interactive", "children"]
  },
  input: {
    variants: ["error", "success", "disabled"],
    sizes: ["sm", "lg"],
    props: ["type", "placeholder", "value", "onChange", "error", "disabled"]
  },
  badge: {
    variants: ["primary", "secondary", "success", "warning", "danger"],
    sizes: ["sm", "lg"],
    props: ["variant", "size", "children"]
  },
  alert: {
    variants: ["info", "success", "warning", "danger"],
    props: ["variant", "title", "children", "dismissible"]
  },
  modal: {
    variants: ["centered", "fullscreen"],
    slots: ["header", "body", "footer"],
    props: ["open", "onClose", "title", "children"]
  },
  dropdown: {
    props: ["trigger", "items", "align"]
  },
  select: {
    props: ["options", "value", "onChange", "placeholder", "disabled"],
    variants: ["error", "success", "disabled"]
  },
  textarea: {
    variants: ["error", "success", "disabled"],
    props: ["placeholder", "value", "onChange", "rows", "disabled"]
  },
  toggle: {
    variants: ["sm", "lg"],
    props: ["checked", "onChange", "disabled", "label"]
  },
  radio: {
    props: ["name", "options", "value", "onChange", "disabled"]
  },
  progress: {
    variants: ["sm", "lg", "striped", "animated"],
    props: ["value", "max", "variant", "showLabel"]
  },
  avatar: {
    variants: ["sm", "lg", "xl"],
    props: ["src", "alt", "size", "fallback"]
  },
  tooltip: {
    variants: ["top", "bottom", "left", "right"],
    props: ["content", "position", "children"]
  },
  toast: {
    variants: ["info", "success", "warning", "danger"],
    props: ["variant", "title", "message", "duration", "onClose"]
  },
  accordion: {
    props: ["items", "multiple", "defaultOpen"]
  },
  carousel: {
    props: ["items", "autoPlay", "interval", "showDots", "showArrows"]
  },
  list: {
    variants: ["bordered", "striped", "hoverable"],
    props: ["items", "variant"]
  },
  "file-input": {
    variants: ["error", "success"],
    props: ["accept", "multiple", "onChange", "disabled"]
  },
  rate: {
    variants: ["sm", "lg"],
    props: ["value", "max", "onChange", "readonly"]
  }
};
function reactButton(ts = true) {
  if (ts) {
    return `import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost" | "outline";
  size?: "sm" | "lg" | "xl";
  loading?: boolean;
  fullWidth?: boolean;
}

export function Button({
  variant = "primary",
  size,
  loading = false,
  fullWidth = false,
  disabled,
  className = "",
  children,
  ...props
}: ButtonProps) {
  const classes = [
    "ui-button",
    variant && \`ui-\${variant}\`,
    size && \`ui-\${size}\`,
    loading && "ui-loading",
    fullWidth && "ui-full",
    disabled && "ui-disabled",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button className={classes} disabled={disabled || loading} {...props}>
      {loading && <span className="ui-spinner" />}
      {children}
    </button>
  );
}
`;
  }
  return `import React from "react";

export function Button({
  variant = "primary",
  size,
  loading = false,
  fullWidth = false,
  disabled,
  className = "",
  children,
  ...props
}) {
  const classes = [
    "ui-button",
    variant && \`ui-\${variant}\`,
    size && \`ui-\${size}\`,
    loading && "ui-loading",
    fullWidth && "ui-full",
    disabled && "ui-disabled",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button className={classes} disabled={disabled || loading} {...props}>
      {loading && <span className="ui-spinner" />}
      {children}
    </button>
  );
}
`;
}
function reactCard(ts = true) {
  if (ts) {
    return `import React from "react";

interface CardProps {
  variant?: "elevated" | "outlined" | "flat";
  hoverable?: boolean;
  interactive?: boolean;
  compact?: boolean;
  className?: string;
  children: React.ReactNode;
  onClick?: () => void;
}

interface CardHeaderProps {
  className?: string;
  children: React.ReactNode;
  sticky?: boolean;
}

interface CardBodyProps {
  className?: string;
  children: React.ReactNode;
}

interface CardFooterProps {
  className?: string;
  children: React.ReactNode;
}

export function Card({
  variant,
  hoverable = false,
  interactive = false,
  compact = false,
  className = "",
  children,
  onClick,
}: CardProps) {
  const classes = [
    "ui-card",
    variant && \`ui-\${variant}\`,
    hoverable && "ui-hoverable",
    interactive && "ui-interactive",
    compact && "ui-compact",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={classes} onClick={onClick}>
      {children}
    </div>
  );
}

export function CardHeader({ className = "", children, sticky = false }: CardHeaderProps) {
  const classes = ["ui-header", sticky && "ui-sticky", className].filter(Boolean).join(" ");
  return <div className={classes}>{children}</div>;
}

export function CardBody({ className = "", children }: CardBodyProps) {
  return <div className={\`ui-body \${className}\`}>{children}</div>;
}

export function CardFooter({ className = "", children }: CardFooterProps) {
  return <div className={\`ui-footer \${className}\`}>{children}</div>;
}
`;
  }
  return `import React from "react";

export function Card({
  variant,
  hoverable = false,
  interactive = false,
  compact = false,
  className = "",
  children,
  onClick,
}) {
  const classes = [
    "ui-card",
    variant && \`ui-\${variant}\`,
    hoverable && "ui-hoverable",
    interactive && "ui-interactive",
    compact && "ui-compact",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={classes} onClick={onClick}>
      {children}
    </div>
  );
}

export function CardHeader({ className = "", children, sticky = false }) {
  const classes = ["ui-header", sticky && "ui-sticky", className].filter(Boolean).join(" ");
  return <div className={classes}>{children}</div>;
}

export function CardBody({ className = "", children }) {
  return <div className={\`ui-body \${className}\`}>{children}</div>;
}

export function CardFooter({ className = "", children }) {
  return <div className={\`ui-footer \${className}\`}>{children}</div>;
}
`;
}
function reactInput(ts = true) {
  if (ts) {
    return `import React from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
  success?: boolean;
  inputSize?: "sm" | "lg";
}

export function Input({
  error = false,
  success = false,
  inputSize,
  disabled,
  className = "",
  ...props
}: InputProps) {
  const classes = [
    "ui-input",
    error && "ui-error",
    success && "ui-success",
    inputSize && \`ui-\${inputSize}\`,
    disabled && "ui-disabled",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return <input className={classes} disabled={disabled} {...props} />;
}
`;
  }
  return `import React from "react";

export function Input({
  error = false,
  success = false,
  inputSize,
  disabled,
  className = "",
  ...props
}) {
  const classes = [
    "ui-input",
    error && "ui-error",
    success && "ui-success",
    inputSize && \`ui-\${inputSize}\`,
    disabled && "ui-disabled",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return <input className={classes} disabled={disabled} {...props} />;
}
`;
}
function reactBadge(ts = true) {
  if (ts) {
    return `import React from "react";

interface BadgeProps {
  variant?: "primary" | "secondary" | "success" | "warning" | "danger";
  size?: "sm" | "lg";
  className?: string;
  children: React.ReactNode;
}

export function Badge({
  variant = "primary",
  size,
  className = "",
  children,
}: BadgeProps) {
  const classes = [
    "ui-badge",
    variant && \`ui-\${variant}\`,
    size && \`ui-\${size}\`,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return <span className={classes}>{children}</span>;
}
`;
  }
  return `import React from "react";

export function Badge({
  variant = "primary",
  size,
  className = "",
  children,
}) {
  const classes = [
    "ui-badge",
    variant && \`ui-\${variant}\`,
    size && \`ui-\${size}\`,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return <span className={classes}>{children}</span>;
}
`;
}
function reactAlert(ts = true) {
  if (ts) {
    return `import React, { useState } from "react";

interface AlertProps {
  variant?: "info" | "success" | "warning" | "danger";
  title?: string;
  dismissible?: boolean;
  className?: string;
  children: React.ReactNode;
}

export function Alert({
  variant = "info",
  title,
  dismissible = false,
  className = "",
  children,
}: AlertProps) {
  const [visible, setVisible] = useState(true);

  if (!visible) return null;

  const classes = [
    "ui-alert",
    variant && \`ui-\${variant}\`,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={classes} role="alert">
      {title && <div className="ui-title">{title}</div>}
      <div className="ui-content">{children}</div>
      {dismissible && (
        <button className="ui-dismiss" onClick={() => setVisible(false)} aria-label="Dismiss">
          &times;
        </button>
      )}
    </div>
  );
}
`;
  }
  return `import React, { useState } from "react";

export function Alert({
  variant = "info",
  title,
  dismissible = false,
  className = "",
  children,
}) {
  const [visible, setVisible] = useState(true);

  if (!visible) return null;

  const classes = [
    "ui-alert",
    variant && \`ui-\${variant}\`,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={classes} role="alert">
      {title && <div className="ui-title">{title}</div>}
      <div className="ui-content">{children}</div>
      {dismissible && (
        <button className="ui-dismiss" onClick={() => setVisible(false)} aria-label="Dismiss">
          &times;
        </button>
      )}
    </div>
  );
}
`;
}
function reactToggle(ts = true) {
  if (ts) {
    return `import React from "react";

interface ToggleProps {
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  disabled?: boolean;
  size?: "sm" | "lg";
  label?: string;
  className?: string;
}

export function Toggle({
  checked = false,
  onChange,
  disabled = false,
  size,
  label,
  className = "",
}: ToggleProps) {
  const classes = [
    "ui-toggle",
    checked && "ui-active",
    size && \`ui-\${size}\`,
    disabled && "ui-disabled",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <label className="ui-toggle-wrapper">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        className={classes}
        disabled={disabled}
        onClick={() => onChange?.(!checked)}
      >
        <span className="ui-toggle-thumb" />
      </button>
      {label && <span className="ui-toggle-label">{label}</span>}
    </label>
  );
}
`;
  }
  return `import React from "react";

export function Toggle({
  checked = false,
  onChange,
  disabled = false,
  size,
  label,
  className = "",
}) {
  const classes = [
    "ui-toggle",
    checked && "ui-active",
    size && \`ui-\${size}\`,
    disabled && "ui-disabled",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <label className="ui-toggle-wrapper">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        className={classes}
        disabled={disabled}
        onClick={() => onChange?.(!checked)}
      >
        <span className="ui-toggle-thumb" />
      </button>
      {label && <span className="ui-toggle-label">{label}</span>}
    </label>
  );
}
`;
}
function vueButton() {
  return `<template>
  <button :class="classes" :disabled="disabled || loading" v-bind="$attrs">
    <span v-if="loading" class="ui-spinner" />
    <slot />
  </button>
</template>

<script setup lang="ts">
interface Props {
  variant?: "primary" | "secondary" | "danger" | "ghost" | "outline";
  size?: "sm" | "lg" | "xl";
  loading?: boolean;
  fullWidth?: boolean;
  disabled?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  variant: "primary",
  loading: false,
  fullWidth: false,
  disabled: false,
});

const classes = computed(() => [
  "ui-button",
  props.variant && \`ui-\${props.variant}\`,
  props.size && \`ui-\${props.size}\`,
  props.loading && "ui-loading",
  props.fullWidth && "ui-full",
  props.disabled && "ui-disabled",
].filter(Boolean).join(" "));
</script>
`;
}
function vueCard() {
  return `<template>
  <div :class="classes" @click="$emit('click')">
    <slot />
  </div>
</template>

<script setup lang="ts">
interface Props {
  variant?: "elevated" | "outlined" | "flat";
  hoverable?: boolean;
  interactive?: boolean;
  compact?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  hoverable: false,
  interactive: false,
  compact: false,
});

defineEmits<{ click: [] }>();

const classes = computed(() => [
  "ui-card",
  props.variant && \`ui-\${props.variant}\`,
  props.hoverable && "ui-hoverable",
  props.interactive && "ui-interactive",
  props.compact && "ui-compact",
].filter(Boolean).join(" "));
</script>
`;
}
function svelteButton() {
  return `<script lang="ts">
  export let variant: "primary" | "secondary" | "danger" | "ghost" | "outline" = "primary";
  export let size: "sm" | "lg" | "xl" | undefined = undefined;
  export let loading = false;
  export let fullWidth = false;
  export let disabled = false;

  $: classes = [
    "ui-button",
    variant && \`ui-\${variant}\`,
    size && \`ui-\${size}\`,
    loading && "ui-loading",
    fullWidth && "ui-full",
    disabled && "ui-disabled",
  ].filter(Boolean).join(" ");
</script>

<button class={classes} {disabled} {...$$restProps}>
  {#if loading}
    <span class="ui-spinner" />
  {/if}
  <slot />
</button>
`;
}
function svelteCard() {
  return `<script lang="ts">
  export let variant: "elevated" | "outlined" | "flat" | undefined = undefined;
  export let hoverable = false;
  export let interactive = false;
  export let compact = false;

  $: classes = [
    "ui-card",
    variant && \`ui-\${variant}\`,
    hoverable && "ui-hoverable",
    interactive && "ui-interactive",
    compact && "ui-compact",
  ].filter(Boolean).join(" ");
</script>

<div class={classes} on:click {...$$restProps}>
  <slot />
</div>
`;
}
function angularButtonTS() {
  return `import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'ui-button',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './button.component.html',
})
export class ButtonComponent {
  @Input() variant: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline' = 'primary';
  @Input() size?: 'sm' | 'lg' | 'xl';
  @Input() loading = false;
  @Input() fullWidth = false;
  @Input() disabled = false;

  get classes(): string {
    return [
      'ui-button',
      this.variant && \`ui-\${this.variant}\`,
      this.size && \`ui-\${this.size}\`,
      this.loading && 'ui-loading',
      this.fullWidth && 'ui-full',
      this.disabled && 'ui-disabled',
    ].filter(Boolean).join(' ');
  }
}
`;
}
function angularButtonHTML() {
  return `<button [class]="classes" [disabled]="disabled || loading">
  <span *ngIf="loading" class="ui-spinner"></span>
  <ng-content></ng-content>
</button>
`;
}
function angularCardTS() {
  return `import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'ui-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './card.component.html',
})
export class CardComponent {
  @Input() variant?: 'elevated' | 'outlined' | 'flat';
  @Input() hoverable = false;
  @Input() interactive = false;
  @Input() compact = false;
  @Output() cardClick = new EventEmitter<void>();

  get classes(): string {
    return [
      'ui-card',
      this.variant && \`ui-\${this.variant}\`,
      this.hoverable && 'ui-hoverable',
      this.interactive && 'ui-interactive',
      this.compact && 'ui-compact',
    ].filter(Boolean).join(' ');
  }
}
`;
}
function angularCardHTML() {
  return `<div [class]="classes" (click)="cardClick.emit()">
  <ng-content></ng-content>
</div>
`;
}
var TEMPLATES = {
  react: {
    button: reactButton,
    card: reactCard,
    input: reactInput,
    badge: reactBadge,
    alert: reactAlert,
    toggle: reactToggle
  },
  vue: {
    button: vueButton,
    card: vueCard
  },
  svelte: {
    button: svelteButton,
    card: svelteCard
  },
  angular: {
    button: { ts: angularButtonTS, html: angularButtonHTML },
    card: { ts: angularCardTS, html: angularCardHTML }
  }
};
function getTemplate(component, stack, isTypeScript = true) {
  const stackTemplates = TEMPLATES[stack] || TEMPLATES.react;
  const template = stackTemplates[component];
  if (!template) {
    return null;
  }
  if (stack === "angular") {
    return template;
  }
  if (typeof template === "function") {
    return template(isTypeScript);
  }
  return template;
}
function getAvailableComponents() {
  return Object.keys(COMPONENTS);
}
function getComponentInfo(component) {
  return COMPONENTS[component] || null;
}
function hasTemplate(component, stack) {
  const stackTemplates = TEMPLATES[stack] || TEMPLATES.react;
  return !!stackTemplates[component];
}
export {
  COMPONENTS,
  TEMPLATES,
  getAvailableComponents,
  getComponentInfo,
  getTemplate,
  hasTemplate
};
//# sourceMappingURL=index.js.map