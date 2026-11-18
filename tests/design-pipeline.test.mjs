import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import * as e from '../factory-v1/engine.mjs';
import * as b from '../factory-v1/batches.mjs';
import * as composition from '../factory-v1/composition.mjs';
import * as editorial from '../factory-v1/editorial.mjs';
import {validateSpec,emit} from '../factory-v1/assembler.mjs';
import * as F from '../bench/segments/fixtures.mjs';

const setup=()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'design-pipeline-'));
 F.design(dir);b.init(dir);
 b.set(dir,'classification',{type:'tracker'});
 b.set(dir,'objects',['activity']);
 b.set(dir,'functionality',['activity.complete']);
 b.set(dir,'pages',['tracker.home']);
 return dir;
};
const configured=(variant='radial-hero')=>({'tracker.home':{
 kind:'detail',archetype:'glance-dashboard',bindings:{heading:'name',hero:'count'},
 composition:{layoutVariant:variant,focalPoint:'telemetry',actionPlacement:'docked-bottom'},
 actions:[{id:'activity.complete',placement:'primary',field:'done'}]
}});
const content=()=>({pages:{'tracker.home':{title:'Today',primary:'Finish session'}},
 data:{activity:[{id:'act-1',name:'Walk',count:'12',done:false}]},
 design:{colorMode:'dark',palette:'midnight',experience:{hierarchy:'data-led',motion:'expressive',pacing:'compact'}}});
test('batch composition preserves selected visual directives through approved materialization',()=>{
 const dir=setup();
 b.set(dir,'composition',configured());
 const draft=composition.compile(configured(),{name:e.load(dir).name,type:'tracker',objects:['activity'],capabilities:['activity.complete'],pages:['tracker.home']});
 assert.equal(draft.spec.pages['tracker-home'].composition.layoutVariant,'radial-hero');
 b.set(dir,'content',content());
 const p=e.load(dir),a=editorial.materialize(p);
 assert.deepEqual(a.spec.design,content().design);
 assert.deepEqual(a.spec.pages['tracker-home'].composition,configured()['tracker.home'].composition);
 assert.equal(validateSpec(a.spec).ok,true);
 assert.ok(emit(a.spec)['src/factory/app.ts'].includes('expressive'));
 assert.equal(a.hash,editorial.materialize(p).hash);
 b.set(dir,'review',{passed:true,evidence:'Reviewed',specHash:a.hash});
 const p2=e.load(dir);
 p2.decisions=[{type:'user-confirmation',value:'USER: approve this art direction',revision:p2.revision}];e.save(dir,p2);
 e.approve(dir);
 assert.equal(editorial.approved(e.load(dir)),true);
});
test('bad or incompatible variants fail before saving, with no revised project',()=>{
 const dir=setup(),before=e.load(dir).revision;
 assert.throws(()=>b.set(dir,'composition',configured('editorial-feature')),/unsupported/);
 assert.equal(e.load(dir).revision,before);
 b.set(dir,'composition',configured());
 const revised=e.load(dir).revision;
 assert.throws(()=>b.set(dir,'content',{...content(),design:{experience:{hierarchy:'media-led'}}}),/required/);
 assert.equal(e.load(dir).revision,revised);
});
test('changing design invalidates review and approval via normal batch semantics',()=>{
 const dir=setup();b.set(dir,'composition',configured());b.set(dir,'content',content());
 const first=editorial.materialize(e.load(dir));
 b.set(dir,'review',{passed:true,evidence:'Review',specHash:first.hash});
 const update=content();
 update.design.experience.motion='none';
 const result=b.set(dir,'content',update);
 assert.ok(result.invalidated.includes('review'));
 const second=editorial.materialize(e.load(dir));
 assert.notEqual(first.hash,second.hash);
 assert.equal(editorial.approved(e.load(dir)),false);
});
test('older project composition and design remain accepted',()=>{
 const dir=setup();const legacy=configured();
 delete legacy['tracker.home'].composition;
 b.set(dir,'composition',legacy);
 const old=content();delete old.design.experience;
 b.set(dir,'content',old);
 const result=editorial.materialize(e.load(dir));
 assert.equal(result.spec.pages['tracker-home'].composition,undefined);
 assert.equal(result.spec.design.experience,undefined);
});
test('design schema names actual runtime colorMode, not mode',()=>{
 const schema=JSON.parse(fs.readFileSync('standards/design/factory-design.schema.json','utf8'));
 assert.deepEqual(schema.properties.colorMode.enum,['light','dark','system']);
 assert.equal(schema.properties.mode,undefined);
});
