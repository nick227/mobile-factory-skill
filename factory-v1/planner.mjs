// Planning intelligence on top of the v1 engine: provenance-tracked facts,
// anchored source ingestion, conflict handling, lite mode, selective
// invalidation, typed data model, terminal wireframes and fresh-agent briefs.
// Canonical state stays in .factory/project.json; engine.audit/approve read
// the `answers` projection of confirmed facts, so the approval gate is unchanged.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import * as engine from './engine.mjs';
import * as cat from './catalog-contract.mjs';
import * as mods from './modules.mjs';

const KEY = /^[a-z][a-z0-9]*(?:[.-][a-z0-9]+)*$/;
const STATUSES = ['stated', 'inferred', 'proposed', 'confirmed'];
const PROJECTED = new Set(['stated', 'confirmed']);
const sha = (s) => crypto.createHash('sha256').update(s).digest('hex');
// Compare quotes ignoring whitespace, case and Markdown emphasis/code marks.
const norm = (s) => String(s).replace(/[*_`]+/g, '').replace(/\s+/g, ' ').trim().toLowerCase();
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const factoryDir = (dir) => path.join(path.resolve(dir), '.factory');

/** Extra design-minded questions. Engine workflow questions stay required; these sharpen the profile. */
export const questionBank = [
  { id: 'product.name', question: 'What is the app called?', priority: 3 },
  { id: 'experience.primary', question: 'Which experience matters most? (catalog experiences: browse-collection, item-detail, form-entry, guided-setup, settings, media-showcase, onboarding-paging, profile, choice-picking)', priority: 1 },
  { id: 'data.source', question: 'Does data come from a remote API, local device only, or both?', when: { 'data.required': true }, priority: 2 },
  { id: 'data.offline', question: 'Must the app work offline?', type: 'boolean', when: { 'data.required': true }, priority: 3 },
  { id: 'design.tone', question: 'Which words describe the intended feel (e.g. calm, editorial, playful)?', priority: 3 },
];

/** Lite-mode defaults: proposed, never projected until the user confirms them in one step. */
export const liteDefaults = {
  'identity.required': false,
  'data.required': false,
  'experience.navigation': 'Single stack: home screen pushes detail screens; native back',
  'design.direction': 'Factory Focus-First Native defaults (system light/dark, calm loading, one primary action per screen)',
  'release.targets': ['ios', 'android'],
};

// Which work depends on which fact keys (for selective invalidation).
const MODULE_KEYS = { 'module-auth': /^identity\./, 'module-data': /^data\./ };
const GLOBAL_KEYS = /^(product\.outcome|design\.|experience\.navigation)/;

// Clear consequences of stated facts update unconfirmed defaults (never stated or confirmed facts).
const IMPLIES = [
  { when: (k, v) => /^data\.(persistence|source|offline)$/.test(k) && v && !/^(none|no)\b/i.test(String(v)), set: 'data.required', value: true },
  { when: (k, v) => /^identity\.(method|recovery)$/.test(k) && v && !/^(none|no)\b/i.test(String(v)), set: 'identity.required', value: true },
];
function applyImplications(p) {
  const out = [];
  for (const [key, f] of Object.entries(p.facts)) {
    if (!PROJECTED.has(f.status)) continue;
    for (const rule of IMPLIES) {
      const target = p.facts[rule.set];
      if (!rule.when(key, f.value) || (target && !['proposed', 'inferred'].includes(target.status)) || target?.value === rule.value) continue;
      p.facts[rule.set] = { value: rule.value, status: 'inferred', sources: [{ id: 'factory', note: `implied by ${key}` }], history: target ? [...target.history, { value: target.value, status: target.status, sources: target.sources, replacedAtRevision: p.revision }] : [] };
      out.push(`${rule.set} = ${rule.value} (implied by ${key}; confirm with the user)`);
    }
  }
  return out;
}

function ensure(p) {
  p.facts ??= {}; p.sources ??= []; p.conflicts ??= []; p.profile ??= { mode: 'standard' }; p.skipped ??= [];
  return p;
}
function project(p) {
  for (const [key, f] of Object.entries(p.facts)) {
    if (PROJECTED.has(f.status)) p.answers[key] = f.value; else delete p.answers[key];
  }
}
/** Bump revision, drop approval and mark only dependent tasks stale (unrelated work keeps its status). */
function invalidate(p, keys, screenIds = []) {
  p.revision = (p.revision || 1) + 1; p.approval = null; p.phase = 'design';
  const global = keys.some((k) => GLOBAL_KEYS.test(k));
  const screens = new Set(screenIds);
  for (const s of p.screens ?? []) if ((s.basis ?? []).some((b) => keys.includes(b))) screens.add(s.id);
  const stale = new Set();
  for (const t of p.tasks ?? []) {
    const hitModule = Object.entries(MODULE_KEYS).some(([id, re]) => t.id === id && keys.some((k) => re.test(k)));
    const hitScreen = t.screenId && (global || screens.has(t.screenId));
    // Only finished work goes stale; work not yet started needs no change.
    if ((hitModule || hitScreen) && t.status === 'done') { t.priorStatus = 'done'; t.status = 'stale'; stale.add(t.id); }
  }
  // Propagate to dependents that were already done.
  let changed = true;
  while (changed) { changed = false; for (const t of p.tasks ?? []) if (t.status === 'done' && t.dependsOn?.some((d) => stale.has(d))) { t.priorStatus = 'done'; t.status = 'stale'; stale.add(t.id); changed = true; } }
  return [...stale];
}
function withProject(dir, fn) { const p = ensure(engine.load(dir)); const result = fn(p); engine.save(dir, p); return result; }

export function initProject(dir, name, mode = 'standard') {
  if (!['lite', 'standard'].includes(mode)) throw Error('mode must be lite or standard');
  engine.init(dir, name);
  return withProject(dir, (p) => {
    p.profile = { mode };
    if (mode === 'lite') for (const [key, value] of Object.entries(liteDefaults)) p.facts[key] = { value, status: 'proposed', sources: [{ id: 'factory', note: 'lite-mode default' }], history: [] };
    project(p);
    return { name, mode, proposed: Object.keys(p.facts) };
  });
}

/** Archive a requirement document and split it into citable anchors. */
export function addSource(dir, file, title) {
  const text = fs.readFileSync(file, 'utf8');
  return withProject(dir, (p) => {
    const digest = sha(text);
    const existing = p.sources.find((s) => s.sha256 === digest);
    if (existing) return { id: existing.id, anchors: existing.anchorCount, unchanged: true };
    const id = `s${p.sources.length + 1}`;
    // Headings form a breadcrumb (e.g. "Block Party › Platform") so titles stay citable.
    const anchors = [], trail = [];
    let heading = '';
    for (const block of text.split(/\n\s*\n/)) {
      const lines = block.split('\n').map((l) => l.trim()).filter(Boolean);
      for (const line of lines) {
        const h = line.match(/^(#{1,6})\s+(.*)$/);
        if (h) { trail.length = h[1].length - 1; trail[h[1].length - 1] = h[2]; heading = trail.filter(Boolean).join(' › '); }
      }
      const items = lines.filter((l) => !/^#{1,6}\s/.test(l));
      const isList = items.length > 1 && items.every((l) => /^([-*+]|\d+[.)])\s/.test(l));
      for (const chunk of isList ? items : items.length ? [items.join(' ')] : []) anchors.push({ id: `${id}:p${anchors.length + 1}`, heading, text: chunk.replace(/^([-*+]|\d+[.)])\s+/, '') });
    }
    // Incremental ingestion: anchors whose text was already mined in an earlier source carry over.
    // Unmined identical text in an older source defers to this newer copy, so each paragraph is mined once.
    const minedText = new Map(), openText = new Map();
    const done = cited(p);
    for (const prevSource of p.sources) for (const a of anchorsOf(dir, prevSource.id)) (done.has(a.id) ? minedText : openText).set(norm(a.text), a.id);
    p.carried ??= {};
    let carried = 0;
    for (const a of anchors) {
      const key = norm(a.text), from = minedText.get(key);
      if (from) { p.carried[a.id] = from; carried++; } else if (openText.has(key)) p.carried[openText.get(key)] = a.id;
    }
    const store = path.join(factoryDir(dir), 'sources');
    fs.mkdirSync(store, { recursive: true });
    fs.writeFileSync(path.join(store, `${id}.txt`), text);
    fs.writeFileSync(path.join(store, `${id}.json`), JSON.stringify({ id, title: title || path.basename(file), sha256: digest, anchors }, null, 2) + '\n');
    p.sources.push({ id, title: title || path.basename(file), sha256: digest, anchorCount: anchors.length, addedAt: new Date().toISOString() });
    return { id, anchors: anchors.length, carriedFromEarlierSources: carried, toMine: anchors.length - carried };
  });
}
function anchorsOf(dir, id) {
  const file = path.join(factoryDir(dir), 'sources', `${id}.json`);
  if (!fs.existsSync(file)) throw Error(`Unknown source ${id}`);
  const data = JSON.parse(fs.readFileSync(file, 'utf8'));
  if (sha(fs.readFileSync(path.join(factoryDir(dir), 'sources', `${id}.txt`), 'utf8')) !== data.sha256) throw Error(`Source ${id} archive integrity check failed`);
  return data.anchors;
}
function cited(p) {
  const out = new Set([...p.skipped, ...Object.keys(p.carried ?? {})]);
  for (const f of Object.values(p.facts)) for (const s of [...(f.sources ?? []), ...(f.history ?? []).flatMap((h) => h.sources ?? [])]) if (s.anchor) out.add(s.anchor);
  for (const s of p.screens ?? []) for (const a of s.sources ?? []) out.add(a);
  for (const c of p.conflicts ?? []) for (const o of c.options) for (const s of o.sources) if (s.anchor) out.add(s.anchor);
  return out;
}

/**
 * Record findings. Each finding: { key, value, status?, source?: {anchor, quote} | {id:'chat', quote}, note? }.
 * Also accepts { skip: ['s1:p3'] } to mark anchors as containing no requirement.
 */
export function record(dir, findings) {
  const list = Array.isArray(findings) ? findings : [findings];
  return withProject(dir, (p) => {
    const changed = [], conflicts = [], unchanged = [], implied = [];
    for (const f of list) {
      if (f.skip) { for (const a of f.skip) if (!p.skipped.includes(a)) p.skipped.push(a); continue; }
      if (!KEY.test(f.key ?? '')) throw Error(`Invalid fact key '${f.key}'; use dotted lowercase like data.source`);
      const status = f.status ?? 'stated';
      if (!STATUSES.includes(status)) throw Error(`status must be one of ${STATUSES.join(', ')}`);
      const source = f.source ? { ...f.source } : { id: 'chat' };
      if (source.anchor) {
        const [sid] = source.anchor.split(':');
        const anchor = anchorsOf(dir, sid).find((a) => a.id === source.anchor);
        if (!anchor) throw Error(`Unknown anchor ${source.anchor}`);
        if (!source.quote || !norm(`${anchor.heading} ${anchor.text}`).includes(norm(source.quote))) throw Error(`Quote for ${f.key} not found verbatim in ${source.anchor} (heading "${anchor.heading}"): "${anchor.text}"`);
      }
      if ((status === 'stated' || status === 'confirmed') && !source.anchor && !source.quote && source.id !== 'factory') throw Error(`${status} fact ${f.key} needs a source quote (user words or document anchor); use status inferred/proposed otherwise`);
      const prev = p.facts[f.key];
      if (prev && same(prev.value, f.value)) {
        // Same value: strengthen status (inferred -> stated -> confirmed) and clear any conflict on confirmation.
        const before = prev.status;
        if (status === 'confirmed') { prev.status = 'confirmed'; p.conflicts = p.conflicts.filter((c) => c.key !== f.key); }
        else if (status === 'stated' && ['inferred', 'proposed'].includes(prev.status)) prev.status = 'stated';
        prev.sources.push(source);
        (before === prev.status ? unchanged : changed).push(f.key); continue;
      }
      // Two documents/user statements disagree: keep both, require explicit resolution.
      if (prev && prev.status === 'stated' && status === 'stated' && prev.sources.some((s) => s.anchor) && source.anchor) {
        p.conflicts = p.conflicts.filter((c) => c.key !== f.key);
        p.conflicts.push({ key: f.key, options: [{ value: prev.value, sources: prev.sources }, { value: f.value, sources: [source] }] });
        prev.status = 'conflicted'; conflicts.push(f.key); continue;
      }
      const fact = { value: f.value, status, sources: [source], history: prev ? [...prev.history, { value: prev.value, status: prev.status, sources: prev.sources, replacedAtRevision: p.revision }] : [], note: f.note };
      p.facts[f.key] = fact;
      if (status === 'confirmed') p.conflicts = p.conflicts.filter((c) => c.key !== f.key);
      changed.push(f.key);
    }
    implied.push(...applyImplications(p));
    project(p);
    const wasProjected = changed.filter((k) => PROJECTED.has(p.facts[k].status) || p.facts[k].history.some((h) => PROJECTED.has(h.status)));
    const stale = wasProjected.length ? invalidate(p, wasProjected) : [];
    return { changed, unchanged, conflicts, implied: implied.length ? implied : undefined, revision: p.revision, staleTasks: stale };
  });
}

/** Confirm proposed/inferred facts or resolve a conflict, with the user's words as evidence. */
export function confirm(dir, keys, quote, values = {}) {
  if (!quote?.trim()) throw Error('Confirmation needs the user\'s words as --quote');
  const p0 = ensure(engine.load(dir));
  const targets = keys === 'all' ? Object.keys(p0.facts).filter((k) => ['proposed', 'inferred'].includes(p0.facts[k].status)) : keys;
  return record(dir, targets.map((key) => {
    const conflict = p0.conflicts.find((c) => c.key === key);
    if (conflict && !(key in values)) throw Error(`${key} is conflicted; pass the chosen value`);
    if (!p0.facts[key] && !(key in values)) throw Error(`No fact ${key}`);
    return { key, value: key in values ? values[key] : p0.facts[key].value, status: 'confirmed', source: { id: 'chat', quote } };
  }));
}

/** What to do next, highest value first, without repeating answered questions. */
export function next(dir, { batch = 6 } = {}) {
  const p = ensure(engine.load(dir));
  const items = [];
  for (const c of p.conflicts) items.push({ kind: 'resolve-conflict', key: c.key, options: c.options.map((o) => ({ value: o.value, from: o.sources.map((s) => s.anchor ?? s.id) })) });
  const toConfirm = Object.entries(p.facts).filter(([, f]) => ['proposed', 'inferred'].includes(f.status));
  if (toConfirm.length) items.push({ kind: 'confirm-assumptions', ask: 'Ask the user to confirm or correct these in one message', facts: Object.fromEntries(toConfirm.map(([k, f]) => [k, f.value])) });
  const known = (id) => id in p.facts && p.facts[id].status !== 'conflicted';
  const whenOk = (q) => !q.when || Object.entries(q.when).every(([k, v]) => p.facts[k]?.value === v);
  const open = [
    ...engine.workflow.filter((q) => q.required && whenOk(q) && !known(q.id)).map((q) => ({ ...q, required: true })),
    ...questionBank.filter((q) => whenOk(q) && !known(q.id) && (p.profile.mode !== 'lite' || q.priority === 1)).sort((a, b) => a.priority - b.priority).map((q) => ({ ...q, required: false })),
  ];
  const done = cited(p);
  const unmined = p.sources.map((s) => ({ s, rest: anchorsOf(dir, s.id).filter((a) => !done.has(a.id)) })).filter((x) => x.rest.length);
  if (unmined.length) {
    // Mine documents before asking the user anything they may already have written down.
    for (const { s, rest } of unmined) items.push({ kind: 'mine-source', source: s.id, remaining: rest.length, lookFor: open.map((q) => q.id), how: 'interview record --file findings.json with {key,value,source:{anchor,quote}} per fact; {skip:[anchors]} for anchors with no requirement; screen anchors are cited via screens[].sources in blueprint set', anchors: rest.slice(0, batch).map((a) => ({ id: a.id, heading: a.heading || undefined, text: a.text.length > 240 ? a.text.slice(0, 237) + '…' : a.text })) });
  } else {
    for (const q of open) items.push({ kind: 'ask', key: q.id, question: q.question, required: q.required });
  }
  const exp = p.facts['experience.primary']?.value;
  if (exp) { try { const c = cat.load(); items.push({ kind: 'catalog-suggestions', experience: exp, items: cat.find(c, { experience: String(exp) }).map((r) => `${r.id} (${r.maturity})`) }); } catch { /* catalog optional */ } }
  if (!items.length || items.every((i) => i.kind === 'catalog-suggestions')) items.push({ kind: (p.screens ?? []).length ? 'audit' : 'define-screens', hint: (p.screens ?? []).length ? 'Run blueprint audit' : 'Propose screens with blueprint set --file screens.json' });
  return { mode: p.profile.mode, revision: p.revision, items };
}

/** Merge screens/entities/roles/integrations/decisions by id; only affected tasks go stale. */
export function setBlueprint(dir, patch) {
  const allowed = ['screens', 'entities', 'roles', 'integrations', 'decisions', 'remove'];
  for (const k of Object.keys(patch)) if (!allowed.includes(k)) throw Error(`Unsupported field ${k}; facts go through interview record`);
  return withProject(dir, (p) => {
    const touchedScreens = [], keys = [], notes = [];
    for (const col of ['screens', 'entities', 'roles', 'integrations']) {
      for (const raw of patch[col] ?? []) {
        const item = typeof raw === 'string' ? { id: raw.toLowerCase().replace(/[^a-z0-9]+/g, '-') } : { ...raw };
        // Recipes are compositions, not registered components: keep them in screen.recipe so audit accepts the screen.
        if (col === 'screens' && Array.isArray(item.components) && item.components.some((c) => String(c).startsWith('recipe.'))) {
          const recipes = item.components.filter((c) => String(c).startsWith('recipe.'));
          item.components = item.components.filter((c) => !String(c).startsWith('recipe.'));
          if (!item.recipe) item.recipe = recipes[0];
          notes.push(`${item.id}: moved ${recipes.join(', ')} from components to recipe`);
        }
        if (!KEY.test(item.id ?? '')) throw Error(`${col} item needs a lowercase id`);
        if (col === 'entities' && item.fields) for (const [name, type] of Object.entries(item.fields)) parseType(type, `${item.id}.${name}`);
        p[col] ??= [];
        const i = p[col].findIndex((x) => (typeof x === 'string' ? x.toLowerCase() : x.id) === item.id);
        if (i >= 0 && same(p[col][i], { ...p[col][i], ...item })) continue;
        if (i >= 0) p[col][i] = { ...p[col][i], ...item }; else p[col].push(item);
        if (col === 'screens') touchedScreens.push(item.id); else if (col === 'entities') keys.push('data.model'); else if (col === 'roles') keys.push('identity.roles');
      }
    }
    for (const d of patch.decisions ?? []) if (!p.decisions.some((x) => same(x, d))) p.decisions.push(d);
    for (const [col, ids] of Object.entries(patch.remove ?? {})) { p[col] = (p[col] ?? []).filter((x) => !ids.includes(x.id)); if (col === 'screens') { p.tasks = (p.tasks ?? []).filter((t) => !ids.includes(t.screenId)); touchedScreens.push(...ids); } }
    const changed = touchedScreens.length || keys.length || (patch.decisions ?? []).length;
    const stale = changed ? invalidate(p, keys, touchedScreens) : [];
    return { revision: p.revision, screens: touchedScreens, staleTasks: stale, notes: notes.length ? notes : undefined };
  });
}

// ---------- typed data model ----------
const BASE = { string: 'string', text: 'string', int: 'number', number: 'number', bool: 'boolean', date: 'string', datetime: 'string', url: 'string', email: 'string', id: 'string' };
export function parseType(spec, where = 'field') {
  const m = String(spec).trim().match(/^(enum\(([^)]+)\)|ref\(([a-z][a-z0-9-]*)\)|([a-z]+)(?:\((\d*)\.\.(\d*)\))?)(\[\])?(\?)?$/);
  if (!m || (m[4] && !(m[4] in BASE))) throw Error(`Invalid type '${spec}' for ${where}. Use string|text|int|number|bool|date|datetime|url|email|id, string(3..80), enum(a|b), ref(entity), with optional [] and ?`);
  return { kind: m[2] ? 'enum' : m[3] ? 'ref' : m[4], values: m[2]?.split('|').map((s) => s.trim()), ref: m[3], min: m[5] ? Number(m[5]) : undefined, max: m[6] ? Number(m[6]) : undefined, list: Boolean(m[7]), optional: Boolean(m[8]) };
}
const pascal = (id) => id.split(/[-.]/).map((w) => w[0].toUpperCase() + w.slice(1)).join('');
export function typescriptModel(entities = []) {
  return entities.filter((e) => typeof e === 'object' && e.fields).map((e) => {
    const lines = Object.entries(e.fields).map(([name, spec]) => {
      const t = parseType(spec);
      let ts = t.kind === 'enum' ? t.values.map((v) => `'${v}'`).join(' | ') : t.kind === 'ref' ? 'string' : BASE[t.kind];
      if (t.list) ts = t.kind === 'enum' ? `(${ts})[]` : `${ts}[]`;
      const notes = [t.kind === 'ref' && `${t.ref} id`, t.kind === 'date' && 'YYYY-MM-DD', t.kind === 'datetime' && 'ISO 8601', (t.min !== undefined || t.max !== undefined) && `length ${t.min ?? 0}..${t.max ?? '∞'}`].filter(Boolean);
      return `  ${name}${t.optional ? '?' : ''}: ${ts};${notes.length ? ` // ${notes.join(', ')}` : ''}`;
    });
    return `export interface ${pascal(e.id)} {\n${lines.join('\n')}\n}`;
  }).join('\n\n');
}

// ---------- terminal wireframes ----------
const W = 36;
const pad = (s, w = W - 4) => (s.length > w ? s.slice(0, w - 1) + '…' : s.padEnd(w));
const line = (s = '') => `│ ${pad(s)} │`;
const BLOCKS = {
  'composites.screenheader': (b) => [line(`‹ ${b.label ?? 'Back'}`), line(b.title ?? '')],
  'composites.mediaframe': (b) => { const r = b.ratio ?? 16 / 9; const h = Math.max(2, Math.min(6, Math.round((W - 4) / r / 2.4))); return [`│ ┌${'─'.repeat(W - 6)}┐ │`, ...Array.from({ length: h }, (_, i) => `│ │${(i === Math.floor(h / 2) ? `IMAGE ${b.ratioLabel ?? ''}`.trim() : '').padStart(Math.floor((W - 6) / 2) + 4).padEnd(W - 6)}│ │`), `│ └${'─'.repeat(W - 6)}┘ │`]; },
  'patterns.immersivehero': (b) => [...BLOCKS['composites.mediaframe']({ ratio: 4 / 3, ratioLabel: 'HERO' }), line(b.title ? `▌${b.title}` : '▌Title over image')],
  'controls.textfield': (b) => [line(b.label ?? 'Label'), line(`[${'_'.repeat(W - 7)}]`)],
  'composites.listitem': (b) => Array.from({ length: b.count ?? 3 }, (_, i) => [line(`▢ ${b.label ?? 'Item'} ${i + 1}`), line('  description')]).flat(),
  'patterns.editorialmosaic': () => [line('┌─────────┐ ┌──────────────┐'), line('│  IMG    │ │   IMG        │'), line('└─────────┘ └──────────────┘'), line('Title       Title')],
  'controls.button': (b) => [line(`[ ${b.label ?? 'Action'} ]`)],
  'controls.iconbutton': (b) => [line(`(${b.label ?? '+'})`)],
  'controls.calmskeleton': () => [line('░'.repeat(W - 6)), line('░'.repeat(Math.round((W - 6) * 0.6)))],
  'composites.emptystate': (b) => [line(''), line(`   ${b.label ?? 'Nothing here yet'}`), line('')],
  'controls.toggle': (b) => [line(`${pad(b.label ?? 'Setting', W - 11)} (● )`)],
  'controls.checkbox': (b) => [line(`[✓] ${b.label ?? 'Option'}`)],
  'controls.radiogroup': (b) => [line(`(•) ${b.label ?? 'Option A'}`), line('( ) Option B')],
  'controls.segmentedcontrol': () => [line('[ One | Two | Three ]')],
  'patterns.choicegallery': () => [line('┌────────┐ ┌────────┐'), line('│ ✓ A    │ │   B    │'), line('└────────┘ └────────┘')],
  'controls.stepprogress': (b) => [line(b.label ?? 'Step 1 of 3  ●○○')],
  'controls.progressbar': () => [line(`[${'█'.repeat(12)}${'·'.repeat(W - 18)}]`)],
  'patterns.settingsgroup': (b) => [line(b.title ?? 'Group'), line('  Row                       ›'), line('  Row                       ›')],
  'composites.sectionheader': (b) => [line(`${b.label ?? 'Section'}               See all`)],
  'patterns.swipepager': () => [line('‹ Previous      1 / 3     Next ›')],
  'primitives.text': (b) => [line(b.label ?? 'Text')],
  'composites.avatar': (b) => [line(`(AB) ${b.label ?? 'Name'}`)],
  'controls.badge': (b) => [line(`(${b.label ?? 'Badge'})`)],
};
const DOCK = new Set(['patterns.actiondock', 'patterns.actionfooter', 'patterns.focusscreen']);
const SILENT = new Set(['primitives.screen', 'primitives.stack', 'primitives.row', 'primitives.surface', 'primitives.spacer', 'primitives.divider', 'patterns.focuswizard']);
/**
 * Deterministic ASCII wireframe. Uses screen.layout (ordered [{use, label?, title?, count?, ratio?}])
 * when present, otherwise derives blocks from screen.components.
 */
export function wireframe(screen) {
  const blocks = (screen.layout ?? (screen.components ?? []).map((use) => ({ use }))).filter((b) => !SILENT.has(b.use));
  const body = blocks.filter((b) => !DOCK.has(b.use) && b.use !== 'controls.button' || (b.use === 'controls.button' && !blocks.some((x) => DOCK.has(x.use))));
  const dock = blocks.some((b) => DOCK.has(b.use)) ? blocks.filter((b) => b.use === 'controls.button' || DOCK.has(b.use)) : [];
  const out = [`┌${'─'.repeat(W - 2)}┐`, line(`${screen.title ?? screen.id}`.toUpperCase()), line(screen.route ?? ''), `├${'─'.repeat(W - 2)}┤`];
  for (const b of body) out.push(...(BLOCKS[b.use]?.(b) ?? [line(`[${b.use}]`)]), line());
  if (dock.length) { out.push(`├${'─'.repeat(W - 2)}┤`); for (const b of dock.filter((x) => x.use === 'controls.button')) out.push(line(`[ ${b.label ?? 'Primary action'} ]`.padStart(Math.floor((W - 4) / 2) + 6))); if (!dock.some((x) => x.use === 'controls.button')) out.push(line('[ Primary action ]')); }
  out.push(`└${'─'.repeat(W - 2)}┘`);
  if (screen.states?.length) out.push(`states: ${screen.states.join(', ')}`);
  return out.join('\n');
}

// ---------- fresh-agent brief and docs ----------
function factLine(key, f) {
  const src = f.sources.map((s) => s.anchor ?? s.id).filter((v, i, a) => a.indexOf(v) === i).join(',');
  return `- \`${key}\`: ${JSON.stringify(f.value)} — ${f.status}${src ? ` [${src}]` : ''}${f.history.length ? ` (rev. ${f.history.length}×)` : ''}`;
}
export function brief(dir, { write = true } = {}) {
  const p = ensure(engine.load(dir));
  const audit = engine.audit(p);
  const approved = p.approval?.revision === p.revision;
  const facts = Object.entries(p.facts).sort(([a], [b]) => a.localeCompare(b));
  const model = typescriptModel(p.entities);
  const nextTasks = engine.next(p).map((t) => t.id);
  const md = [
    `# ${p.name} — agent brief (rev ${p.revision}, ${approved ? `APPROVED ${p.approval.blueprintHash.slice(0, 12)}` : 'NOT APPROVED — no construction'})`,
    `Mode: ${p.profile.mode}. Canonical state: .factory/project.json. This brief is a projection; do not edit it.`,
    '', '## Decisions', ...facts.map(([k, f]) => factLine(k, f)),
    p.conflicts.length ? `\n## Conflicts (resolve before approval)\n${p.conflicts.map((c) => `- ${c.key}: ${c.options.map((o) => JSON.stringify(o.value)).join(' vs ')}`).join('\n')}` : '',
    '', `## Screens (${(p.screens ?? []).length})`,
    ...(p.screens ?? []).map((s) => `- **${s.id}** \`${s.route ?? '?'}\` — ${s.purpose ?? ''}\n  uses: ${(s.components ?? []).join(', ')}${s.recipe ? `; recipe: ${s.recipe}` : ''}\n  states: ${(s.states ?? []).join(', ')}; actions: ${(s.actions ?? []).join(', ')}\n  done when: ${(s.acceptance ?? []).join('; ')}`),
    model ? `\n## Data model\n\`\`\`ts\n${model}\n\`\`\`` : '',
    (p.roles ?? []).length ? `\n## Roles\n${p.roles.map((r) => `- ${typeof r === 'string' ? r : `${r.id}${r.can ? `: ${r.can.join(', ')}` : ''}`}`).join('\n')}` : '',
    `\n## Readiness\n${audit.ready ? 'Blueprint audit: ready.' : audit.problems.map((x) => `- ${x.scope}${x.id ? ' ' + x.id : ''}: ${x.message}`).join('\n')}`,
    (p.tasks ?? []).some((t) => t.gaps?.length) ? `\n## Unverified (done without evidence for)\n${p.tasks.filter((t) => t.gaps?.length).map((t) => `- ${t.id}: ${t.gaps.join('; ')}`).join('\n')}` : '',
    nextTasks.length ? `\n## Next tasks\n${nextTasks.map((t) => `- ${t} → \`plan task ${t}\``).join('\n')}` : '',
  ].filter((x) => x !== '').join('\n') + '\n';
  if (write) {
    const docs = path.join(factoryDir(dir), 'docs');
    fs.mkdirSync(docs, { recursive: true });
    fs.writeFileSync(path.join(docs, 'BRIEF.md'), md);
    fs.writeFileSync(path.join(docs, 'SCREENS.md'), `# Screen contracts and wireframes (rev ${p.revision})\n\n` + (p.screens ?? []).map((s) => `## ${s.title ?? s.id}\n\n\`\`\`\n${wireframe(s)}\n\`\`\`\n`).join('\n'));
    fs.writeFileSync(path.join(docs, 'DECISIONS.md'), `# Decision log (rev ${p.revision})\n\n` + facts.map(([k, f]) => `## ${k}\n${factLine(k, f)}\n${f.sources.filter((s) => s.quote).map((s) => `> ${s.quote}`).join('\n')}${f.history.length ? '\n\nHistory:\n' + f.history.map((h) => `- ${JSON.stringify(h.value)} (${h.status}, replaced at rev ${h.replacedAtRevision})`).join('\n') : ''}\n`).join('\n'));
    const designFacts = facts.filter(([key]) => key.startsWith('design.'));
    const legacyDesign = Object.entries(p.answers ?? {}).filter(([key]) => key.startsWith('design.') && !p.facts[key]);
    fs.writeFileSync(path.join(docs, 'DESIGN.md'), `# Global design (rev ${p.revision})\n\nCanonical source: .factory/project.json. This file is generated; do not edit.\n\n` +
      (designFacts.length || legacyDesign.length ? [...designFacts.map(([key, value]) => factLine(key, value)), ...legacyDesign.map(([key, value]) => `- ${key}: ${JSON.stringify(value)} — recorded`)].join('\n') : 'No global design preferences recorded.') + '\n');
    fs.writeFileSync(path.join(docs, 'INTERACTIONS.md'), `# Presentation interactions (rev ${p.revision})\n\nCanonical source: .factory/project.json. This file is generated; do not edit.\n\n` +
      (p.screens ?? []).map(s => `## ${s.title ?? s.id} (${s.id})\nRoute: ${s.route ?? '?'}\nPurpose: ${s.purpose ?? ''}\nActions:\n${(s.actions ?? []).length ? s.actions.map(a => `- ${typeof a === 'string' ? a : JSON.stringify(a)}`).join('\n') : '- None'}\nStates: ${(s.states ?? []).join(', ')}\n\n`).join(''));
    if (model) fs.writeFileSync(path.join(docs, 'model.ts'), `// Generated from .factory/project.json rev ${p.revision}. Copy into src/features/*/types.ts.\n${model}\n`);
  }
  return { markdown: md, tokensApprox: Math.ceil(md.length / 4) };
}

