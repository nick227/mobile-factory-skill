import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import * as e from '../factory-v1/engine.mjs';
import * as batches from '../factory-v1/batches.mjs';
import * as editorial from '../factory-v1/editorial.mjs';
import * as generator from '../factory-v1/generate.mjs';
import * as F from '../bench/segments/fixtures.mjs';

function project(root=fs.mkdtempSync(path.join(os.tmpdir(),'factory-generation-'))){
  const dir=path.join(root,'approved-app');
  fs.mkdirSync(dir,{recursive:true});
  F.design(dir);
  batches.init(dir);
  batches.set(dir,'classification',{type:'tracker'});
  batches.set(dir,'objects',['activity']);
  batches.set(dir,'functionality',['activity.complete']);
  batches.set(dir,'pages',['tracker.home']);
  batches.set(dir,'composition',{'tracker.home':{
    kind:'detail',archetype:'glance-dashboard',bindings:{heading:'name',hero:'count'},
    actions:[{id:'activity.complete',placement:'primary',field:'done'}]
  }});
  batches.set(dir,'content',{
    pages:{'tracker.home':{title:'Today',primary:'Complete'}},
    data:{activity:[{id:'activity-one',name:'Daily walk',count:'12',done:false}]}
  });
  const hash=editorial.materialize(e.load(dir)).hash;
  batches.set(dir,'review',{passed:true,evidence:'Verified final composed spec and fixture content',specHash:hash});
  const p=e.load(dir);
  p.decisions=[{type:'user-confirmation',value:'USER: Approved this version',revision:p.revision,appSpecHash:hash}];
  e.save(dir,p);e.approve(dir);
  return dir;
}
const generated=dir=>{
  const out={};
  function walk(d){for(const name of fs.readdirSync(d)){if(name==='.factory')continue;
    const f=path.join(d,name),s=fs.statSync(f);
    if(s.isDirectory())walk(f);else out[path.relative(dir,f).replaceAll('\\','/')]=fs.readFileSync(f,'utf8');
  }}
  walk(dir);return out;
};
test('unapproved and legacy projects do not generate any files',()=>{
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'factory-unapproved-'));
  F.design(dir);
  assert.throws(()=>generator.generate(dir),/opted-in/);
  assert.equal(fs.existsSync(path.join(dir,'package.json')),false);
  batches.init(dir);
  assert.throws(()=>generator.generate(dir),/Generation blocked/);
  assert.equal(fs.existsSync(path.join(dir,'package.json')),false);
});
test('approved blueprint creates deterministic Expo routes without agent screen source',()=>{
  const dir=project();
  const p=e.load(dir);
  const result=generator.generate(dir);
  assert.equal(result.ok,true);
  assert.equal(result.mode,'create');
  assert.equal(result.appSpecHash,p.approval.appSpecHash);
  assert.ok(fs.existsSync(path.join(dir,'app/index.tsx')));
  assert.ok(fs.existsSync(path.join(dir,'src/factory/app.ts')));
  assert.ok(fs.existsSync(path.join(dir,'src/assembly/MonadPage.tsx')));
  assert.ok(fs.existsSync(path.join(dir,'src/ui/index.ts')));
  assert.ok(fs.readFileSync(path.join(dir,'app/index.tsx'),'utf8').includes('MonadPage'));
  assert.equal(fs.existsSync(path.join(dir,'app.spec.json')),false);
  assert.equal(JSON.parse(fs.readFileSync(path.join(dir,'factory-install.json'),'utf8')).installedAt,undefined);
  assert.equal(e.load(dir).approval.appSpecHash,p.approval.appSpecHash);
  const baseline=generated(dir);
  const again=generator.generate(dir);
  assert.equal(again.ok,true);
  assert.equal(again.mode,'update');
  assert.equal(again.written.length,0);
  assert.deepEqual(generated(dir),baseline);
});
test('byte-identical output from identical approved states in distinct parent directories',()=>{
  const a=project(), b=project();
  generator.generate(a);generator.generate(b);
  assert.deepEqual(generated(a),generated(b));
});
test('dry run previews but never writes to the project',()=>{
  const dir=project(),before=e.load(dir);
  const dry=generator.generate(dir,{dryRun:true});
  assert.equal(dry.ok,true);
  assert.equal(dry.mode,'create');
  assert.ok(dry.files.includes('app/index.tsx'));
  assert.equal(fs.existsSync(path.join(dir,'package.json')),false);
  assert.deepEqual(e.load(dir),before);
});
test('stale hash, stale revision and modified content all block generation',()=>{
  for(const type of ['hash','revision','content']){
    const dir=project(),p=e.load(dir);
    if(type==='hash')p.approval.appSpecHash='invalid';
    if(type==='revision')p.revision++;
    if(type==='content')p.batches.selections.content.pages['tracker.home'].title='Different';
    e.save(dir,p);
    assert.throws(()=>generator.generate(dir),/Generation blocked/);
    assert.equal(fs.existsSync(path.join(dir,'package.json')),false);
  }
});
test('existing hand-edited generated files are never overwritten',()=>{
  const dir=project();generator.generate(dir);
  const target=path.join(dir,'app/index.tsx');
  fs.appendFileSync(target,'\n// user-authored line\n');
  const before=generated(dir);
  const result=generator.generate(dir);
  assert.equal(result.ok,false);
  assert.deepEqual(result.conflicts,['app/index.tsx']);
  assert.deepEqual(generated(dir),before);
});
test('generation CLI uses only project state and fails for stale approval',()=>{
  const dir=project();
  const cmd=(...args)=>spawnSync(process.execPath,['scripts/factory.mjs','factory','generate','--project',dir,...args],{encoding:'utf8'});
  const dry=cmd('--dry-run','true');
  assert.equal(dry.status,0,dry.stderr);
  assert.equal(JSON.parse(dry.stdout).dryRun,true);
  assert.equal(fs.existsSync(path.join(dir,'package.json')),false);
  const run=cmd();
  assert.equal(run.status,0,run.stderr);
  assert.equal(JSON.parse(run.stdout).ok,true);
  const p=e.load(dir);p.approval=null;e.save(dir,p);
  const failure=cmd();
  assert.equal(failure.status,1);
  assert.match(failure.stderr,/Generation blocked/);
});
