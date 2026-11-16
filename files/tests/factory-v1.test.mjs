import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import * as f from '../factory-v1/engine.mjs';
const work=()=>fs.mkdtempSync(path.join(os.tmpdir(),'factory-v1-test-'));
const complete={
 answers:{'product.audience':'Residents','product.outcome':'Discover events','experience.navigation':'Feed to detail','design.direction':'Approved editorial style','identity.required':false,'data.required':false,'release.targets':['web']},
 screens:[{id:'home',title:'Home',purpose:'Discover events',route:'/',components:['primitives.screen','controls.button'],states:['loading','ready','error'],actions:['open detail'],acceptance:['screen renders']}],
 decisions:[{type:'user-confirmation',value:'Explicit user approval of the fictitious test project'}]
};
test('catalog uses real source and returns bounded metadata',()=>{const all=f.catalog('',100);assert.equal(all.length,32);assert.ok(f.catalogGet('patterns.focusscreen').source.endsWith('.tsx'));assert.throws(()=>f.catalogGet('patterns.nonexistent'));});
test('questions activate conditionally',()=>{const dir=work();try{f.init(dir,'Example');let qs=f.questions(f.load(dir)).map(q=>q.id);assert.ok(!qs.includes('identity.method'));f.update(dir,{answers:{'identity.required':true}});qs=f.questions(f.load(dir)).map(q=>q.id);assert.ok(qs.includes('identity.method'));}finally{fs.rmSync(dir,{recursive:true,force:true});}});
test('blueprint requires screen contract and recorded approval',()=>{const dir=work();try{f.init(dir,'Example');f.update(dir,{answers:complete.answers,screens:complete.screens});assert.equal(f.audit(f.load(dir)).ready,false);f.update(dir,{decisions:complete.decisions});assert.equal(f.audit(f.load(dir)).ready,true);f.approve(dir);assert.ok(f.load(dir).approval);}finally{fs.rmSync(dir,{recursive:true,force:true});}});
test('plan tasks have bounded dependencies, evidence and invalidation',()=>{const dir=work();try{f.init(dir,'Example');f.update(dir,complete);f.approve(dir);const plan=f.planBuild(dir);assert.equal(plan.count,5);const first=f.next(f.load(dir));assert.deepEqual(first.map(t=>t.id),['setup-project']);assert.throws(()=>f.doneTask(dir,'screen-home','unsatisfied'));f.doneTask(dir,'setup-project','Executed environment check');f.doneTask(dir,'setup-design','Installed curated UI and verified imports');assert.equal(f.packageTask(f.load(dir),'screen-home').componentContracts.length,2);f.doneTask(dir,'screen-home','Compiled and passed screen checks');f.doneTask(dir,'verify-home','Ran typecheck and visual review');assert.throws(()=>f.doneTask(dir,'release-readiness','Not authorized'));f.update(dir,{answers:{'product.outcome':'Updated product scope'}});assert.equal(f.load(dir).approval,null);assert.equal(f.load(dir).tasks.length,0);}finally{fs.rmSync(dir,{recursive:true,force:true});}});
test('export emits reproducible human-readable projections',()=>{const dir=work();try{f.init(dir,'Example');f.update(dir,complete);const result=f.exportDocs(dir);assert.equal(result.files.length,4);assert.match(fs.readFileSync(path.join(result.docs,'EXPERIENCE.md'),'utf8'),/Home/);}finally{fs.rmSync(dir,{recursive:true,force:true});}});
test('updates reject unknown fields and unsafe screen ids',()=>{const dir=work();try{f.init(dir,'Example');assert.throws(()=>f.update(dir,{evil:42}));assert.throws(()=>f.update(dir,{screens:[{id:'../bad'}]}));assert.equal(f.load(dir).revision,1);}finally{fs.rmSync(dir,{recursive:true,force:true});}});
