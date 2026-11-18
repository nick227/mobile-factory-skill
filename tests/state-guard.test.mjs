import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import * as plan from '../factory-v1/planner.mjs';
import * as engine from '../factory-v1/engine.mjs';
import {
  appendTranscript,
  loadTranscript,
  verifyQuoteProvenance,
  applyGuardedResponse,
} from '../factory-v1/state-guard.mjs';

const tempDir = () => fs.mkdtempSync(path.join(os.tmpdir(), 'state-guard-test-'));

test('State Guard: transcript persistence and message-ID retrieval', () => {
  const dir = tempDir();
  try {
    plan.initProject(dir, 'CoffeeLog');
    const msg1 = appendTranscript(dir, {
      role: 'user',
      content: 'I want a simple mobile app to log my espresso extractions every morning.',
    });
    assert.equal(msg1.id, 'user-msg-1');
    assert.equal(msg1.role, 'user');

    const msg2 = appendTranscript(dir, {
      role: 'assistant',
      content: 'What visual style do you prefer?',
    });
    assert.equal(msg2.id, 'assistant-msg-2');

    const transcript = loadTranscript(dir);
    assert.equal(transcript.length, 2);
    assert.equal(transcript[0].content, msg1.content);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('State Guard: quote provenance verification against immutable user transcript', () => {
  const dir = tempDir();
  try {
    plan.initProject(dir, 'CoffeeLog');
    appendTranscript(dir, {
      id: 'usr_101',
      role: 'user',
      content: 'We need a dark botanical theme with warm earthy accents.',
    });

    // 1. Verbatim quote with messageId
    const res1 = verifyQuoteProvenance('dark botanical theme', { dir, messageId: 'usr_101' });
    assert.equal(res1.verified, true);
    assert.equal(res1.messageId, 'usr_101');

    // 2. Verbatim quote resolved automatically from user utterances
    const res2 = verifyQuoteProvenance('warm earthy accents', { dir });
    assert.equal(res2.verified, true);
    assert.equal(res2.messageId, 'usr_101');

    // 3. Fabricated quote: must reject
    assert.throws(
      () => verifyQuoteProvenance('neon cyberpunk aesthetic', { dir }),
      /fabricated quote "neon cyberpunk aesthetic" does not match/
    );

    // 4. Quote mismatch against specific message ID
    assert.throws(
      () => verifyQuoteProvenance('completely different words', { dir, messageId: 'usr_101' }),
      /is not a substring of message usr_101/
    );
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('State Guard: CONFIRM envelope cannot manufacture evidence and rolls back atomically on failure', () => {
  const dir = tempDir();
  try {
    plan.initProject(dir, 'CoffeeLog');
    appendTranscript(dir, {
      id: 'usr_201',
      role: 'user',
      content: 'Yes, this is strictly for single-user offline home baristas.',
    });

    // Seed an inferred fact
    plan.record(dir, [
      { key: 'product.audience', value: 'Home baristas', status: 'inferred', source: { id: 'factory' } },
    ]);

    const projectBefore = fs.readFileSync(path.join(dir, '.factory', 'project.json'), 'utf8');

    // Attempt to confirm using a fabricated quote
    const fabricatedEnvelope = {
      type: 'CONFIRM',
      status: 'proposed',
      message: 'Confirming audience.',
      payload: {
        items: [
          {
            key: 'product.audience',
            value: 'Home baristas',
            quote: 'This fabricated quote was never spoken by the user',
          },
        ],
      },
      evidence: [{ source: 'chat', quote: 'This fabricated quote was never spoken by the user' }],
      next: 'proceed',
    };

    assert.throws(
      () => applyGuardedResponse(dir, fabricatedEnvelope),
      /fabricated quote/
    );

    // Atomic rollback check: project.json must be identical to before
    const projectAfterFailed = fs.readFileSync(path.join(dir, '.factory', 'project.json'), 'utf8');
    assert.equal(projectAfterFailed, projectBefore, 'Failed confirmation must not mutate project state');

    // Now confirm with authentic user evidence
    const validEnvelope = {
      type: 'CONFIRM',
      status: 'proposed',
      message: 'Confirming audience with verified quote.',
      payload: {
        items: [
          {
            key: 'product.audience',
            value: 'Home baristas',
            quote: 'strictly for single-user offline home baristas',
          },
        ],
      },
      evidence: [{ source: 'chat', quote: 'strictly for single-user offline home baristas' }],
      next: 'proceed',
    };

    const confirmRes = applyGuardedResponse(dir, validEnvelope);
    assert.equal(confirmRes.applied, true);

    const projectUpdated = engine.load(dir);
    assert.equal(projectUpdated.facts['product.audience'].status, 'confirmed');
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('State Guard: AI APPROVAL response alone cannot authorize approval; requires explicit user authorization', () => {
  const dir = tempDir();
  try {
    plan.initProject(dir, 'CoffeeLog');

    // Provide complete valid blueprint
    plan.record(dir, [
      { key: 'product.audience', value: 'Baristas', status: 'confirmed', source: { id: 'chat', quote: 'baristas' } },
      { key: 'product.outcome', value: 'Log roasts', status: 'confirmed', source: { id: 'chat', quote: 'log roasts' } },
      { key: 'experience.navigation', value: 'Feed to detail', status: 'confirmed', source: { id: 'chat', quote: 'feed to detail' } },
      { key: 'design.direction', value: 'Approved clean style', status: 'confirmed', source: { id: 'chat', quote: 'clean style' } },
      { key: 'identity.required', value: false, status: 'confirmed', source: { id: 'chat', quote: 'no accounts' } },
      { key: 'data.required', value: false, status: 'confirmed', source: { id: 'chat', quote: 'no data' } },
      { key: 'release.targets', value: ['web'], status: 'confirmed', source: { id: 'chat', quote: 'web' } },
    ]);
    plan.setBlueprint(dir, {
      screens: [
        {
          id: 'home',
          title: 'Home',
          purpose: 'Log roasts',
          route: '/',
          components: ['primitives.screen', 'controls.button'],
          states: ['loading', 'ready', 'error'],
          actions: ['log'],
          acceptance: ['renders'],
        },
      ],
      decisions: [{ type: 'user-confirmation', value: 'initial' }],
    });

    const projectBefore = engine.load(dir);
    assert.equal(projectBefore.approval, null, 'Blueprint starts unapproved');

    // 1. AI emits a valid APPROVAL envelope without user authorization
    const aiApprovalEnvelope = {
      type: 'APPROVAL',
      status: 'ready',
      message: 'Blueprint is complete. Ready for approval.',
      payload: {
        blueprintHash: 'dummy-hash-1234',
        revision: projectBefore.revision,
        summary: { screens: 1 },
      },
      next: 'request-client-approval',
    };

    const attemptResult = applyGuardedResponse(dir, aiApprovalEnvelope);
    assert.equal(attemptResult.applied, false);
    assert.equal(attemptResult.status, 'pending_user_approval');

    const projectStillUnapproved = engine.load(dir);
    assert.equal(projectStillUnapproved.approval, null, 'Project remains unapproved without user authorization');

    // 2. User provides approval in transcript
    appendTranscript(dir, {
      id: 'usr_approval_msg',
      role: 'user',
      content: 'I have reviewed the screens and design. The blueprint looks good, please approve and build.',
    });

    // 3. Apply with explicit user authorization
    const approvedResult = applyGuardedResponse(dir, aiApprovalEnvelope, {
      confirmed: true,
      messageId: 'usr_approval_msg',
      quote: 'The blueprint looks good, please approve and build',
    });

    assert.equal(approvedResult.applied, true);
    assert.equal(approvedResult.status, 'approved');

    const projectApproved = engine.load(dir);
    assert.ok(projectApproved.approval, 'Project is now approved');
    assert.equal(projectApproved.phase, 'build');
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('State Guard: revision mismatch is rejected and rolls back cleanly', () => {
  const dir = tempDir();
  try {
    plan.initProject(dir, 'CoffeeLog');
    const p = engine.load(dir);
    const currentRev = p.revision;

    const staleEnvelope = {
      type: 'APPROVAL',
      status: 'ready',
      message: 'Approval based on stale revision.',
      payload: {
        blueprintHash: 'hash-abc',
        revision: currentRev + 5, // Stale / future revision mismatch
        summary: 'stale',
      },
      next: 'sign-off',
    };

    assert.throws(
      () => applyGuardedResponse(dir, staleEnvelope),
      /Revision mismatch: response specifies revision/
    );
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
