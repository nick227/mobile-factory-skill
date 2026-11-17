// MR 7: exact editorial materialization and content-addressed blueprint review.
// No AI-written JSX, fabricated fixture fallback, or implicit human approval.
import crypto from 'node:crypto';
import { compile as draft } from './composition.mjs';
import { validateSpec } from './assembler.mjs';
import * as engineering from './engineering-contracts.mjs';

const isObj=v=>v!==null&&typeof v==='object'&&!Array.isArray(v);
const own=(v,k)=>Object.prototype.hasOwnProperty.call(v,k);
const keys=(value,allowed,where)=>{
  if(!isObj(value))throw Error(where+': expected object');
  for(const k of Object.keys(value))if(!allowed.includes(k))throw Error(where+': unexpected key '+k);
};
const text=(v,where)=>{if(typeof v!=='string'||!v.trim())throw Error(where+': nonempty text required');return v;};
const sorted=v=>Array.isArray(v)?v.map(sorted):isObj(v)?Object.fromEntries(Object.keys(v).sort().map(k=>[k,sorted(v[k])])):v;
export const sha256=value=>crypto.createHash('sha256').update(JSON.stringify(sorted(value))).digest('hex');
const context=p=>({name:p.name,type:p.batches.selections.classification.type,objects:p.batches.selections.objects,capabilities:p.batches.selections.functionality,pages:p.batches.selections.pages});

