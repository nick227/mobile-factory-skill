// Content & Editorial quality evaluator for mobile applications:
// validates microcopy against mobile geometry constraints, checks exceptional states,
// lints prohibited words, and verifies seed fixtures.
import fs from 'node:fs';
import path from 'node:path';

export const BANNED_BUZZWORDS = [
  'seamless',
  'effortless',
  'synergy',
  'leverage',
  'revolutionary',
  'cutting-edge',
  'disruptive',
  'game-changing',
  'holistic',
];

export const MICROCOPY_BUDGETS = {
  headerAction: 20,
  primaryButton: 28,
  emptyTitle: 36,
  emptyDescription: 90,
  toastNotice: 60,
};

/** Lint a single text string against editorial standards. */
export function lintCopy(text, where = 'text') {
  const issues = [];
  if (!text || typeof text !== 'string') return issues;
  const lower = text.toLowerCase();
  for (const word of BANNED_BUZZWORDS) {
    const re = new RegExp(`\\b${word}\\b`, 'i');
    if (re.test(lower)) {
      issues.push(`${where}: contains prohibited buzzword "${word}". Use clear, direct user language.`);
    }
  }
  return issues;
}

/**
 * Audit content completeness and editorial quality for a factory project or app spec.
 * Returns { ok, errors, warnings, metrics }.
 */
export function auditContent({ project = null, spec = null } = {}) {
  const errors = [];
  const warnings = [];
  let screensChecked = 0;
  let pagesChecked = 0;

  // 1. Audit Project Screens if available
  if (project?.screens && Array.isArray(project.screens)) {
    for (const s of project.screens) {
      screensChecked++;
      const p = `project.screens.${s.id}`;
      if (s.title) warnings.push(...lintCopy(s.title, `${p}.title`));
      if (s.purpose) warnings.push(...lintCopy(s.purpose, `${p}.purpose`));

      // Exceptional state check: loading and error
      if (!Array.isArray(s.states) || !s.states.includes('loading') || !s.states.includes('error')) {
        errors.push(`${p}.states: screen must declare 'loading' and 'error' states`);
      }

      // Check actions: destructive actions need acceptance or confirmation
      const hasDestructive = (s.actions ?? []).some((a) => /^(delete|remove)\b/i.test(String(a)));
      if (hasDestructive) {
        const hasConfirmInAcceptance = (s.acceptance ?? []).some((acc) => /confirm|alert|destructive/i.test(acc));
        if (!hasConfirmInAcceptance) {
          warnings.push(`${p}.actions: contains destructive action (${(s.actions ?? []).filter((a) => /^(delete|remove)\b/i.test(a)).join(', ')}) without an explicit confirmation criterion in acceptance`);
        }
      }
    }
  }

  // 2. Audit App Spec if available
  if (spec?.pages && typeof spec.pages === 'object') {
    for (const [id, page] of Object.entries(spec.pages)) {
      pagesChecked++;
      const p = `spec.pages.${id}`;

      // Title & Subtitle linting
      if (page.title) warnings.push(...lintCopy(page.title, `${p}.title`));
      if (page.subtitle) warnings.push(...lintCopy(page.subtitle, `${p}.subtitle`));

      // Header Action Budget
      if (page.headerAction?.label) {
        warnings.push(...lintCopy(page.headerAction.label, `${p}.headerAction.label`));
        if (page.headerAction.label.length > MICROCOPY_BUDGETS.headerAction) {
          warnings.push(`${p}.headerAction.label: "${page.headerAction.label}" (${page.headerAction.label.length} chars) exceeds ${MICROCOPY_BUDGETS.headerAction} char budget`);
        }
      }

      // Primary Action Budget
      if (page.primary?.label) {
        warnings.push(...lintCopy(page.primary.label, `${p}.primary.label`));
        if (page.primary.label.length > MICROCOPY_BUDGETS.primaryButton) {
          warnings.push(`${p}.primary.label: "${page.primary.label}" (${page.primary.label.length} chars) exceeds ${MICROCOPY_BUDGETS.primaryButton} char budget`);
        }
      }

      // Empty State Checks
      if (page.empty) {
        if (page.empty.title) {
          warnings.push(...lintCopy(page.empty.title, `${p}.empty.title`));
          if (page.empty.title.length > MICROCOPY_BUDGETS.emptyTitle) {
            warnings.push(`${p}.empty.title: exceeds ${MICROCOPY_BUDGETS.emptyTitle} chars`);
          }
        }
        if (page.empty.description) {
          warnings.push(...lintCopy(page.empty.description, `${p}.empty.description`));
          if (page.empty.description.length > MICROCOPY_BUDGETS.emptyDescription) {
            warnings.push(`${p}.empty.description: exceeds ${MICROCOPY_BUDGETS.emptyDescription} chars`);
          }
        }
      } else if (page.subject?.kind === 'collection') {
        warnings.push(`${p}.empty: collection screens must define an empty state (title, description, action)`);
      }

      // Form Field Hints & Placeholders
      if (page.subject?.kind === 'form' && Array.isArray(page.subject.fields)) {
        page.subject.fields.forEach((f, i) => {
          if (f.label) warnings.push(...lintCopy(f.label, `${p}.subject.fields[${i}].label`));
          if (f.placeholder) warnings.push(...lintCopy(f.placeholder, `${p}.subject.fields[${i}].placeholder`));
          if (f.type !== 'toggle' && !f.placeholder && f.type !== 'date') {
            warnings.push(`${p}.subject.fields[${i}] (${f.key}): form fields should provide helpful placeholder guidance`);
          }
        });
      }

      // Destructive Actions in Events
      for (const [ev, actions] of Object.entries(page.events ?? {})) {
        const raw = JSON.stringify(actions);
        if (raw.includes('"remove":')) {
          if (!raw.includes('"confirm":') || !raw.includes('"destructive":true')) {
            errors.push(`${p}.events.${ev}: destructive 'remove' action must be guarded with confirm { destructive: true }`);
          }
        }
      }
    }
  }

  return {
    ok: errors.length === 0,
    errors,
    warnings,
    metrics: { screensChecked, pagesChecked, errorCount: errors.length, warningCount: warnings.length },
  };
}
