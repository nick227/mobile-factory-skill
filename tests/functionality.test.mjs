import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import * as catalog from '../factory-v1/functionality.mjs';
import * as batches from '../factory-v1/batches.mjs';
import * as engine from '../factory-v1/engine.mjs';
import * as orch from '../factory-v1/orchestrator.mjs';
import * as F from '../bench/segments/fixtures.mjs';
const project=()=>{const dir=fs.mkdtempSync(path.join(os.tmpdir(),'functionality-'));F.design(dir);batches.init(dir);batches.set(dir,'classification',{type:'tracker'});batches.set(dir,'objects',['activity','session']);return dir;};

test('registry validates, has stable capability operations, and ships planning-only',()=>{
  const entries=catalog.load();
  assert.deepEqual(catalog.validateCatalog(entries),[]);
  assert.equal(entries.every(x=>x.status==='planning-only'),true);
  assert.ok(entries.some(x=>x.id==='auth.basic'));
  assert.ok(entries.some(x=>x.id==='complete'));
});
test('malformed catalogs cannot contain missing dependencies, cycles or duplicates',()=>{
  const entries=catalog.load();
  assert.match(catalog.validateCatalog([...entries,entries[0]]).join(' '),/duplicate/);
  assert.match(catalog.validateCatalog([{...entries[0],requires:['ghost']},...entries.slice(1)]).join(' '),/unknown capability/);
  assert.match(catalog.validateCatalog([{...entries[0],requires:[entries[0].id]},...entries.slice(1)]).join(' '),/self-reference/);
  assert.match(catalog.validateCatalog([{...entries[0],extra:1},...entries.slice(1)]).join(' '),/unknown field/);
});
test('capability selection validates namespace, dependencies, conflicts, duplicate IDs and syntax',()=>{
  const objects=['activity','session'];
  for(const bad of [
    ['ghost.create'],['activity.invented'],['activity.filter'],['activity.read-only','activity.create'],
    ['activity.create','activity.read-only'],['activity.create','activity.create'],['activity.bad.operation'],
    ['auth.invented']
  ]) assert.throws(()=>catalog.resolve(bad,objects));
  assert.doesNotThrow(()=>catalog.resolve(['activity.search','activity.filter','session.complete','auth.basic'],objects));
  assert.deepEqual(catalog.resolve([],objects),[]);
});
test('resolved functionality is deterministic and remains planning-only',()=>{
  const input=['activity.search','activity.filter','session.complete','auth.basic'];
  const first=catalog.resolve(input,['activity','session']);
  assert.deepEqual(first,catalog.resolve(input,['activity','session']));
  assert.equal(first[0].contract.event,'activity.search');
  assert.equal(first[0].contract.control,'activity.control.search');
  assert.equal(first[1].kind,'control');
  assert.equal(first[3].status,'planning-only');
});
test('batch rejects invalid capability selection without mutating and advances to pages',()=>{
  const dir=project(), rev=engine.load(dir).revision;
  assert.throws(()=>batches.set(dir,'functionality',['ghost.create']),/unknown object/);
  assert.equal(engine.load(dir).revision,rev);
  assert.equal(batches.nextId(engine.load(dir)),'functionality');
  batches.set(dir,'functionality',['activity.search','activity.filter','session.complete']);
  const next=batches.next(engine.load(dir),orch.status(dir));
  assert.equal(next.id,'pages');
  assert.equal(next.functionalityContract.length,3);
  assert.equal(engine.load(dir).batches.selections.pages,undefined);
  const result=batches.set(dir,'functionality',['session.complete']);
  assert.equal(result.changed,true);
  assert.equal(result.next,'pages');
});
test('CLI catalog and workflow functionality expose the same contracts',()=>{
  const dir=project();
  const run=(...args)=>spawnSync(process.execPath,['scripts/factory.mjs',...args],{encoding:'utf8'});
  const list=run('catalog','capabilities');assert.equal(list.status,0,list.stderr);
  assert.equal(JSON.parse(list.stdout).length,catalog.list().length);
  const detail=run('catalog','capability','filter');assert.equal(detail.status,0,detail.stderr);
  assert.deepEqual(JSON.parse(detail.stdout).requires,['search']);
  assert.equal(run('catalog','capability','unknown').status,1);
  const missing=run('workflow','functionality','--project',dir);assert.equal(missing.status,1);
  batches.set(dir,'functionality',['activity.complete']);
  const output=run('workflow','functionality','--project',dir);
  assert.equal(output.status,0,output.stderr);
  assert.deepEqual(JSON.parse(output.stdout),catalog.resolve(['activity.complete'],['activity','session']));
});
test('skill package fallback resolves identical capability catalog',()=>{
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'functionality-pack-'));
  fs.writeFileSync(path.join(dir,'functionality.json'),JSON.stringify(catalog.load()));
  assert.deepEqual(catalog.load(dir),catalog.load());
});
