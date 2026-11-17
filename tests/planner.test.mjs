import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import * as engine from '../factory-v1/engine.mjs';
import * as plan from '../factory-v1/planner.mjs';

const work = () => fs.mkdtempSync(path.join(os.tmpdir(), 'planner-'));
const doc = (dir, name, text) => { const f = path.join(dir, name); fs.writeFileSync(f, text); return f; };
const SPEC = `# Block Party

## Platform
- Expo app for **iOS and Android**.
- No backend; use a mock API.

## Screens
The events list shows upcoming events with search.

RSVP state **persists locally** across restarts.
`;
const screens = [
  { id: 'events', title: 'Events', purpose: 'Browse events', route: '/', components: ['primitives.screen', 'composites.listitem'], states: ['loading', 'error', 'ready'], actions: ['open'], acceptance: ['lists events'] },
  { id: 'detail', title: 'Event', purpose: 'RSVP', route: '/events/[id]', basis: ['data.persistence'], components: ['composites.mediaframe', 'controls.button'], states: ['loading', 'error'], actions: ['rsvp'], acceptance: ['rsvp persists'] },
];
function approvedProject(dir) {
  plan.initProject(dir, 'Block Party', 'lite');
  plan.record(dir, [
    { key: 'product.outcome', value: 'Find events and RSVP', source: { id: 'chat', quote: 'find events and RSVP' } },
    { key: 'product.audience', value: 'Neighbors', source: { id: 'chat', quote: 'for my neighbors' } },
    { key: 'data.persistence', value: 'device storage', source: { id: 'chat', quote: 'save RSVPs on the phone' } },
  ]);
  plan.confirm(dir, 'all', 'Yes, go with those defaults', { 'data.required': true });
  plan.setBlueprint(dir, { screens, entities: [{ id: 'event', fields: { title: 'string(3..80)', date: 'date' } }], decisions: [{ type: 'user-confirmation', value: 'USER: approved plan' }] });
  engine.approve(dir);
  plan.planBuild(dir);
}

test('lite mode proposes defaults, asks one batched confirmation, and projects only after confirmation', () => {
  const dir = work();
  plan.initProject(dir, 'Timer', 'lite');
  let p = engine.load(dir);
  assert.equal(p.answers['identity.required'], undefined, 'proposed facts are not answers yet');
  const first = plan.next(dir).items[0];
  assert.equal(first.kind, 'confirm-assumptions');
  assert.ok('design.direction' in first.facts);
  plan.confirm(dir, 'all', 'sounds good');
  p = engine.load(dir);
  assert.equal(p.answers['identity.required'], false);
  assert.ok(!plan.next(dir).items.some((i) => i.key === 'identity.required'), 'answered questions are not asked again');
  assert.ok(plan.next(dir).items.filter((i) => i.kind === 'ask').length <= 3, 'lite mode keeps the interview short');
});

test('stated facts need provenance; quotes are verified against the archived source', () => {
  const dir = work();
  plan.initProject(dir, 'X');
  assert.throws(() => plan.record(dir, { key: 'product.outcome', value: 'x' }), /needs a source quote/);
  const { id } = plan.addSource(dir, doc(dir, 'spec.md', SPEC));
  const anchors = JSON.parse(fs.readFileSync(path.join(dir, '.factory/sources', `${id}.json`), 'utf8')).anchors;
  const platform = anchors.find((a) => /iOS and Android/.test(a.text));
  assert.equal(platform.heading, 'Block Party › Platform');
  assert.throws(() => plan.record(dir, [
    { key: 'release.targets', value: ['ios', 'android'], source: { anchor: platform.id, quote: 'iOS and Android' } },
    { key: 'data.source', value: 'api', source: { anchor: platform.id, quote: 'a REST backend' } },
  ]), /not found verbatim/);
  assert.equal(engine.load(dir).facts['release.targets'], undefined, 'a failed batch saves nothing');
  plan.record(dir, { key: 'release.targets', value: ['ios', 'android'], source: { anchor: platform.id, quote: 'iOS and Android' } });
  plan.record(dir, { key: 'product.name', value: 'Block Party', source: { anchor: anchors[0].id, quote: 'Block Party' } });
  assert.deepEqual(engine.load(dir).answers['release.targets'], ['ios', 'android']);
});

