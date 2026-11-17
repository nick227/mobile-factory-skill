import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import * as e from '../factory-v1/engine.mjs';
import * as batches from '../factory-v1/batches.mjs';
import * as editorial from '../factory-v1/editorial.mjs';
import * as controlled from '../factory-v1/controlled-construction.mjs';
import * as generator from '../factory-v1/generate.mjs';
import * as F from '../bench/segments/fixtures.mjs';
const contract=(strategy='extension')=>({
 id:'waveform',requirement:'audio.range-selection',strategy,
 reason:'Not supported by the standard catalog',
 contract:{inputs:['audioUri'],outputs:['selectedRange']},
 acceptance:['Supports selecting audio ranges on device'],
 ...(strategy==='ejection'?{page:'tracker.home'}:{})
});
function project(strategy='extension',extra=[]){
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'engineering-construction-'));
 const dir=path.join(root,'approved-app');
 fs.mkdirSync(dir,{recursive:true});F.design(dir);batches.init(dir);
 batches.set(dir,'classification',{type:'tracker'});
 batches.set(dir,'objects',['activity']);
 batches.set(dir,'functionality',['activity.complete']);
 batches.set(dir,'pages',['tracker.home']);
 batches.set(dir,'composition',{'tracker.home':{kind:'detail',archetype:'glance-dashboard',bindings:{heading:'name',hero:'count'},actions:[{id:'activity.complete',placement:'primary',field:'done'}]}});
 batches.set(dir,'content',{pages:{'tracker.home':{title:'Today',primary:'Complete'}},data:{activity:[{id:'act-1',name:'Walk',count:'12',done:false}]},engineering:[contract(strategy),...extra]});
 const m=editorial.materialize(e.load(dir));
 batches.set(dir,'review',{passed:true,evidence:'Inspected specification and extension',specHash:m.hash,blueprintHash:m.blueprintHash});
 const p=e.load(dir);p.decisions=[{type:'user-confirmation',value:'USER: Approve scoped implementation',revision:p.revision,blueprintHash:m.blueprintHash}];e.save(dir,p);e.approve(dir);
 return dir;
}
function add(dir,rel,data){
 const full=path.join(dir,rel);fs.mkdirSync(path.dirname(full),{recursive:true});fs.writeFileSync(full,data);
}
test('prepare scaffolds only approved work and produces bounded agent tasks',()=>{
 const dir=project(),before=e.load(dir);
 assert.throws(()=>generator.generate(dir),/controlled construction/);
 const prep=controlled.prepare(dir);
 assert.equal(prep.ok,true);
 assert.equal(prep.codeStatus,'pending');
 assert.deepEqual(prep.workOrders[0].allowedSource,['src/extensions/waveform/**']);
 assert.deepEqual(prep.workOrders[0].allowedTests,['tests/engineering/waveform/**']);
 assert.ok(fs.existsSync(path.join(dir,'src/factory/app.ts')));
 assert.deepEqual(e.load(dir),before);
 const again=controlled.prepare(dir);
 assert.equal(again.unchanged,true);
 assert.deepEqual(controlled.tasks(dir).workOrders,prep.workOrders);
 const check=controlled.inspect(dir);
 assert.equal(check.scopeValid,false);
 assert.ok(check.errors.some(e=>e.includes('No changed implementation')));
 assert.equal(check.testsRan,false);
});
test('only authorized code plus owned tests pass static diff validation',()=>{
 const dir=project();controlled.prepare(dir);
 add(dir,'src/extensions/waveform/index.ts','export function range(audioUri: string) { return audioUri; }\n');
 add(dir,'tests/engineering/waveform/waveform.test.mjs',"import test from 'node:test'; test('range selection',()=>{});\n");
 const result=controlled.inspect(dir);
 assert.equal(result.scopeValid,false);
 assert.deepEqual(result.outside,[]);
 assert.equal(result.ok,false);
 assert.ok(result.errors.some(e=>e.includes('No approved ejected page')));
 assert.equal(result.contracts[0].source.length,1);
 assert.equal(result.contracts[0].tests.length,1);
});
test('extension is only accepted when imported by a separately approved ejected page',()=>{
 const dir=project('extension',[{...contract('ejection'),id:'custom-home'}]);
 controlled.prepare(dir);
 add(dir,'src/extensions/waveform/index.ts','export const range=(uri: string)=>uri;\n');
 add(dir,'tests/engineering/waveform/waveform.test.mjs',"import test from 'node:test'; test('waveform',()=>{});\n");
 add(dir,'tests/engineering/custom-home/ejection.test.mjs',"import test from 'node:test'; test('custom page',()=>{});\n");
 const target=path.join(dir,'app/index.tsx');
 let code=fs.readFileSync(target,'utf8').replace('Unrolled ejected content for tracker-home. Customize this screen directly.','Waveform-enabled screen');
 fs.writeFileSync(target,code);
 const missing=controlled.inspect(dir);
 assert.equal(missing.scopeValid,false);
 assert.ok(missing.errors.some(x=>x.includes('No approved ejected page imports')));
 code="import { range } from '@/src/extensions/waveform';\n"+code;
 fs.writeFileSync(target,code);
 const integrated=controlled.inspect(dir);
 assert.equal(integrated.scopeValid,true,integrated.errors.join('; '));
 assert.deepEqual(integrated.outside,[]);
 assert.equal(integrated.ok,false); // must still run tests and typecheck
});
test('no arbitrary edits to runtime, generated routes, config or UI, including deletions',()=>{
 for(const rel of ['src/factory/app.ts','app/index.tsx','src/ui/index.ts','package.json']){
   const dir=project();controlled.prepare(dir);
   fs.appendFileSync(path.join(dir,rel),'\n// Unauthorized\n');
   const result=controlled.inspect(dir);
   assert.equal(result.scopeValid,false,rel);
   assert.ok(result.outside.includes(rel),rel);
 }
 const dir=project();controlled.prepare(dir);
 fs.rmSync(path.join(dir,'app/index.tsx'));
 assert.equal(controlled.inspect(dir).scopeValid,false);
});
test('new files outside approved scope and symlinks are rejected',()=>{
 const dir=project();controlled.prepare(dir);
 add(dir,'src/custom/random.ts','export const arbitrary = true;\n');
 assert.equal(controlled.inspect(dir).scopeValid,false);
 fs.rmSync(path.join(dir,'src/custom/random.ts'));
 fs.symlinkSync(path.join(dir,'package.json'),path.join(dir,'src','shadow'));
 assert.throws(()=>controlled.inspect(dir),/symbolic link/);
});
test('AEP ejections are explicitly registered and remain developer-owned',()=>{
 const dir=project('ejection');
 const prep=controlled.prepare(dir);
 assert.deepEqual(prep.workOrders[0].allowedSource,['app/index.tsx']);
 const manifest=JSON.parse(fs.readFileSync(path.join(dir,'factory-assembly.json'),'utf8'));
 assert.equal(manifest.ejected['app/index.tsx'].pageId,'tracker-home');
 assert.equal(manifest.files['app/index.tsx'],undefined);
 const result=controlled.inspect(dir);
 assert.equal(result.scopeValid,false);
 assert.ok(result.errors.some(x=>x.includes('No changed implementation')));
 const prep2=controlled.prepare(dir);
 assert.equal(prep2.unchanged,true);
 const file=path.join(dir,'app/index.tsx');
 let source=fs.readFileSync(file,'utf8');
 source=source.replace('Unrolled ejected content for tracker-home. Customize this screen directly.','Custom controlled engineering view');
 fs.writeFileSync(file,source);
 add(dir,'tests/engineering/waveform/ejection.test.mjs',"import test from 'node:test'; test('custom route',()=>{});\n");
 assert.equal(controlled.inspect(dir).scopeValid,true);
 const manifest2=JSON.parse(fs.readFileSync(path.join(dir,'factory-assembly.json'),'utf8'));
 assert.equal(manifest2.ejected['app/index.tsx'].pageId,'tracker-home');
});
test('stale or tampered approvals cannot authorize editing',()=>{
 const dir=project();controlled.prepare(dir);
 const p=e.load(dir);p.approval.blueprintHash='tampered';e.save(dir,p);
 assert.throws(()=>controlled.inspect(dir),/not explicitly approved/);
 assert.throws(()=>controlled.prepare(dir),/not explicitly approved/);
});
test('CLI exposes prepare, tasks, and policy verifier; no test pass claims by default',()=>{
 const dir=project();
 const run=(...args)=>spawnSync(process.execPath,['scripts/factory.mjs','engineering',...args,'--project',dir],{encoding:'utf8'});
 const prep=run('prepare');assert.equal(prep.status,0,prep.stderr);
 const tasks=run('tasks');assert.equal(tasks.status,0,tasks.stderr);
 assert.equal(JSON.parse(tasks.stdout).workOrders[0].id,'waveform');
 const verify=run('verify');assert.equal(verify.status,1);
 const report=JSON.parse(verify.stdout);
 assert.equal(report.testsRan,false);
 assert.equal(report.scopeValid,false);
 assert.equal(report.ok,false);
});
