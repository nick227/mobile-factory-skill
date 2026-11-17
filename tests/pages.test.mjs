import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import * as pages from '../factory-v1/pages.mjs';
import * as appTypes from '../factory-v1/app-archetypes.mjs';
import * as batches from '../factory-v1/batches.mjs';
import * as engine from '../factory-v1/engine.mjs';
import * as orch from '../factory-v1/orchestrator.mjs';
import * as F from '../bench/segments/fixtures.mjs';

const project=(type='tracker',objs=['activity'],capabilities=['activity.complete'])=>{
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'page-inventory-'));
  F.design(dir);batches.init(dir);
  batches.set(dir,'classification',{type});
  batches.set(dir,'objects',objs);
  batches.set(dir,'functionality',capabilities);
  return dir;
};
test('page catalog validates, covers each archetype default, and is deterministic',()=>{
  const cat=pages.load();
  assert.deepEqual(pages.validateCatalog(cat),[]);
  assert.deepEqual(pages.load(),cat);
  for(const app of appTypes.list()){
    assert.ok(appTypes.get(app.id).defaults.pages.every(id=>cat.some(p=>p.id===id)));
    assert.ok(pages.list(app.id).some(p=>p.route==='/'));
  }
  assert.equal(pages.get('tracker.detail').route,'/records/[id]');
});
test('catalog validates missing links, unsupported capabilities and duplicates',()=>{
  const cat=pages.load();
  assert.match(pages.validateCatalog([...cat,cat[0]]).join(' '),/duplicate/);
  assert.match(pages.validateCatalog(cat.map((p,i)=>i? p : {...p,links:['not.registered']})).join(' '),/unknown linked page/);
  assert.match(pages.validateCatalog(cat.map((p,i)=>i? p : {...p,covers:['fantasy']})).join(' '),/unknown covered capability/);
});
test('default inventory for all six apps covers the catalog-recommended capabilities',()=>{
  for(const type of appTypes.list().map(x=>x.id)){
    const app=appTypes.get(type),objs=app.defaults.objects, caps=app.defaults.capabilities;
    const spec=pages.resolve(app.defaults.pages,type,objs,caps);
    assert.equal(spec.pages.length,app.defaults.pages.length);
    assert.ok(spec.entry);
    assert.deepEqual(pages.suggest(type,objs,caps).unresolved,[]);
  }
});
test('page plan rejects unknown, wrong-app, duplicated routes, unreachable and missing capability coverage',()=>{
  const obj=['activity'];
  for(const [selected,caps,pattern] of [
    [['not.real'],['activity.complete'],/unknown page/],
    [['catalog.home'],['activity.complete'],/incompatible/],
    [['tracker.dashboard','tracker.home'],['activity.complete'],/duplicate route/],
    [['tracker.detail'],['activity.complete'],/missing root/],
    [['tracker.dashboard','tracker.create'],['activity.create'],/unreachable|capability/],
    [['tracker.dashboard'],['activity.create'],/no selected page/]
  ]) assert.throws(()=>pages.resolve(selected,'tracker',obj,caps),pattern);
  assert.doesNotThrow(()=>pages.resolve(['tracker.dashboard','tracker.create'],'tracker',obj,['activity.create']));
  assert.throws(()=>pages.resolve(['tracker.dashboard','tracker.create'],'tracker',['activity','other'],['other.create']),/no selected page/);
});
test('auth requires login and registration patterns and is reachable from root',()=>{
  assert.throws(()=>pages.resolve(['tracker.dashboard'],'tracker',['activity'],['auth.basic']),/auth.basic requires/);
  const spec=pages.resolve(['tracker.dashboard','auth.login','auth.register'],'tracker',['activity'],['auth.basic']);
  assert.equal(spec.pages.find(p=>p.id==='tracker.dashboard').links.includes('auth.login'),true);
  assert.deepEqual(pages.suggest('tracker',['activity'],['auth.basic']).unresolved,[]);
});
test('batch persistence and next expose only the current page plan',()=>{
  const dir=project();
  const next=batches.next(engine.load(dir),orch.status(dir));
  assert.equal(next.id,'pages');
  assert.equal(next.pageCatalog.some(p=>p.id==='tracker.home'),true);
  assert.equal(next.suggestedPages.pages[0],'tracker.dashboard');
  assert.equal(engine.load(dir).batches.selections.pages,undefined);
  const rev=engine.load(dir).revision;
  assert.throws(()=>batches.set(dir,'pages',['tracker.create']),/missing root/);
  assert.equal(engine.load(dir).revision,rev);
  batches.set(dir,'pages',['tracker.home']);
  const composition=batches.next(engine.load(dir),orch.status(dir));
  assert.equal(composition.id,'composition');
  assert.equal(composition.pageInventory.pages[0].object,'activity');
  assert.equal(engine.load(dir).batches.selections.pages[0],'tracker.home');
});
test('CLI and packaged page pattern catalog resolve identically',()=>{
  const dir=project();
  const run=(...args)=>spawnSync(process.execPath,['scripts/factory.mjs',...args],{encoding:'utf8'});
  const list=run('catalog','pages','--type','tracker');
  assert.equal(list.status,0,list.stderr);
  assert.ok(JSON.parse(list.stdout).some(x=>x.id==='tracker.dashboard'));
  const detail=run('catalog','page','tracker.detail');
  assert.equal(detail.status,0,detail.stderr);
  assert.equal(run('catalog','page','unknown').status,1);
  assert.equal(run('workflow','pages','--project',dir).status,1);
  batches.set(dir,'pages',['tracker.home']);
  const result=run('workflow','pages','--project',dir);
  assert.equal(result.status,0,result.stderr);
  assert.deepEqual(JSON.parse(result.stdout),pages.resolve(['tracker.home'],'tracker',['activity'],['activity.complete']));
  const pack=fs.mkdtempSync(path.join(os.tmpdir(),'page-catalog-pack-'));
  fs.writeFileSync(path.join(pack,'page-patterns.json'),JSON.stringify(pages.load()));
  assert.deepEqual(pages.load(pack),pages.load());
});
