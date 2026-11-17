// Deterministic construction for presentation apps: validate an app spec (JSON the agent writes),
// then emit Expo Router route files and install the Monad page runtime. Same spec → same bytes.
// Generated files carry a marker; files the app has edited are never overwritten.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
export function runtimeDir(root = path.resolve(here, '..')) {
  const repo = path.join(root, 'packages/assembly/src');
  return fs.existsSync(repo) ? repo : path.join(root, 'assembly/src');
}

const KIND_KEYS = {
  collection: ['kind', 'source', 'title', 'description', 'badge', 'media', 'search', 'segments', 'sort', 'onSelect'],
  detail: ['kind', 'source', 'param', 'media', 'heading', 'facts', 'body', 'badge', 'actions'],
  form: ['kind', 'source', 'mode', 'param', 'fields'],
  settings: ['kind', 'groups'],
  message: ['kind', 'heading', 'body'],
};
const PAGE_KEYS = ['route', 'title', 'subtitle', 'archetype', 'back', 'headerAction', 'subject', 'primary', 'events', 'empty'];
const APP_KEYS = ['$schema', 'name', 'design', 'mock', 'data', 'settings', 'pages'];
const FIELD_KEYS = ['key', 'label', 'type', 'required', 'min', 'max', 'placeholder', 'hint', 'default'];
const FIELD_TYPES = ['text', 'multiline', 'number', 'date', 'email', 'toggle'];
const FORMATS = ['date', 'relative', 'upper', 'yesno'];
const TONES = ['neutral', 'accent', 'success', 'warning', 'danger'];
const ID = /^[a-z][a-z0-9-]*$/;

export const ARCHETYPES = [
  'hero-decision',
  'glance-dashboard',
  'focus-wizard',
  'bento-overview',
  'content-canvas',
  'system-settings',
];

export const ARCHETYPE_COMPAT = {
  'hero-decision': ['detail', 'message', 'form'],
  'glance-dashboard': ['detail', 'collection'],
  'focus-wizard': ['form'],
  'bento-overview': ['collection', 'detail'],
  'content-canvas': ['detail', 'collection'],
  'system-settings': ['settings'],
};

const DESIGN_AXES = {
  preset: ['minimal-pro', 'kyoto-craft', 'fintech-midnight', 'wellness-botanical', 'editorial-luxury', 'playful-consumer'],
  palette: ['default', 'kyoto', 'midnight', 'emerald', 'crimson', 'amber'],
  radius: ['sharp', 'smooth', 'curved'],
  density: ['compact', 'comfortable', 'spacious'],
  typography: ['compact', 'default', 'editorial'],
  surface: ['flat', 'outlined', 'elevated'],
  layout: ['standard', 'editorial', 'immersive'],
  media: ['contained', 'edge-to-edge', 'mosaic'],
  colorMode: ['system', 'light', 'dark'],
};

const segs = (route) => route.split('/').filter(Boolean);
const dynamicParams = (route) => segs(route).filter((s) => /^\[[^\]]+\]$/.test(s)).map((s) => s.slice(1, -1));
const isObj = (v) => v && typeof v === 'object' && !Array.isArray(v);