export function materialize(p,selection=p.batches?.selections?.content) {
  const s=p.batches?.selections;
  if(!s?.composition)throw Error('content: complete the composition batch first');
  keys(selection,['pages','data','design','engineering'],'content');
  const contracts=engineering.fromProject(p,selection);
  const base=draft(s.composition,context(p)).spec;
  if(!isObj(selection.pages)||!isObj(selection.data))throw Error('content: pages and data objects required');
  const expected=Object.keys(s.composition);
  if(Object.keys(selection.pages).length!==expected.length||expected.some(id=>!own(selection.pages,id)))
    throw Error('content.pages: editorial copy required for every selected page');
  for(const id of expected){
    const edit=selection.pages[id],where='content.pages.'+id;
    keys(edit,['title','subtitle','primary','header','empty','fields','actions'],where);
    const target=base.pages[id.replace(/\./g,'-')];
    if(!target)throw Error(where+': page was not compiled');
    target.title=text(edit.title,where+'.title');
    if(own(edit,'subtitle'))target.subtitle=text(edit.subtitle,where+'.subtitle');
    if(own(edit,'primary')){
      if(!target.primary)throw Error(where+'.primary: page has no primary action');
      target.primary.label=text(edit.primary,where+'.primary');
    }
    if(own(edit,'header')){
      if(!target.headerAction)throw Error(where+'.header: page has no header action');
      target.headerAction.label=text(edit.header,where+'.header');
    }
    if(own(edit,'empty')){
      keys(edit.empty,['title','description'],where+'.empty');
      if(target.subject.kind!=='collection')throw Error(where+'.empty: requires collection subject');
      target.empty={title:text(edit.empty.title,where+'.empty.title')};
      if(own(edit.empty,'description'))target.empty.description=text(edit.empty.description,where+'.empty.description');
    }
    if(own(edit,'fields')){
      if(target.subject.kind!=='form')throw Error(where+'.fields: requires form subject');
      const fs=target.subject.fields;
      keys(edit.fields,fs.map(x=>x.key),where+'.fields');
      if(Object.keys(edit.fields).length!==fs.length)throw Error(where+'.fields: label every form field');
      for(const f of fs)f.label=text(edit.fields[f.key],where+'.fields.'+f.key);
    }
    if(own(edit,'actions')){
      const available=target.subject.actions??[];
      keys(edit.actions,available.map(a=>a.event),where+'.actions');
      for(const action of available)if(own(edit.actions,action.event))action.label=text(edit.actions[action.event],where+'.actions.'+action.event);
    }
  }
  if(Object.keys(selection.data).length!==Object.keys(base.data).length||Object.keys(base.data).some(k=>!own(selection.data,k)))
    throw Error('content.data: provide records for every compiled object collection');
  for(const [name,templateRows] of Object.entries(base.data)){
    const rows=selection.data[name];
    if(!Array.isArray(rows)||!rows.length)throw Error('content.data.'+name+': nonempty record array required');
    const required=Object.keys(templateRows[0]??{id:''});
    for(const [i,r] of rows.entries()){
      const where='content.data.'+name+'['+i+']';
      if(!isObj(r)||required.some(k=>!own(r,k))||Object.keys(r).some(k=>!required.includes(k)))
        throw Error(where+': must provide exactly the composed field IDs '+required.join(', '));
      text(r.id,where+'.id');
      if(/-sample$/.test(r.id))throw Error(where+'.id: synthetic sample ID must be replaced');
      for(const key of required.filter(k=>k!=='id')){
        const type=typeof templateRows[0][key];
        if(typeof r[key]!==type)throw Error(where+'.'+key+': expected '+type);
        if(type==='string'){
          text(r[key],where+'.'+key);
          if(r[key]===templateRows[0][key])throw Error(where+'.'+key+': synthetic fixture value must be replaced');
        }
        if(type==='number'&&!Number.isFinite(r[key]))throw Error(where+'.'+key+': finite number required');
      }
    }
    base.data[name]=structuredClone(rows);
  }
  if(own(selection,'design')){
    keys(selection.design,['colorMode','preset','palette','radius','density','typography','surface','layout','media'],'content.design');
    base.design=structuredClone(selection.design);
  }
  const check=validateSpec(base);
  if(!check.ok)throw Error('content: executable AppSpec failed validation: '+check.errors.join('; '));
  const hash=sha256(base);
  const blueprintHash=contracts.length?sha256({appSpec:base,engineering:contracts}):hash;
  return {spec:base,hash,blueprintHash,engineering:contracts,warnings:check.warnings,source:'approved-blueprint-candidate'};
}
export function review(p,selection){
  keys(selection,['passed','evidence','specHash','blueprintHash'],'review');
  if(selection.passed!==true)throw Error('review.passed: must be true after inspection');
  text(selection.evidence,'review.evidence');
  const final=materialize(p);
  if(selection.specHash!==final.hash)throw Error('review.specHash: does not match current executable AppSpec');
  if(final.engineering.length&&selection.blueprintHash!==final.blueprintHash)throw Error('review.blueprintHash: does not match approved implementation contracts');
  if(!final.engineering.length&&selection.blueprintHash!==undefined&&selection.blueprintHash!==final.blueprintHash)throw Error('review.blueprintHash: stale blueprint');
  return {hash:final.hash,blueprintHash:final.blueprintHash,warnings:final.warnings};
}
export function audit(p) {
  const problems=[];
  if(p.batches?.schemaVersion!==1)return {ready:false,problems:[{scope:'batches',message:'Unsupported batch schema'}]};
  for(const id of ['classification','objects','functionality','pages','composition','content','review'])
    if(!own(p.batches.selections??{},id))problems.push({scope:'batches',message:'Missing '+id});
  let candidate;
  if(!problems.length)try{
    candidate=materialize(p);
    review(p,p.batches.selections.review);
  }catch(e){problems.push({scope:'appSpec',message:e.message});}
  const confirmed=(p.decisions??[]).some(d=>d?.type==='user-confirmation'&&d.revision===p.revision&&typeof d.value==='string'&&d.value.startsWith('USER: ')&&(!candidate?.engineering.length||d.blueprintHash===candidate.blueprintHash));
  if(!confirmed)problems.push({scope:'approval',message:'Explicit user confirmation for the exact current revision required'});
  return {ready:problems.length===0,revision:p.revision,screenCount:candidate?Object.keys(candidate.spec.pages).length:0,appSpecHash:candidate?.hash,blueprintHash:candidate?.blueprintHash,engineering:candidate?.engineering??[],problems,warnings:candidate?.warnings??[]};
}
export function approved(p) {
  if(!p.batches)return false;
  try{
    const a=p.approval;
    const plan=materialize(p);
    return Boolean(a&&a.revision===p.revision&&a.appSpecHash===plan.hash&&
      (!plan.engineering.length||a.blueprintHash===plan.blueprintHash)&&
      p.batches.selections.review?.specHash===a.appSpecHash&&
      (!plan.engineering.length||p.batches.selections.review?.blueprintHash===plan.blueprintHash)&&
      (p.decisions??[]).some(d=>d?.type==='user-confirmation'&&d.revision===p.revision&&typeof d.value==='string'&&d.value.startsWith('USER: ')&&(!plan.engineering.length||d.blueprintHash===plan.blueprintHash)));
  }catch{return false;}
}
