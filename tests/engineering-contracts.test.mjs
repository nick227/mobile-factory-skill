import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import * as contracts from '../factory-v1/engineering-contracts.mjs';
import * as e from '../factory-v1/engine.mjs';
import * as batches from '../factory-v1/batches.mjs';
import * as editorial from '../factory-v1/editorial.mjs';
import * as generator from '../factory-v1/generate.mjs';
import * as F from '../bench/segments/fixtures.mjs';
const plan={
  id:'waveform',
  requirement:'audio.range-selection',
  strategy:'extension',
  reason:'Waveform interaction absent from standard component catalog',
  contract:{inputs:['audioUri'],outputs:['selectedRange'],events:['rangeChanged']},
  acceptance:['Range selection works on iOS and Android']
};
function setup(){
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'engineering-contracts-'));
  F.design(dir);batches.init(dir);
  batches.set(dir,'classification',{type:'tracker'});
  batches.set(dir,'objects',['activity']);
  batches.set(dir,'functionality',['activity.complete']);
  batches.set(dir,'pages',['tracker.home']);
  batches.set(dir,'composition',{'tracker.home':{kind:'detail',archetype:'glance-dashboard',bindings:{heading:'name',hero:'count'},actions:[{id:'activity.complete',placement:'primary',field:'done'}]}});
  return dir;
}
const content=engineering=>({pages:{'tracker.home':{title:'Today',primary:'Complete'}},data:{activity:[{id:'act-1',name:'Walk',count:'12',done:false}]},...(engineering?{engineering}:{})});
test('valid engineering exception resolves to strict factory-owned scope without another batch',()=>{
  const dir=setup();
  batches.set(dir,'content',content([plan]));
  const result=editorial.materialize(e.load(dir));
  assert.deepEqual(result.engineering[0].scope,['src/extensions/waveform/**']);
  assert.equal(result.engineering[0].status,'planned');
  assert.notEqual(result.hash,result.blueprintHash);
  assert.equal(batches.nextId(e.load(dir)),'review');
  const cli=spawnSync(process.execPath,['scripts/factory.mjs','workflow','engineering','--project',dir],{encoding:'utf8'});
  assert.equal(cli.status,0,cli.stderr);
  assert.deepEqual(JSON.parse(cli.stdout),result.engineering);
});
test('contract validation rejects path overrides, duplicate IDs, invalid ABI and ejection without page',()=>{
  const ctx={type:'tracker',objects:['activity'],capabilities:['activity.complete'],pages:['tracker.home']};
  for(const bad of [
    {...plan,scope:['src/factory/**']},
    {...plan,contract:{inputs:['audioUri'],outputs:[],events:[]}},
    {...plan,contract:{inputs:['audioUri'],outputs:['audioUri']}},
    {...plan,strategy:'ejection',page:'tracker.detail'},
    {...plan,strategy:'adapter',page:'tracker.home'},
    {...plan,acceptance:[]},
    {...plan,id:'../bad'}
  ])assert.throws(()=>contracts.resolve([bad],ctx));
  assert.throws(()=>contracts.resolve([plan,plan],ctx),/duplicate/);
  const eject={...plan,id:'custom-home',strategy:'ejection',page:'tracker.home'};
  const out=contracts.resolve([eject],ctx);
  assert.deepEqual(out[0].scope,['app/index.tsx']);
  assert.throws(()=>contracts.resolve([eject,{...eject,id:'other-home'}],ctx),/multiple ejections/);
  const adapter={...plan,id:'remote-data',strategy:'adapter'};
  assert.deepEqual(contracts.resolve([adapter],ctx)[0].scope,['src/adapters/remote-data/**']);
});
test('engineering content errors never mutate persisted revision',()=>{
  const dir=setup(),rev=e.load(dir).revision;
  assert.throws(()=>batches.set(dir,'content',content([{...plan,scope:['src/**']}])) ,/unknown key/);
  assert.equal(e.load(dir).revision,rev);
});
test('review and user confirmation must bind full blueprint hash',()=>{
  const dir=setup();
  batches.set(dir,'content',content([plan]));
  const info=editorial.materialize(e.load(dir));
  assert.throws(()=>batches.set(dir,'review',{passed:true,evidence:'Examined',specHash:info.hash}),/blueprintHash/);
  batches.set(dir,'review',{passed:true,evidence:'Examined contract, source boundaries and acceptance criteria',specHash:info.hash,blueprintHash:info.blueprintHash});
  const p=e.load(dir);
  p.decisions=[{type:'user-confirmation',value:'USER: Approved',revision:p.revision}];e.save(dir,p);
  assert.equal(e.audit(e.load(dir)).ready,false);
  const command=spawnSync(process.execPath,['scripts/factory.mjs','workflow','confirm','--project',dir,'--quote','I approve the blueprint and extension contract'],{encoding:'utf8'});
  assert.equal(command.status,0,command.stderr);
  assert.equal(e.audit(e.load(dir)).ready,true);
  const approval=e.approve(dir);
  assert.equal(approval.blueprintHash,info.blueprintHash);
  assert.equal(editorial.approved(e.load(dir)),true);
  assert.throws(()=>generator.generate(dir),/controlled construction/);
});
test('in-place tampering of planned engineering contract invalidates approval and hash',()=>{
  const dir=setup();batches.set(dir,'content',content([plan]));
  const info=editorial.materialize(e.load(dir));
  batches.set(dir,'review',{passed:true,evidence:'Reviewed',specHash:info.hash,blueprintHash:info.blueprintHash});
  let p=e.load(dir);p.decisions=[{type:'user-confirmation',value:'USER: Approved',revision:p.revision,blueprintHash:info.blueprintHash}];e.save(dir,p);e.approve(dir);
  p=e.load(dir);p.batches.selections.content.engineering[0].reason='Modified scope rationale';
  e.save(dir,p);
  assert.equal(editorial.approved(e.load(dir)),false);
  assert.equal(e.audit(e.load(dir)).ready,false);
});
test('legacy apps without exceptions keep identical hash and approval behavior',()=>{
  const dir=setup();batches.set(dir,'content',content());
  const result=editorial.materialize(e.load(dir));
  assert.equal(result.hash,result.blueprintHash);
  assert.deepEqual(result.engineering,[]);
  batches.set(dir,'review',{passed:true,evidence:'Reviewed',specHash:result.hash});
  const p=e.load(dir);p.decisions=[{type:'user-confirmation',value:'USER: Approved',revision:p.revision}];e.save(dir,p);
  assert.equal(e.audit(e.load(dir)).ready,true);
  const approval=e.approve(dir);assert.equal(approval.blueprintHash,undefined);
  const dry=generator.generate(dir,{dryRun:true});
  assert.equal(dry.ok,true);
});
