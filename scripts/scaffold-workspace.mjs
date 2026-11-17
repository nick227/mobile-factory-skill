#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as engine from '../factory-v1/engine.mjs';
import { installSource } from './install-source.mjs';

const factoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const requiredDocs = ['BRIEF.md', 'SCREENS.md', 'DECISIONS.md', 'DESIGN.md', 'INTERACTIONS.md'];
const walk = dir => fs.readdirSync(dir, { withFileTypes: true }).flatMap(e => {
  const entry = path.join(dir, e.name);
  return e.isDirectory() ? walk(entry) : [entry];
});

/** Add an Expo presentation app to an existing approved factory project, without touching its documentation. */
export function scaffoldWorkspace(projectDir, { root = factoryRoot } = {}) {
  const project = path.resolve(projectDir);
  const state = engine.load(project);
  if (state.approval?.revision !== state.revision) {
    throw Error('Blueprint is not approved at the current revision; complete the approval gate first');
  }
  const audit = engine.audit(state);
  if (!audit.ready) throw Error(`Blueprint is not ready: ${audit.problems.map(p => p.message).join('; ')}`);
  const docs = path.join(project, '.factory', 'docs');
  for (const name of requiredDocs) {
    const file = path.join(docs, name);
    if (!fs.existsSync(file)) throw Error(`Missing documentation ${name}; run blueprint brief before scaffolding`);
    const content = fs.readFileSync(file, 'utf8');
    if (!content.includes(`rev ${state.revision}`)) {
      throw Error(`Stale documentation ${name}; regenerate with blueprint brief`);
    }
  }
  if (fs.existsSync(path.join(project, 'package.json'))) {
    throw Error('Application already scaffolded (package.json exists); refusing to overwrite it');
  }

  const template = path.join(root, 'templates', 'expo-app');
  const library = fs.existsSync(path.join(root, 'packages', 'ui', 'src'))
    ? path.join(root, 'packages', 'ui', 'src') : path.join(root, 'library');
  const catalog = fs.existsSync(path.join(root, 'packages', 'catalog', 'registry.json'))
    ? path.join(root, 'packages', 'catalog', 'registry.json') : path.join(root, 'catalog.json');
  if (!fs.existsSync(template) || !fs.existsSync(library) || !fs.existsSync(catalog)) {
    throw Error('Missing packaged Expo template, component library, or catalog');
  }

  // Build everything away from the project first; failures cannot corrupt the planning workspace.
  const stage = fs.mkdtempSync(path.join(path.dirname(project), '.factory-scaffold-'));
  try {
    fs.cpSync(template, stage, { recursive: true, force: true });
    const slug = path.basename(project).toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, '') || 'factory-app';
    const pkgPath = path.join(stage, 'package.json');
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    pkg.name = slug;
    fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
    const appPath = path.join(stage, 'app.json');
    const app = JSON.parse(fs.readFileSync(appPath, 'utf8'));
    app.expo.name = state.name;
    app.expo.slug = slug;
    app.expo.scheme = slug.replace(/[^a-z0-9]/g, '') || 'factoryapp';
    fs.writeFileSync(appPath, JSON.stringify(app, null, 2) + '\n');
    installSource({ libraryDir: library, registryFile: catalog, appDir: stage, all: true });

    const files = walk(stage).map(f => path.relative(stage, f));
    const conflicts = files.filter(rel => fs.existsSync(path.join(project, rel)));
    if (conflicts.length) {
      throw Error(`Scaffold would overwrite existing files: ${conflicts.slice(0, 8).join(', ')}`);
    }
    const created = [];
    try {
      for (const rel of files) {
        const dest = path.join(project, rel);
        fs.mkdirSync(path.dirname(dest), { recursive: true });
        if (fs.existsSync(dest)) throw Error(`Concurrent write detected: ${rel}`);
        fs.copyFileSync(path.join(stage, rel), dest, fs.constants.COPYFILE_EXCL);
        created.push(dest);
      }
    } catch (error) {
      for (const dest of created.reverse()) fs.rmSync(dest, { force: true });
      throw error;
    }
    return { project, revision: state.revision, scaffolded: true, filesCreated: files.length, documentation: requiredDocs, next: `cd ${project} && pnpm install && npx expo install --check` };
  } finally {
    fs.rmSync(stage, { recursive: true, force: true });
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  const flag = args.indexOf('--project');
  if (flag < 0 || !args[flag + 1]) {
    console.error('Usage: node scripts/scaffold-workspace.mjs --project <approved-factory-project>');
    process.exitCode = 1;
  } else {
    try { console.log(JSON.stringify(scaffoldWorkspace(args[flag + 1]), null, 2)); }
    catch (error) { console.error(JSON.stringify({ error: error.message })); process.exitCode = 1; }
  }
}