test('documents are mined before the user is asked, and every anchor must be cited or skipped', () => {
  const dir = work();
  plan.initProject(dir, 'X');
  plan.addSource(dir, doc(dir, 'spec.md', SPEC));
  const items = plan.next(dir).items;
  assert.equal(items[0].kind, 'mine-source');
  assert.ok(!items.some((i) => i.kind === 'ask'), 'no user questions while the document is unmined');
  const ids = items[0].anchors.map((a) => a.id);
  plan.record(dir, { skip: ids });
  assert.ok(!plan.next(dir).items.some((i) => i.kind === 'mine-source'));
  assert.ok(plan.next(dir).items.some((i) => i.kind === 'ask'));
});

test('conflicting documents are kept side by side until the user resolves them', () => {
  const dir = work();
  plan.initProject(dir, 'X');
  const a = plan.addSource(dir, doc(dir, 'v1.md', SPEC));
  const b = plan.addSource(dir, doc(dir, 'v2.md', SPEC.replace('iOS and Android', 'iOS only')));
  const anchor = (sid, re) => JSON.parse(fs.readFileSync(path.join(dir, '.factory/sources', `${sid}.json`), 'utf8')).anchors.find((x) => re.test(x.text)).id;
  plan.record(dir, { key: 'release.targets', value: ['ios', 'android'], source: { anchor: anchor(a.id, /iOS and Android/), quote: 'iOS and Android' } });
  const r = plan.record(dir, { key: 'release.targets', value: ['ios'], source: { anchor: anchor(b.id, /iOS only/), quote: 'iOS only' } });
  assert.deepEqual(r.conflicts, ['release.targets']);
  assert.equal(engine.load(dir).answers['release.targets'], undefined, 'conflicted facts are not projected');
  assert.equal(plan.next(dir).items[0].kind, 'resolve-conflict');
  assert.throws(() => plan.confirm(dir, ['release.targets'], 'android too'), /pass the chosen value/);
  plan.confirm(dir, ['release.targets'], 'both platforms', { 'release.targets': ['ios', 'android'] });
  assert.deepEqual(engine.load(dir).answers['release.targets'], ['ios', 'android']);
  assert.ok(!plan.next(dir).items.some((i) => i.kind === 'resolve-conflict'));
});

test('a revised document only needs its changed paragraphs mined', () => {
  const dir = work();
  plan.initProject(dir, 'X');
  const v1 = plan.addSource(dir, doc(dir, 'v1.md', SPEC));
  const all = JSON.parse(fs.readFileSync(path.join(dir, '.factory/sources', `${v1.id}.json`), 'utf8')).anchors.map((a) => a.id);
  plan.record(dir, { skip: all });
  const v2 = plan.addSource(dir, doc(dir, 'v2.md', SPEC + '\nOrganizers can cancel events.\n'));
  assert.equal(v2.toMine, 1);
  const mine = plan.next(dir).items.filter((i) => i.kind === 'mine-source');
  assert.equal(mine.length, 1);
  assert.match(mine[0].anchors[0].text, /cancel events/);
  assert.equal(plan.addSource(dir, doc(dir, 'v2-copy.md', SPEC + '\nOrganizers can cancel events.\n')).unchanged, true, 're-adding identical bytes is a no-op');
});

