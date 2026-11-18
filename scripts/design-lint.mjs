// Automated, enforceable design linter for factory mobile application specs.
// Enforces structural requirements: design directives, archetype variant compatibility,
// CTA constraints and palette contrast. Control geometry is tested against actual UI component styles.
// Visual aesthetics (hierarchy rhythm, whitespace, art direction) remain reserved for visual review.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';
import { ARCHETYPES, ARCHETYPE_VARIANTS, validateSpec } from '../factory-v1/assembler.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// Parse the canonical runtime token source, not a second hand-maintained palette map.
// This is a development-time linter; the generated application never bundles TypeScript parsing.
export function loadRuntimePalettes(tokenFile = path.join(root, 'packages/ui/src/foundation/tokens.ts')) {
  const tree = ts.createSourceFile(tokenFile, fs.readFileSync(tokenFile, 'utf8'), ts.ScriptTarget.Latest, true);
  const variable = tree.statements.filter(ts.isVariableStatement)
    .flatMap(s => [...s.declarationList.declarations])
    .find(d => d.name.getText(tree) === 'palettes');
  if (!variable || !variable.initializer || !ts.isObjectLiteralExpression(variable.initializer))
    throw Error('Design lint: could not read canonical runtime palettes');
  const parseObject = node => {
    if (!ts.isObjectLiteralExpression(node)) throw Error('Design lint: unexpected palette structure');
    return Object.fromEntries(node.properties.map(prop => {
      if (!ts.isPropertyAssignment(prop)) throw Error('Design lint: palette properties must be static');
      const name = prop.name.getText(tree).replace(/^['"]|['"]$/g,'');
      const init = prop.initializer;
      return [name, ts.isStringLiteral(init) ? init.text : parseObject(init)];
    }));
  };
  return parseObject(variable.initializer);
}
export const FACTORY_PALETTES = loadRuntimePalettes();

// Relative luminance calculator (WCAG standard)
function hexToRgb(hex) {
  const clean = hex.replace('#', '');
  const bigint = parseInt(clean, 16);
  if (clean.length === 6) {
    return [(bigint >> 16) & 255, (bigint >> 8) & 255, bigint & 255];
  }
  return [0, 0, 0];
}

function sRgbLuminance(rgb) {
  const [r, g, b] = rgb.map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrastRatio(hex1, hex2) {
  const l1 = sRgbLuminance(hexToRgb(hex1));
  const l2 = sRgbLuminance(hexToRgb(hex2));
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Lint an AppSpec against automated, enforceable design rules.
 * Returns { ok, errors, warnings }.
 */
export function lintDesign(spec) {
  const errors = [];
  const warnings = [];

  // 1. Base validation check
  const baseResult = validateSpec(spec);
  if (!baseResult.ok) {
    errors.push(...baseResult.errors);
  }

  // 2. Missing Design Directives
  if (!spec.design) {
    errors.push('$.design: missing application design configuration');
  } else {
    if (!spec.design.experience) {
      errors.push('$.design.experience: required Experience Direction configuration');
    } else {
      if (!spec.design.experience.hierarchy) {
        errors.push('$.design.experience.hierarchy: required hierarchy directive (media-led | typography-led | data-led | task-led)');
      }
      if (!spec.design.experience.motion) {
        errors.push('$.design.experience.motion: required motion directive (subtle | expressive | none)');
      }
      if (!spec.design.experience.pacing) {
        errors.push('$.design.experience.pacing: required pacing directive (compact | relaxed | monumental)');
      }
    }
  }

  // 3. Screen-level Design Directives & Variant Compatibility
  if (spec.pages && typeof spec.pages === 'object') {
    for (const [id, page] of Object.entries(spec.pages)) {
      const p = `$.pages.${id}`;
      if (page.archetype && !ARCHETYPES.includes(page.archetype)) {
        errors.push(`${p}.archetype: unsupported archetype '${page.archetype}'`);
      } else if (page.composition?.layoutVariant) {
        if (!page.archetype) {
          errors.push(`${p}.composition.layoutVariant: cannot declare layoutVariant without an explicit page archetype`);
        } else {
          const allowed = ARCHETYPE_VARIANTS[page.archetype];
          if (allowed && !allowed.includes(page.composition.layoutVariant)) {
            errors.push(`${p}.composition.layoutVariant: variant '${page.composition.layoutVariant}' is unsupported for archetype '${page.archetype}' (supported: ${allowed.join(', ')})`);
          }
        }
      }

      // 4. Multiple Competing Primary CTAs
      let primaryCount = 0;
      if (page.primary) primaryCount++;
      if (page.composition?.actionPlacement === 'header' && page.headerAction) primaryCount++;
      if (page.subject?.actions && Array.isArray(page.subject.actions)) {
        const primaryActions = page.subject.actions.filter((a) => a.tone === 'primary' || a.primary === true);
        primaryCount += primaryActions.length;
      }
      if (primaryCount > 1) {
        errors.push(`${p}: multiple competing primary CTAs detected (${primaryCount} primary actions); mobile focus requires at most 1 dominant action`);
      }

      // Actual touch-target geometry belongs to rendered UI tests, not label-length guesses.
    }
  }

  // 5. Color Contrast Verification
  const paletteName = spec.design?.palette || 'default';
  if (FACTORY_PALETTES[paletteName]) {
    const pair = FACTORY_PALETTES[paletteName];
    for (const mode of ['light', 'dark']) {
      const colors = pair[mode];
      const bgTextContrast = contrastRatio(colors.background, colors.text);
      if (bgTextContrast < 4.5) {
        errors.push(`$.design.palette: ${paletteName} (${mode}) background-to-text contrast ratio is ${bgTextContrast.toFixed(2)}:1 (fails WCAG AA 4.5:1)`);
      }
      const primaryContrast = contrastRatio(colors.primary, colors.onPrimary);
      if (primaryContrast < 3.0) {
        errors.push(`$.design.palette: ${paletteName} (${mode}) primary-to-onPrimary contrast ratio is ${primaryContrast.toFixed(2)}:1 (fails WCAG AA 3.0:1)`);
      }
    }
  }

  return {
    ok: errors.length === 0,
    errors,
    warnings,
  };
}

// CLI runner
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  let files = args;
  if (files.length === 0) {
    const examplesDir = path.join(root, 'packages/assembly/examples');
    if (fs.existsSync(examplesDir)) {
      files = fs.readdirSync(examplesDir).filter((f) => f.endsWith('.spec.json')).map((f) => path.join(examplesDir, f));
    }
  }

  let totalErrors = 0;
  for (const file of files) {
    try {
      const spec = JSON.parse(fs.readFileSync(file, 'utf8'));
      const result = lintDesign(spec);
      const rel = path.relative(root, file);
      if (result.ok) {
        console.log(`PASS: ${rel} (design verified)`);
      } else {
        console.error(`FAIL: ${rel}`);
        result.errors.forEach((e) => console.error(`  - ${e}`));
        totalErrors += result.errors.length;
      }
    } catch (e) {
      console.error(`ERROR: ${file} - ${e.message}`);
      totalErrors++;
    }
  }

  if (totalErrors > 0) {
    process.exit(1);
  }
}
