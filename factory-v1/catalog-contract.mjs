// Agent-facing catalog: merges registration facts (registry.json) with agent
// semantics (contracts.json) and recipes. See packages/catalog/CONTRACT.md.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadModules, moduleLayout } from './modules.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
export const LEVELS = ['candidate', 'implemented', 'tested', 'verified', 'recommended'];
export const ROLES = ['interview', 'document', 'construct'];
const REGISTRY_ONLY = ['id', 'name', 'category', 'status', 'source', 'exportName', 'showcase', 'test', 'npm', 'requires'];
const CONTRACT_FIELDS = ['summary', 'capabilities', 'experiences', 'props', 'constraints', 'recipe', 'compat', 'evidence', 'requires', 'replacedBy'];
const CLAIM = { development: 'candidate', candidate: 'candidate', preview: 'implemented', implemented: 'implemented', tested: 'tested', verified: 'verified', stable: 'recommended', recommended: 'recommended' };

/** Resolve file locations for the factory repo or an unpacked skill release. */
export function layout(root = path.resolve(here, '..')) {
  const repo = fs.existsSync(path.join(root, 'packages/catalog/registry.json'));
  return repo
    ? { root, registry: path.join(root, 'packages/catalog/registry.json'), contracts: path.join(root, 'packages/catalog/contracts.json'), recipes: path.join(root, 'packages/catalog/recipes'), source: path.join(root, 'packages/ui/src'), tests: path.join(root, 'packages/ui') }
    : { root, registry: path.join(root, 'catalog.json'), contracts: path.join(root, 'contracts.json'), recipes: path.join(root, 'recipes'), source: path.join(root, 'library'), tests: null };
}

