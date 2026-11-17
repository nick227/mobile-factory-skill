import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import * as engine from '../factory-v1/engine.mjs';
import * as plan from '../factory-v1/planner.mjs';
import * as orch from '../factory-v1/orchestrator.mjs';
import * as batches from '../factory-v1/batches.mjs';
import * as editorial from '../factory-v1/editorial.mjs';
import * as F from '../bench/segments/fixtures.mjs';

const project = () => { const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'batch-')); F.design(dir); return dir; };
const awaitedHash = dir => editorial.materialize(engine.load(dir)).hash;
const selections = {
  classification: { type: 'tracker' },
  objects: ['activity'],
  functionality: ['activity.complete'],
  pages: ['tracker.home'],
  composition: { 'tracker.home': { kind:'detail', archetype:'glance-dashboard', bindings:{heading:'name',hero:'count'}, actions:[{id:'activity.complete',placement:'primary',field:'completed'}] } },
  content: { pages: { 'tracker.home': {title:'Today'} }, data: {activity:[{id:'activity-one',name:'Daily Activity',count:'10',completed:false}]} },
  review: null,
};

test('existing projects retain their pre-batch workflow behavior', () => {
  const dir = project();
  assert.equal(engine.load(dir).batches, undefined);
  assert.equal(orch.status(dir).segment, '04-design');
  assert.equal(orch.status(dir).segments.find(s => s.id === '04-design').unmet.some(x => x.id === 'batches:complete'), false);
});

test('one ordered selection at a time, persisted and resumable', () => {
  const dir = project();
  batches.init(dir);
  assert.equal(batches.next(engine.load(dir), orch.status(dir)).id, 'classification');
  assert.throws(() => batches.set(dir, 'pages', selections.pages), /Complete classification/);
  for (const [id, selection] of Object.entries(selections)) {
    assert.equal(batches.next(engine.load(dir), orch.status(dir)).id, id);
    batches.set(dir, id, id==='review' ? {passed:true,evidence:'Reviewed all pages and content',specHash:(awaitedHash(dir))} : selection);
  }
  assert.equal(batches.complete(engine.load(dir)), true);
  assert.equal(orch.status(dir).segments.find(s => s.id === '04-design').unmet.some(x => x.id === 'batches:complete'), false);
  assert.equal(batches.next(engine.load(dir), orch.status(dir)).batchesComplete, true);
});

test('invalid input and repeat writes do not mutate revision', () => {
  const dir = project(); batches.init(dir);
  const before = engine.load(dir).revision;
  assert.throws(() => batches.set(dir, 'classification', { type: 'bad id' }), /classification/);
  assert.equal(engine.load(dir).revision, before);
  const first = batches.set(dir, 'classification', selections.classification);
  assert.equal(first.revision, before + 1);
  const repeat = batches.set(dir, 'classification', selections.classification);
  assert.equal(repeat.changed, false);
  assert.equal(repeat.revision, first.revision);
  assert.throws(() => batches.set(dir, 'objects', ['foo','foo']), /unique/);
});

test('editing earlier decisions invalidates downstream only and stales build tasks', () => {
  const dir = project(); batches.init(dir);
  for (const [id, value] of Object.entries(selections)) batches.set(dir, id, id==='review' ? {passed:true,evidence:'Reviewed content',specHash:awaitedHash(dir)} : value);
  const p = engine.load(dir);
  p.tasks = [
    { id:'setup-project', status:'done', dependsOn:[] },
    { id:'screen-home', screenId:'home', status:'done', dependsOn:['setup-project'] },
    { id:'verify-home', screenId:'home', status:'done', dependsOn:['screen-home'] },
  ];
  engine.save(dir, p);
  const r = batches.set(dir, 'functionality', ['activity.complete', 'activity.pause']);
  assert.deepEqual(r.invalidated, ['pages','composition','content','review']);
  assert.equal(batches.nextId(engine.load(dir)), 'pages');
  assert.equal(engine.load(dir).batches.selections.classification.type, 'tracker');
  assert.equal(engine.load(dir).tasks.find(t => t.id === 'setup-project').status, 'done');
  assert.equal(engine.load(dir).tasks.find(t => t.id === 'screen-home').status, 'stale');
  assert.equal(engine.load(dir).tasks.find(t => t.id === 'verify-home').status, 'stale');
  assert.ok(orch.status(dir).segments.find(s => s.id === '04-design').unmet.some(x => x.id === 'batches:complete'));
});

test('CLI workflow next and batch commands work in an existing project', () => {
  const dir = project();
  const cmd = (...args) => spawnSync(process.execPath, ['scripts/factory.mjs',...args,'--project',dir], { encoding:'utf8' });
  const init = cmd('workflow','batch','init');
  assert.equal(init.status,0,init.stderr);
  const next = cmd('workflow','next');
  assert.equal(next.status,0,next.stderr);
  assert.equal(JSON.parse(next.stdout).id,'classification');
  const f = path.join(dir, 'selection.json');
  fs.writeFileSync(f,JSON.stringify(selections.classification));
  const set = cmd('workflow','batch','set','classification','--file',f);
  assert.equal(set.status,0,set.stderr);
  assert.equal(JSON.parse(cmd('workflow','next').stdout).id,'objects');
});
