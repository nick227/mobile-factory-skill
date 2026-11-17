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

test('the example specs (pantry, fitness, finance) are valid', () => {
  for (const name of ['pantry', 'fitness', 'finance']) {
    const file = path.join(root, `packages/assembly/examples/${name}.spec.json`);
    const s = JSON.parse(fs.readFileSync(file, 'utf8'));
    const r = asm.validateSpec(s);
    assert.deepEqual(r.errors, [], `${name}.spec.json errors: ${r.errors.join(', ')}`);
  }
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
  // Archetype mistakes
  assert.match(errorsOf((s) => { s.pages.pantry.archetype = 'magical-grid'; }), /pages\.pantry\.archetype: one of hero-decision/);
  assert.match(errorsOf((s) => { s.pages.pantry.archetype = 'focus-wizard'; }), /pages\.pantry\.archetype: archetype 'focus-wizard' is incompatible with subject kind 'collection'/);
  assert.match(errorsOf((s) => { s.pages.pantry.archetype = 'system-settings'; }), /pages\.pantry\.archetype: archetype 'system-settings' is incompatible with subject kind 'collection'/);
  // Multi-axis design configuration mistakes
  assert.match(errorsOf((s) => { s.design.preset = 'space-station'; }), /design\.preset: minimal-pro \| kyoto-craft/);
  assert.match(errorsOf((s) => { s.design.palette = 'neon-pink'; }), /design\.palette: default \| kyoto \| midnight/);
  assert.match(errorsOf((s) => { s.design.radius = 'extra-round'; }), /design\.radius: sharp \| smooth \| curved/);
  assert.match(errorsOf((s) => { s.design.density = 'ultra-compact'; }), /design\.density: compact \| comfortable \| spacious/);
  assert.match(errorsOf((s) => { s.design.surface = 'glass'; }), /design\.surface: flat \| outlined \| elevated/);
  assert.match(errorsOf((s) => { s.design.shadow = 'heavy'; }), /design\.shadow: unknown key/);
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

test('custom subject kind is supported in spec and validated', () => {
  const s = spec();
  s.pages['custom-view'] = {
    route: '/custom',
    title: 'Custom View',
    subject: {
      kind: 'custom',
      component: 'MyCustomWidget',
      source: 'items',
    },
  };
  const r = asm.validateSpec(s);
  assert.equal(r.ok, true, r.errors.join('\n'));
});

test('Assembly Ejection Protocol: ejectPage unrolls JSX, protects file, and avoids assembly conflict', () => {
  const app = newApp();
  const init = asm.assemble(example, app);
  assert.ok(init.ok);

  const ejectRes = asm.ejectPage(example, app, 'item-new');
  assert.ok(ejectRes.ok);
  assert.equal(ejectRes.ejected, 'app/items/new.tsx');

  const content = fs.readFileSync(path.join(app, 'app/items/new.tsx'), 'utf8');
  assert.match(content, /EJECTED Monad Page/);
  assert.match(content, /ScreenHeader/);
  assert.match(content, /useSafeAreaInsets/);

  fs.appendFileSync(path.join(app, 'app/items/new.tsx'), '\n// bespoke custom modification\n');

  const s = spec();
  s.pages.pantry.title = 'Updated Pantry Title';
  fs.writeFileSync(path.join(app, 'spec.json'), JSON.stringify(s));

  const second = asm.assemble(path.join(app, 'spec.json'), app);
  assert.ok(second.ok, JSON.stringify(second.errors));
  assert.ok(second.ejected.includes('app/items/new.tsx'), 'ejected file is tracked and reported');
  assert.deepEqual(second.conflicts, [], 'no conflicts raised on ejected file');

  const updatedContent = fs.readFileSync(path.join(app, 'app/items/new.tsx'), 'utf8');
  assert.match(updatedContent, /\/\/ bespoke custom modification/);
});

const lab = path.join(root, 'apps/lab/node_modules');
test('the assembled app typechecks against the real UI, Expo Router and React Native types', { skip: !fs.existsSync(path.join(lab, 'expo-router')) && 'apps/lab dependencies not installed' }, () => {
  const app = newApp();
  assert.ok(asm.assemble(example, app).ok);
  fs.symlinkSync(lab, path.join(app, 'node_modules'));
  const r = spawnSync(process.execPath, [path.join(lab, 'typescript/bin/tsc'), '--noEmit', '-p', app], { encoding: 'utf8' });
  assert.equal(r.status, 0, r.stdout + r.stderr);
});
