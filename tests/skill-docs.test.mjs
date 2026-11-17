// Governance for the agent-facing skill: references resolve, every segment reference carries the full
// operating contract, documented condition ids and commands match the engine, and tagged JSON examples
// are accepted by the real factory API at the segment they belong to.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import * as plan from '../factory-v1/planner.mjs';
import * as orch from '../factory-v1/orchestrator.mjs';
import * as F from '../bench/segments/fixtures.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const skill = path.join(root, 'skill');
const read = (rel) => fs.readFileSync(path.join(skill, rel), 'utf8');
const SEGMENTS = orch.SEGMENTS.map((s) => s.id);
const docs = ['SKILL.md', ...fs.readdirSync(path.join(skill, 'references')).filter((f) => f.endsWith('.md')).map((f) => `references/${f}`)];
// Files scripts/build-skill.mjs copies into references/ at packaging time (source of truth lives elsewhere).
const GENERATED = {
  'references/design/': 'standards/design',
  'references/native-quality.md': 'standards/quality.md',
  'references/catalog-contract.md': 'packages/catalog/CONTRACT.md',
  'references/foundations.md': 'packages/foundations/README.md',
};
const SECTIONS = ['Purpose and entry conditions', 'Inspect state first', 'Required facts and decisions', 'Agent behaviour (reasoning procedure)', 'User interaction', 'Commands and schemas', 'Outputs and examples', 'Completion criteria', 'Failure and contradiction handling', 'Transitions and revisit rules'];

test('production-workflow-v1.md is retired; one reference per segment 02–08 exists', () => {
  assert.ok(!fs.existsSync(path.join(skill, 'references/production-workflow-v1.md')));
  for (const id of SEGMENTS) assert.ok(fs.existsSync(path.join(skill, `references/${id}.md`)), id);
});

test('every references/ path in the skill resolves in source or is generated at build time', () => {
  for (const doc of docs) {
    for (const [, ref] of read(doc).matchAll(/`?(references\/[A-Za-z0-9_./-]+)`?/g)) {
      const rel = ref.replace(/[.,)]+$/, '');
      const generated = Object.entries(GENERATED).find(([k]) => rel === k || (k.endsWith('/') && rel.startsWith(k)));
      if (generated) {
        const [k, src] = generated;
        const target = k.endsWith('/') ? path.join(root, src, rel.slice(k.length)) : path.join(root, src);
        assert.ok(fs.existsSync(target), `${doc}: ${rel} → ${path.relative(root, target)} missing`);
      } else assert.ok(fs.existsSync(path.join(skill, rel)), `${doc}: ${rel} does not exist`);
    }
  }
});

test('each segment reference has the ten-part operating contract, in order', () => {
  for (const id of SEGMENTS) {
    const text = read(`references/${id}.md`);
    const headings = [...text.matchAll(/^## (\d+)\. (.+)$/gm)].map((m) => `${m[1]}. ${m[2]}`);
    assert.deepEqual(headings, SECTIONS.map((s, i) => `${i + 1}. ${s}`), id);
  }
});

test('SKILL.md routes to every segment reference and stays an orchestrator, not a manual', () => {
  const text = read('SKILL.md');
  assert.match(text, /^---\nname: mobile-development\ndescription:/);
  for (const id of SEGMENTS) assert.ok(text.includes(`references/${id}.md`), id);
  assert.ok(text.includes('workflow status'));
  assert.ok(Buffer.byteLength(text) < 20000, 'SKILL.md under 20 KB; procedures belong in references');
});

function allConditionIds() {
  const ids = Object.fromEntries(SEGMENTS.map((s) => [s, new Set()]));
  const collect = (dir) => { for (const [seg, list] of Object.entries(orch.conditions(dir))) for (const c of list) ids[seg].add(c.id.replace(/^screen:.+$/, 'screen:<id>')); };
  for (const build of [...Object.values(F.SEGMENT_FIXTURES), F.revisit]) { const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'docs-')); build(dir); collect(dir); }
  const accounts = fs.mkdtempSync(path.join(os.tmpdir(), 'docs-'));
  plan.initProject(accounts, 'Accounts', 'standard');
  plan.record(accounts, { key: 'identity.required', value: true, source: { id: 'chat', quote: 'people sign in' } });
  collect(accounts);
  return ids;
}

test('every condition the engine evaluates is documented in its segment reference', () => {
  for (const [seg, set] of Object.entries(allConditionIds())) {
    const text = read(`references/${seg}.md`);
    for (const id of set) assert.ok(text.includes(`\`${id}\``), `${seg}.md does not document condition \`${id}\``);
  }
});

test('every documented factory command exists in the CLI', () => {
  const help = JSON.parse(execFileSync(process.execPath, [path.join(root, 'scripts/factory.mjs'), 'help'], { encoding: 'utf8' }));
  const valid = new Set(help.actions.map((a) => a.split(' ').slice(0, 2).join(' ')));
  for (const doc of docs) {
    for (const [, family, verb] of read(doc).matchAll(/node scripts\/factory\.mjs ([a-z]+) ([a-z]+|<[^>]+>)/g)) {
      if (family === 'wireframe') continue;
      assert.ok(valid.has(`${family} ${verb}`), `${doc}: unknown command '${family} ${verb}'`);
    }
  }
});

test('tagged JSON examples are accepted by the factory at their segment', () => {
  let count = 0;
  for (const doc of docs) {
    for (const [, kind, seg, json] of read(doc).matchAll(/<!-- validate: (findings|blueprint) @([0-9a-z-]+) -->\n```json\n([\s\S]*?)```/g)) {
      const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'example-'));
      F.SEGMENT_FIXTURES[seg](dir);
      const data = JSON.parse(json);
      assert.doesNotThrow(() => (kind === 'findings' ? plan.record(dir, data) : plan.setBlueprint(dir, data)), `${doc} ${kind} example @${seg}`);
      count++;
    }
  }
  assert.ok(count >= 4, `expected tagged examples, found ${count}`);
});

test('the Requirements example mines the whole spec', () => {
  const json = read('references/03-requirements.md').match(/<!-- validate: findings @03-requirements -->\n```json\n([\s\S]*?)```/)[1];
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'example-'));
  F.requirements(dir);
  plan.record(dir, JSON.parse(json));
  assert.deepEqual(plan.unminedAnchors(dir), []);
});

test('the Design example completes segment 04 and the Blueprint example satisfies user:confirmed', () => {
  const text = read('references/04-design.md');
  const json = text.match(/<!-- validate: blueprint @04-design -->\n```json\n([\s\S]*?)```/)[1];
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'example-'));
  F.design(dir);
  plan.record(dir, [
    { key: 'experience.navigation', value: 'Single stack', source: { id: 'chat', quote: 'one list, push to add' } },
    { key: 'design.direction', value: 'Factory defaults', source: { id: 'chat', quote: 'use your defaults' } },
  ]);
  plan.setBlueprint(dir, JSON.parse(json));
  assert.equal(orch.status(dir).segment, '05-blueprint');
  const confirm = read('references/05-blueprint.md').match(/<!-- validate: blueprint @05-blueprint -->\n```json\n([\s\S]*?)```/)[1];
  plan.setBlueprint(dir, JSON.parse(confirm));
  assert.equal(orch.status(dir).next.condition, 'blueprint:approved');
});