/** Validate an app spec. Returns { ok, errors, warnings }; every message starts with a JSON path. */
export function validateSpec(spec) {
  const errors = [], warnings = [];
  const err = (p, m) => errors.push(`${p}: ${m}`);
  const unknownKeys = (obj, allowed, p) => { for (const k of Object.keys(obj ?? {})) if (!allowed.includes(k)) err(`${p}.${k}`, `unknown key (allowed: ${allowed.join(', ')})`); };
  if (!isObj(spec)) return { ok: false, errors: ['$: spec must be a JSON object'], warnings };
  unknownKeys(spec, APP_KEYS, '$');
  if (!spec.name || typeof spec.name !== 'string') err('$.name', 'required string');
  if (spec.design !== undefined) {
    unknownKeys(spec.design, Object.keys(DESIGN_AXES), '$.design');
    for (const [axis, allowed] of Object.entries(DESIGN_AXES)) {
      if (spec.design[axis] !== undefined && !allowed.includes(spec.design[axis])) {
        err(`$.design.${axis}`, allowed.join(' | '));
      }
    }
  }
  if (spec.mock !== undefined) unknownKeys(spec.mock, ['latencyMs', 'failFirstLoad'], '$.mock');
  if (!isObj(spec.data)) err('$.data', 'required object of collection name → array of records');
  const fieldsOf = {};
  for (const [name, rows] of Object.entries(spec.data ?? {})) {
    if (!Array.isArray(rows)) { err(`$.data.${name}`, 'must be an array of records'); continue; }
    fieldsOf[name] = new Set(['id', ...rows.flatMap((r) => (isObj(r) ? Object.keys(r) : []))]);
    rows.forEach((r, i) => { if (!isObj(r)) err(`$.data.${name}[${i}]`, 'must be an object'); });
    const ids = rows.map((r) => r?.id).filter((x) => x !== undefined);
    if (new Set(ids).size !== ids.length) err(`$.data.${name}`, 'duplicate record ids');
  }
  for (const c of spec.mock?.failFirstLoad ?? []) if (!(c in (spec.data ?? {}))) err('$.mock.failFirstLoad', `unknown collection ${c}`);
  if (!isObj(spec.pages) || !Object.keys(spec.pages).length) { err('$.pages', 'at least one page required'); return { ok: false, errors, warnings }; }

  const routes = new Map();
  for (const [id, page] of Object.entries(spec.pages)) {
    if (!ID.test(id)) err(`$.pages.${id}`, 'page ids are lowercase-hyphenated');
    if (!isObj(page)) { err(`$.pages.${id}`, 'must be an object'); continue; }
    if (typeof page.route !== 'string' || !page.route.startsWith('/')) err(`$.pages.${id}.route`, 'required, starts with /');
    else if (routes.has(page.route)) err(`$.pages.${id}.route`, `duplicates page ${routes.get(page.route)}`);
    else routes.set(page.route, id);
  }
  if (![...routes.keys()].includes('/')) err('$.pages', 'one page must have route "/"');

  for (const [id, page] of Object.entries(spec.pages)) {
    if (!isObj(page)) continue;
    const p = `$.pages.${id}`;
    unknownKeys(page, PAGE_KEYS, p);
    // Monad invariant: every page has a header title and exactly one subject.
    if (!page.title || typeof page.title !== 'string') err(`${p}.title`, 'required: every page has a header');
    const s = page.subject;
    if (!isObj(s) || !KIND_KEYS[s.kind]) { err(`${p}.subject.kind`, `one of ${Object.keys(KIND_KEYS).join(', ')}`); continue; }
    unknownKeys(s, KIND_KEYS[s.kind], `${p}.subject`);
    if (page.archetype !== undefined) {
      if (!ARCHETYPES.includes(page.archetype)) {
        err(`${p}.archetype`, `one of ${ARCHETYPES.join(' | ')}`);
      } else {
        const compat = ARCHETYPE_COMPAT[page.archetype];
        if (!compat.includes(s.kind)) {
          err(`${p}.archetype`, `archetype '${page.archetype}' is incompatible with subject kind '${s.kind}' (compatible: ${compat.join(', ')})`);
        }
      }
    }
    const source = s.source;
    if ('source' in s || ['collection', 'detail', 'form'].includes(s.kind)) {
      if (!source || !(source in (spec.data ?? {}))) err(`${p}.subject.source`, `unknown collection '${source}' (data has: ${Object.keys(spec.data ?? {}).join(', ') || 'none'})`);
    }
    const known = fieldsOf[source];
    const formFields = s.kind === 'form' ? (s.fields ?? []).map((f) => f.key) : [];
    const checkTemplate = (t, where, fields = known) => {
      if (t === undefined) return;
      if (typeof t !== 'string') { err(where, 'must be a string template'); return; }
      for (const m of t.matchAll(/\{([^}|]+)(?:\|([^}]+))?\}/g)) {
        if (m[2] && !FORMATS.includes(m[2])) err(where, `unknown format |${m[2]} (use ${FORMATS.join(', ')})`);
        const field = m[1].split('.')[0];
        if (fields && !fields.has(field)) err(where, `unknown field {${m[1]}} in ${source} (fields: ${[...fields].join(', ')})`);
        if (!fields && !source) warnings.push(`${where}: {${m[1]}} has no record on this page and renders empty`);
      }
    };
    const recordPage = s.kind === 'detail' || (s.kind === 'form' && s.mode === 'edit');
    const params = dynamicParams(page.route ?? '');
    if (recordPage && page.route !== '/' && s.param !== null) {
      const param = s.param ?? 'id';
      if (!params.includes(param)) err(`${p}.route`, `${s.kind} pages read the record from route param [${param}]; e.g. "/${source}/[${param}]"`);
    }
    checkTemplate(page.title, `${p}.title`, recordPage ? known : new Set());
    checkTemplate(page.subtitle, `${p}.subtitle`, recordPage ? known : new Set());

    const refs = [];
    const ref = (ev, where) => { if (ev !== undefined) refs.push([ev, where]); };
    if (page.headerAction) { unknownKeys(page.headerAction, ['label', 'event'], `${p}.headerAction`); ref(page.headerAction.event, `${p}.headerAction.event`); }
    if (page.primary) { unknownKeys(page.primary, ['label', 'event', 'tone'], `${p}.primary`); if (!page.primary.label) err(`${p}.primary.label`, 'required'); ref(page.primary.event, `${p}.primary.event`); }
    if (page.empty) { unknownKeys(page.empty, ['title', 'description', 'action'], `${p}.empty`); if (page.empty.action) ref(page.empty.action.event, `${p}.empty.action.event`); }
    if (s.kind === 'collection') {
      checkTemplate(s.title, `${p}.subject.title`);
      if (!s.title) err(`${p}.subject.title`, 'required row title template, e.g. "{name}"');
      checkTemplate(s.description, `${p}.subject.description`);
      if (s.badge) { checkTemplate(s.badge.label, `${p}.subject.badge.label`); if (s.badge.tone && !TONES.includes(s.badge.tone)) err(`${p}.subject.badge.tone`, TONES.join(' | ')); if (s.badge.when && known && !known.has(s.badge.when.replace(/^!/, ''))) err(`${p}.subject.badge.when`, `unknown field ${s.badge.when}`); }
      for (const f of s.search?.fields ?? []) if (known && !known.has(f)) err(`${p}.subject.search.fields`, `unknown field ${f}`);
      if (s.sort && known && !known.has(s.sort.by)) err(`${p}.subject.sort.by`, `unknown field ${s.sort.by}`);
      if (s.media && known && !known.has(s.media.field)) err(`${p}.subject.media.field`, `unknown field ${s.media.field}`);
      (s.segments ?? []).forEach((g, i) => { for (const k of Object.keys(g.where ?? {})) if (known && !known.has(k)) err(`${p}.subject.segments[${i}].where`, `unknown field ${k}`); });
      ref(s.onSelect, `${p}.subject.onSelect`);
    }
    if (s.kind === 'detail') {
      checkTemplate(s.heading, `${p}.subject.heading`); checkTemplate(s.body, `${p}.subject.body`);
      (s.facts ?? []).forEach((f, i) => checkTemplate(f.value, `${p}.subject.facts[${i}].value`));
      if (s.badge) checkTemplate(s.badge.label, `${p}.subject.badge.label`);
      if (s.media && known && !known.has(s.media.field)) err(`${p}.subject.media.field`, `unknown field ${s.media.field}`);
      (s.actions ?? []).forEach((a, i) => ref(a.event, `${p}.subject.actions[${i}].event`));
      if ((s.actions ?? []).length > 3) warnings.push(`${p}.subject.actions: more than 3 actions dilutes a focus page`);
    }
    if (s.kind === 'form') {
      if (!['create', 'edit'].includes(s.mode)) err(`${p}.subject.mode`, 'create | edit');
      if (!Array.isArray(s.fields) || !s.fields.length) err(`${p}.subject.fields`, 'at least one field');
      (s.fields ?? []).forEach((f, i) => {
        unknownKeys(f, FIELD_KEYS, `${p}.subject.fields[${i}]`);
        if (!f.key || !f.label) err(`${p}.subject.fields[${i}]`, 'key and label required');
        if (f.type && !FIELD_TYPES.includes(f.type)) err(`${p}.subject.fields[${i}].type`, FIELD_TYPES.join(' | '));
      });
      const all = (list) => (list ?? []).flatMap((a) => (isObj(a) && a.confirm ? [a, ...all(a.then)] : [a]));
      const submits = Object.values(page.events ?? {}).flatMap(all).some((a) => isObj(a) && (a.create || (a.update && a.from === 'form')));
      if (!page.primary) err(`${p}.primary`, 'form pages need a primary action that submits (an event with create, or update from "form")');
      else if (!submits) err(`${p}.events`, 'no event creates or updates from the form; the primary action would not save');
    }
    if (s.kind === 'settings') (s.groups ?? []).forEach((g, i) => (g.links ?? []).forEach((l, j) => ref(l.event, `${p}.subject.groups[${i}].links[${j}].event`)));
    if (s.kind === 'message') { checkTemplate(s.heading, `${p}.subject.heading`, new Set()); checkTemplate(s.body, `${p}.subject.body`, new Set()); }

    for (const [ev, where] of refs) if (!page.events?.[ev]) err(where, `event '${ev}' is not defined in ${p}.events`);
    const checkActions = (list, where) => {
      if (!Array.isArray(list)) { err(where, 'must be an array of actions'); return; }
      list.forEach((a, i) => {
        const w = `${where}[${i}]`;
        const kinds = ['navigate', 'back', 'create', 'update', 'remove', 'toggle', 'notice', 'confirm'].filter((k) => isObj(a) && k in a);
        if (kinds.length !== 1) { err(w, 'exactly one of navigate | back | create | update | remove | toggle | notice | confirm'); return; }
        const k = kinds[0];
        if (k === 'navigate') {
          const target = [...routes.keys()].find((r) => r === a.navigate);
          if (!target) err(`${w}.navigate`, `no page has route '${a.navigate}' (routes: ${[...routes.keys()].join(', ')})`);
          else for (const need of dynamicParams(target)) if (!a.params?.[need]) err(`${w}.params`, `route ${target} needs params.${need}, e.g. "{id}"`);
          for (const v of Object.values(a.params ?? {})) checkTemplate(v, `${w}.params`, s.kind === 'collection' || recordPage ? known : undefined);
        }
        if (['create', 'update', 'remove', 'toggle'].includes(k) && !(a[k] in (spec.data ?? {}))) err(`${w}.${k}`, `unknown collection '${a[k]}'`);
        if ((k === 'create' || a.from === 'form') && s.kind !== 'form') err(w, 'reads form values but this page has no form');
        if (k === 'update' && a.from !== 'form' && !a.set) err(w, 'update needs set:{…} or from:"form"');
        if (k === 'update' && a.set && known) for (const f of Object.keys(a.set)) if (!known.has(f)) err(`${w}.set`, `unknown field ${f}`);
        if (k === 'toggle' && known && !known.has(a.field)) err(`${w}.field`, `unknown field ${a.field}`);
        if (k === 'notice') checkTemplate(a.notice, `${w}.notice`, recordPage || s.kind === 'collection' ? known : undefined);
        if (k === 'confirm') { if (!a.confirm?.title || !a.confirm?.description) err(`${w}.confirm`, 'title and description required'); checkActions(a.then, `${w}.then`); }
        if (k === 'remove' && i < list.length - 1 && !list.slice(i + 1).some((x) => 'navigate' in x || 'back' in x) && recordPage) warnings.push(`${w}: removing the page's own record without navigating away leaves a "Not found" page`);
      });
      const destructive = list.some((a) => isObj(a) && 'remove' in a);
      if (destructive && !where.includes('.then')) err(where, 'destructive actions (remove) must be wrapped in confirm (standards: destructive actions are confirmed)');
    };
    for (const [ev, list] of Object.entries(page.events ?? {})) checkActions(list, `${p}.events.${ev}`);
  }
  // Reachability: every page should be navigable from "/".
  const reach = new Set(), queue = [routes.get('/')].filter(Boolean);
  const targets = (page) => JSON.stringify(page.events ?? {}).match(/"navigate":"[^"]+"/g)?.map((m) => routes.get(m.slice(12, -1))).filter(Boolean) ?? [];
  while (queue.length) { const id = queue.pop(); if (reach.has(id)) continue; reach.add(id); queue.push(...targets(spec.pages[id])); }
  for (const id of Object.keys(spec.pages)) if (!reach.has(id)) warnings.push(`$.pages.${id}: not reachable from "/" through navigate actions`);
  return { ok: errors.length === 0, errors, warnings };
}

