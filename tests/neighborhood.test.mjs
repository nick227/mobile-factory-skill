import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import * as f from '../factory-v1/engine.mjs';

test('neighborhood example patch updates cleanly and completes lifecycle', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'test-neighborhood-'));
  try {
    f.init(dir, 'Neighborhood Events');
    const patch = JSON.parse(fs.readFileSync('factory-v1/examples/neighborhood.patch.json', 'utf8'));
    const updateResult = f.update(dir, patch);
    assert.equal(updateResult.revision, 2);

    const project = f.load(dir);
    assert.equal(project.entities.length, 4);
    assert.equal(project.entities[0].id, 'user');
    assert.equal(project.roles.length, 4);
    assert.equal(project.integrations.length, 2);
    assert.equal(project.screens.length, 2);

    // Audit must be ready with 0 problems
    const audit = f.audit(project);
    assert.equal(audit.ready, true);
    assert.equal(audit.problems.length, 0);

    // Approval succeeds
    const approval = f.approve(dir);
    assert.equal(approval.revision, 2);

    // Construction plan builds
    const plan = f.planBuild(dir);
    assert.ok(plan.tasks.length > 0);
    assert.ok(plan.tasks.some(t => t.id === 'screen-discover'));
    assert.ok(plan.tasks.some(t => t.id === 'screen-event-detail'));

    // Export documentation
    const docs = f.exportDocs(dir);
    assert.ok(docs.files.includes('PROJECT.md'));
    assert.ok(docs.files.includes('EXPERIENCE.md'));
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
