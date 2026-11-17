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
test('catalog uses real source and returns bounded metadata',()=>{const all=f.catalog('',100);assert.ok(all.length >= 32);assert.ok(f.catalogGet('patterns.focusscreen').source.endsWith('.tsx'));assert.throws(()=>f.catalogGet('patterns.nonexistent'));});
test('questions activate conditionally',()=>{const dir=work();try{f.init(dir,'Example');let qs=f.questions(f.load(dir)).map(q=>q.id);assert.ok(!qs.includes('identity.method'));f.update(dir,{answers:{'identity.required':true}});qs=f.questions(f.load(dir)).map(q=>q.id);assert.ok(qs.includes('identity.method'));}finally{fs.rmSync(dir,{recursive:true,force:true});}});
test('blueprint requires screen contract and recorded approval',()=>{const dir=work();try{f.init(dir,'Example');f.update(dir,{answers:complete.answers,screens:complete.screens});assert.equal(f.audit(f.load(dir)).ready,false);f.update(dir,{decisions:complete.decisions});assert.equal(f.audit(f.load(dir)).ready,true);f.approve(dir);assert.ok(f.load(dir).approval);}finally{fs.rmSync(dir,{recursive:true,force:true});}});
test('plan tasks have bounded dependencies, evidence and invalidation',()=>{const dir=work();try{f.init(dir,'Example');f.update(dir,complete);f.approve(dir);const plan=f.planBuild(dir);assert.equal(plan.count,5);const first=f.next(f.load(dir));assert.deepEqual(first.map(t=>t.id),['setup-project']);assert.throws(()=>f.doneTask(dir,'screen-home','unsatisfied'));f.doneTask(dir,'setup-project','Executed environment check');f.doneTask(dir,'setup-design','Installed curated UI and verified imports');assert.equal(f.packageTask(f.load(dir),'screen-home').componentContracts.length,2);f.doneTask(dir,'screen-home','Compiled and passed screen checks');f.doneTask(dir,'verify-home','Ran typecheck and visual review');assert.throws(()=>f.doneTask(dir,'release-readiness','Not authorized'));f.update(dir,{answers:{'product.outcome':'Updated product scope'}});const loaded=f.load(dir);assert.equal(loaded.approval,null);assert.equal(loaded.tasks.length,5);const setupProj=loaded.tasks.find(t=>t.id==='setup-project');assert.equal(setupProj.status,'done');assert.equal(setupProj.evidence,'Executed environment check');const screenHome=loaded.tasks.find(t=>t.id==='screen-home');assert.equal(screenHome.status,'stale');assert.equal(screenHome.priorEvidence,'Compiled and passed screen checks');assert.equal(screenHome.history.length,1);f.approve(dir);const replan=f.planBuild(dir);assert.equal(replan.count,5);const pkg=f.packageTask(f.load(dir),'screen-home');assert.equal(pkg.status,'todo');assert.equal(pkg.priorEvidence,'Compiled and passed screen checks');}finally{fs.rmSync(dir,{recursive:true,force:true});}});
test('incremental updates merge by ID without silent data loss',()=>{const dir=work();try{f.init(dir,'MergeTest');f.update(dir,{screens:[{id:'feed',title:'Feed',purpose:'Browse',route:'/feed',components:['primitives.screen'],states:['loading','error'],actions:[],acceptance:['ok']}]});assert.equal(f.load(dir).screens.length,1);f.update(dir,{screens:[{id:'profile',title:'Profile',purpose:'User',route:'/profile',components:['primitives.screen'],states:['loading','error'],actions:[],acceptance:['ok']}]});assert.equal(f.load(dir).screens.length,2);assert.equal(f.load(dir).screens[0].id,'feed');assert.equal(f.load(dir).screens[1].id,'profile');f.update(dir,{screens:[{id:'feed',purpose:'Browse articles'}]});const feed=f.load(dir).screens.find(s=>s.id==='feed');assert.equal(feed.purpose,'Browse articles');assert.equal(feed.route,'/feed');f.update(dir,{remove:{screens:['profile']}});assert.equal(f.load(dir).screens.length,1);assert.equal(f.load(dir).screens[0].id,'feed');}finally{fs.rmSync(dir,{recursive:true,force:true});}});
test('export emits reproducible human-readable projections',()=>{const dir=work();try{f.init(dir,'Example');f.update(dir,complete);const result=f.exportDocs(dir);assert.equal(result.files.length,4);assert.match(fs.readFileSync(path.join(result.docs,'EXPERIENCE.md'),'utf8'),/Home/);}finally{fs.rmSync(dir,{recursive:true,force:true});}});
test('catalog maturity tiers enforce candidate implementation dependencies before construction',()=>{
  const all=f.catalog('',100);
  assert.ok(all.every(c=>['candidate','implemented','verified','recommended'].includes(c.maturity)));
  const btn=f.catalogGet('controls.button');
  assert.equal(btn.isCandidate,false);
  assert.equal(btn.maturity,'implemented');
  assert.ok(btn.usage.includes('Button'));
  assert.equal(btn.directive,'AVAILABLE: Verified factory component.');

  assert.equal(f.normalizeMaturity('candidate'),'candidate');
  assert.equal(f.normalizeMaturity('development'),'candidate');
  assert.equal(f.normalizeMaturity('preview'),'implemented');
  assert.equal(f.normalizeMaturity('implemented'),'implemented');
  assert.equal(f.normalizeMaturity('verified'),'verified');
  assert.equal(f.normalizeMaturity('recommended'),'recommended');
  assert.equal(f.normalizeMaturity('stable'),'recommended');

  const dir=work();
  try{
    f.init(dir,'CandidateTest');
    const customCatalog=[
      ...f.catalog('',100),
      {id:'patterns.schedulepicker',name:'SchedulePicker',category:'patterns',status:'candidate',source:'patterns/SchedulePicker.tsx',exportName:'SchedulePicker'}
    ];
    const catFile=path.join(dir,'test-catalog.json');
    fs.writeFileSync(catFile,JSON.stringify(customCatalog,null,2));

    const cand=f.catalogGet('patterns.schedulepicker',catFile);
    assert.equal(cand.isCandidate,true);
    assert.equal(cand.maturity,'candidate');
    assert.equal(cand.usage,null);
    assert.ok(cand.directive.includes('CANDIDATE_ONLY'));

    f.update(dir,{
      answers:complete.answers,
      screens:[{
        id:'mosaic-home',
        title:'Mosaic Home',
        purpose:'Explore gallery',
        route:'/mosaic',
        components:['primitives.screen','patterns.schedulepicker'],
        states:['loading','error'],
        actions:['tap item'],
        acceptance:['renders mosaic']
      }],
      decisions:complete.decisions
    });

    const audit=f.audit(f.load(dir),catFile);
    assert.equal(audit.ready,true);
    f.approve(dir,catFile);

    const plan=f.planBuild(dir,{registryPath:catFile});
    const implTask=plan.tasks.find(t=>t.id==='implement-patterns-schedulepicker');
    assert.ok(implTask);
    assert.equal(implTask.type,'agent-implement');

    const screenTask=plan.tasks.find(t=>t.id==='screen-mosaic-home');
    assert.ok(screenTask.dependsOn.includes('implement-patterns-schedulepicker'));

    const readyFirst=f.next(f.load(dir));
    assert.ok(!readyFirst.some(t=>t.id==='screen-mosaic-home'));

    const pkg=f.packageTask(f.load(dir),'screen-mosaic-home',catFile);
    assert.ok(pkg.rules.some(r=>r.includes('Do not import candidate components')));
  }finally{fs.rmSync(dir,{recursive:true,force:true});}
});
test('updates reject unknown fields and unsafe screen ids',()=>{const dir=work();try{f.init(dir,'Example');assert.throws(()=>f.update(dir,{evil:42}));assert.throws(()=>f.update(dir,{screens:[{id:'../bad'}]}));assert.equal(f.load(dir).revision,1);}finally{fs.rmSync(dir,{recursive:true,force:true});}});
