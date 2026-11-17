#!/usr/bin/env node
// Assemble a runnable demo app from current factory source:
//   template + UI library + construction modules + recipes + the example's own files.
// Usage: node examples/build-example.mjs block-party <output parent dir>
// Then: cd <dir>/<name> && pnpm install && npm_config_save=true npx expo install <printed packages> && npx tsc --noEmit
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { install } from '../factory-v1/modules.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const [name, parent] = process.argv.slice(2);
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'examples', name, 'example.json'), 'utf8'));
const created = spawnSync(process.execPath, [path.join(root, 'scripts/create-app.mjs'), name, path.resolve(parent)], { stdio: 'inherit' });
if (created.status !== 0) process.exit(created.status ?? 1);
const app = path.join(path.resolve(parent), name);
const mods = install(app, manifest.modules);
if (mods.error) { console.error(mods.error); process.exit(1); }
fs.mkdirSync(path.join(app, 'src/recipes'), { recursive: true });
for (const r of manifest.recipes) fs.copyFileSync(path.join(root, 'packages/catalog/recipes', `${r}.tsx`), path.join(app, 'src/recipes', `${r}.tsx`));
fs.copyFileSync(path.join(app, 'src/foundations/navigation/RootLayout.tsx'), path.join(app, 'app/_layout.tsx'));
fs.cpSync(path.join(root, 'examples', name), app, { recursive: true, filter: (src) => !src.endsWith('example.json') && !src.endsWith('README.md') });
console.log(JSON.stringify({ app, modules: mods.modules, next: `cd ${app} && pnpm install && npm_config_save=true ${mods.expoInstall ?? 'true'} && npx tsc --noEmit` }, null, 2));
