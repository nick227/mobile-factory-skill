import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import * as e from '../factory-v1/engine.mjs';
import * as batches from '../factory-v1/batches.mjs';
import * as editorial from '../factory-v1/editorial.mjs';
import {validateSpec} from '../factory-v1/assembler.mjs';
import * as F from '../bench/segments/fixtures.mjs';

const stages={
  classification:{type:'tracker'},
  objects:['activity'],
  functionality:['activity.complete'],
  pages:['tracker.home'],
  composition:{'tracker.home':{kind:'detail',archetype:'glance-dashboard',bindings:{heading:'name',hero:'count'},actions:[{id:'activity.complete',placement:'primary',field:'done'}]}}
};
const content={pages:{'tracker.home':{title:'Today',primary:'Mark done',subtitle:'Your latest activity'}},data:{activity:[{id:'act-1',name:'Walk',count:'12',done:false}]}};
function setup(){
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'editorial-'));
  F.design(dir);batches.init(dir);
  for(const [k,v] of Object.entries(stages))batches.set(dir,k,v);
  return dir;
}
const cmd=(dir,...args)=>spawnSync(process.execPath,['scripts/factory.mjs',...args,'--project',dir],{encoding:'utf8'});
test('content materializes exact executable spec with page copy and real fixtures',()=>{
  const dir=setup();batches.set(dir,'content',content);
  const p=e.load(dir),a=editorial.materialize(p);
  assert.equal(a.spec.pages['tracker-home'].title,'Today');
  assert.equal(a.spec.pages['tracker-home'].primary.label,'Mark done');
  assert.deepEqual(a.spec.data.activity,content.data.activity);
  assert.equal(validateSpec(a.spec).ok,true);
  assert.equal(a.hash,editorial.materialize(p).hash);
  assert.equal(JSON.parse(cmd(dir,'workflow','spec').stdout).hash,a.hash);
});
test('incomplete or unexpected editorial data cannot pass and never changes revision',()=>{
  const dir=setup(),before=e.load(dir).revision;
  for(const input of [
    {pages:{},data:content.data},
    {...content,data:{activity:[{...content.data.activity[0],name:'Sample Name'}]}},
    {...content,data:{activity:[{...content.data.activity[0],id:'activity-sample'}]}},
    {...content,data:{activity:[{...content.data.activity[0],done:'false'}]}},
    {...content,data:{activity:[{...content.data.activity[0],unexpected:1}]}},
    {...content,pages:{'tracker.home':{title:'Today',unexpected:true}}},
    {...content,pages:{'tracker.home':{title:'  '}}}
  ]) assert.throws(()=>batches.set(dir,'content',input));
  assert.equal(e.load(dir).revision,before);
});
test('review cannot approve a stale or invented spec hash',()=>{
  const dir=setup();batches.set(dir,'content',content);
  const revision=e.load(dir).revision;
  assert.throws(()=>batches.set(dir,'review',{passed:true,evidence:'Looked at pages',specHash:'bad'}),/specHash/);
  assert.equal(e.load(dir).revision,revision);
  const hash=editorial.materialize(e.load(dir)).hash;
  batches.set(dir,'review',{passed:true,evidence:'Checked page, control and fixture completeness',specHash:hash});
  assert.equal(e.audit(e.load(dir)).ready,false);
  assert.equal(e.audit(e.load(dir)).problems[0].scope,'approval');
  assert.equal(editorial.approved(e.load(dir)),false);
  assert.throws(()=>e.approve(dir),/Blueprint blocked/);
});
test('explicit revision-scoped user confirmation enables hash-locked approval',()=>{
  const dir=setup();batches.set(dir,'content',content);
  const hash=editorial.materialize(e.load(dir)).hash;
  batches.set(dir,'review',{passed:true,evidence:'Inspected generated preview',specHash:hash});
  const confirm=cmd(dir,'workflow','confirm','--quote','I approve this blueprint');
  assert.equal(confirm.status,0,confirm.stderr);
  const pre=e.audit(e.load(dir));
  assert.equal(pre.ready,true);
  assert.equal(pre.appSpecHash,hash);
  const approval=e.approve(dir);
  assert.equal(approval.appSpecHash,hash);
  assert.equal(editorial.approved(e.load(dir)),true);
  assert.equal(JSON.parse(cmd(dir,'workflow','spec').stdout).approved,true);
  const p=e.load(dir);p.batches.selections.content.pages['tracker.home'].title='Tampered';e.save(dir,p);
  assert.equal(editorial.approved(e.load(dir)),false);
  assert.equal(editorial.materialize(e.load(dir)).hash===approval.appSpecHash,false);
});
test('editing a previously approved selection reopens review and drops approval',()=>{
  const dir=setup();batches.set(dir,'content',content);
  const hash=editorial.materialize(e.load(dir)).hash;
  batches.set(dir,'review',{passed:true,evidence:'Inspection complete',specHash:hash});
  const confirm=cmd(dir,'workflow','confirm','--quote','Approved');assert.equal(confirm.status,0,confirm.stderr);
  e.approve(dir);
  const newContent=structuredClone(content);newContent.pages['tracker.home'].title='Later';
  const result=batches.set(dir,'content',newContent);
  assert.deepEqual(result.invalidated,['review']);
  assert.equal(e.load(dir).approval,null);
  assert.equal(editorial.approved(e.load(dir)),false);
  assert.equal(batches.nextId(e.load(dir)),'review');
  assert.equal(e.audit(e.load(dir)).ready,false);
});
test('user consent cannot be fabricated by an empty quote or stale revision',()=>{
  const dir=setup();batches.set(dir,'content',content);
  const hash=editorial.materialize(e.load(dir)).hash;
  batches.set(dir,'review',{passed:true,evidence:'Inspection complete',specHash:hash});
  assert.equal(cmd(dir,'workflow','confirm','--quote',' ').status,1);
  assert.equal(cmd(dir,'workflow','confirm','--quote','Okay').status,0);
  const p=e.load(dir);p.decisions[0].revision=p.revision-1;e.save(dir,p);
  assert.equal(editorial.audit(e.load(dir)).ready,false);
});
