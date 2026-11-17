// Canonical object namespace contract for the documentation object batch.
// No data models, event handlers, UI controls or pages are generated in MR 3.
// Compact strings and richer relationship declarations normalize identically.
const OBJECT_ID = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/;
const KINDS = Object.freeze(['belongs-to', 'has-many', 'references']);
const isObject = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const owns = (value, key) => Object.prototype.hasOwnProperty.call(value, key);

export function resolve(input) {
  if (!Array.isArray(input) || input.length === 0)
    throw Error('objects: expected nonempty array of object IDs or {id, relations} declarations');
  const objects = input.map((entry, index) => {
    const where = `objects[${index}]`;
    const value = typeof entry === 'string' ? { id: entry } : entry;
    if (!isObject(value) || Object.keys(value).some(key => !['id', 'relations'].includes(key)))
      throw Error(`${where}: expected ID or {id, relations}`);
    if (typeof value.id !== 'string' || !OBJECT_ID.test(value.id))
      throw Error(`${where}.id: expected lowercase hyphenated ID`);
    if (owns(value, 'relations') && !Array.isArray(value.relations))
      throw Error(`${where}.relations: expected array`);
    const relations = (value.relations ?? []).map((r, ri) => {
      const location = `${where}.relations[${ri}]`;
      if (!isObject(r) || Object.keys(r).length !== 2 || !owns(r, 'to') || !owns(r, 'kind'))
        throw Error(`${location}: expected {to, kind}`);
      if (typeof r.to !== 'string' || !OBJECT_ID.test(r.to))
        throw Error(`${location}.to: invalid object ID`);
      if (!KINDS.includes(r.kind)) throw Error(`${location}.kind: choose ${KINDS.join(' | ')}`);
      return { to: r.to, kind: r.kind };
    });
    return { id: value.id, relations };
  });
  const known = new Set(objects.map(o => o.id));
  if (known.size !== objects.length) throw Error('objects: duplicate object ID');
  for (const obj of objects) {
    const seen = new Set();
    for (const rel of obj.relations) {
      if (rel.to === obj.id) throw Error(`objects.${obj.id}: self relation is not supported`);
      if (!known.has(rel.to)) throw Error(`objects.${obj.id}: unknown relationship target "${rel.to}"`);
      const key = `${rel.to}:${rel.kind}`;
      if (seen.has(key)) throw Error(`objects.${obj.id}: duplicate relationship ${key}`);
      seen.add(key);
    }
  }
  // Containment must not form circular parent chains. References may be cyclic.
  const parents = new Map(objects.map(o => [o.id, o.relations.filter(r => r.kind === 'belongs-to').map(r => r.to)]));
  const visiting = new Set(), visited = new Set();
  const visit = id => {
    if (visiting.has(id)) throw Error(`objects: circular belongs-to relation at "${id}"`);
    if (visited.has(id)) return;
    visiting.add(id);
    for (const parent of parents.get(id)) visit(parent);
    visiting.delete(id); visited.add(id);
  };
  for (const obj of objects) visit(obj.id);
  return objects.map(obj => ({
    id: obj.id,
    relations: obj.relations,
    namespaces: {
      data: obj.id,
      events: `${obj.id}.`,
      controls: `${obj.id}.control.`,
      display: `${obj.id}.display.`,
    },
  }));
}
export function validate(input) { resolve(input); return true; }
export function ids(input) { return resolve(input).map(o => o.id); }
