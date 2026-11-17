// Contract tests for the workflow gate evaluator (factory-v1/orchestrator.mjs):
// each segment fixture lands in its segment, gates open in order, revisions reopen only what they affect.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import * as engine from '../factory-v1/engine.mjs';
import * as plan from '../factory-v1/planner.mjs';
import * as orch from '../factory-v1/orchestrator.mjs';
import * as F from '../bench/segments/fixtures.mjs';

const work = () => fs.mkdtempSync(path.join(os.tmpdir(), 'orch-'));
const unmet = (s, seg) => (s.segments.find((x) => x.id === seg).unmet ?? []).map((u) => u.id);

test('every segment fixture is evaluated as that segment', () => {
  for (const [segment, build] of Object.entries(F.SEGMENT_FIXTURES)) {
    const dir = work();
    build(dir);
    const s = orch.status(dir);
    assert.equal(s.segment, segment, `${segment} fixture`);
    assert.equal(s.reference, `references/${segment}.md`);
    assert.ok(s.next.condition && s.next.fix, `${segment} names the next condition and how to satisfy it`);
    const index = orch.SEGMENTS.findIndex((x) => x.id === segment);
    for (const earlier of s.segments.slice(0, index)) assert.ok(earlier.complete, `${earlier.id} complete before ${segment}`);
  }
});

test('no project: points to the fast path or segment 02', () => {
  const s = orch.status(work());
  assert.equal(s.project, null);
  assert.match(s.guidance, /Fast path/);
  assert.equal(s.reference, 'references/02-discovery.md');
});

test('discovery accepts inferred facts; requirements demands confirmation', () => {
  const dir = work();
  F.discovery(dir);
  plan.record(dir, [
    { key: 'product.outcome', value: 'Track food', status: 'inferred' },
    { key: 'product.audience', value: 'Home cooks', status: 'inferred' },
    { key: 'identity.required', value: false, status: 'inferred' },
    { key: 'data.required', value: true, status: 'inferred' },
  ]);
  const s = orch.status(dir);
  assert.equal(s.segment, '03-requirements');
  assert.ok(unmet(s, '03-requirements').includes('facts:confirmed'));
  plan.confirm(dir, 'all', 'yes that is right');
  assert.ok(!unmet(orch.status(dir), '03-requirements').includes('facts:confirmed'));
});

test('documents must be fully mined before requirements complete', () => {
  const dir = work();
  F.requirements(dir);
  const s = orch.status(dir);
  assert.ok(unmet(s, '03-requirements').includes('sources:mined'));
  plan.record(dir, { skip: plan.unminedAnchors(dir) });
  assert.ok(!unmet(orch.status(dir), '03-requirements').includes('sources:mined'));
});

test('a stated fact that contradicts a confirmed one raises a conflict instead of passing silently', () => {
  const dir = work();
  plan.initProject(dir, 'Contradiction', 'lite');
  plan.confirm(dir, 'all', 'defaults are fine');
  plan.record(dir, [{ key: 'product.outcome', value: 'Journal moods', source: { id: 'chat', quote: 'journal my mood' } }, { key: 'product.audience', value: 'Me', source: { id: 'chat', quote: 'just for me' } }]);
  assert.equal(engine.load(dir).answers['data.required'], false);
  const r = plan.record(dir, { key: 'data.persistence', value: 'device storage', source: { id: 'chat', quote: 'keep entries on my phone' } });
  assert.deepEqual(r.conflicts, ['data.required']);
  const s = orch.status(dir);
  assert.equal(s.segment, '03-requirements', 'a conflicted fact counts as discussed; it is resolved in requirements');
  assert.ok(unmet(s, '03-requirements').includes('conflicts:none'));
  plan.confirm(dir, ['data.required'], 'yes it stores data', { 'data.required': true });
  assert.equal(engine.load(dir).answers['data.required'], true);
  assert.ok(!unmet(orch.status(dir), '03-requirements').includes('conflicts:none'));
});

