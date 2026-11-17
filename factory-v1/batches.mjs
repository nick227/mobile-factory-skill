// Ordered, opt-in documentation decisions. Catalog-backed classification and object namespaces.
// Later batches resolve capabilities, pages, composition, and final generation.
import * as engine from './engine.mjs';
import { invalidate } from './planner.mjs';
import * as appTypes from './app-archetypes.mjs';
import * as objects from './object-schema.mjs';
import * as functionality from './functionality.mjs';
import * as pages from './pages.mjs';

export const STAGES = Object.freeze([
  { id: 'classification', shape: '{ "type": "catalog-id" }' },
  { id: 'objects', shape: '["object-id", {"id":"object-id","relations":[{"to":"parent-id","kind":"belongs-to"}]}]' },
  { id: 'functionality', shape: '["capability-id", ...]' },
  { id: 'pages', shape: '["page-pattern-id", ...]' },
  { id: 'composition', shape: '{ "page-id": { ... } }' },
  { id: 'content', shape: '{ "copy": { ... }, ... }' },
  { id: 'review', shape: '{ "passed": true, "evidence": "..." }' },
]);
const IDENTIFIER = /^[a-z][a-z0-9]*(?:[.-][a-z0-9]+)*$/;
const own = (obj, key) => Object.prototype.hasOwnProperty.call(obj, key);
const isObj = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
const ids = (v, label, nonempty = false) => {
  if (!Array.isArray(v) || (nonempty && v.length === 0) ||
    v.some(x => typeof x !== 'string' || !IDENTIFIER.test(x)) ||
    new Set(v).size !== v.length) throw Error(`${label}: expected ${nonempty ? 'nonempty ' : ''}unique catalog ID array`);
};
function validate(id, selection, p) {
  if (id === 'classification') {
    if (!isObj(selection) || Object.keys(selection).join(',') !== 'type' || typeof selection.type !== 'string' || !IDENTIFIER.test(selection.type))
      throw Error('classification: expected { "type": "catalog-id" }');
    appTypes.get(selection.type);
  } else if (id === 'objects') {
    objects.validate(selection);
  } else if (id === 'functionality') {
    functionality.resolve(selection, p.batches.selections.objects);
  } else if (id === 'pages') {
    pages.resolve(selection,p.batches.selections.classification.type,p.batches.selections.objects,p.batches.selections.functionality);
  } else if (id === 'composition') {
    if (!isObj(selection) || !Object.keys(selection).length || Object.entries(selection).some(([k, v]) => !IDENTIFIER.test(k) || !isObj(v)))
      throw Error('composition: expected nonempty map of page IDs to configuration objects');
  } else if (id === 'content') {
    if (!isObj(selection) || !Object.keys(selection).length) throw Error('content: expected nonempty content object');
  } else if (id === 'review') {
    if (!isObj(selection) || selection.passed !== true || typeof selection.evidence !== 'string' || !selection.evidence.trim())
      throw Error('review: expected { "passed": true, "evidence": "..." }');
  }
}
export function nextId(p) {
  if (!p.batches) return null;
  return STAGES.find(s => !own(p.batches.selections ?? {}, s.id))?.id ?? null;
}
export function complete(p) { return Boolean(p.batches && p.batches.schemaVersion === 1 && nextId(p) === null); }
export function init(dir) {
  const p = engine.load(dir);
  if (p.batches) return { initialized: false, revision: p.revision, next: nextId(p) };
  if (p.approval) throw Error('Cannot enable documentation batches on an approved blueprint; start before approval');
  p.batches = { schemaVersion: 1, selections: {} };
  engine.save(dir, p);
  return { initialized: true, revision: p.revision, next: nextId(p) };
}
export function set(dir, id, selection) {
  const p = engine.load(dir);
  if (!p.batches || p.batches.schemaVersion !== 1) throw Error('Run workflow batch init first');
  const index = STAGES.findIndex(s => s.id === id);
  if (index < 0) throw Error(`Unknown batch "${id}"`);
  const prerequisite = STAGES.slice(0, index).find(s => !own(p.batches.selections, s.id));
  if (prerequisite) throw Error(`Complete ${prerequisite.id} before ${id}`);
  validate(id, selection, p);
  if (own(p.batches.selections, id) && JSON.stringify(p.batches.selections[id]) === JSON.stringify(selection))
    return { id, changed: false, revision: p.revision, next: nextId(p), invalidated: [] };
  const invalidated = STAGES.slice(index + 1).filter(s => own(p.batches.selections, s.id)).map(s => s.id);
  for (const s of STAGES.slice(index + 1)) delete p.batches.selections[s.id];
  p.batches.selections[id] = structuredClone(selection);
  const staleTasks = invalidate(p, ['design.batches']);
  engine.save(dir, p);
  return { id, changed: true, revision: p.revision, next: nextId(p), invalidated, staleTasks };
}
export function next(p, workflowStatus) {
  const prerequisite = workflowStatus.segments?.find(s => ['02-discovery', '03-requirements'].includes(s.id) && !s.complete);
  if (prerequisite) return { kind: 'segment', segment: prerequisite.id, next: workflowStatus.next };
  if (!p.batches) return { kind: 'segment', segment: workflowStatus.segment, next: workflowStatus.next, optional: 'workflow batch init --project <dir>' };
  const id = nextId(p);
  if (id) {
    const stage = STAGES.find(s => s.id === id);
    return { kind: 'batch', id, shape: stage.shape, completed: STAGES.indexOf(stage), total: STAGES.length,
      ...(id === 'classification' ? { catalog: 'catalog apps', choices: appTypes.list().map(a => a.id) } : {}),
      ...(id === 'objects' ? { suggestedDefaults: appTypes.expand(p.batches.selections.classification.type) } : {}),
      ...(id === 'functionality' ? { objectContract: objects.resolve(p.batches.selections.objects), capabilityCatalog: functionality.list(), suggestedCapabilities: appTypes.get(p.batches.selections.classification.type).defaults.capabilities } : {}),
      ...(id === 'pages' ? { functionalityContract: functionality.resolve(p.batches.selections.functionality,p.batches.selections.objects), pageCatalog: pages.list(p.batches.selections.classification.type), suggestedPages:pages.suggest(p.batches.selections.classification.type,p.batches.selections.objects,p.batches.selections.functionality) } : {}),
      ...(id === 'composition' ? { pageInventory: pages.resolve(p.batches.selections.pages,p.batches.selections.classification.type,p.batches.selections.objects,p.batches.selections.functionality) } : {}),
      command: `workflow batch set ${id} --project <dir> --file SELECTION.json` };
  }
  return { kind: 'segment', segment: workflowStatus.segment, next: workflowStatus.next, batchesComplete: true };
}
