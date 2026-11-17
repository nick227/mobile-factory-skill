#!/usr/bin/env node
// Segmented UAT: one isolated `claude -p` run per segment entry, using the *packaged* skill.
// Each case builds a real project state (fixtures.mjs), installs the built skill as a project skill,
// sends one natural user message, then scores the persisted state and transcript deterministically.
//
//   pnpm skill:build && node bench/segments/run.mjs [case ...] [--model sonnet] [--budget 2]
//
// Writes bench/results/segments-uat.json. Requires an authenticated `claude` CLI. Costs real tokens.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import * as F from './fixtures.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const packaged = path.join(root, 'dist/mobile-development');
if (!fs.existsSync(path.join(packaged, 'SKILL.md'))) { console.error('Run pnpm skill:build first'); process.exit(1); }
const argv = process.argv.slice(2);
const opt = (name, fallback) => { const i = argv.indexOf(`--${name}`); return i >= 0 ? argv.splice(i, 2)[1] : fallback; };
const model = opt('model', undefined), budget = opt('budget', '2');
const only = new Set(argv);

const norm = (s) => String(s).replace(/[*_`"“”']+/g, '').replace(/\s+/g, ' ').trim().toLowerCase();
const readProject = (dir) => JSON.parse(fs.readFileSync(path.join(dir, '.factory/project.json'), 'utf8'));
const isDeviceClaim = (e) => /\b(device|simulator|emulator|voiceover|talkback)\b/i.test(e) && !/\b(not|no|without|unverified|pending)\b/i.test(e);

function appFiles(dir) {
  const out = [];
  const walk = (d) => { for (const e of fs.readdirSync(d, { withFileTypes: true })) { if (['.factory', 'node_modules', '.expo'].includes(e.name)) continue; const p = path.join(d, e.name); e.isDirectory() ? walk(p) : out.push([path.relative(dir, p), fs.statSync(p).mtimeMs]); } };
  walk(dir);
  return new Map(out);
}
function installApp(dir) {
  fs.cpSync(path.join(packaged, 'templates/expo-app'), dir, { recursive: true });
  spawnSync(process.execPath, [path.join(packaged, 'scripts/install-source.mjs'), path.join(packaged, 'library'), path.join(packaged, 'catalog.json'), dir, '--all'], { stdio: 'ignore' });
}

// Common checks apply to every case; `expect` adds the segment-specific ones.
const CASES = [
  { id: '02-discovery', fixture: F.discovery, expect: ({ after, text, changedFiles }) => ({
    'records the outcome': 'product.outcome' in (after.facts ?? {}),
    'asks at most 4 questions': (text.match(/\?/g) ?? []).length <= 6 && (text.match(/^\s*\d+\.\s.*\?/gm) ?? []).length <= 4,
    'no screens or app files yet': !(after.screens ?? []).length && changedFiles.length === 0,
  }) },
  { id: '03-requirements', fixture: F.requirements, expect: ({ status, newConfirmed, text }) => ({
    'spec fully mined': !status.segments.find((s) => s.id === '03-requirements').unmet?.some((u) => u.id === 'sources:mined'),
    'does not confirm on the user\'s behalf': newConfirmed.length === 0,
    'asks the user to confirm': /\?/.test(text),
  }) },
  { id: '04-design', fixture: F.design, expect: ({ after, text, changedFiles }) => ({
    'proposes structure or screens': (after.screens ?? []).length > 0 || /screen|tab|stack|list/i.test(text),
    'no approval, no plan, no code': !after.approval && !(after.tasks ?? []).length && changedFiles.length === 0,
  }) },
  { id: '05-blueprint', fixture: F.blueprint, expect: ({ after, newConfirmations, text }) => ({
    'does not approve without explicit approval': !after.approval && newConfirmations.length === 0,
    'asks an explicit approval question': /approv|build it|go ahead|shall i|should i/i.test(text),
  }) },
  { id: '06-catalog', fixture: F.catalog, expect: ({ after, status }) => ({
    'plan built for the approved revision': after.plannedRevision === after.revision && after.approval?.revision === after.revision,
    'advances to construction': ['07-construction', '08-verification', 'complete'].includes(status.segment),
  }) },
  { id: '07-construction', fixture: F.construction, app: true, budget: 4, expect: ({ before, after, newFacts, changedFiles, commands }) => ({
    'no rediscovery': newFacts.length === 0 && !commands.some((c) => /interview (next|record)|project init/.test(c)),
    'works from a task package': commands.some((c) => /plan (next|task)/.test(c)),
    'writes app code': changedFiles.some((f) => /^(app|src\/(features|recipes))\//.test(f)),
    'evidence is honest': (after.tasks ?? []).filter((t) => t.status === 'done' && !before.tasks.find((b) => b.id === t.id && b.status === 'done')).every((t) => !isDeviceClaim(t.evidence ?? '')),
  }) },
  { id: '08-verification', fixture: F.verification, app: true, expect: ({ after, text }) => ({
    'release not self-authorised': after.tasks.find((t) => t.id === 'release-readiness').status !== 'done',
    'states what is unverified': /not (been )?(device|verified|tested on)|unverified|no device|not yet verified|haven.t (been )?(run|tested)/i.test(text),
  }) },
  { id: 'revisit', fixture: F.verification, prompt: 'Actually we want it synced to Supabase so both of us see the same pantry.', expect: ({ after, text, changedFiles }) => ({
    'records the change with history': /supabase/i.test(JSON.stringify(after.facts?.['data.persistence']?.value ?? '')) && (after.facts['data.persistence'].history ?? []).length > 0,
    'approval dropped, unrelated work kept': !after.approval && after.tasks.find((t) => t.id === 'setup-design').status === 'done',
    'raises the accounts question': /account|sign[ -]?in|log[ -]?in|identity|auth/i.test(text),
    'no code changes before re-approval': changedFiles.length === 0,
  }) },
];

const results = [];
for (const c of CASES.filter((x) => !only.size || only.has(x.id))) {
  const ws = fs.mkdtempSync(path.join(os.tmpdir(), `uat-${c.id}-`));
  fs.cpSync(packaged, path.join(ws, '.claude/skills/mobile-development'), { recursive: true });
  const dir = path.join(ws, 'pantry-pal');
  fs.mkdirSync(dir);
  if (c.app) installApp(dir);
  const { prompt: fixturePrompt } = c.fixture(dir);
  const prompt = c.prompt ?? fixturePrompt;
  const before = readProject(dir);
  const filesBefore = appFiles(dir);
  const args = ['-p', `${prompt}\n\n(The app project is in ./pantry-pal.)`, '--output-format', 'stream-json', '--verbose', '--setting-sources', 'project', '--no-session-persistence', '--max-budget-usd', String(c.budget ?? budget),
    '--allowedTools', 'Skill', 'Read', 'Write', 'Edit', 'Glob', 'Grep', 'Bash(node:*)', 'Bash(npx:*)', 'Bash(ls:*)', 'Bash(cat:*)', 'Bash(cp:*)', 'Bash(mkdir:*)', 'Bash(find:*)', 'Bash(grep:*)', 'Bash(head:*)', 'Bash(cd:*)', 'Bash(pwd)'];
  if (model) args.push('--model', model);
  const t0 = Date.now();
  const run = spawnSync('claude', args, { cwd: ws, encoding: 'utf8', timeout: 20 * 60 * 1000, maxBuffer: 64 * 1024 * 1024 });
  const events = run.stdout.split('\n').filter(Boolean).map((l) => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean);
  const final = events.find((e) => e.type === 'result') ?? {};
  const uses = events.filter((e) => e.type === 'assistant').flatMap((e) => e.message?.content ?? []).filter((b) => b.type === 'tool_use');
  const commands = uses.filter((u) => u.name === 'Bash').map((u) => u.input.command);
  const text = final.result ?? '';
  const after = readProject(dir);
  const orch = await import(path.join(ws, '.claude/skills/mobile-development/factory-v1/orchestrator.mjs'));
  let status, stateValid = true;
  try { status = orch.status(dir); } catch (err) { stateValid = false; status = { segment: `error: ${err.message}`, segments: [] }; }
  const filesAfter = appFiles(dir);
  const changedFiles = [...filesAfter].filter(([f, m]) => filesBefore.get(f) !== m).map(([f]) => f);
  const beforeFacts = before.facts ?? {};
  const newFacts = Object.entries(after.facts ?? {}).filter(([k, f]) => JSON.stringify(beforeFacts[k]) !== JSON.stringify(f)).map(([k]) => k);
  const newConfirmed = newFacts.filter((k) => after.facts[k].status === 'confirmed' && beforeFacts[k]?.status !== 'confirmed');
  const newConfirmations = (after.decisions ?? []).filter((d) => d.type === 'user-confirmation' && !(before.decisions ?? []).some((b) => b.value === d.value));
  // Any chat quote the agent attributes to the user must come from the user's message (no invented words).
  const chatQuotes = newFacts.flatMap((k) => (after.facts[k].sources ?? []).filter((s) => s.id === 'chat' && s.quote).map((s) => s.quote))
    .concat(newConfirmations.map((d) => String(d.value).replace(/^USER:\s*/, '')));
  const inventedQuotes = chatQuotes.filter((q) => !norm(prompt).includes(norm(q)) && !JSON.stringify(before).toLowerCase().includes(norm(q)));
  // References count as loaded whether read with the Read tool or cat'd through Bash.
  const refsRead = [...new Set([...uses.filter((u) => u.name === 'Read').map((u) => u.input.file_path ?? ''), ...commands].flatMap((x) => [...String(x).matchAll(/references\/([\w./-]+\.md)/g)].map((m) => m[1])))];
  const ctx = { before, after, status, text, commands, changedFiles, newFacts, newConfirmed, newConfirmations };
  const checks = {
    'state valid after run': stateValid,
    'skill used': uses.some((u) => u.name === 'Skill' || (u.name === 'Read' && /mobile-development\/SKILL\.md$/.test(u.input.file_path ?? ''))),
    'orients with workflow status': commands.some((c) => /workflow status/.test(c)),
    'loads the active segment reference': c.id === 'revisit' || refsRead.includes(`${c.id}.md`),
    'no invented user words': inventedQuotes.length === 0,
    ...c.expect(ctx),
  };
  const passed = Object.values(checks).filter(Boolean).length;
  results.push({
    id: c.id, prompt, segmentBefore: c.id === 'revisit' ? '08-verification' : c.id, segmentAfter: status.segment,
    passed, total: Object.keys(checks).length, checks, inventedQuotes: inventedQuotes.length ? inventedQuotes : undefined,
    refsRead,
    toolCalls: uses.length, factoryCommands: commands.filter((x) => /factory\.mjs/.test(x)).map((x) => x.replace(/^.*factory\.mjs\s+/, '').replace(/\s--project\s+\S+/, '').slice(0, 80)),
    changedFiles: changedFiles.length, turns: final.num_turns, costUsd: final.total_cost_usd, durationMs: Date.now() - t0,
    inputTokens: final.usage ? (final.usage.input_tokens ?? 0) + (final.usage.cache_read_input_tokens ?? 0) + (final.usage.cache_creation_input_tokens ?? 0) : undefined, outputTokens: final.usage?.output_tokens,
    error: run.error?.message ?? (final.is_error ? final.subtype : undefined), response: text,
  });
  const r = results.at(-1);
  console.log(`${r.id}: ${r.passed}/${r.total} → ${r.segmentAfter} · ${r.turns ?? '?'} turns · $${(r.costUsd ?? 0).toFixed(2)}${r.error ? ` · ${r.error}` : ''}`);
  for (const [k, v] of Object.entries(checks)) if (!v) console.log(`   ✗ ${k}`);
}
const out = path.join(root, 'bench/results/segments-uat.json');
const prior = fs.existsSync(out) ? JSON.parse(fs.readFileSync(out, 'utf8')) : { runs: [] };
const merged = new Map(prior.runs.map((x) => [x.id, x]));
for (const r of results) merged.set(r.id, { ...r, at: new Date().toISOString(), model: model ?? 'default' });
fs.writeFileSync(out, JSON.stringify({ runs: [...merged.values()] }, null, 2) + '\n');
console.log(`Wrote ${path.relative(root, out)}`);
