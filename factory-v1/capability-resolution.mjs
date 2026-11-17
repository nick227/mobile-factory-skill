// Runtime capability truth, kept separate from aspirational capability vocabulary.
// 'local-mock' means presentation behavior exists, NOT a production implementation or device verification.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as functionality from './functionality.mjs';
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const STATES=['local-mock','policy','missing-adapter'];
const BINDINGS=['detail-or-linked-collection','collection-search','collection-segments','form-create','form-update','detail-remove','detail-toggle','dashboard-progress','selection-conflict'];
const own=(v,k)=>Object.prototype.hasOwnProperty.call(v,k);
const isObj=v=>v!==null&&typeof v==='object'&&!Array.isArray(v);
export function manifestPath(root=ROOT){
  const repo=path.join(root,'packages/catalog/capability-implementations.json');
  return fs.existsSync(repo)?repo:path.join(root,'capability-implementations.json');
}
export function validateManifest(manifest, vocabulary=functionality.load()){
  const errors=[];
  if(!Array.isArray(manifest))return ['capability-implementations: expected array'];
  const catalogIds=new Set(vocabulary.map(c=>c.id)),seen=new Set();
  for(const [i,item] of manifest.entries()){
    const at='capability-implementations['+i+']';
    if(!isObj(item)){errors.push(at+': expected object');continue;}
    for(const key of Object.keys(item))if(!['id','state','binding','notes'].includes(key))errors.push(at+': unknown field '+key);
    if(typeof item.id!=='string'||!catalogIds.has(item.id))errors.push(at+': unknown capability '+item.id);
    if(seen.has(item.id))errors.push(at+': duplicate capability '+item.id);
    seen.add(item.id);
    if(!STATES.includes(item.state))errors.push(at+': invalid state');
    if((item.state==='missing-adapter')!==(item.binding===null))errors.push(at+': missing-adapter must have null binding, implemented/policy must have a binding');
    if(item.binding!==null&&!BINDINGS.includes(item.binding))errors.push(at+': unknown binding '+item.binding);
    if(item.state==='policy'&&item.id!=='read-only')errors.push(at+': unsupported policy '+item.id);
    if(item.id==='read-only'&&item.state!=='policy')errors.push(at+': read-only must be policy');
    if(typeof item.notes!=='string'||!item.notes.trim())errors.push(at+': explanation required');
  }
  for(const id of catalogIds)if(!seen.has(id))errors.push('capability-implementations: missing '+id);
  return errors;
}
export function load(root=ROOT){
  const file=manifestPath(root);
  if(!fs.existsSync(file))throw Error('Missing capability implementation manifest: '+file);
  const items=JSON.parse(fs.readFileSync(file,'utf8'));
  const errors=validateManifest(items);
  if(errors.length)throw Error(errors.join('; '));
  return items;
}
export function list(root=ROOT){return structuredClone(load(root));}
export function resolve(selected,objects,root=ROOT){
  const capabilities=functionality.resolve(selected,objects,root);
  const manifest=new Map(load(root).map(x=>[x.id,x]));
  const entries=capabilities.map(cap=>{
    const impl=manifest.get(cap.object===null?cap.id:cap.operation);
    // A matched catalog ID alone never implies that its implementation is available.
    return {id:cap.id,operation:cap.operation,object:cap.object,
      state:impl.state,requiresCustomCode:impl.state==='missing-adapter',
      binding:impl.binding,notes:impl.notes,
      productionReady:false,
      verifiedOnDevice:false};
  });
  return {capabilities:entries,
    gaps:entries.filter(x=>x.requiresCustomCode).map(x=>({id:x.id,reason:x.notes,kind:'missing-adapter'})),
    localOnly:entries.filter(x=>x.state==='local-mock').map(x=>x.id),
    policyOnly:entries.filter(x=>x.state==='policy').map(x=>x.id),
    productionReady:false};
}
export function catalogCoverage(root=ROOT){
  return {registered:load(root).length,byState:Object.fromEntries(STATES.map(s=>[s,load(root).filter(x=>x.state===s).length]))};
}