// ---------- emission ----------
const MARK = '// GENERATED by the mobile factory (assemble). Edit app.spec.json and re-run assemble; do not edit by hand.';
const sha = (s) => crypto.createHash('sha256').update(s).digest('hex');
export function routeFile(route) {
  const parts = segs(route);
  return parts.length ? `app/${parts.join('/')}.tsx` : 'app/index.tsx';
}
const component = (id) => id.split('-').map((w) => w[0].toUpperCase() + w.slice(1)).join('') + 'Page';

/** Files (path → content) a spec produces. Pure and deterministic. */
export function emit(spec) {
  const files = {};
  files['src/factory/app.ts'] = `${MARK}\nimport { createStore, type AppSpec } from '@/src/assembly';\n\nexport const app: AppSpec = ${JSON.stringify(spec, null, 2)};\n\nexport const store = createStore(app);\n`;
  files['app/_layout.tsx'] = `${MARK}\nimport React from 'react';\nimport { AppShell } from '@/src/assembly';\nimport { app } from '@/src/factory/app';\n\nexport default function Layout() {\n  return <AppShell app={app} />;\n}\n`;
  for (const [id, page] of Object.entries(spec.pages).sort(([a], [b]) => a.localeCompare(b))) {
    files[routeFile(page.route)] = `${MARK}\nimport React from 'react';\nimport { MonadPage } from '@/src/assembly';\nimport { app, store } from '@/src/factory/app';\n\nexport default function ${component(id)}() {\n  return <MonadPage app={app} page="${id}" store={store} />;\n}\n`;
  }
  return files;
}

