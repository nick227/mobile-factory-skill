import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import * as plan from '../factory-v1/planner.mjs';
import * as orch from '../factory-v1/orchestrator.mjs';

test('Interview and Documentation: end-to-end interview recording to BRIEF.md generation', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'interview-doc-'));
  try {
    // 1. Initialize project
    const init = plan.initProject(dir, 'CoffeeLog', 'lite');
    assert.equal(init.name, 'CoffeeLog');
    assert.equal(init.mode, 'lite');

    // 2. Query interview next
    const next1 = plan.next(dir);
    assert.ok(next1.items.length > 0, 'Interview returns open items');
    const confirmItem = next1.items.find((i) => i.kind === 'confirm-assumptions');
    assert.ok(confirmItem, 'Lite mode proposes assumptions to confirm');
    assert.ok(next1.items.some((i) => i.key === 'product.audience'), 'Asks for audience');
    assert.ok(next1.items.some((i) => i.key === 'product.outcome'), 'Asks for outcome');

    // 3. Record interview facts with provenance (quotes)
    plan.record(dir, [
      {
        key: 'product.audience',
        value: 'Home espresso brewers',
        source: { id: 'chat', quote: 'I brew espresso at home daily' },
      },
      {
        key: 'product.outcome',
        value: 'Dial in grind size and extraction time',
        source: { id: 'chat', quote: 'Help me dial in grind size and extraction time' },
      },
      {
        key: 'experience.primary',
        value: 'browse-collection',
        source: { id: 'chat', quote: 'I want to browse my brew log' },
      },
    ]);

    // 4. Verify gate advances to 03-requirements once discovery answers are recorded
    const status1 = orch.status(dir);
    assert.equal(status1.segment, '03-requirements');

    // 5. User confirms default assumptions
    plan.confirm(dir, 'all', 'Yes, those defaults are good');

    // 6. Documentation step: Generate BRIEF.md and documentation suite
    const brief = plan.brief(dir);
    assert.ok(brief.markdown.length > 0, 'BRIEF content returned');

    const briefFile = path.join(dir, '.factory/docs/BRIEF.md');
    assert.ok(fs.existsSync(briefFile), '.factory/docs/BRIEF.md was generated');

    const decisionsFile = path.join(dir, '.factory/docs/DECISIONS.md');
    assert.ok(fs.existsSync(decisionsFile), '.factory/docs/DECISIONS.md was generated');

    const designFile = path.join(dir, '.factory/docs/DESIGN.md');
    assert.ok(fs.existsSync(designFile), '.factory/docs/DESIGN.md was generated');

    const text = fs.readFileSync(briefFile, 'utf8');
    assert.ok(text.includes('# CoffeeLog'), 'BRIEF has project title');
    assert.ok(text.includes('Home espresso brewers'), 'BRIEF documents audience from interview');
    assert.ok(text.includes('Dial in grind size and extraction time'), 'BRIEF documents outcome from interview');
    assert.ok(text.includes('browse-collection'), 'BRIEF documents primary experience');
    assert.ok(text.includes('## Decisions'), 'BRIEF documents decisions section');
    assert.ok(text.includes('## Readiness'), 'BRIEF documents readiness section');
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('Interview and Documentation: source intake, conflict detection, resolution, and DECISIONS.md update', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'interview-doc-conflict-'));
  try {
    plan.initProject(dir, 'SyncConflictApp', 'lite');

    // 1. Ingest an external specification document
    const specFile = path.join(dir, 'spec.md');
    fs.writeFileSync(specFile, '# Specification\n\nUsers must be able to work offline without an account.\n\nAll data is stored locally.\n');
    plan.addSource(dir, specFile, 'Initial Spec');

    // 2. Query interview next - should report unmined source anchors
    const next1 = plan.next(dir);
    const mineItem = next1.items.find((i) => i.kind === 'mine-source');
    assert.ok(mineItem, 'Unmined source produces mine-source item');

    // 3. Mine the document anchors into interview facts
    plan.record(dir, [
      {
        key: 'identity.required',
        value: false,
        source: { anchor: 's1:p1', quote: 'Users must be able to work offline without an account.' },
      },
      {
        key: 'data.required',
        value: false,
        source: { anchor: 's1:p2', quote: 'All data is stored locally.' },
      },
      {
        key: 'product.outcome',
        value: 'Local offline notes',
        source: { anchor: 's1:p1', quote: 'Users must be able to work offline without an account.' },
      },
      {
        key: 'product.audience',
        value: 'Solo note takers',
        source: { id: 'chat', quote: 'Solo note takers' },
      },
      {
        key: 'experience.primary',
        value: 'browse-collection',
        source: { id: 'chat', quote: 'browse notes' },
      },
    ]);

    // 4. Confirm the mined assumptions
    plan.confirm(dir, 'all', 'Yes, confirm offline local operation');

    // 5. User introduces a contradictory requirement in chat: "Keep entries on my phone storage" (conflicts with data.required=false)
    const rec = plan.record(dir, {
      key: 'data.persistence',
      value: 'device storage',
      source: { id: 'chat', quote: 'keep entries on my phone storage' },
    });
    assert.deepEqual(rec.conflicts, ['data.required'], 'Contradiction flagged in conflicts');

    // Orchestrator gate in 03-requirements halts on conflicts:none
    const orchStatus = orch.status(dir);
    assert.equal(orchStatus.segment, '03-requirements');
    const unmet = (orchStatus.segments.find((s) => s.id === '03-requirements')?.unmet ?? []).map((c) => c.id);
    assert.ok(unmet.includes('conflicts:none'), 'conflicts:none halts 03-requirements');

    // Interview next must prompt user to resolve the conflict
    const next2 = plan.next(dir);
    const conflictItem = next2.items.find((i) => i.kind === 'resolve-conflict');
    assert.ok(conflictItem, 'resolve-conflict item generated');
    assert.equal(conflictItem.key, 'data.required');

    // 6. Resolve conflict: User chooses data.required = true
    plan.confirm(dir, ['data.required'], 'yes it stores data locally', { 'data.required': true });

    // 7. Verify conflict resolved and DECISIONS.md reflects history
    plan.brief(dir, { workflow: orch.summary(dir) });
    const briefText = fs.readFileSync(path.join(dir, '.factory/docs/BRIEF.md'), 'utf8');
    assert.ok(briefText.includes('Active segment:'), 'BRIEF.md carries active workflow segment');

    const decisionsText = fs.readFileSync(path.join(dir, '.factory/docs/DECISIONS.md'), 'utf8');
    assert.ok(decisionsText.includes('## data.required'), 'Decision logged');
    assert.ok(decisionsText.includes('History:'), 'Conflict history logged in DECISIONS.md');
    assert.ok(decisionsText.includes('yes it stores data locally'), 'User resolution quote recorded');
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
