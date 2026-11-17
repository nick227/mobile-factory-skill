// MR 4: semantic functionality inventory. IDs select *planned* capability contracts,
// not executable handlers or implemented React Native components.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ids as objectIds } from './object-schema.mjs';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const TOKEN = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/;
const FIELDS = ['id','kind','ui','requires','conflicts','status'];
const KINDS = ['action','control','display','policy','system'];
const isObj = v => v && typeof v === 'object' && !Array.isArray(v);
export function catalogPath(root = ROOT) {
  const file = path.join(root,'packages/catalog/functionality.json');
  return fs.existsSync(file) ? file : path.join(root,'functionality.json');
}
export function validateCatalog(entries) {
  const errors = [];
  if (!Array.isArray(entries) || !entries.length) return ['functionality: expected a nonempty catalog'];
  const seen = new Set();
  for (const [i, entry] of entries.entries()) {
    const at = `functionality[${i}]`;
    if (!isObj(entry)) {errors.push(`${at}: expected object`);continue;}
    for (const key of Object.keys(entry)) if (!FIELDS.includes(key)) errors.push(`${at}: unknown field ${key}`);
    if (typeof entry.id !== 'string' || !(TOKEN.test(entry.id) || entry.id === 'auth.basic')) errors.push(`${at}: invalid capability ID`);
    else if (seen.has(entry.id)) errors.push(`${at}: duplicate ID ${entry.id}`);
    else seen.add(entry.id);
    if (!KINDS.includes(entry.kind)) errors.push(`${at}: unknown kind`);
    if (typeof entry.ui !== 'string' || !TOKEN.test(entry.ui)) errors.push(`${at}: invalid UI semantics ID`);
    if (entry.status !== 'planning-only') errors.push(`${at}: status must be planning-only until implementation verified`);
    for (const key of ['requires','conflicts']) {
      if (!Array.isArray(entry[key]) || entry[key].some(x=>typeof x !== 'string'||!TOKEN.test(x)) || new Set(entry[key]).size !== entry[key].length)
        errors.push(`${at}.${key}: expected unique capability name array`);
    }
  }
  const known = new Set(entries.filter(x=>isObj(x)).map(x=>x.id));
  for (const entry of entries.filter(isObj)) for (const key of ['requires','conflicts']) {
    for (const value of Array.isArray(entry[key]) ? entry[key] : []) {
      if (!known.has(value)) errors.push(`${entry.id}.${key}: unknown capability ${value}`);
      if (entry.id === value) errors.push(`${entry.id}.${key}: self-reference`);
    }
  }
  const deps = new Map(entries.filter(isObj).map(x=>[x.id,Array.isArray(x.requires)?x.requires:[]]));
  const visiting = new Set(), visited = new Set();
  function walk(id) {
    if (visiting.has(id)) {errors.push(`functionality: circular dependency at ${id}`);return;}
    if (visited.has(id)) return;
    visiting.add(id);
    for (const dep of deps.get(id)??[]) if (deps.has(dep)) walk(dep);
    visiting.delete(id);visited.add(id);
  }
  for (const id of deps.keys()) walk(id);
  return errors;
}
export function load(root=ROOT) {
  const file=catalogPath(root);
  if (!fs.existsSync(file)) throw Error(`Missing functionality catalog: ${file}`);
  const entries=JSON.parse(fs.readFileSync(file,'utf8'));
  const errors=validateCatalog(entries);
  if (errors.length) throw Error(errors.join('; '));
  return entries;
}
export function list(root=ROOT) { return load(root).map(({id,kind,ui,status})=>({id,kind,ui,status})); }
export function get(id,root=ROOT) {
  const entry=load(root).find(x=>x.id===id);
  if (!entry) throw Error(`Unknown functionality capability "${id}" (use catalog capabilities)`);
  return structuredClone(entry);
}
export function resolve(selected, objects, root=ROOT) {
  if (!Array.isArray(selected) || selected.some(x=>typeof x!=='string') || new Set(selected).size!==selected.length)
    throw Error('functionality: expected unique capability ID array');
  const objectSet = new Set(objectIds(objects));
  const registry = new Map(load(root).map(x=>[x.id,x]));
  const chosen = new Set(selected);
  const result = [];
  for (const id of selected) {
    if (id === 'auth.basic') {
      result.push({id, object:null, operation:'basic', ...registry.get(id)});
      continue;
    }
    const match = /^([a-z][a-z0-9-]*)\.([a-z][a-z0-9-]*)$/.exec(id);
    if (!match) throw Error(`functionality: invalid ID "${id}" (expected object.operation)`);
    const [, object, operation] = match;
    if (!objectSet.has(object)) throw Error(`functionality: unknown object namespace "${object}" in "${id}"`);
    const def = registry.get(operation);
    if (!def || def.kind === 'system') throw Error(`functionality: unknown capability "${operation}" for ${object}`);
    for (const dependency of def.requires) if (!chosen.has(`${object}.${dependency}`))
      throw Error(`functionality: "${id}" requires "${object}.${dependency}"`);
    for (const conflict of def.conflicts) if (chosen.has(`${object}.${conflict}`))
      throw Error(`functionality: "${id}" conflicts with "${object}.${conflict}"`);
    result.push({
      id,object,operation,kind:def.kind,ui:def.ui,status:def.status,
      contract:{event:`${object}.${operation}`,control:`${object}.control.${operation}`,display:`${object}.display.${operation}`}
    });
  }
  return result;
}