/** Validate, then write routes and install the runtime into an app. Never overwrites hand-edited files. */
export function assemble(specFile, appDir, { dryRun = false, root } = {}) {
  const spec = JSON.parse(fs.readFileSync(specFile, 'utf8'));
  const check = validateSpec(spec);
  if (!check.ok) return { ok: false, errors: check.errors, warnings: check.warnings };
  const app = path.resolve(appDir);
  if (!fs.existsSync(path.join(app, 'package.json'))) throw Error(`${app} is not an app (no package.json); copy templates/expo-app first`);
  if (!fs.existsSync(path.join(app, 'src/ui/index.ts'))) throw Error(`${app}/src/ui is missing; run install-source first`);
  const manifestFile = path.join(app, 'factory-assembly.json');
  const manifest = fs.existsSync(manifestFile) ? JSON.parse(fs.readFileSync(manifestFile, 'utf8')) : { files: {} };
  const files = emit(spec);
  const rt = runtimeDir(root);
  for (const f of fs.readdirSync(rt).filter((x) => /\.tsx?$/.test(x)).sort()) files[`src/assembly/${f}`] = fs.readFileSync(path.join(rt, f), 'utf8');
  const result = { ok: true, written: [], unchanged: [], conflicts: [], removed: [], warnings: check.warnings };
  const plan = [];
  for (const [rel, content] of Object.entries(files)) {
    const dest = path.join(app, rel);
    if (fs.existsSync(dest)) {
      const current = fs.readFileSync(dest, 'utf8');
      if (current === content) { result.unchanged.push(rel); continue; }
      // A file is ours to replace if we wrote it last, or it is the untouched template placeholder.
      const ours = manifest.files[rel] === sha(current) || (!manifest.files[rel] && /^app\/(index|_layout)\.tsx$/.test(rel) && isTemplate(rel, current, root));
      if (!ours) { result.conflicts.push(rel); continue; }
    }
    plan.push([rel, dest, content]);
  }
  // Routes generated earlier for pages that no longer exist.
  const stale = Object.keys(manifest.files).filter((rel) => rel.startsWith('app/') && !(rel in files));
  if (result.conflicts.length) return { ...result, ok: false, error: 'Hand-edited files would be overwritten; nothing was changed. Move the edits into the spec or remove the files.' };
  if (!dryRun) {
    for (const [rel, dest, content] of plan) { fs.mkdirSync(path.dirname(dest), { recursive: true }); fs.writeFileSync(dest, content); manifest.files[rel] = sha(content); result.written.push(rel); }
    for (const rel of stale) { const dest = path.join(app, rel); if (fs.existsSync(dest) && sha(fs.readFileSync(dest, 'utf8')) === manifest.files[rel]) { fs.rmSync(dest); result.removed.push(rel); } delete manifest.files[rel]; }
    manifest.spec = sha(JSON.stringify(spec));
    fs.writeFileSync(manifestFile, JSON.stringify(manifest, null, 2) + '\n');
  } else result.written = plan.map(([rel]) => rel);
  result.pages = Object.fromEntries(Object.entries(spec.pages).map(([id, p]) => [id, routeFile(p.route)]));
  return result;
}
function isTemplate(rel, content, root = path.resolve(here, '..')) {
  const f = path.join(root, 'templates/expo-app', rel);
  return fs.existsSync(f) && fs.readFileSync(f, 'utf8') === content;
}