/** Compact construction package: replaces raw catalog records with construct views, adds recipe and wireframe. */
export function taskPackage(dir, id) {
  const p = ensure(engine.load(dir));
  const pkg = engine.packageTask(p, id);
  const c = cat.load();
  const screen = pkg.screen;
  const views = (screen?.components ?? []).map((cid) => { try { const v = cat.view(c, cid, 'construct'); return { id: v.id, import: v.import, props: v.props, constraints: v.constraints.length ? v.constraints : undefined, warnings: v.warnings.filter((w) => !/native device evidence/.test(w)) }; } catch (err) { return { id: cid, error: err.message }; } });
  const recipe = screen?.recipe ? cat.view(c, screen.recipe, 'construct') : null;
  const relevantFacts = Object.fromEntries(Object.entries(p.facts).filter(([k, f]) => PROJECTED.has(f.status) && (!screen || GLOBAL_KEYS.test(k) || (screen.basis ?? []).includes(k))).map(([k, f]) => [k, f.value]));
  const entities = (p.entities ?? []).filter((e) => typeof e === 'object' && (!screen?.entities || screen.entities.includes(e.id)));
  return {
    project: p.name, revision: p.revision, approved: p.approval?.revision === p.revision, task: pkg.task,
    screen: screen ? { ...screen, wireframe: wireframe(screen) } : undefined,
    decisions: relevantFacts, model: entities.length ? typescriptModel(entities) : undefined,
    components: views.length ? views : undefined,
    recipe: recipe ? { id: recipe.id, code: recipe.recipe, constraints: recipe.constraints } : undefined,
    modules: /^(setup-|module-)/.test(id) ? (() => { const r = mods.recommend(p); const all = mods.loadModules(); const scope = id === 'module-auth' ? /auth|persistence/ : id === 'module-data' ? /api-client|persistence|validation|env/ : /./; return { install: r.install, expoInstall: r.expoInstall, items: r.modules.filter((m) => scope.test(m.id)).map((m) => ({ ...m, usage: all.find((x) => x.id === m.id)?.usage })) }; })() : undefined,
    rules: ['Compose the listed components; do not reimplement them.', 'Report only verification you actually ran; device quality needs device evidence.', `Finish with: plan done ${id} --evidence "<commands run and results>"`],
  };
}

