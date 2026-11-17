import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import * as cat from '../factory-v1/catalog-contract.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const catalog = cat.load();

test('contract has no errors and covers every registered component', () => {
  assert.deepEqual(catalog.problems, []);
  const registry = JSON.parse(fs.readFileSync(path.join(root, 'packages/catalog/registry.json'), 'utf8'));
  for (const r of registry) assert.ok(catalog.items.find((i) => i.id === r.id)?.summary, `${r.id} needs a summary`);
});

test('capabilities and experiences use the controlled vocabulary', () => {
  for (const i of catalog.items) {
    for (const c of i.capabilities) assert.ok(c in catalog.vocabulary.capabilities, `${i.id}: ${c}`);
    for (const x of i.experiences) assert.ok(x in catalog.vocabulary.experiences, `${i.id}: ${x}`);
  }
});

function fixture({ status, test: testBody, evidence }) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'catalog-'));
  fs.mkdirSync(path.join(dir, 'packages/catalog'), { recursive: true });
  fs.mkdirSync(path.join(dir, 'packages/ui/src/controls'), { recursive: true });
  fs.mkdirSync(path.join(dir, 'packages/ui/tests'), { recursive: true });
  fs.writeFileSync(path.join(dir, 'packages/ui/src/controls/Thing.tsx'), "import { Image } from 'expo-image';\nexport function Thing(){return null}\n");
  if (testBody) fs.writeFileSync(path.join(dir, 'packages/ui/tests/Thing.test.tsx'), testBody);
  fs.writeFileSync(path.join(dir, 'packages/catalog/registry.json'), JSON.stringify([{ id: 'controls.thing', name: 'Thing', category: 'controls', status, source: 'controls/Thing.tsx', exportName: 'Thing', showcase: 'Thing', test: 'tests/Thing.test.tsx' }]));
  fs.writeFileSync(path.join(dir, 'packages/catalog/contracts.json'), JSON.stringify({ vocabulary: { capabilities: {}, experiences: {} }, items: { 'controls.thing': { summary: 'x', capabilities: [], experiences: [], compat: { platforms: ['ios', 'android'] }, evidence } } }));
  return cat.load(cat.layout(dir)).items[0];
}

test('a verified claim without device evidence is reported as unsupported', () => {
  const item = fixture({ status: 'verified', test: "test('x',()=>{})", evidence: [] });
  assert.equal(item.maturity.effective, 'tested');
  assert.equal(item.maturity.claimUnsupported, true);
});

test('mocked tests, types and bundles never produce verified', () => {
  const evidence = ['unit-mocked', 'types'].map((type) => ({ type, result: 'pass', date: '2026-11-16', ref: 'x' }));
  assert.equal(fixture({ status: 'verified', test: "test('x',()=>{})", evidence }).maturity.effective, 'tested');
});

test('placeholder test files do not count as tests', () => {
  assert.equal(fixture({ status: 'verified', test: '// TODO add tests\nexport const x=1;', evidence: [] }).maturity.effective, 'implemented');
});

test('passing iOS and Android evidence supports verified; one platform does not', () => {
  const ios = { type: 'ios-simulator', result: 'pass', date: '2026-11-16', ref: 'r' };
  const android = { type: 'android-device', result: 'pass', date: '2026-11-16', ref: 'r' };
  assert.equal(fixture({ status: 'verified', test: "test('x',()=>{})", evidence: [ios] }).maturity.effective, 'tested');
  assert.equal(fixture({ status: 'verified', test: "test('x',()=>{})", evidence: [ios, android] }).maturity.effective, 'verified');
  assert.equal(fixture({ status: 'verified', test: "test('x',()=>{})", evidence: [ios, { ...android, result: 'fail' }] }).maturity.effective, 'tested');
});

test('npm dependencies are derived from the import closure', () => {
  assert.deepEqual(fixture({ status: 'preview', evidence: [] }).dependencies.npm, ['expo-image']);
  assert.ok(catalog.items.find((i) => i.id === 'composites.mediaframe').dependencies.npm.includes('expo-image'));
  assert.ok(catalog.items.find((i) => i.id === 'patterns.focusscreen').dependencies.npm.includes('react-native-safe-area-context'));
});

