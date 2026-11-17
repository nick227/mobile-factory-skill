import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import * as composition from '../factory-v1/composition.mjs';
import * as batches from '../factory-v1/batches.mjs';
import * as engine from '../factory-v1/engine.mjs';
import * as orch from '../factory-v1/orchestrator.mjs';
import {validateSpec,emit} from '../factory-v1/assembler.mjs';
import * as F from '../bench/segments/fixtures.mjs';

const context={type:'tracker',name:'Test Tracker',objects:['activity'],capabilities:['activity.view','activity.create'],pages:['tracker.dashboard','tracker.detail','tracker.create']};
const config={
 'tracker.dashboard':{kind:'collection',archetype:'bento-overview',bindings:{title:'name',search:['name']},navigation:[{to:'tracker.detail',placement:'select'},{to:'tracker.create',placement:'header'}]},
 'tracker.detail':{kind:'detail',archetype:'content-canvas',bindings:{heading:'name',facts:['summary']},navigation:[{to:'tracker.dashboard',placement:'action'}]},
 'tracker.create':{kind:'form',archetype:'focus-wizard',bindings:{fields:['name']},actions:[{id:'activity.create',placement:'primary'}]}
};
const ctx={...context,capabilities:['activity.view','activity.create']};
test('compiles multiple screens, links, form submit and deterministic AppSpec without handwritten JSX',()=>{
  const one=composition.compile(config,ctx),two=composition.compile(config,ctx);
  assert.deepEqual(one,two);
  assert.equal(one.status,'draft');
  assert.equal(validateSpec(one.spec).ok,true);
  assert.equal(one.spec.pages['tracker-dashboard'].subject.onSelect,'navigate-tracker-detail');
  assert.equal(one.spec.pages['tracker-dashboard'].events['navigate-tracker-detail'][0].params.id,'{id}');
  assert.deepEqual(one.spec.pages['tracker-create'].events['cap-create'],[{create:'activity',from:'form'}]);
  assert.ok(Object.keys(emit(one.spec)).includes('app/records/new.tsx'));
  assert.deepEqual(one.spec.data.activity[0].name,'Sample Name');
});
test('glance slots explicitly bind hero and ring without heuristic name guessing',()=>{
  const c={...ctx,capabilities:['activity.progress'],pages:['tracker.dashboard']};
  const selected={'tracker.dashboard':{kind:'detail',archetype:'glance-dashboard',bindings:{heading:'name',hero:'steps',progress:'completion-rate',facts:['distance']}}};
  const out=composition.compile(selected,c);
  assert.deepEqual(out.spec.pages['tracker-dashboard'].subject.glance,{value:'{steps}',label:'{name}',progressField:'completion-rate'});
  assert.equal(out.spec.data.activity[0]['completion-rate'],0);
  assert.equal(validateSpec(out.spec).ok,true);
  const bad=structuredClone(out.spec);
  bad.pages['tracker-dashboard'].subject.glance.progressField='ghost';
  assert.match(validateSpec(bad).errors.join(' '),/ghost/);
});
test('invalid composition rejects unknown pages, fields, archetypes, navigation and feature omissions',()=>{
  const bad=structuredClone(config);delete bad['tracker.detail'];
  assert.throws(()=>composition.compile(bad,ctx),/missing tracker.detail/);
  const invalid=structuredClone(config);invalid['tracker.dashboard'].bindings.title='not.field';
  assert.throws(()=>composition.compile(invalid,ctx),/field ID/);
  const wrong=structuredClone(config);wrong['tracker.dashboard'].archetype='focus-wizard';
  assert.throws(()=>composition.compile(wrong,ctx),/incompatible/);
  const nav=structuredClone(config);nav['tracker.dashboard'].navigation=[{to:'tracker.detail',placement:'header'}];
  assert.throws(()=>composition.compile(nav,ctx),/dynamic target/);
  const noCreate=structuredClone(config);noCreate['tracker.create'].actions=[];
  assert.throws(()=>composition.compile(noCreate,ctx),/form needs/);
  const extra=structuredClone(config);extra['wrong.page']={};
  assert.throws(()=>composition.compile(extra,ctx),/unknown key/);
});
test('functionality cannot be silently claimed without executable binding',()=>{
  const c={...ctx,capabilities:['activity.complete'],pages:['tracker.dashboard']};
  const selection={'tracker.dashboard':{kind:'detail',archetype:'glance-dashboard',bindings:{heading:'name',hero:'count'}}};
  assert.throws(()=>composition.compile(selection,c),/no executable page binding/);
  const applied=structuredClone(selection);
  applied['tracker.dashboard'].actions=[{id:'activity.complete',placement:'primary',field:'done'}];
  const r=composition.compile(applied,c);
  assert.equal(r.spec.data.activity[0].done,false);
  assert.deepEqual(r.spec.pages['tracker-dashboard'].events['cap-complete'],[{toggle:'activity',field:'done'}]);
});
test('auth must not be misrepresented as working UI without real implementation',()=>{
  const c={...ctx,capabilities:['auth.basic'],pages:['tracker.dashboard','auth.login','auth.register']};
  const selection={
    'tracker.dashboard':{kind:'detail',archetype:'content-canvas',bindings:{heading:'name'}},
    'auth.login':{kind:'form',archetype:'focus-wizard',bindings:{fields:['email']}},
    'auth.register':{kind:'form',archetype:'focus-wizard',bindings:{fields:['email']}}
  };
  assert.throws(()=>composition.compile(selection,c));
});
test('composition batch persists only validated contracts and exposes a draft via CLI',()=>{
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'composition-'));
  F.design(dir);batches.init(dir);
  batches.set(dir,'classification',{type:'tracker'});
  batches.set(dir,'objects',['activity']);
  batches.set(dir,'functionality',['activity.view','activity.create']);
  batches.set(dir,'pages',ctx.pages);
  const before=engine.load(dir).revision;
  assert.throws(()=>batches.set(dir,'composition',{'tracker.dashboard':{}}));
  assert.equal(engine.load(dir).revision,before);
  batches.set(dir,'composition',config);
  const next=batches.next(engine.load(dir),orch.status(dir));
  assert.equal(next.id,'content');
  assert.equal(typeof next.preview,'string');
  assert.equal(next.compositionPreview,undefined);
  const cli=spawnSync(process.execPath,['scripts/factory.mjs','workflow','composition','--project',dir],{encoding:'utf8'});
  assert.equal(cli.status,0,cli.stderr);
  assert.equal(JSON.parse(cli.stdout).status,'draft');
});