test('a conflict resolved in favour of the existing value is not raised again', () => {
  const dir = work();
  plan.initProject(dir, 'Keep', 'lite');
  plan.confirm(dir, 'all', 'defaults are fine');
  plan.record(dir, { key: 'data.persistence', value: 'device storage', source: { id: 'chat', quote: 'remember my theme' } });
  plan.confirm(dir, ['data.required'], 'no, it is only a preference', { 'data.required': false });
  plan.record(dir, { key: 'data.persistence', value: 'device storage (prefs)', source: { id: 'chat', quote: 'just the theme preference' } });
  assert.equal(engine.load(dir).conflicts.length, 0);
});

test('design gate checks every screen contract, recipe and entity reference', () => {
  const dir = work();
  F.design(dir);
  plan.setBlueprint(dir, { screens: [{ ...F.SCREENS[0], recipe: 'recipe.not-real', entities: ['ghost'], states: ['ready'] }] });
  const s = orch.status(dir);
  const pantry = s.segments.find((x) => x.id === '04-design').unmet.find((u) => u.id === 'screen:pantry');
  assert.match(pantry.message, /loading and error/);
  assert.match(pantry.message, /Unknown recipe recipe\.not-real/);
  assert.match(pantry.message, /Unknown entity ghost/);
});

test('approval needs a user confirmation recorded at the current revision', () => {
  const dir = work();
  F.blueprint(dir);
  plan.setBlueprint(dir, { decisions: [{ type: 'user-confirmation', value: 'USER: yes' }] });
  assert.equal(orch.status(dir).next.condition, 'blueprint:approved');
  plan.setBlueprint(dir, { screens: [{ id: 'pantry', purpose: 'See items, soonest first' }] });
  const s = orch.status(dir);
  assert.equal(s.segment, '05-blueprint');
  assert.equal(s.next.condition, 'user:confirmed', 'a blueprint change after confirmation needs a fresh one');
  assert.throws(() => engine.approve(dir), /blocked/);
});

test('plan must be rebuilt after re-approval', () => {
  const dir = work();
  F.construction(dir);
  plan.setBlueprint(dir, { screens: [{ id: 'pantry', purpose: 'See items, soonest expiry first, with counts' }], decisions: [{ type: 'user-confirmation', value: 'USER: add counts' }] });
  engine.approve(dir);
  const s = orch.status(dir);
  assert.equal(s.segment, '06-catalog');
  plan.planBuild(dir);
  assert.equal(orch.status(dir).segment, '07-construction');
});

test('a late requirement change reopens the blueprint and preserves unrelated finished work', () => {
  const dir = work();
  F.revisit(dir);
  const s = orch.status(dir);
  assert.equal(s.segment, '05-blueprint');
  assert.equal(s.reopened, true);
  assert.ok(s.preservedDoneTasks >= 2);
  const p = engine.load(dir);
  assert.equal(p.tasks.find((t) => t.id === 'setup-design').status, 'done');
  assert.equal(p.tasks.find((t) => t.id === 'module-data').status, 'stale');
  assert.equal(s.segments.find((x) => x.id === '07-construction').complete, false, 'stale work keeps construction open');
});

test('verification closes only with a user-approved release', () => {
  const dir = work();
  F.verification(dir);
  for (const sc of F.SCREENS) plan.done(dir, `verify-${sc.id}`, 'tsc --noEmit exit 0; expo export android ok; visual review not done on device');
  let s = orch.status(dir);
  assert.equal(s.segment, '08-verification');
  assert.deepEqual(unmet(s, '08-verification'), ['release:authorised']);
  assert.ok(s.segments.find((x) => x.id === '08-verification').advisory.some((a) => a.id === 'gaps:none'), 'visual gaps stay visible');
  assert.throws(() => plan.done(dir, 'release-readiness', 'looks done'), /USER-APPROVED/);
  plan.done(dir, 'release-readiness', 'USER-APPROVED: ship it to TestFlight');
  s = orch.status(dir);
  assert.equal(s.segment, 'complete');
});

test('the brief carries the active segment for a fresh agent', () => {
  const dir = work();
  F.construction(dir);
  const md = plan.brief(dir, { workflow: orch.summary(dir) }).markdown;
  assert.match(md, /Active segment: \*\*07-construction\*\*/);
  assert.match(md, /references\/07-construction\.md/);
});
