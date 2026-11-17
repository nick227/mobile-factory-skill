import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import * as mods from '../factory-v1/modules.mjs';
import * as cat from '../factory-v1/catalog-contract.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const app = () => { const d = fs.mkdtempSync(path.join(os.tmpdir(), 'mod-app-')); fs.writeFileSync(path.join(d, 'package.json'), JSON.stringify({ dependencies: { zod: '^4.6.7' } })); return d; };
const facts = (o) => ({ facts: Object.fromEntries(Object.entries(o).map(([k, value]) => [k, { value, status: 'confirmed' }])), answers: {}, screens: [] });

test('module logic tests pass (pure logic, real Node; not device evidence)', { skip: !fs.existsSync(path.join(root, 'packages/foundations/node_modules/zod')) && 'run pnpm install first' }, () => {
  const r = spawnSync(process.execPath, ['packages/foundations/scripts/test.mjs'], { cwd: root, encoding: 'utf8' });
  assert.equal(r.status, 0, r.stdout + r.stderr);
});

test('recommendations follow blueprint facts and pull in dependencies', () => {
  const simple = mods.recommend(facts({ 'identity.required': false, 'data.required': false }));
  assert.deepEqual(simple.modules.map((m) => m.id).sort(), ['module.error-boundary', 'module.navigation']);
  const full = mods.recommend({ ...facts({ 'identity.required': true, 'data.source': 'remote REST api', 'data.persistence': 'device' }), screens: [{ components: ['controls.textfield'] }] });
  const ids = full.modules.map((m) => m.id);
  for (const id of ['module.auth', 'module.persistence', 'module.api-client', 'module.env', 'module.validation']) assert.ok(ids.includes(id), id);
  assert.match(full.expoInstall, /expo-sqlite/);
  const auth = mods.recommend(facts({ 'identity.required': true })).modules;
  assert.ok(auth.some((m) => m.id === 'module.persistence' && m.why === 'identity.required = true'), 'each module states why it was chosen');
  const inferred = { facts: { 'identity.required': { value: true, status: 'inferred' } }, answers: {}, screens: [] };
  assert.ok(!mods.recommend(inferred).modules.some((m) => m.id === 'module.auth'), 'unconfirmed facts do not select modules');
});

test('install copies modules with dependencies, reports only missing npm packages, and is idempotent', () => {
  const dir = app();
  const r = mods.install(dir, ['module.auth']);
  assert.deepEqual(r.modules.sort(), ['module.auth', 'module.error-boundary', 'module.persistence']);
  assert.ok(fs.existsSync(path.join(dir, 'src/foundations/auth/AuthProvider.tsx')));
  assert.equal(r.expoInstall, 'npx expo install expo-secure-store expo-sqlite');
  const again = mods.install(dir, ['module.auth']);
  assert.equal(again.installed.length, 0);
  assert.ok(again.identical.length > 0);
});

test('install never overwrites locally edited files and changes nothing on conflict', () => {
  const dir = app();
  mods.install(dir, ['module.persistence']);
  const edited = path.join(dir, 'src/foundations/persistence/store.ts');
  fs.writeFileSync(edited, '// app-owned edit\n');
  const before = fs.readdirSync(path.join(dir, 'src/foundations'));
  const r = mods.install(dir, ['module.persistence', 'module.validation']);
  assert.ok(r.error);
  assert.deepEqual(r.conflicts, ['src/foundations/persistence/store.ts']);
  assert.equal(fs.readFileSync(edited, 'utf8'), '// app-owned edit\n');
  assert.deepEqual(fs.readdirSync(path.join(dir, 'src/foundations')), before, 'validation was not installed either');
});

test('modules are discoverable through the shared catalog with honest maturity', () => {
  const c = cat.load();
  assert.deepEqual(c.problems, []);
  assert.equal(cat.find(c, { text: 'save data on device' })[0].id, 'module.persistence');
  assert.equal(cat.find(c, { text: 'sign in' })[0].id, 'module.auth');
  const nav = c.items.find((i) => i.id === 'module.navigation');
  assert.equal(nav.maturity.effective, 'implemented', 'no tests: not "tested"');
  assert.ok(!c.items.some((i) => i.kind === 'module' && ['verified', 'recommended'].includes(i.maturity.effective)));
});

test('every module typechecks against the real UI library and SDK 58 types', { skip: !fs.existsSync(path.join(root, 'packages/foundations/node_modules/@types/react')) && 'run pnpm install first' }, () => {
  const r = spawnSync(process.execPath, [path.join(root, 'packages/foundations/node_modules/typescript/bin/tsc'), '-p', 'packages/foundations/tsconfig.json'], { cwd: root, encoding: 'utf8' });
  assert.equal(r.status, 0, r.stdout + r.stderr);
});
