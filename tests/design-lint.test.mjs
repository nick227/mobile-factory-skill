import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { lintDesign, contrastRatio, FACTORY_PALETTES, loadRuntimePalettes } from '../scripts/design-lint.mjs';
import { DESIGN_AXES, EXPERIENCE_AXES } from '../factory-v1/assembler.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const examplesDir = path.join(root, 'packages/assembly/examples');

test('Phase 3: all 5 flagship applications pass design linting with zero errors', () => {
  const flagships = ['pantry', 'finance', 'fitness', 'botanical', 'dispatch'];
  for (const name of flagships) {
    const filePath = path.join(examplesDir, `${name}.spec.json`);
    assert.ok(fs.existsSync(filePath), `Flagship spec exists: ${name}.spec.json`);
    const spec = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const result = lintDesign(spec);
    assert.deepEqual(result.errors, [], `${name}.spec.json design errors: ${result.errors.join(', ')}`);
    assert.equal(result.ok, true);
  }
});

test('Design Linter: catches missing design and experience directives', () => {
  const base = JSON.parse(fs.readFileSync(path.join(examplesDir, 'pantry.spec.json'), 'utf8'));

  // Missing spec.design
  const noDesign = { ...base };
  delete noDesign.design;
  const r1 = lintDesign(noDesign);
  assert.equal(r1.ok, false);
  assert.match(r1.errors.join('; '), /missing application design configuration/);

  // Missing spec.design.experience
  const noExp = { ...base, design: { preset: 'minimal-pro' } };
  const r2 = lintDesign(noExp);
  assert.equal(r2.ok, false);
  assert.match(r2.errors.join('; '), /required Experience Direction configuration/);

  // Missing hierarchy or pacing
  const partialExp = { ...base, design: { ...base.design, experience: { motion: 'subtle' } } };
  const r3 = lintDesign(partialExp);
  assert.equal(r3.ok, false);
  assert.match(r3.errors.join('; '), /required hierarchy directive/);
  assert.match(r3.errors.join('; '), /required pacing directive/);

  // Declaring layoutVariant without archetype
  const noArchetypeVariant = JSON.parse(JSON.stringify(base));
  delete noArchetypeVariant.pages.item.archetype;
  noArchetypeVariant.pages.item.composition = { layoutVariant: 'editorial-feature' };
  const r4 = lintDesign(noArchetypeVariant);
  assert.equal(r4.ok, false);
  assert.match(r4.errors.join('; '), /cannot declare layoutVariant without an explicit page archetype/);
});

test('Design Linter: catches unsupported composition variants', () => {
  const base = JSON.parse(fs.readFileSync(path.join(examplesDir, 'pantry.spec.json'), 'utf8'));
  base.pages.item.composition = { layoutVariant: 'nonexistent-variant' };
  const r = lintDesign(base);
  assert.equal(r.ok, false);
  assert.match(r.errors.join('; '), /variant 'nonexistent-variant' is unsupported for archetype 'content-canvas'/);
});

test('Design Linter: catches multiple competing primary CTAs without punishing single actions', () => {
  const base = JSON.parse(fs.readFileSync(path.join(examplesDir, 'finance.spec.json'), 'utf8'));
  
  // Conflicting header placement with existing primary and headerAction
  const conflicting = JSON.parse(JSON.stringify(base));
  conflicting.pages.portfolio.composition = { actionPlacement: 'header' };
  const r1 = lintDesign(conflicting);
  assert.equal(r1.ok, false);
  assert.match(r1.errors.join('; '), /multiple competing primary CTAs detected/);

  // Multiple primary actions in detail view
  const multiPrimary = JSON.parse(JSON.stringify(base));
  multiPrimary.pages.portfolio.subject.actions = [
    { label: 'Action 1', event: 'goTransfer', tone: 'primary' },
    { label: 'Action 2', event: 'goSettings', tone: 'primary' },
  ];
  const r2 = lintDesign(multiPrimary);
  assert.equal(r2.ok, false);
  assert.match(r2.errors.join('; '), /multiple competing primary CTAs detected/);
});

test('Design Linter: verifies WCAG contrast ratios across all verified factory palettes', () => {
  for (const [paletteName, pair] of Object.entries(FACTORY_PALETTES)) {
    for (const mode of ['light', 'dark']) {
      const colors = pair[mode];
      const bgTextContrast = contrastRatio(colors.background, colors.text);
      assert.ok(bgTextContrast >= 4.5, `${paletteName} (${mode}) background-to-text contrast must be >= 4.5:1 (got ${bgTextContrast.toFixed(2)})`);
      const primaryContrast = contrastRatio(colors.primary, colors.onPrimary);
      assert.ok(primaryContrast >= 3.0, `${paletteName} (${mode}) primary-to-onPrimary contrast must be >= 3.0:1 (got ${primaryContrast.toFixed(2)})`);
    }
  }
});

test('Design Linter: does not penalize sophisticated asymmetrical layouts or deliberate density variations', () => {
  const base = JSON.parse(fs.readFileSync(path.join(examplesDir, 'botanical.spec.json'), 'utf8'));
  // Priority feed bento + monumental pacing + custom margins passes cleanly
  assert.equal(base.pages.sanctuary.composition.layoutVariant, 'priority-feed');
  assert.equal(base.design.experience.pacing, 'monumental');
  const result = lintDesign(base);
  assert.equal(result.ok, true);
  assert.deepEqual(result.errors, []);
});

test('design schema, compiler, and canonical runtime palette keys stay aligned', () => {
  const schema=JSON.parse(fs.readFileSync(path.join(root,'standards/design/factory-design.schema.json'),'utf8'));
  for(const [key,options] of Object.entries(DESIGN_AXES))
    assert.deepEqual(new Set(schema.properties[key].enum),new Set(options),'schema '+key);
  for(const [key,options] of Object.entries(EXPERIENCE_AXES))
    assert.deepEqual(new Set(schema.properties.experience.properties[key].enum),new Set(options),'experience '+key);
  assert.deepEqual(Object.keys(FACTORY_PALETTES).sort(),DESIGN_AXES.palette.slice().sort());
  assert.deepEqual(FACTORY_PALETTES,loadRuntimePalettes());
  assert.equal(schema.properties.mode,undefined);
});
test('design linter no longer guesses touch geometry from short action labels', () => {
  const spec=JSON.parse(fs.readFileSync(path.join(examplesDir,'botanical.spec.json'),'utf8'));
  spec.pages.sanctuary.headerAction.label='X';
  const result=lintDesign(spec);
  assert.equal(result.ok,true);
  assert.ok(result.warnings.every(x=>!x.includes('sub-44pt')));
});
