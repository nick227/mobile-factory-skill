// Deterministic construction: the spec validator catches agent mistakes with JSON paths, emission is
// byte-stable, hand edits are never overwritten, and the assembled app typechecks against the real UI.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import * as asm from '../factory-v1/assembler.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const example = path.join(root, 'packages/assembly/examples/pantry.spec.json');
const spec = () => JSON.parse(fs.readFileSync(example, 'utf8'));
const errorsOf = (mutate) => { const s = spec(); mutate(s); return asm.validateSpec(s).errors.join('\n'); };
function newApp() {
  const app = fs.mkdtempSync(path.join(os.tmpdir(), 'assembled-'));
  fs.cpSync(path.join(root, 'templates/expo-app'), app, { recursive: true });
  const r = spawnSync(process.execPath, [path.join(root, 'scripts/install-source.mjs'), path.join(root, 'packages/ui/src'), path.join(root, 'packages/catalog/registry.json'), app, '--all'], { encoding: 'utf8' });
  assert.equal(r.status, 0, r.stderr);
  return app;
}

test('the example spec is valid', () => {
  const r = asm.validateSpec(spec());
  assert.deepEqual(r.errors, []);
});

test('validator reports agent mistakes with a JSON path and the fix', () => {
  assert.match(errorsOf((s) => { s.pages.pantry.subject.title = '{nmae}'; }), /pages\.pantry\.subject\.title: unknown field \{nmae\} in items \(fields: id, name/);
  assert.match(errorsOf((s) => { s.pages.pantry.events.open = [{ navigate: '/item/[id]', params: { id: '{id}' } }]; }), /no page has route '\/item\/\[id\]'/);
  assert.match(errorsOf((s) => { s.pages.pantry.events.open = [{ navigate: '/items/[id]' }]; }), /needs params\.id/);
  assert.match(errorsOf((s) => { s.pages.item.events.delete = [{ remove: 'items' }, { back: true }]; }), /destructive actions \(remove\) must be wrapped in confirm/);
  assert.match(errorsOf((s) => { s.pages['item-new'].events.save = [{ back: true }]; }), /no event creates or updates from the form/);
  assert.match(errorsOf((s) => { delete s.pages.pantry.title; }), /pages\.pantry\.title: required: every page has a header/);
  assert.match(errorsOf((s) => { s.pages.item.route = '/item'; }), /read the record from route param \[id\]/);
  assert.match(errorsOf((s) => { s.pages.pantry.subject.colour = 'red'; }), /pages\.pantry\.subject\.colour: unknown key/);
  assert.match(errorsOf((s) => { s.pages.pantry.primary = { label: 'Add', event: 'nope' }; }), /event 'nope' is not defined/);
  assert.match(errorsOf((s) => { s.pages.pantry.subject.description = '{expires|ago}'; }), /unknown format \|ago/);
});

test('emission is deterministic and maps routes to Expo Router files', () => {
  assert.deepEqual(asm.emit(spec()), asm.emit(spec()));
  const files = asm.emit(spec());
  assert.ok(files['app/index.tsx'] && files['app/items/[id].tsx'] && files['app/items/[id]/edit.tsx'] && files['app/items/new.tsx']);
  for (const [f, c] of Object.entries(files)) if (f.startsWith('app/') && f !== 'app/_layout.tsx') assert.equal((c.match(/</g) ?? []).length, 1, `${f}: one generated element, no screen JSX`);
});

test('assemble replaces template placeholders, is idempotent, and never overwrites hand edits', () => {
  const app = newApp();
  const first = asm.assemble(example, app);
  assert.ok(first.ok, JSON.stringify(first.errors));
  assert.ok(first.written.includes('app/index.tsx'), 'untouched template index is replaced');
  const again = asm.assemble(example, app);
  assert.deepEqual(again.written, [], 'second run writes nothing');
  fs.appendFileSync(path.join(app, 'app/items/new.tsx'), '\n// my tweak\n');
  const s = spec(); s.pages['item-new'].title = 'New item';
  fs.writeFileSync(path.join(app, 'spec.json'), JSON.stringify(s));
  const blocked = asm.assemble(path.join(app, 'spec.json'), app);
  assert.equal(blocked.ok, false);
  assert.deepEqual(blocked.conflicts, ['app/items/new.tsx']);
  assert.match(fs.readFileSync(path.join(app, 'src/factory/app.ts'), 'utf8'), /"title": "Add item"/, 'a blocked run changes nothing');
});

test('removing a page removes its generated route', () => {
  const app = newApp();
  asm.assemble(example, app);
  const s = spec(); delete s.pages['item-edit']; s.pages.item.subject.actions = s.pages.item.subject.actions.filter((a) => a.event !== 'edit'); delete s.pages.item.events.edit;
  fs.writeFileSync(path.join(app, 'spec.json'), JSON.stringify(s));
  const r = asm.assemble(path.join(app, 'spec.json'), app);
  assert.deepEqual(r.removed, ['app/items/[id]/edit.tsx']);
  assert.ok(!fs.existsSync(path.join(app, 'app/items/[id]/edit.tsx')));
});

const lab = path.join(root, 'apps/lab/node_modules');
test('the assembled app typechecks against the real UI, Expo Router and React Native types', { skip: !fs.existsSync(path.join(lab, 'expo-router')) && 'apps/lab dependencies not installed' }, () => {
  const app = newApp();
  assert.ok(asm.assemble(example, app).ok);
  fs.symlinkSync(lab, path.join(app, 'node_modules'));
  const r = spawnSync(process.execPath, [path.join(lab, 'typescript/bin/tsc'), '--noEmit', '-p', app], { encoding: 'utf8' });
  assert.equal(r.status, 0, r.stdout + r.stderr);
});