test('revising one decision invalidates approval but only stales dependent work', () => {
  const dir = work();
  approvedProject(dir);
  for (const id of ['setup-project', 'setup-design', 'module-data', 'screen-events', 'verify-events']) plan.done(dir, id, 'tsc --noEmit exit 0');
  const r = plan.record(dir, { key: 'data.persistence', value: 'SQLite', source: { id: 'chat', quote: 'use sqlite instead' } });
  const p = engine.load(dir);
  assert.equal(p.approval, null);
  assert.ok(r.staleTasks.includes('module-data'));
  assert.equal(p.tasks.find((t) => t.id === 'screen-detail').status, 'todo', 'not-started work is untouched');
  assert.equal(p.tasks.find((t) => t.id === 'screen-events').status, 'stale', 'screen-events depends on stale module-data, so it is re-checked');
  assert.equal(p.tasks.find((t) => t.id === 'setup-design').status, 'done', 'unrelated work survives');
  assert.equal(p.facts['data.persistence'].history[0].value, 'device storage', 'history keeps the old decision');
  plan.record(dir, { key: 'product.audience', value: 'Neighbors', source: { id: 'chat', quote: 'for my neighbors' } });
  assert.throws(() => engine.approve(dir), /blocked/, 'the earlier user confirmation does not cover the revised blueprint');
  plan.setBlueprint(dir, { decisions: [{ type: 'user-confirmation', value: 'USER: SQLite is fine, go ahead' }] });
  engine.approve(dir);
  const re = plan.planBuild(dir);
  assert.ok(re.keptDone >= 2, 'replanning keeps finished work');
  assert.equal(engine.load(dir).tasks.find((t) => t.id === 'module-data').status, 'todo');
});

test('a global design change re-checks every screen but not infrastructure', () => {
  const dir = work();
  approvedProject(dir);
  plan.done(dir, 'setup-project', 'npx expo export ok');
  const r = plan.record(dir, { key: 'design.direction', value: 'Editorial', source: { id: 'chat', quote: 'make it editorial' } });
  assert.equal(engine.load(dir).tasks.find((t) => t.id === 'setup-project').status, 'done');
  assert.deepEqual(r.staleTasks, [], 'no screen task was done yet, so nothing finished is lost');
});

test('blueprint set merges by id, accepts string entities, validates field types', () => {
  const dir = work();
  plan.initProject(dir, 'X');
  plan.setBlueprint(dir, { screens: [screens[0]], entities: ['User', 'Event'] });
  plan.setBlueprint(dir, { screens: [{ id: 'events', purpose: 'Browse upcoming events' }] });
  const p = engine.load(dir);
  assert.equal(p.screens[0].route, '/', 'merge keeps unspecified fields');
  assert.equal(p.screens[0].purpose, 'Browse upcoming events');
  assert.deepEqual(p.entities.map((e) => e.id), ['user', 'event']);
  assert.throws(() => plan.setBlueprint(dir, { entities: [{ id: 'event', fields: { when: 'timestamp' } }] }), /Invalid type/);
  assert.throws(() => plan.setBlueprint(dir, { answers: {} }), /interview record/);
});

