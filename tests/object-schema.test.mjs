import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import * as objects from '../factory-v1/object-schema.mjs';
import * as batches from '../factory-v1/batches.mjs';
import * as engine from '../factory-v1/engine.mjs';
import * as orch from '../factory-v1/orchestrator.mjs';
import * as F from '../bench/segments/fixtures.mjs';

const project = () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'objects-'));
  F.design(dir);
  batches.init(dir);
  batches.set(dir, 'classification', {type:'tracker'});
  return dir;
};
const selection = ['program', {id:'activity',relations:[{to:'program',kind:'belongs-to'}]}, {id:'session',relations:[{to:'activity',kind:'belongs-to'}]}];

test('compact objects and explicit object declarations have identical namespaces', () => {
  assert.deepEqual(objects.resolve(['activity']), objects.resolve([{id:'activity', relations:[]}]));
  assert.deepEqual(objects.resolve(['activity'])[0].namespaces,{
    data:'activity',events:'activity.',controls:'activity.control.',display:'activity.display.'
  });
  assert.deepEqual(objects.ids(selection), ['program','activity','session']);
  assert.equal(objects.resolve(selection)[2].relations[0].to,'activity');
});

test('object relationships must reference existing IDs and have valid kinds', () => {
  for(const bad of [
    [], ['program','program'], ['bad.id'], ['Activity'],
    [{id:'program',relations:[{to:'ghost',kind:'belongs-to'}]}],
    [{id:'program',relations:[{to:'program',kind:'references'}]}],
    ['a',{id:'b',relations:[{to:'a',kind:'unknown'}]}],
    ['a',{id:'b',relations:[{to:'a',kind:'belongs-to'},{to:'a',kind:'belongs-to'}]}],
    [{id:'a',unknown:true}],
    [{id:'a',relations:null}]
  ]) assert.throws(()=>objects.resolve(bad));
  assert.throws(()=>objects.resolve([{id:'a',relations:[{to:'b',kind:'belongs-to'}]},{id:'b',relations:[{to:'a',kind:'belongs-to'}]}]),/circular/);
  assert.doesNotThrow(()=>objects.resolve([{id:'a',relations:[{to:'b',kind:'references'}]},{id:'b',relations:[{to:'a',kind:'references'}]}]));
});

test('invalid object selections never change revision or erase previous state', () => {
  const dir = project(), before = engine.load(dir).revision;
  assert.throws(()=>batches.set(dir,'objects',['activity','activity']),/duplicate/);
  assert.equal(engine.load(dir).revision,before);
  assert.equal(batches.nextId(engine.load(dir)),'objects');
  const result = batches.set(dir,'objects',selection);
  assert.equal(result.changed,true);
  assert.deepEqual(engine.load(dir).batches.selections.objects,selection);
  const next = batches.next(engine.load(dir),orch.status(dir));
  assert.equal(next.id,'functionality');
  assert.deepEqual(next.objectContract,objects.resolve(selection));
  assert.equal(engine.load(dir).batches.selections.functionality,undefined);
});

test('changes to objects invalidate only downstream batches and avoid redundant writes', () => {
  const dir = project();
  batches.set(dir,'objects',selection);
  batches.set(dir,'functionality',['program.complete']);
  batches.set(dir,'pages',['tracker.dashboard']);
  const before = engine.load(dir).revision;
  const same = batches.set(dir,'objects',selection);
  assert.equal(same.changed,false);
  assert.equal(engine.load(dir).revision,before);
  const change = batches.set(dir,'objects',['program','activity']);
  assert.deepEqual(change.invalidated,['functionality','pages']);
  assert.equal(batches.nextId(engine.load(dir)),'functionality');
  assert.equal(engine.load(dir).batches.selections.classification.type,'tracker');
});

test('workflow objects CLI returns resolved namespaces and fails safely before selection', () => {
  const dir=project();
  const run=(...args)=>spawnSync(process.execPath,['scripts/factory.mjs',...args,'--project',dir],{encoding:'utf8'});
  const missing=run('workflow','objects');
  assert.equal(missing.status,1);
  batches.set(dir,'objects',selection);
  const output=run('workflow','objects');
  assert.equal(output.status,0,output.stderr);
  assert.deepEqual(JSON.parse(output.stdout),objects.resolve(selection));
});
