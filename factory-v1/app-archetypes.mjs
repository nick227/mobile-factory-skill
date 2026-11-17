// Application-level classification catalog. Distinct from Monad visual page archetypes.
// Default IDs are *suggestions* for subsequent batches, not implemented functionality.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ID = /^[a-z][a-z0-9]*(?:[.-][a-z0-9]+)*$/;
const own = (o, k) => Object.prototype.hasOwnProperty.call(o, k);
const FIELDS = ['id','name','summary','defaults'];
const DEFAULT_FIELDS = ['objects','capabilities','pages'];
const isObj = v => v !== null && typeof v === 'object' && !Array.isArray(v);
export function catalogPath(base = root) {
  const local = path.join(base, 'packages/catalog/app-archetypes.json');
  return fs.existsSync(local) ? local : path.join(base, 'app-archetypes.json');
}
export function validate(catalog) {
  const errors = [];
  if (!Array.isArray(catalog) || !catalog.length) return ['app archetypes: expected nonempty array'];
  const seen = new Set();
  for (const [i, item] of catalog.entries()) {
    const p = `app archetypes[${i}]`;
    if (!isObj(item)) { errors.push(`${p}: expected object`); continue; }
    for (const k of Object.keys(item)) if (!FIELDS.includes(k)) errors.push(`${p}.${k}: unsupported field`);
    if (typeof item.id !== 'string' || !ID.test(item.id)) errors.push(`${p}.id: invalid ID`);
    else if (seen.has(item.id)) errors.push(`${p}.id: duplicate ${item.id}`);
    else seen.add(item.id);
    for (const k of ['name','summary']) if (typeof item[k] !== 'string' || !item[k].trim()) errors.push(`${p}.${k}: required text`);
    if (!isObj(item.defaults)) { errors.push(`${p}.defaults: expected object`); continue; }
    for (const k of Object.keys(item.defaults)) if (!DEFAULT_FIELDS.includes(k)) errors.push(`${p}.defaults.${k}: unsupported field`);
    for (const k of DEFAULT_FIELDS) {
      const values = item.defaults[k];
      if (!Array.isArray(values) || !values.length || values.some(v => typeof v !== 'string' || !ID.test(v)) || new Set(values).size !== values.length)
        errors.push(`${p}.defaults.${k}: expected nonempty array of unique IDs`);
    }
  }
  return errors;
}
export function load(base = root) {
  const file = catalogPath(base);
  if (!fs.existsSync(file)) throw Error(`Application archetype catalog missing: ${file}`);
  const entries = JSON.parse(fs.readFileSync(file, 'utf8'));
  const errors = validate(entries);
  if (errors.length) throw Error(errors.join('; '));
  return entries;
}
export function list(base = root) {
  return load(base).map(({ id, name, summary }) => ({ id, name, summary }));
}
export function get(id, base = root) {
  const entry = load(base).find(a => a.id === id);
  if (!entry) throw Error(`Unknown application archetype "${id}" (use catalog apps)`);
  return structuredClone(entry);
}
export function expand(id, base = root) {
  const entry = get(id, base);
  return { type: entry.id, defaults: entry.defaults, advisory: 'Defaults are suggestions for subsequent decision batches; none is an approved capability or page.' };
}