test('typed data model produces TypeScript interfaces', () => {
  const ts = plan.typescriptModel([{ id: 'event', fields: { title: 'string(3..80)', date: 'date', status: 'enum(draft|live)', tags: 'string[]', venueId: 'ref(venue)', note: 'text?' } }]);
  assert.match(ts, /export interface Event \{/);
  assert.match(ts, /title: string; \/\/ length 3\.\.80/);
  assert.match(ts, /status: 'draft' \| 'live';/);
  assert.match(ts, /tags: string\[\];/);
  assert.match(ts, /venueId: string; \/\/ venue id/);
  assert.match(ts, /note\?: string;/);
});

test('wireframes are deterministic, fixed width, and put actions in the dock', () => {
  const s = { id: 'new', title: 'New event', route: '/events/new', components: ['patterns.focusscreen', 'controls.textfield', 'controls.button'], states: ['editing', 'saving'] };
  const a = plan.wireframe(s);
  assert.equal(a, plan.wireframe(s));
  for (const row of a.split('\n').filter((r) => /^[│┌├└]/.test(r))) assert.equal([...row].length, 36, row);
  const lines = a.split('\n');
  assert.ok(lines.findIndex((l) => l.includes('[ Primary action ]') || l.includes('[ Action ]')) > lines.findLastIndex((l) => l.startsWith('├')), 'action renders below the dock divider');
});

test('task packages are compact and carry construct views, recipe and wireframe', () => {
  const dir = work();
  approvedProject(dir);
  const p = engine.load(dir);
  p.screens[0].recipe = 'recipe.collection-screen';
  engine.save(dir, p);
  const pkg = plan.taskPackage(dir, 'screen-events');
  assert.match(pkg.components.find((c) => c.id === 'composites.listitem').import, /from '@\/src\/ui'/);
  assert.match(pkg.recipe.code, /FlatList/);
  assert.match(pkg.screen.wireframe, /EVENTS/);
  assert.ok(JSON.stringify(pkg).length < 9000, `package is ${JSON.stringify(pkg).length} chars`);
});

test('task completion requires executed-check evidence and honest device claims', () => {
  const dir = work();
  approvedProject(dir);
  assert.throws(() => plan.done(dir, 'setup-project', 'looks good'), /checks you actually ran/);
  assert.throws(() => plan.done(dir, 'setup-project', 'tsc passed; tested on device, works'), /platform and OS version/);
  plan.done(dir, 'setup-project', 'tsc --noEmit exit 0; no device testing done');
});

test('the fresh-agent brief is small and states approval status', () => {
  const dir = work();
  approvedProject(dir);
  const b = plan.brief(dir);
  assert.match(b.markdown, /APPROVED/);
  assert.match(b.markdown, /export interface Event/);
  assert.ok(b.tokensApprox < 1500, `brief ~${b.tokensApprox} tokens`);
  for (const f of ['BRIEF.md', 'SCREENS.md', 'DECISIONS.md', 'model.ts']) assert.ok(fs.existsSync(path.join(dir, '.factory/docs', f)), f);
});

// Regressions from benchmark run 3 (improved factory).
test('recipe ids listed as components are moved to screen.recipe so audit accepts them', () => {
  const dir = work();
  plan.initProject(dir, 'X');
  const r = plan.setBlueprint(dir, { screens: [{ ...screens[0], components: ['recipe.collection-screen', 'composites.listitem'] }] });
  const s = engine.load(dir).screens[0];
  assert.equal(s.recipe, 'recipe.collection-screen');
  assert.deepEqual(s.components, ['composites.listitem']);
  assert.match(r.notes[0], /moved recipe.collection-screen/);
  assert.ok(!engine.audit(engine.load(dir)).problems.some((x) => /Unknown catalog component/.test(x.message)));
});

test('stated persistence overrides an unconfirmed lite default and asks for confirmation', () => {
  const dir = work();
  plan.initProject(dir, 'X', 'lite');
  const r = plan.record(dir, { key: 'data.persistence', value: 'device storage for RSVPs', source: { id: 'chat', quote: 'RSVPs survive restarts' } });
  assert.match(r.implied[0], /data.required = true/);
  assert.equal(engine.load(dir).facts['data.required'].status, 'inferred');
  assert.equal(plan.next(dir).items[0].facts['data.required'], true);
  plan.record(dir, { key: 'data.required', value: false, status: 'confirmed', source: { id: 'chat', quote: 'actually no data' } });
  plan.record(dir, { key: 'data.source', value: 'local', source: { id: 'chat', quote: 'local' } });
  assert.equal(engine.load(dir).facts['data.required'].value, false, 'confirmed facts are never overridden');
});

test('verify tasks done without device or browser evidence keep a visible gap', () => {
  const dir = work();
  approvedProject(dir);
  for (const id of ['setup-project', 'setup-design', 'module-data', 'screen-events']) plan.done(dir, id, 'tsc --noEmit exit 0');
  const r = plan.done(dir, 'verify-events', 'tsc --noEmit exit 0; expo export android ok; no device testing');
  assert.deepEqual(r.gaps, ['visual review: no device/browser evidence recorded']);
  assert.match(plan.brief(dir, { write: false }).markdown, /Unverified[\s\S]*verify-events/);
});
