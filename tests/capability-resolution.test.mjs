import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import * as implementations from '../factory-v1/capability-resolution.mjs';
import * as functionality from '../factory-v1/functionality.mjs';
import * as engine from '../factory-v1/engine.mjs';
import * as batches from '../factory-v1/batches.mjs';
import * as F from '../bench/segments/fixtures.mjs';
test('runtime implementation manifest covers vocabulary exactly, without production claims',()=>{
  const m=implementations.load(),v=functionality.load();
  assert.deepEqual(implementations.validateManifest(m),[]);
  assert.deepEqual(new Set(m.map(x=>x.id)),new Set(v.map(x=>x.id)));
  assert.equal(m.some(x=>x.state==='verified'),false);
  assert.equal(implementations.catalogCoverage().registered,v.length);
});
test('malformed implementation metadata is rejected, not silently guessed',()=>{
  const m=implementations.load();
  assert.match(implementations.validateManifest(m.slice(1)).join(' '),/missing view/);
  assert.match(implementations.validateManifest([...m,m[0]]).join(' '),/duplicate/);
  assert.match(implementations.validateManifest(m.map(x=>x.id==='checkout'?{...x,state:'local-mock'}:x)).join(' '),/missing-adapter/);
  assert.match(implementations.validateManifest(m.map(x=>x.id==='create'?{...x,binding:'invented'}:x)).join(' '),/unknown binding/);
  assert.match(implementations.validateManifest(m.map(x=>x.id==='auth.basic'?{...x,id:'unregistered'}:x)).join(' '),/unknown capability/);
});
test('reports auth and checkout as missing adapters, never working functionality',()=>{
  const r=implementations.resolve(['order.checkout','auth.basic','order.create'],['order']);
  assert.deepEqual(r.gaps.map(x=>x.id),['order.checkout','auth.basic']);
  assert.deepEqual(r.localOnly,['order.create']);
  assert.equal(r.productionReady,false);
  assert.equal(r.capabilities.every(x=>!x.verifiedOnDevice&&!x.productionReady),true);
});
test('local CRUD and policy are explicitly distinct, with stable output',()=>{
  const input=['activity.view','activity.create','activity.complete','activity.read-only'];
  assert.throws(()=>implementations.resolve(input,['activity']),/conflicts/);
  const selected=['activity.view','activity.complete'];
  const result=implementations.resolve(selected,['activity']);
  assert.equal(result.capabilities[1].binding,'detail-toggle');
  assert.equal(result.capabilities[1].state,'local-mock');
  assert.deepEqual(result,implementations.resolve(selected,['activity']));
  const policy=implementations.resolve(['activity.read-only'],['activity']);
  assert.equal(policy.capabilities[0].state,'policy');
});
test('workflow next and CLI expose gaps without advancing/altering selections',()=>{
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'coverage-'));
  F.design(dir);batches.init(dir);
  batches.set(dir,'classification',{type:'tracker'});
  batches.set(dir,'objects',['activity']);
  batches.set(dir,'functionality',['activity.complete']);
  const before=engine.load(dir);
  const output=spawnSync(process.execPath,['scripts/factory.mjs','workflow','capability-coverage','--project',dir],{encoding:'utf8'});
  assert.equal(output.status,0,output.stderr);
  assert.deepEqual(JSON.parse(output.stdout),implementations.resolve(['activity.complete'],['activity']));
  assert.deepEqual(engine.load(dir),before);
  const c=spawnSync(process.execPath,['scripts/factory.mjs','catalog','implementations'],{encoding:'utf8'});
  assert.equal(c.status,0,c.stderr);
  assert.equal(JSON.parse(c.stdout).length,functionality.load().length);
});
test('packaged implementation manifest supports fallback path',()=>{
  const temp=fs.mkdtempSync(path.join(os.tmpdir(),'implementations-pack-'));
  fs.writeFileSync(path.join(temp,'functionality.json'),JSON.stringify(functionality.load()));
  fs.writeFileSync(path.join(temp,'capability-implementations.json'),JSON.stringify(implementations.load()));
  assert.deepEqual(implementations.load(temp),implementations.load());
  assert.equal(implementations.resolve(['activity.complete'],['activity'],temp).capabilities[0].state,'local-mock');
});