const readJSON = (file, fallback) => (fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : fallback);
const importsOf = (file) => [...fs.readFileSync(file, 'utf8').matchAll(/(?:import|export)\s+(?:type\s+)?(?:[^'";]*?\s+from\s+)?['"]([^'"]+)['"]/g)].map((m) => m[1]);
function resolveRelative(from, spec) {
  const base = path.resolve(path.dirname(from), spec);
  for (const candidate of [base, ...['.tsx', '.ts', '.js'].map((e) => base + e), ...['.tsx', '.ts'].map((e) => path.join(base, 'index' + e))]) {
    if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) return candidate;
  }
  return null;
}
/** Internal file closure and external npm packages reachable from one source file. */
export function dependencyClosure(entry, sourceRoot) {
  const files = new Set(), npm = new Set(), queue = [entry];
  while (queue.length) {
    const file = queue.pop();
    if (files.has(file) || !fs.existsSync(file)) continue;
    files.add(file);
    for (const spec of importsOf(file)) {
      if (spec.startsWith('.')) { const hit = resolveRelative(file, spec); if (hit) queue.push(hit); }
      else npm.add(spec.startsWith('@') ? spec.split('/').slice(0, 2).join('/') : spec.split('/')[0]);
    }
  }
  for (const builtin of ['react', 'react-native']) npm.delete(builtin);
  return { files: [...files].map((f) => path.relative(sourceRoot, f).replaceAll('\\', '/')).sort(), npm: [...npm].sort() };
}

function parseRecipe(file) {
  const text = fs.readFileSync(file, 'utf8');
  const header = text.match(/\/\*\*([\s\S]*?)\*\//)?.[1] ?? '';
  const tag = (name) => header.match(new RegExp(`@${name}\\s+(.+)`))?.[1]?.trim();
  const list = (name) => (tag(name) ?? '').split(',').map((s) => s.trim()).filter(Boolean);
  return {
    id: tag('recipe'), kind: 'recipe', summary: tag('summary') ?? '', capabilities: list('capabilities'), experiences: list('experiences'),
    uses: list('uses'), constraints: list('constraints'), file: path.basename(file),
    recipe: text.replace(/^[\s\S]*?\*\/\s*/, '').trim(),
  };
}

function evidenceLevel(evidence = [], platforms = ['ios', 'android']) {
  const pass = (prefix) => evidence.some((e) => e.result === 'pass' && e.type.startsWith(prefix));
  const nativeOk = pass('ios-') && pass('android-') && (!platforms.includes('web') || pass('web-browser'));
  if (nativeOk && evidence.some((e) => e.type === 'design-review' && e.result === 'pass')) return 'recommended';
  if (nativeOk) return 'verified';
  return null;
}

/** Load and merge the catalog. Returns { items, vocabulary, problems (errors), warnings }. */
export function load(paths = layout()) {
  const registry = readJSON(paths.registry, []);
  const contract = readJSON(paths.contracts, { vocabulary: { capabilities: {}, experiences: {} }, items: {} });
  const problems = [];
  const warnings = [];
  const items = [];
  const exported = new Set();
  for (const reg of registry) {
    const c = contract.items?.[reg.id];
    if (!c) problems.push(`No contract for registered component ${reg.id}`);
    for (const key of Object.keys(c ?? {})) if (!CONTRACT_FIELDS.includes(key)) problems.push(`${reg.id}: unknown contract field '${key}'`);
    for (const key of Object.keys(reg)) if (CONTRACT_FIELDS.includes(key) && key !== 'requires' && c?.[key] !== undefined) problems.push(`${reg.id}: '${key}' defined in both registry and contract`);
    const sourceFile = reg.source ? path.join(paths.source, reg.source) : null;
    const hasSource = Boolean(sourceFile && fs.existsSync(sourceFile));
    if (hasSource) exported.add(reg.exportName);
    let structural = hasSource ? 'implemented' : 'candidate';
    if (hasSource && paths.tests && reg.test) {
      const testFile = path.join(paths.tests, reg.test);
      if (fs.existsSync(testFile) && /\b(test|it)\s*\(/.test(fs.readFileSync(testFile, 'utf8'))) structural = 'tested';
    }
    const claimed = CLAIM[reg.status] ?? 'candidate';
    const evidenced = evidenceLevel(c?.evidence, c?.compat?.platforms);
    // Effective = min(claim, what structure + evidence can support).
    const supported = evidenced && LEVELS.indexOf(evidenced) > LEVELS.indexOf(structural) ? evidenced : structural;
    const effective = LEVELS[Math.min(LEVELS.indexOf(claimed), LEVELS.indexOf(supported))];
    const deps = hasSource ? dependencyClosure(sourceFile, paths.source) : { files: [], npm: [] };
    items.push({
      id: reg.id, kind: 'component', name: reg.name, category: reg.category, exportName: reg.exportName,
      summary: c?.summary ?? '', capabilities: c?.capabilities ?? [], experiences: c?.experiences ?? [], props: c?.props ?? '',
      constraints: c?.constraints ?? [], recipe: c?.recipe ?? '', compat: c?.compat ?? {}, evidence: c?.evidence ?? [],
      requires: [...new Set([...(reg.requires ?? []), ...(c?.requires ?? [])])],
      dependencies: { npm: [...new Set([...(reg.npm ?? []), ...deps.npm])].sort(), files: deps.files },
      maturity: { claimed, effective, claimUnsupported: LEVELS.indexOf(claimed) > LEVELS.indexOf(effective), basis: evidenced ? 'recorded evidence' : structural === 'tested' ? 'automated (mocked) tests only' : structural === 'implemented' ? 'source exists; no behaviour test' : 'not implemented' },
      replacedBy: c?.replacedBy,
    });
  }
  // A contract may precede its registration (owned by the UI foundation); that is a warning, not an error.
  for (const id of Object.keys(contract.items ?? {})) if (!registry.some((r) => r.id === id)) warnings.push(`Contract awaiting registration: ${id}`);
  if (fs.existsSync(paths.recipes)) {
    for (const file of fs.readdirSync(paths.recipes).filter((f) => f.endsWith('.tsx')).sort()) {
      const r = parseRecipe(path.join(paths.recipes, file));
      if (!r.id || !/^recipe\.[a-z][a-z0-9-]*$/.test(r.id)) { problems.push(`${file}: missing or invalid @recipe id`); continue; }
      for (const use of r.uses) if (!items.some((i) => i.id === use)) problems.push(`${r.id}: uses unknown item ${use}`);
      const parts = r.uses.map((u) => items.find((i) => i.id === u)).filter(Boolean);
      const floor = parts.reduce((lo, p) => Math.min(lo, LEVELS.indexOf(p.maturity.effective)), LEVELS.length - 1);
      items.push({ ...r, name: r.id, requires: [...new Set(parts.flatMap((p) => p.requires))], dependencies: { npm: [...new Set(parts.flatMap((p) => p.dependencies.npm))].sort(), files: [] }, props: '', compat: {}, evidence: [], maturity: { claimed: LEVELS[floor], effective: LEVELS[floor], claimUnsupported: false, basis: 'lowest maturity of components used' } });
    }
  }
  // Construction modules (packages/foundations/registry.json) share the catalog and vocabulary.
  const ml = moduleLayout(paths.root);
  for (const m of loadModules(ml)) {
    const tests = (m.tests ?? []).filter((t) => fs.existsSync(path.join(ml.base, t)));
    const level = tests.length ? 'tested' : fs.existsSync(path.join(ml.source, m.dir)) ? 'implemented' : 'candidate';
    items.push({ id: m.id, kind: 'module', name: m.id, summary: m.summary, capabilities: m.capabilities, experiences: [], props: '', constraints: m.constraints ?? [], recipe: m.usage, compat: { platforms: ['ios', 'android'] }, evidence: [], requires: [], dependencies: { npm: m.npm, files: [] }, uses: m.dependsOn, maturity: { claimed: level, effective: level, claimUnsupported: false, basis: tests.length ? 'pure-logic Node tests (hooks/components untested)' : 'source exists; no behaviour test' } });
  }
  const vocab = contract.vocabulary ?? { capabilities: {}, experiences: {} };
  for (const item of items) {
    for (const cap of item.capabilities) if (!(cap in vocab.capabilities)) problems.push(`${item.id}: unknown capability '${cap}'`);
    for (const exp of item.experiences) if (!(exp in vocab.experiences)) problems.push(`${item.id}: unknown experience '${exp}'`);
  }
  return { items, vocabulary: vocab, problems, warnings, exported };
}

const STOP = new Set(['a', 'an', 'and', 'the', 'to', 'for', 'of', 'in', 'on', 'with', 'my', 'is', 'it', 'by', 'or', 'at', 'from', 'into', 'that', 'this']);
const words = (s) => String(s).toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length > 1 && !STOP.has(w));
// Common agent phrasings mapped onto catalog vocabulary.
const SYNONYMS = { sign: ['auth'], login: ['sign', 'auth'], logout: ['sign', 'auth'], signin: ['sign', 'auth'], account: ['auth', 'session'], persist: ['save', 'persistence'], store: ['save', 'persistence'], storage: ['persistence'], offline: ['device', 'persistence'], fetch: ['api'], http: ['api'], network: ['api'], picture: ['image'], photo: ['image'], crash: ['error', 'recovery'], delete: ['destructive', 'confirmation'], remove: ['destructive'], wizard: ['multi', 'step'], onboarding: ['paging', 'guided'], spinner: ['loading'], placeholder: ['skeleton'] };
const expand = (ws) => [...new Set(ws.flatMap((w) => [w, ...(SYNONYMS[w] ?? [])]))];
/** Rank items for a free-text need, with optional exact filters. */
export function find(catalog, { text = '', capability, experience, minMaturity = 'candidate', kind, limit = 8 } = {}) {
  const floor = LEVELS.indexOf(minMaturity);
  const q = expand(words(text));
  const hayOf = (i) => ({ cap: words(i.capabilities.join(' ')), exp: words(i.experiences.join(' ')), name: words(`${i.name} ${i.id}`), sum: words(i.summary) });
  // Inverse document frequency: rare, specific words outweigh common ones like "data".
  const all = catalog.items.map(hayOf);
  const idf = Object.fromEntries(q.map((w) => {
    const df = all.filter((h) => [...h.cap, ...h.exp, ...h.name, ...h.sum].some((x) => x.startsWith(w))).length;
    return [w, Math.log(1 + catalog.items.length / (1 + df))];
  }));
  return catalog.items
    .filter((i) => (!capability || i.capabilities.some((c) => c === capability || c.startsWith(capability + '.') || c.startsWith(capability + '-')))
      && (!experience || i.experiences.includes(experience)) && (!kind || i.kind === kind)
      && LEVELS.indexOf(i.maturity.effective) >= floor && !i.replacedBy)
    .map((i) => {
      const hay = hayOf(i);
      const score = q.reduce((s, w) => s + idf[w] * ((hay.name.includes(w) ? 4 : 0) + (hay.cap.some((x) => x.startsWith(w)) ? 3 : 0) + (hay.exp.includes(w) ? 2 : 0) + (hay.sum.some((x) => x.startsWith(w)) ? 1 : 0)), 0);
      return { item: i, score };
    })
    .filter((r) => !q.length || r.score > 0)
    .sort((a, b) => b.score - a.score || LEVELS.indexOf(b.item.maturity.effective) - LEVELS.indexOf(a.item.maturity.effective) || a.item.id.localeCompare(b.item.id))
    .slice(0, limit)
    .map(({ item }) => ({ id: item.id, kind: item.kind, summary: item.summary, maturity: item.maturity.effective }));
}

/** Compact, role-specific view of one item. */
export function view(catalog, id, role = 'construct') {
  if (!ROLES.includes(role)) throw Error(`Unknown role ${role}; use ${ROLES.join('|')}`);
  const i = catalog.items.find((x) => x.id === id);
  if (!i) throw Error(`Unknown catalog id ${id}. Try: catalog search <need>`);
  const m = i.maturity;
  const maturity = m.claimUnsupported ? `${m.effective} (claimed ${m.claimed}; unsupported)` : `${m.effective} — ${m.basis}`;
  const base = { id: i.id, kind: i.kind, summary: i.summary, maturity };
  if (role === 'interview') return { ...base, experiences: i.experiences, capabilities: i.capabilities };
  const doc = { ...base, capabilities: i.capabilities, props: i.props || undefined, constraints: i.constraints, requires: i.requires, npm: i.dependencies.npm, platforms: i.compat.platforms };
  if (role === 'document') return doc;
  const warnings = [];
  if (m.effective === 'candidate') warnings.push('Not implemented: create an implement task first; do not import.');
  if (m.claimUnsupported) warnings.push(`Registry claims '${m.claimed}' without supporting evidence; treat as '${m.effective}'.`);
  if (LEVELS.indexOf(m.effective) < LEVELS.indexOf('verified')) warnings.push('No native device evidence: verify on iOS and Android before claiming quality.');
  const HOSTS = { SafeAreaProvider: 'SafeAreaProvider (expo-router mounts it; add it yourself only outside expo-router)', PortalProvider: 'PortalProvider in app/_layout.tsx', PortalHost: 'one PortalHost in app/_layout.tsx' };
  if (i.requires.length) warnings.push(`Needs: ${i.requires.map((r) => HOSTS[r] ?? r).join('; ')}.`);
  if (i.kind === 'module') warnings.push(`Install: node scripts/factory.mjs module add ${i.id} --app <app>`);
  return { ...doc, import: i.kind === 'component' ? `import { ${i.exportName} } from '@/src/ui';` : undefined, uses: i.uses, recipe: i.recipe, warnings };
}

/** Experiences with the items that can deliver them (interview discovery). */
export function experiences(catalog) {
  return Object.entries(catalog.vocabulary.experiences).map(([id, label]) => ({
    id, label, items: catalog.items.filter((i) => i.experiences.includes(id) && !i.replacedBy).map((i) => `${i.id} (${i.maturity.effective})`),
  }));
}
