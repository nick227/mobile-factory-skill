import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import * as appTypes from '../factory-v1/app-archetypes.mjs';
import * as batches from '../factory-v1/batches.mjs';
import * as engine from '../factory-v1/engine.mjs';
import * as orch from '../factory-v1/orchestrator.mjs';
import * as F from '../bench/segments/fixtures.mjs';

const make = () => { const dir=fs.mkdtempSync(path.join(os.tmpdir(),'app-types-')); F.design(dir); batches.init(dir); return dir; };
test('catalog IDs, defaults, and ordering are deterministic', () => {
  const first = appTypes.load(), second = appTypes.load();
  assert.deepEqual(first, second);
  assert.deepEqual(appTypes.validate(first), []);
  assert.deepEqual(appTypes.list().map(x=>x.id), ['catalog','marketplace','scheduler','social','tracker','workspace']);
  assert.deepEqual(appTypes.expand('tracker').defaults.objects, ['record']);
  assert.deepEqual(appTypes.expand('tracker'), appTypes.expand('tracker'));
});
test('catalog rejects duplicate IDs, malformed suggestions, and unsupported fields', () => {
  const entries = appTypes.load();
  assert.match(appTypes.validate([...entries, entries[0]]).join(' '), /duplicate/);
  assert.match(appTypes.validate([{ ...entries[0], defaults: {...entries[0].defaults, pages:['not valid']}}]).join(' '), /pages/);
  assert.match(appTypes.validate([{ ...entries[0], bogus:true }]).join(' '), /unsupported field/);
  assert.throws(() => appTypes.get('not-registered'), /Unknown application archetype/);
});
test('classification rejects unknown catalog IDs without changing state', () => {
  const dir=make(), before=engine.load(dir).revision;
  assert.throws(() => batches.set(dir,'classification',{type:'not-registered'}), /Unknown application archetype/);
  assert.equal(engine.load(dir).revision, before);
  assert.equal(batches.nextId(engine.load(dir)), 'classification');
});
test('selection provides defaults to only the next batch, without selecting it', () => {
  const dir=make();
  const initial=batches.next(engine.load(dir),orch.status(dir));
  assert.equal(initial.id,'classification');
  assert.deepEqual(initial.choices, appTypes.list().map(x=>x.id));
  batches.set(dir,'classification',{type:'tracker'});
  const result=batches.next(engine.load(dir),orch.status(dir));
  assert.equal(result.id,'objects');
  assert.deepEqual(result.suggestedDefaults.defaults.pages, ['tracker.dashboard','tracker.history','tracker.detail','tracker.create']);
  assert.deepEqual(Object.keys(engine.load(dir).batches.selections), ['classification']);
});
test('classification changes invalidate downstream and preserve unrelated state', () => {
  const dir=make(); batches.set(dir,'classification',{type:'tracker'}); batches.set(dir,'objects',['record']);
  const result=batches.set(dir,'classification',{type:'scheduler'});
  assert.deepEqual(result.invalidated,['objects']);
  assert.equal(engine.load(dir).batches.selections.classification.type,'scheduler');
  assert.equal(batches.nextId(engine.load(dir)),'objects');
  assert.deepEqual(batches.next(engine.load(dir),orch.status(dir)).suggestedDefaults.defaults.objects,['event']);
});
test('CLI catalog discovery works and packaged skill has the same registry contract', () => {
  const run=(...args)=>spawnSync(process.execPath,['scripts/factory.mjs',...args],{encoding:'utf8'});
  const r=run('catalog','apps'); assert.equal(r.status,0,r.stderr);
  assert.deepEqual(JSON.parse(r.stdout).map(x=>x.id),appTypes.list().map(x=>x.id));
  const detail=run('catalog','app','marketplace'); assert.equal(detail.status,0,detail.stderr);
  assert.equal(JSON.parse(detail.stdout).id,'marketplace');
  const bad=run('catalog','app','invalid'); assert.equal(bad.status,1);
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'app-catalog-pack-'));
  fs.writeFileSync(path.join(dir,'app-archetypes.json'), JSON.stringify(appTypes.load()));
  assert.deepEqual(appTypes.load(dir),appTypes.load());
});
