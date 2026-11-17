// Regression checks from the independent quality review (docs/reviews/).
// Tests marked `todo` encode a defect in files owned by the UI foundation
// workstream: they report on every run without failing the suite. When the
// owner fixes the defect, remove `todo` so the check becomes a guard.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as cat from '../factory-v1/catalog-contract.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]));

test('Q1: no registry status claims more maturity than recorded evidence supports', { todo: 'owner: UI foundation — 18 components are "verified" with no device evidence' }, () => {
  const unsupported = cat.load().items.filter((i) => i.maturity.claimUnsupported).map((i) => `${i.id} (claims ${i.maturity.claimed}, supports ${i.maturity.effective})`);
  assert.deepEqual(unsupported, []);
});

const rnRoles = (() => {
  const file = path.join(root, 'packages/foundations/node_modules/react-native/types_generated/Libraries/Components/View/ViewAccessibility.d.ts');
  if (!fs.existsSync(file)) return null;
  const line = fs.readFileSync(file, 'utf8').split('\n').find((l) => l.startsWith('export type AccessibilityRole ='));
  return new Set([...line.matchAll(/"([a-z]+)"/g)].map((m) => m[1]));
})();

test('Q2: every accessibilityRole literal is a real React Native AccessibilityRole', { skip: !rnRoles && 'run pnpm install first', todo: 'owner: UI foundation — Dialog uses accessibilityRole="dialog" (use role="dialog")' }, () => {
  // React Native's types accept any string here, so only this check catches it.
  const bad = [];
  for (const file of walk(path.join(root, 'packages/ui/src')).filter((f) => f.endsWith('.tsx'))) {
    for (const m of fs.readFileSync(file, 'utf8').matchAll(/accessibilityRole=\{?["']([a-z]+)["']/g)) if (!rnRoles.has(m[1])) bad.push(`${path.relative(root, file)}: ${m[1]}`);
  }
  assert.deepEqual(bad, []);
});

test('Q3: the UI library is typechecked against real react-native types, not test mocks', { todo: 'owner: UI foundation — tsconfig.base.json paths map react-native/expo-image/safe-area to tests/mocks' }, () => {
  const base = JSON.parse(fs.readFileSync(path.join(root, 'tsconfig.base.json'), 'utf8'));
  const mapped = Object.entries(base.compilerOptions?.paths ?? {}).filter(([, targets]) => targets.some((t) => t.includes('mocks'))).map(([k]) => k);
  assert.deepEqual(mapped, [], 'move mock mappings into a tests-only tsconfig');
});

test('Q4: mocked component tests are labelled as mocked in the catalog (never device evidence)', () => {
  for (const i of cat.load().items.filter((x) => x.kind === 'component' && x.maturity.basis.includes('mocked'))) {
    assert.ok(!['verified', 'recommended'].includes(i.maturity.effective), i.id);
  }
});

