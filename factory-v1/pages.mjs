// MR 5: deterministic page inventory planning, not JSX, route emission, or rendering.
// Catalog links express possible navigation. Only links between selected pages are active.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as appTypes from './app-archetypes.mjs';
import * as objects from './object-schema.mjs';
import * as functionality from './functionality.mjs';

const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const ID=/^[a-z][a-z0-9]*(?:[.-][a-z0-9]+)*$/;
const ROUTE=/^\/(?:[a-z][a-z0-9-]*|\[[a-z][a-z0-9-]*\])?(?:\/(?:[a-z][a-z0-9-]*|\[[a-z][a-z0-9-]*\]))*$/;
const FIELDS=['id','app','route','objectRole','covers','links','entry','status'];
const object=v=>v!==null&&typeof v==='object'&&!Array.isArray(v);
export function catalogPath(root=ROOT) {
  const local=path.join(root,'packages/catalog/page-patterns.json');
  return fs.existsSync(local)?local:path.join(root,'page-patterns.json');
}
export function validateCatalog(entries) {
  const errors=[];
  if(!Array.isArray(entries)||!entries.length)return ['pages: expected nonempty catalog'];
  const byId=new Map();
  const apps=new Set(appTypes.list().map(a=>a.id).concat('global'));
  for(const [i,p] of entries.entries()){
    const at=`pages[${i}]`;
    if(!object(p)){errors.push(`${at}: expected object`);continue;}
    for(const k of Object.keys(p))if(!FIELDS.includes(k))errors.push(`${at}: unknown field ${k}`);
    if(typeof p.id!=='string'||!ID.test(p.id))errors.push(`${at}: invalid ID`);
    else if(byId.has(p.id))errors.push(`${at}: duplicate ID ${p.id}`);
    else byId.set(p.id,p);
    if(!apps.has(p.app))errors.push(`${at}: unknown application type ${p.app}`);
    if(p.app!=='global'&&typeof p.id==='string'&&!p.id.startsWith(`${p.app}.`))errors.push(`${at}: page prefix must match app type`);
    if(typeof p.route!=='string'||!ROUTE.test(p.route))errors.push(`${at}: invalid route`);
    if(p.objectRole!==null&&(!Number.isInteger(p.objectRole)||p.objectRole<0))errors.push(`${at}: invalid objectRole`);
    if(!Array.isArray(p.covers)||p.covers.some(v=>typeof v!=='string'||!ID.test(v))||new Set(p.covers).size!==p.covers.length)errors.push(`${at}: invalid covers`);
    if(!Array.isArray(p.links)||p.links.some(v=>typeof v!=='string'||!ID.test(v))||new Set(p.links).size!==p.links.length)errors.push(`${at}: invalid links`);
    if(typeof p.entry!=='boolean'||p.entry!==(p.route==='/'))errors.push(`${at}: entry must correspond to root route`);
    if(p.status!=='planning-only')errors.push(`${at}: must remain planning-only`);
  }
  const operations=new Set(functionality.load().map(v=>v.id));
  for(const p of entries.filter(object)){
    for(const link of p.links??[])if(!byId.has(link))errors.push(`${p.id}: unknown linked page ${link}`);
    for(const op of p.covers??[])if(!operations.has(op))errors.push(`${p.id}: unknown covered capability ${op}`);
  }
  for(const type of appTypes.list()){
    const relevant=entries.filter(p=>p.app===type.id);
    if(!relevant.some(p=>p.route==='/'))errors.push(`${type.id}: missing root pattern`);
    for(const id of appTypes.get(type.id).defaults.pages)if(!byId.has(id))errors.push(`${type.id}: unknown default page ${id}`);
  }
  return errors;
}
export function load(root=ROOT){
  const file=catalogPath(root);
  if(!fs.existsSync(file))throw Error(`Missing page pattern catalog: ${file}`);
  const items=JSON.parse(fs.readFileSync(file,'utf8'));
  const errors=validateCatalog(items);
  if(errors.length)throw Error(errors.join('; '));
  return items;
}
export function list(type,root=ROOT){
  const all=load(root);
  return all.filter(p=>!type||p.app===type||p.app==='global').map(({id,app,route,objectRole,covers,status})=>({id,app,route,objectRole,covers,status}));
}
export function get(id,root=ROOT) {
  const p=load(root).find(p=>p.id===id);
  if(!p)throw Error(`Unknown page pattern "${id}" (use catalog pages)`);
  return structuredClone(p);
}
function roleObject(p,objectIds){
  if(p.objectRole===null)return null;
  return objectIds[p.objectRole]??null;
}
export function resolve(selected,type,objectSelection,capabilitySelection,root=ROOT){
  if(!Array.isArray(selected)||!selected.length||selected.some(x=>typeof x!=='string')||new Set(selected).size!==selected.length)
    throw Error('pages: expected nonempty unique registered page IDs');
  const objectIds=objects.ids(objectSelection);
  const capabilities=functionality.resolve(capabilitySelection,objectSelection);
  const registry=new Map(load(root).map(p=>[p.id,p]));
  const selectedSet=new Set(selected);
  const resolved=selected.map(id=>{
    const p=registry.get(id);
    if(!p)throw Error(`pages: unknown page pattern "${id}"`);
    if(p.app!==type&&p.app!=='global')throw Error(`pages: "${id}" incompatible with application type "${type}"`);
    const obj=roleObject(p,objectIds);
    if(p.objectRole!==null&&!obj)throw Error(`pages: "${id}" needs object role ${p.objectRole} (only ${objectIds.length} objects declared)`);
    return {id:p.id,route:p.route,object:obj,links:p.links.filter(x=>selectedSet.has(x)),covers:p.covers.map(x=>x==='auth.basic'?x:`${obj}.${x}`),status:p.status};
  });
  const routes=new Map();
  for(const p of resolved){
    if(routes.has(p.route))throw Error(`pages: duplicate route ${p.route} (${routes.get(p.route)} and ${p.id})`);
    routes.set(p.route,p.id);
  }
  const start=routes.get('/');
  if(!start)throw Error('pages: missing root route "/"');
  const requiredAuth=capabilities.some(c=>c.id==='auth.basic');
  if(requiredAuth&&(!selectedSet.has('auth.login')||!selectedSet.has('auth.register')))
    throw Error('pages: auth.basic requires both auth.login and auth.register');
  // Auth entry is a standard available navigation link when selected, not an extra user-designed route.
  if(requiredAuth)resolved.find(p=>p.id===start).links.push('auth.login');
  const graph=new Map(resolved.map(p=>[p.id,p.links]));
  const reached=new Set(),queue=[start];
  while(queue.length){const id=queue.shift();if(reached.has(id))continue;reached.add(id);queue.push(...graph.get(id)??[]);}
  for(const p of resolved)if(!reached.has(p.id))throw Error(`pages: unreachable from root: ${p.id}`);
  const covered=new Set(resolved.flatMap(p=>p.covers));
  for(const capability of capabilities){
    // read-only is a policy, not a visible control or page action.
    if(capability.operation==='read-only')continue;
    if(!covered.has(capability.id))throw Error(`pages: capability "${capability.id}" has no selected page`);
  }
  return {type,pages:resolved,entry:start,coveredCapabilities:capabilities.map(c=>c.id)};
}
export function suggest(type,objectSelection,capabilitySelection,root=ROOT){
  const defaults=appTypes.get(type).defaults.pages;
  const selected=[...defaults];
  if(capabilitySelection.includes('auth.basic'))selected.push('auth.login','auth.register');
  // Default pages are recommendations, not automatic approval. Report mismatches early.
  let unresolved=[];
  try{resolve(selected,type,objectSelection,capabilitySelection,root);}
  catch(e){unresolved=[e.message];}
  return {type,pages:selected,unresolved,advisory:'Page IDs are suggested, not approved; validate the chosen selection with workflow batch set pages.'};
}
