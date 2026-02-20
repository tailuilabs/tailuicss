/**
 * TailUI Migration — Tag-First Matcher
 * * PHILOSOPHY: The HTML tag is the PRIMARY signal.
 */

import {
  TAG_MAP,
  ATTR_RULES,
  COMPONENTS,
  GENERIC_TAG_RULES,
  shouldPreserve,
} from './patterns';

// --- Types & Interfaces ---

export interface ClassMatch {
  classes: string[];
  tag?: string;
  attrs?: string[];
}

export interface MatchResult {
  component: string;      // TailUI component name
  uiClass: string;        // Primary ui-* class
  uiVariants: string[];   // Detected variant classes
  score: number;          // Confidence score (0–100)
  consumed: string[];     // Tailwind classes consumed (for CSS generation)
  preserved: string[];    // Classes to keep in HTML (layout, spacing)
  newClassString: string; // The replacement class string
  resolvedBy: 'tag' | 'attr' | 'class'; // How the match was resolved
}

// --- Internal Utility Functions ---

/**
 * Extracts the base of a Tailwind class ignoring prefixes (e.g., md:hover:bg-blue-500 -> bg-blue-500)
 */
function getBaseClass(cls: string): string {
  const parts = cls.split(':');
  return parts[parts.length - 1];
}

/**
 * Checks if a base class matches a pattern defined in patterns.ts
 */
function matchPattern(base: string, pattern: string): boolean {
  if (base === pattern) return true;
  if (pattern.endsWith('-') && base.startsWith(pattern)) return true;
  if (!pattern.includes('/') && !pattern.match(/\d$/)) {
    return base === pattern || base.startsWith(pattern + '-');
  }
  return false;
}

/**
 * Find a class (or one of its responsive/state variants) in the array.
 */
function findMatchingClass(classes: string[], pattern: string): string | undefined {
  return classes.find(cls => matchPattern(getBaseClass(cls), pattern));
}

// --- Main Functions ---

/**
 * Find the best match for a ClassMatch using tag-first resolution.
 */
export function findBestMatch(
  classMatch: ClassMatch, 
  threshold: number = 60
): MatchResult | null {
  const { classes, tag, attrs } = classMatch;

  // ── STEP 1: Deterministic tag resolution ──
  if (tag && tag in TAG_MAP) {
    const componentKey = TAG_MAP[tag as keyof typeof TAG_MAP];

    if (componentKey) {
      const result = resolveComponent(componentKey, classes, 'tag');
      if (result && result.score >= threshold) return result;
    }

    if (tag === 'a') {
      const result = resolveComponent('link-button', classes, 'tag');
      if (result && result.score >= threshold) return result;
    }

    if (tag === 'label') {
      for (const key of ['toggle', 'radio', 'file-input']) {
        const result = resolveComponent(key, classes, 'tag');
        if (result && result.score >= threshold) return result;
      }
    }
  }

  // ── STEP 2: Attribute-based resolution (aria-roles, types, etc.) ──
  if (attrs && attrs.length > 0) {
    for (const rule of ATTR_RULES) {
      let matched = 0;
      for (const attr of rule.attrs) {
        if (attrs.some(a => a === attr || a.includes(attr))) {
          matched++;
        }
      }
      if (matched >= rule.minAttrs) {
        const result = resolveComponent(rule.component, classes, 'attr');
        if (result && result.score >= threshold) return result;
      }
    }
  }

  // ── STEP 3: Class-based fallback for generic tags (div, span) ──
  if (!tag || !(tag in TAG_MAP)) {
    for (const componentKey of GENERIC_TAG_RULES) {
      const result = resolveComponent(componentKey, classes, 'class');
      if (result && result.score >= threshold) return result;
    }
  }

  return null;
}

/**
 * Resolve a specific component against the given classes.
 */
export function resolveComponent(
  componentKey: string, 
  classes: string[], 
  resolvedBy: 'tag' | 'attr' | 'class'
): MatchResult | null {
  const def = COMPONENTS[componentKey as keyof typeof COMPONENTS];
  if (!def) return null;

  const initialConsumed = new Set<string>();

  
  let confirmed = 0;
  for (const pattern of def.confirm) {
    const found = findMatchingClass(classes, pattern);
    if (found) confirmed++;
  }

  if (confirmed < def.confirmMin) return null;


  for (const cls of classes) {
    const base = getBaseClass(cls);
    
    const isConfirm = def.confirm.some(p => matchPattern(base, p));
    const isVariant = def.variants?.some(v => v.indicators.some(p => matchPattern(base, p)));

    if (isConfirm || isVariant) {
      initialConsumed.add(cls);
    }
  }


  const uiVariants: string[] = [];
  if (def.variants) {
    for (const variant of def.variants) {
      if (variant.indicators.some(ind => findMatchingClass(classes, ind))) {
        uiVariants.push(variant.name);
      }
    }
  }

  // Calcul du Score
  let score = (resolvedBy === 'tag') ? 70 : (resolvedBy === 'attr' ? 65 : 40);
  score += Math.round((confirmed / def.confirm.length) * 30);
  score = Math.min(score, 100);

  // 5. Arbitrage final : Preserved (Layout) vs Consumed (Style)
  const preserved: string[] = [];
  const finalConsumed = new Set<string>(initialConsumed);

  for (const cls of classes) {
    const base = getBaseClass(cls);
    
    if (shouldPreserve(base)) {
      preserved.push(cls);
      finalConsumed.delete(cls);
    } 

    else if (!finalConsumed.has(cls)) {
      finalConsumed.add(cls);
    }
  }

  const uiClasses = [def.uiClass, ...uiVariants];
  const newClassString = [...uiClasses, ...preserved].join(' ');

  return {
    component: componentKey,
    uiClass: def.uiClass,
    uiVariants,
    score,
    consumed: Array.from(finalConsumed),
    preserved,
    newClassString,
    resolvedBy,
  };
}