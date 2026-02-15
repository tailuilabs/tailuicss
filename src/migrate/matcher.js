/**
 * TailUI Migration — Tag-First Matcher
 *
 * PHILOSOPHY: The HTML tag is the PRIMARY signal.
 *   1. Read the tag → deterministic component mapping
 *   2. Confirm with classes → ensure it's actually styled as that component
 *   3. Detect variants → which .ui-* variant to apply
 *   4. For generic tags (<div>, <span>) → use attributes first, then class fallback
 *
 * We NEVER guess a <div> is a button. A <button> is a button. Period.
 */

const {
  TAG_MAP,
  ATTR_RULES,
  COMPONENTS,
  GENERIC_TAG_RULES,
  shouldPreserve,
} = require('./patterns');

/**
 * @typedef {Object} MatchResult
 * @property {string}   component      - TailUI component name
 * @property {string}   uiClass        - Primary ui-* class
 * @property {string[]} uiVariants     - Detected variant classes
 * @property {number}   score          - Confidence score (0–100)
 * @property {string[]} consumed       - Tailwind classes consumed
 * @property {string[]} preserved      - Classes to keep alongside ui-*
 * @property {string}   newClassString - The replacement class string
 * @property {string}   resolvedBy     - How the match was resolved: 'tag', 'attr', 'class'
 */

/**
 * Find the best match for a ClassMatch using tag-first resolution.
 *
 * @param {import('./scanner').ClassMatch} classMatch
 * @param {number} threshold - Minimum score (0–100, default 60)
 * @returns {MatchResult|null}
 */
function findBestMatch(classMatch, threshold = 60) {
  const { classes, tag, attrs } = classMatch;

  // ── STEP 1: Deterministic tag resolution ──
  if (tag && tag in TAG_MAP) {
    const componentKey = TAG_MAP[tag];

    if (componentKey) {
      // Deterministic: <button> → button, <input> → input, etc.
      const result = resolveComponent(componentKey, classes, 'tag');
      if (result && result.score >= threshold) return result;
    }

    // Ambiguous tags: <a>, <label> — resolve by classes
    if (tag === 'a') {
      const result = resolveComponent('link-button', classes, 'tag');
      if (result && result.score >= threshold) return result;
    }

    if (tag === 'label') {
      // Try toggle first (most common), then radio, then file-input
      for (const key of ['toggle', 'radio', 'file-input']) {
        const result = resolveComponent(key, classes, 'tag');
        if (result && result.score >= threshold) return result;
      }
    }
  }

  // ── STEP 2: Attribute-based resolution (for <div>, <span>, etc.) ──
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

  // ── STEP 3: Class-based fallback for generic tags ──
  // Only for tags NOT in TAG_MAP (div, span, section, article, etc.)
  // These require HIGH class confidence since we can't rely on the tag.
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
 * Returns a MatchResult or null if classes don't confirm.
 *
 * @param {string} componentKey
 * @param {string[]} classes
 * @param {string} resolvedBy - 'tag', 'attr', or 'class'
 * @returns {MatchResult|null}
 */
function resolveComponent(componentKey, classes, resolvedBy) {
  const def = COMPONENTS[componentKey];
  if (!def) return null;

  const consumed = new Set();

  // ── Confirm classes ──
  let confirmed = 0;
  for (const cls of def.confirm) {
    const matched = findMatchingClass(classes, cls);
    if (matched) {
      confirmed++;
      consumed.add(matched);
    }
  }

  if (confirmed < def.confirmMin) return null;

  // ── Score calculation ──
  let score = 0;

  // Base score from resolution method
  switch (resolvedBy) {
    case 'tag':   score = 70; break;  // Tag = high base confidence
    case 'attr':  score = 65; break;  // Attribute = good confidence
    case 'class': score = 40; break;  // Class-only = needs more confirmation
  }

  // Bonus from confirm ratio
  const confirmRatio = confirmed / def.confirm.length;
  score += Math.round(confirmRatio * 30);

  // ── Detect variants ──
  const uiVariants = [];
  if (def.variants && def.variants.length > 0) {
    for (const variant of def.variants) {
      let indicatorMatched = 0;
      for (const indicator of variant.indicators) {
        const matched = findMatchingClass(classes, indicator);
        if (matched) {
          indicatorMatched++;
          consumed.add(matched);
        }
      }
      if (indicatorMatched >= variant.min) {
        uiVariants.push(variant.name);
      }
    }
  }

  // ── Determine preserved vs consumed classes ──
  const preserved = [];
  for (const cls of classes) {
    if (!consumed.has(cls) && shouldPreserve(cls)) {
      preserved.push(cls);
    }
  }

  // Consume remaining styling classes
  for (const cls of classes) {
    if (!consumed.has(cls) && !shouldPreserve(cls)) {
      consumed.add(cls);
    }
  }

  // Cap score
  score = Math.min(score, 100);

  // Build new class string
  const uiClasses = [def.uiClass, ...uiVariants];
  const newClassString = [...uiClasses, ...preserved].join(' ');

  return {
    component: componentKey,
    uiClass: def.uiClass,
    uiVariants,
    score,
    consumed: [...consumed],
    preserved,
    newClassString,
    resolvedBy,
  };
}

/**
 * Find a class in the array that matches a pattern string.
 *   - Exact: 'rounded-full' matches 'rounded-full'
 *   - Prefix (ends with -): 'bg-blue-' matches 'bg-blue-500'
 *   - Prefix (no trailing digit): 'rounded' matches 'rounded-lg'
 */
function findMatchingClass(classes, pattern) {
  const exact = classes.find(c => c === pattern);
  if (exact) return exact;

  if (pattern.endsWith('-')) {
    return classes.find(c => c.startsWith(pattern));
  }

  if (!pattern.includes('/') && !pattern.match(/\d$/)) {
    return classes.find(c => c === pattern || c.startsWith(pattern + '-'));
  }

  return null;
}

module.exports = { findBestMatch, resolveComponent };
