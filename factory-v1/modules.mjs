// Construction modules: blueprint-driven recommendation and copy-in installation.
// Installed apps own the copied source (src/foundations/<module>); local edits are never overwritten.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
export function moduleLayout(root = path.resolve(here, '..')) {
  const repo = fs.existsSync(path.join(root, 'packages/foundations/registry.json'));
  const base = repo ? path.join(root, 'packages/foundations') : path.join(root, 'foundations');
  return { registry: path.join(base, 'registry.json'), source: path.join(base, 'src'), base };
}
export function loadModules(l = moduleLayout()) {
  return fs.existsSync(l.registry) ? JSON.parse(fs.readFileSync(l.registry, 'utf8')) : [];
}

function matches(rule, p) {
  if (rule.always) return true;
  if (rule.screensUse) return (p.screens ?? []).some((s) => (s.components ?? []).includes(rule.screensUse) || s.recipe === rule.screensUse);
  const fact = p.facts?.[rule.fact];
  const value = fact && ['stated', 'confirmed'].includes(fact.status) ? fact.value : p.answers?.[rule.fact];
  if (rule.present) return value !== undefined && value !== null && value !== '' && value !== false;
  if ('equals' in rule) return value === rule.equals;
  if (rule.matches) return value !== undefined && new RegExp(rule.matches, 'i').test(JSON.stringify(value));
  return false;
}

/** Modules a blueprint needs, with the reason for each and dependencies resolved. */
export function recommend(p, modules = loadModules()) {
  const picked = new Map();
  const add = (id, why) => {
    const m = modules.find((x) => x.id === id);
    if (!m || picked.has(id)) return;
    picked.set(id, why);
    for (const dep of m.dependsOn) add(dep, `required by ${id}`);
  };
  for (const m of modules) {
    const rule = m.when.find((r) => matches(r, p));
    if (rule) add(m.id, rule.always ? 'every app' : rule.screensUse ? `screens use ${rule.screensUse}` : `${rule.fact} = ${JSON.stringify(p.facts?.[rule.fact]?.value ?? p.answers?.[rule.fact])}`);
  }
  const ids = [...picked.keys()];
  const npm = [...new Set(ids.flatMap((id) => modules.find((m) => m.id === id).npm))].sort();
  return { modules: ids.map((id) => ({ id, why: picked.get(id) })), npm, install: `node scripts/factory.mjs module add ${ids.join(',')} --app <app dir>`, expoInstall: npm.length ? `npx expo install ${npm.join(' ')}` : null };
}

const sha = (buf) => crypto.createHash('sha256').update(buf).digest('hex');
const walk = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)]));

/** Copy modules (plus dependencies) into <app>/src/foundations. Never overwrites locally edited files. */
export function install(appDir, ids, { dryRun = false, l = moduleLayout() } = {}) {
  const modules = loadModules(l);
  const wanted = new Set();
  const visit = (id) => {
    const m = modules.find((x) => x.id === id);
    if (!m) throw Error(`Unknown module ${id}. Available: ${modules.map((x) => x.id).join(', ')}`);
    if (wanted.has(id)) return;
    wanted.add(id);
    m.dependsOn.forEach(visit);
  };
  ids.forEach(visit);
  const app = path.resolve(appDir);
  if (!fs.existsSync(path.join(app, 'package.json'))) throw Error(`${app} is not an app (no package.json); create it from the template first`);
  const manifestFile = path.join(app, 'factory-modules.json');
  const manifest = fs.existsSync(manifestFile) ? JSON.parse(fs.readFileSync(manifestFile, 'utf8')) : { files: {} };
  const result = { installed: [], identical: [], conflicts: [] };
  const plan = [];
  for (const id of wanted) {
    const m = modules.find((x) => x.id === id);
    for (const src of walk(path.join(l.source, m.dir))) {
      const rel = path.join('src/foundations', m.dir, path.relative(path.join(l.source, m.dir), src)).replaceAll('\\', '/');
      const dest = path.join(app, rel);
      const content = fs.readFileSync(src);
      if (fs.existsSync(dest)) {
        const current = sha(fs.readFileSync(dest));
        if (current === sha(content)) { result.identical.push(rel); continue; }
        if (manifest.files[rel] !== current) { result.conflicts.push(rel); continue; } // edited locally
      }
      plan.push({ rel, dest, content });
    }
  }
  if (result.conflicts.length) return { ...result, error: 'Locally modified files would be overwritten; nothing was changed. Merge by hand or remove them.' };
  if (!dryRun) {
    for (const f of plan) { fs.mkdirSync(path.dirname(f.dest), { recursive: true }); fs.writeFileSync(f.dest, f.content); manifest.files[f.rel] = sha(f.content); result.installed.push(f.rel); }
    manifest.modules = [...new Set([...(manifest.modules ?? []), ...wanted])].sort();
    fs.writeFileSync(manifestFile, JSON.stringify(manifest, null, 2) + '\n');
  } else result.installed = plan.map((f) => f.rel);
  const npm = [...new Set([...wanted].flatMap((id) => modules.find((m) => m.id === id).npm))].sort();
  const pkg = JSON.parse(fs.readFileSync(path.join(app, 'package.json'), 'utf8'));
  const missing = npm.filter((n) => !(pkg.dependencies ?? {})[n]);
  return { ...result, modules: [...wanted], expoInstall: missing.length ? `npx expo install ${missing.join(' ')}` : null, usage: [...wanted].map((id) => ({ id, usage: modules.find((m) => m.id === id).usage })) };
}