test('search ranks by need and filters by capability prefix, experience and maturity', () => {
  assert.equal(cat.find(catalog, { text: 'image' })[0].id.includes('mediaframe') || cat.find(catalog, { text: 'image' }).some((r) => r.id === 'composites.mediaframe'), true);
  const choices = cat.find(catalog, { capability: 'input.choice' }).map((r) => r.id);
  assert.ok(choices.includes('controls.radiogroup') && choices.includes('controls.checkbox'));
  assert.ok(cat.find(catalog, { experience: 'settings' }).every((r) => catalog.items.find((i) => i.id === r.id).experiences.includes('settings')));
  assert.deepEqual(cat.find(catalog, { minMaturity: 'verified' }), cat.find(catalog, { minMaturity: 'verified' }).filter((r) => ['verified', 'recommended'].includes(r.maturity)));
});

test('role views stay compact and construct views carry warnings', () => {
  const interview = cat.view(catalog, 'controls.button', 'interview');
  assert.equal(interview.props, undefined);
  const construct = cat.view(catalog, 'patterns.focusscreen', 'construct');
  assert.match(construct.import, /import \{ FocusScreen \}/);
  assert.ok(construct.warnings.some((w) => /SafeAreaProvider/.test(w)));
  assert.ok(construct.warnings.some((w) => /native device evidence/.test(w)));
  assert.ok(JSON.stringify(construct).length < 2000, 'construct view should stay small');
});

test('every recipe typechecks against the real library', { skip: !fs.existsSync(path.join(root, 'apps/lab/node_modules/@types/react')) && 'run pnpm install first' }, () => {
  const tsc = spawnSync(process.execPath, [path.join(root, 'node_modules/typescript/bin/tsc'), '-p', 'packages/catalog/recipes/tsconfig.json'], { cwd: root, encoding: 'utf8' });
  assert.equal(tsc.status, 0, tsc.stdout + tsc.stderr);
  for (const r of catalog.items.filter((i) => i.kind === 'recipe')) assert.ok(r.uses.length && r.recipe.includes("from '@/src/ui'"), r.id);
});

test('the built skill catalogs every implemented component and its contract has no errors', () => {
  const build = spawnSync(process.execPath, ['scripts/build-skill.mjs'], { cwd: root, encoding: 'utf8' });
  assert.equal(build.status, 0, build.stderr);
  const skill = path.join(root, 'dist/mobile-development');
  const shipped = JSON.parse(fs.readFileSync(path.join(skill, 'catalog.json'), 'utf8')).map((x) => x.id).sort();
  const registered = JSON.parse(fs.readFileSync(path.join(root, 'packages/catalog/registry.json'), 'utf8')).filter((x) => !['candidate', 'development'].includes(x.status)).map((x) => x.id).sort();
  assert.deepEqual(shipped, registered);
  const dist = cat.load(cat.layout(skill));
  assert.deepEqual(dist.problems, []);
  assert.deepEqual(dist.warnings, []);
});

// Guard against contract drift: every prop (and every value of a local string-literal union)
// declared in a registered component's Props interface must be described in its contract.
test('contracts describe every current prop and union value of each component', () => {
  const registry = JSON.parse(fs.readFileSync(path.join(root, 'packages/catalog/registry.json'), 'utf8'));
  const contracts = JSON.parse(fs.readFileSync(path.join(root, 'packages/catalog/contracts.json'), 'utf8')).items;
  const drift = [];
  for (const r of registry) {
    const src = fs.readFileSync(path.join(root, 'packages/ui/src', r.source), 'utf8');
    const unions = Object.fromEntries([...src.matchAll(/export type (\w+) = ((?:\s*\|?\s*'[^']+')+);/g)].map((m) => [m[1], [...m[2].matchAll(/'([^']+)'/g)].map((x) => x[1])]));
    const start = src.search(new RegExp(`export interface ${r.exportName}Props\\b[^{]*\\{`));
    if (start < 0) continue;
    let depth = 0, body = '';
    for (let k = src.indexOf('{', start); k < src.length; k++) { const c = src[k]; if (c === '{') depth++; if (c === '}' && --depth === 0) break; body += depth === 1 ? c : ' '; }
    const text = contracts[r.id]?.props ?? '';
    for (const [, key, type] of body.matchAll(/(?:^|[;\n{])\s*([A-Za-z_]\w*)\??\s*:\s*([^;\n]+)/g)) {
      if (key === 'style') continue;
      if (!new RegExp(`\\b${key}\\b`).test(text)) drift.push(`${r.id}: prop ${key}`);
      for (const v of unions[type.trim()] ?? []) if (!text.includes(`'${v}'`)) drift.push(`${r.id}: ${key} value '${v}'`);
    }
  }
  assert.deepEqual(drift, []);
});
