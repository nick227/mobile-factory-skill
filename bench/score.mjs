#!/usr/bin/env node
// Independent scoring of a benchmark run: re-runs the definition-of-done
// commands and measures code volume/reuse. Spec checks are STATIC HEURISTICS
// (source greps), not behavioural verification; nothing here runs on a device.
// Usage: node bench/score.mjs <app dir> [--no-build]
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const app = path.resolve(process.argv[2] ?? '.');
const build = !process.argv.includes('--no-build');
const SKIP = new Set(['node_modules', '.expo', '.factory', 'dist', 'export', 'android', 'ios', '.git']);
const walk = (d) => fs.existsSync(d) ? fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => SKIP.has(e.name) ? [] : e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]) : [];
const code = walk(app).filter((f) => /\.(tsx?|jsx?)$/.test(f) && !/\.d\.ts$/.test(f));
const rel = (f) => path.relative(app, f).replaceAll('\\', '/');
const loc = (f) => fs.readFileSync(f, 'utf8').split('\n').filter((l) => l.trim() && !/^\s*(\/\/|\*|\/\*)/.test(l)).length;
const isFactory = (r) => r.startsWith('src/ui/') || r.startsWith('src/foundations/');
const isRecipe = (r) => r.startsWith('src/recipes/');
const custom = code.filter((f) => !isFactory(rel(f)) && !isRecipe(rel(f)) && !/(^|\/)scripts\//.test(rel(f)));
const recipes = code.filter((f) => isRecipe(rel(f)));
const factory = code.filter((f) => isFactory(rel(f)));
const all = [...custom, ...recipes].map((f) => fs.readFileSync(f, 'utf8')).join('\n');
const tsx = custom.filter((f) => f.endsWith('.tsx'));

const usedUi = new Set([...all.matchAll(/import\s*\{([^}]+)\}\s*from\s*['"][^'"]*(?:src\/ui|\/ui)['"]/g)].flatMap((m) => m[1].split(',').map((s) => s.trim().replace(/^type\s+/, '').split(/\s+as\s+/)[0]).filter(Boolean)));
const usedModules = new Set([...all.matchAll(/from\s*['"][^'"]*foundations\/([a-z-]+)\//g)].map((m) => m[1]));

const run = (cmd, args, timeout = 600000) => {
  if (!build) return { skipped: true };
  const t0 = Date.now();
  const r = spawnSync(cmd, args, { cwd: app, encoding: 'utf8', timeout, env: { ...process.env, CI: '1' } });
  return { exit: r.status, seconds: Math.round((Date.now() - t0) / 1000), tail: (r.stdout + r.stderr).trim().split('\n').slice(-3).join(' | ').slice(0, 300) };
};
const has = (re) => re.test(all);
const routes = walk(path.join(app, 'app')).concat(walk(path.join(app, 'src/app'))).map(rel);

const report = {
  app: rel(app) || app,
  verification: {
    tsc: run('npx', ['tsc', '--noEmit']),
    androidExport: run('npx', ['expo', 'export', '--platform', 'android', '--output-dir', path.join(path.dirname(app), 'score-export')]),
    note: 'Re-run independently by the scorer. Types and bundles only; no device, simulator or screen reader.',
  },
  volume: {
    customFiles: custom.length,
    customLoc: custom.reduce((s, f) => s + loc(f), 0),
    customTsxLoc: tsx.reduce((s, f) => s + loc(f), 0),
    recipeLocCopiedAndAdapted: recipes.reduce((s, f) => s + loc(f), 0),
    factoryFilesInstalled: factory.length,
    factoryLocInstalled: factory.reduce((s, f) => s + loc(f), 0),
    factoryUiComponentsUsed: [...usedUi].sort(),
    factoryModulesUsed: [...usedModules].sort(),
  },
  staticSpecChecks: {
    _note: 'Source-pattern heuristics only; a pass means the pattern exists, not that it behaves correctly.',
    routeList: routes.some((r) => /app\/index\.tsx$/.test(r)),
    routeDetail: routes.some((r) => /app\/events\/\[id\]\.tsx$/.test(r)),
    routeCreate: routes.some((r) => /app\/events\/new\.tsx$/.test(r)),
    persistence: has(/async-storage|expo-sqlite|SecureStore|deviceBackend|createStore/),
    destructiveConfirm: has(/Alert\.alert[\s\S]{0,400}destructive|confirm/i),
    errorBoundary: has(/ErrorBoundary/),
    validationLength: has(/80/) && has(/\b3\b/),
    validationIsoDate: has(/\\d\{4\}-\\d\{2\}-\\d\{2\}|YYYY-MM-DD|isoDate/),
    validationNotPast: has(/past/i),
    descriptionMax500: has(/500/),
    simulatedLatency: has(/300/) && has(/800/),
    forcedErrors: has(/fail|error mode|failure/i),
    darkMode: has(/useColorScheme|useTheme|dark/),
    accessibilityLabels: (all.match(/accessibilityLabel|accessibilityRole/g) ?? []).length,
    fixedAspectRatio: has(/aspectRatio|ratio=\{/),
  },
};
process.stdout.write(JSON.stringify(report, null, 2) + '\n');