/** Re-plan after re-approval without discarding finished work: done stays done unless marked stale. */
export function planBuild(dir) {
  const before = ensure(engine.load(dir)).tasks ?? [];
  const result = engine.planBuild(dir);
  return withProject(dir, (p) => {
    const prev = new Map(before.map((t) => [t.id, t]));
    let kept = 0, redo = 0;
    for (const t of p.tasks) {
      const old = prev.get(t.id);
      if (old?.status === 'done') { Object.assign(t, { status: 'done', evidence: old.evidence, completedAt: old.completedAt }); kept++; }
      else if (old?.status === 'stale') { t.status = 'todo'; t.priorEvidence = old.evidence; redo++; }
    }
    return { count: result.count, keptDone: kept, redoStale: redo, next: engine.next(p).map((t) => t.id) };
  });
}

const EVIDENCE = /\b(tsc|typecheck|expo export|bundle|test|jest|node --test|lint|pnpm|npm|npx|ran|passed|failed|exit)\b/i;
/** Like engine.doneTask but rejects evidence that names no executed check and blocks unbacked device claims. */
export function done(dir, id, evidence) {
  const text = String(evidence ?? '').trim();
  const p = ensure(engine.load(dir));
  const task = p.tasks.find((t) => t.id === id);
  if (task && task.type !== 'user-gated' && !EVIDENCE.test(text)) throw Error('Evidence must name the checks you actually ran and their result (e.g. "tsc --noEmit exit 0; expo export android ok").');
  if (/\b(device|simulator|emulator|screen reader|voiceover|talkback)\b/i.test(text) && !/\b(not|no|without|unverified|pending)\b/i.test(text) && !/\b(ios|android)\b.*\b(\d{1,2}(\.\d+)*)\b/i.test(text)) throw Error('Device/screen-reader claims need the platform and OS version (e.g. "Android 16 Pixel 8: TalkBack labels ok"), or say explicitly that it was not done.');
  const result = engine.doneTask(dir, id, text);
  // Record acceptance items the evidence did not cover, so they stay visible instead of silently "done".
  const visual = (task?.acceptance ?? []).some((a) => /visual|device/i.test(a));
  const deviceEvidence = /\b(ios|android|web|chrome|safari)\b[^.;]*\d/i.test(text) && !/\b(not|no|without)\b[^.;]*\b(visual|device|browser)/i.test(text);
  if (visual && !deviceEvidence) withProject(dir, (q) => { const t = q.tasks.find((x) => x.id === id); t.gaps = ['visual review: no device/browser evidence recorded']; });
  return visual && !deviceEvidence ? { ...result, gaps: ['visual review: no device/browser evidence recorded'] } : result;
}
