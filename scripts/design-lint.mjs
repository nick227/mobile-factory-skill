// Automated, enforceable design linter for factory mobile application specs.
// Enforces structural requirements: design directives, archetype variant compatibility,
// single primary CTA invariants, touch target geometry, and WCAG color contrast.
// Visual aesthetics (hierarchy rhythm, whitespace, art direction) remain reserved for visual review.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ARCHETYPES, ARCHETYPE_VARIANTS, validateSpec } from '../factory-v1/assembler.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// Standard verified factory color palettes
export const FACTORY_PALETTES = {
  default: {
    light: { background: '#FFFFFF', surface: '#F5F6F7', text: '#16181C', muted: '#646A72', primary: '#1D4ED8', onPrimary: '#FFFFFF' },
    dark: { background: '#101114', surface: '#1C1F23', text: '#F5F6F8', muted: '#B3B8C0', primary: '#8FB2FF', onPrimary: '#101114' },
  },
  kyoto: {
    light: { background: '#FAF8F5', surface: '#F2EFE9', text: '#241E19', muted: '#786F66', primary: '#B84A28', onPrimary: '#FFFFFF' },
    dark: { background: '#181512', surface: '#24201B', text: '#F5F0EB', muted: '#ABA094', primary: '#F07A54', onPrimary: '#181512' },
  },
  midnight: {
    light: { background: '#F8FAFC', surface: '#F1F5F9', text: '#0F172A', muted: '#64748B', primary: '#0284C7', onPrimary: '#FFFFFF' },
    dark: { background: '#090D16', surface: '#131B2E', text: '#F1F5F9', muted: '#94A3B8', primary: '#38BDF8', onPrimary: '#090D16' },
  },
  emerald: {
    light: { background: '#F7FAF8', surface: '#EEF4F0', text: '#14231B', muted: '#5E7166', primary: '#15803D', onPrimary: '#FFFFFF' },
    dark: { background: '#0D1711', surface: '#16251C', text: '#EEF6F1', muted: '#9AB0A2', primary: '#4ADE80', onPrimary: '#0D1711' },
  },
  crimson: {
    light: { background: '#FCF9F9', surface: '#F8EFEF', text: '#261316', muted: '#7D6569', primary: '#BE123C', onPrimary: '#FFFFFF' },
    dark: { background: '#170A0D', surface: '#261318', text: '#FDF2F4', muted: '#BA9DA3', primary: '#FB7185', onPrimary: '#170A0D' },
  },
  amber: {
    light: { background: '#FDFBF7', surface: '#F7F2E8', text: '#2B2113', muted: '#7A6F5E', primary: '#D97706', onPrimary: '#FFFFFF' },
    dark: { background: '#16130B', surface: '#241E12', text: '#FBF6EA', muted: '#ABA08C', primary: '#FBBF24', onPrimary: '#16130B' },
  },
};

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

      // 5. Touch Target Minimums
      if (page.headerAction && page.headerAction.label && page.headerAction.label.length < 2) {
        warnings.push(`${p}.headerAction: label '${page.headerAction.label}' may result in sub-44pt touch width without adequate padding`);
      }
    }
  }

  // 6. Color Contrast Verification
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
