import test from 'node:test';
import assert from 'node:assert/strict';
import {
  RESPONSE_TYPES,
  validateResponse,
  assertValidResponse,
  createResponse,
  formatPresentation,
} from '../factory-v1/response-registry.mjs';

test('Response Registry: exports all 8 canonical response types', () => {
  assert.equal(RESPONSE_TYPES.length, 8);
  const expected = ['QUESTION', 'CONFIRM', 'CONFLICT', 'DESIGN', 'PROGRESS', 'APPROVAL', 'BUILD', 'HANDOFF'];
  for (const t of expected) {
    assert.ok(RESPONSE_TYPES.includes(t), `Type ${t} should be registered`);
  }
});

test('Response Registry: validates valid QUESTION response', () => {
  const resp = {
    type: 'QUESTION',
    status: 'pending',
    message: 'What is the primary audience for this app?',
    payload: {
      questions: [
        {
          id: 'audience',
          prompt: 'Who is the main user of this app?',
          options: ['Home baristas', 'Commercial roasters'],
        },
      ],
    },
    next: 'wait-for-answer',
  };

  const res = validateResponse(resp);
  assert.equal(res.valid, true, 'Valid QUESTION response passes');
  assert.equal(res.errors.length, 0);
});

test('Response Registry: enforces QUESTION count limits (1 to 2 allowed, rejects 0 or >=3)', () => {
  // 0 questions
  const zero = {
    type: 'QUESTION',
    status: 'pending',
    message: 'No questions?',
    payload: { questions: [] },
    next: 'wait',
  };
  const zeroRes = validateResponse(zero);
  assert.equal(zeroRes.valid, false);
  assert.ok(zeroRes.errors.some((e) => e.includes('must contain at least 1 question')));

  // 3 questions (audit issue A: question limit too generous)
  const three = {
    type: 'QUESTION',
    status: 'pending',
    message: 'Too many questions',
    payload: {
      questions: [
        { id: 'q1', prompt: 'Question 1' },
        { id: 'q2', prompt: 'Question 2' },
        { id: 'q3', prompt: 'Question 3' },
      ],
    },
    next: 'wait',
  };
  const threeRes = validateResponse(three);
  assert.equal(threeRes.valid, false);
  assert.ok(threeRes.errors.some((e) => e.includes('maximum 2 questions allowed')));
});

test('Response Registry: validates CONFIRM response and enforces explicit user evidence', () => {
  // Without evidence: should fail
  const withoutEvidence = {
    type: 'CONFIRM',
    status: 'proposed',
    message: 'Please confirm these assumptions.',
    payload: {
      items: [{ key: 'product.audience', value: 'Specialty coffee enthusiasts' }],
    },
    next: 'user-confirm',
  };
  const failRes = validateResponse(withoutEvidence);
  assert.equal(failRes.valid, false);
  assert.ok(failRes.errors.some((e) => e.includes('requires explicit user evidence')));

  // With evidence in envelope: should succeed
  const withEvidence = {
    ...withoutEvidence,
    evidence: [{ source: 'chat', quote: 'I brew pour-over coffee daily' }],
  };
  const passRes = validateResponse(withEvidence);
  assert.equal(passRes.valid, true);
});

test('Response Registry: validates CONFLICT response', () => {
  const conflict = {
    type: 'CONFLICT',
    status: 'detected',
    message: 'We noticed conflicting requirements between offline usage and live collaboration.',
    payload: {
      conflicts: [
        {
          key: 'sync.strategy',
          description: 'Offline-first storage conflicts with real-time websocket sync.',
          options: ['Prioritize offline with background sync', 'Require internet connection for multi-user editing'],
        },
      ],
    },
    next: 'resolve-conflict',
  };
  assert.equal(validateResponse(conflict).valid, true);
});

test('Response Registry: validates DESIGN response and enforces catalog & evidence invariants', () => {
  const validDesign = {
    type: 'DESIGN',
    status: 'proposed',
    message: 'A warm, editorial experience with generous imagery.',
    payload: {
      direction: 'Warm botanical journal with earth tones and generous white space',
      rationale: 'Matches the client artisan brand identity and relaxed cafe atmosphere',
      previewReference: 'patterns.focusscreen',
      visualChoices: {
        preset: 'wellness-botanical',
        hierarchy: 'media-led',
        motion: 'subtle',
        pacing: 'monumental',
      },
    },
    evidence: [{ source: 'user', quote: 'warm botanical, earthy journal' }],
    next: 'confirm',
  };

  const pass = validateResponse(validDesign);
  assert.equal(pass.valid, true);

  // Missing evidence: must fail
  const noEvidence = structuredClone(validDesign);
  delete noEvidence.evidence;
  const failEv = validateResponse(noEvidence);
  assert.equal(failEv.valid, false);
  assert.ok(failEv.errors.some((e) => e.includes('requires non-empty user aesthetic evidence quotes')));

  // Invalid preset: must fail
  const badPreset = structuredClone(validDesign);
  badPreset.payload.visualChoices.preset = 'cyberpunk-neon';
  const failPreset = validateResponse(badPreset);
  assert.equal(failPreset.valid, false);
  assert.ok(failPreset.errors.some((e) => e.includes('invalid value "cyberpunk-neon"')));

  // Invalid hierarchy: must fail
  const badHierarchy = structuredClone(validDesign);
  badHierarchy.payload.visualChoices.hierarchy = 'random-grid';
  const failH = validateResponse(badHierarchy);
  assert.equal(failH.valid, false);
  assert.ok(failH.errors.some((e) => e.includes('invalid value "random-grid"')));
});

test('Response Registry: validates PROGRESS response', () => {
  const progress = {
    type: 'PROGRESS',
    status: 'in-progress',
    message: 'Completed requirements mining; moving to visual direction.',
    payload: {
      completed: ['product.audience', 'product.outcome'],
      currentSegment: '04-design',
      pending: ['design.direction', 'design.palette'],
    },
    next: 'propose-design',
  };
  assert.equal(validateResponse(progress).valid, true);
});

test('Response Registry: validates APPROVAL response and binds to revision and blueprintHash', () => {
  const approval = {
    type: 'APPROVAL',
    status: 'ready',
    message: 'Blueprint is complete and validated. Ready for client sign-off.',
    payload: {
      blueprintHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      revision: 4,
      summary: {
        screens: 3,
        entities: 2,
        operations: 4,
      },
    },
    next: 'factory-approve',
  };
  assert.equal(validateResponse(approval).valid, true);

  // Missing revision or blueprintHash: must fail
  const badApproval = { ...approval, payload: { ...approval.payload, revision: 0 } };
  assert.equal(validateResponse(badApproval).valid, false);
});

test('Response Registry: validates BUILD and HANDOFF responses', () => {
  const build = {
    type: 'BUILD',
    status: 'success',
    message: 'Assembled screens and executed governance checks.',
    payload: {
      operation: 'assemble',
      status: 'success',
      files: ['apps/demo/app/index.tsx', 'apps/demo/app/details.tsx'],
      tests: { pass: 12, fail: 0, total: 12 },
    },
    next: 'verify-handoff',
  };
  assert.equal(validateResponse(build).valid, true);

  const handoff = {
    type: 'HANDOFF',
    status: 'ready',
    message: 'Application construction and verification complete.',
    payload: {
      revision: 6,
      summary: 'CoffeeLog app assembled with Expo Router routes and custom themes.',
      verification: { uatPassed: true, typecheck: true },
      instructions: ['Run pnpm lab to preview in simulator', 'Run pnpm check to verify'],
    },
    next: 'done',
  };
  assert.equal(validateResponse(handoff).valid, true);
});

test('Response Registry: rejects unknown top-level envelope keys and unknown payload keys', () => {
  const unknownEnvelopeKey = {
    type: 'PROGRESS',
    status: 'in-progress',
    message: 'Test message',
    unauthorizedField: 'hacker',
    payload: {
      completed: [],
      currentSegment: '02-discovery',
      pending: [],
    },
    next: 'next-step',
  };
  const res = validateResponse(unknownEnvelopeKey);
  assert.equal(res.valid, false);
  assert.ok(res.errors.some((e) => e.includes('unknown envelope key')));

  const unknownPayloadKey = {
    type: 'PROGRESS',
    status: 'in-progress',
    message: 'Test message',
    payload: {
      completed: [],
      currentSegment: '02-discovery',
      pending: [],
      extraData: 123,
    },
    next: 'next-step',
  };
  const res2 = validateResponse(unknownPayloadKey);
  assert.equal(res2.valid, false);
  assert.ok(res2.errors.some((e) => e.includes('unknown key (allowed: completed, currentSegment, pending, metrics)')));
});

test('Response Registry: createResponse and formatPresentation enforce contracts and produce clean derived output', () => {
  const envelope = createResponse('PROGRESS', {
    status: 'in-progress',
    message: 'Recorded coffee grinding preferences.',
    payload: {
      completed: ['product.audience'],
      currentSegment: '02-discovery',
      pending: ['product.outcome'],
    },
    evidence: [{ source: 'chat', quote: 'I use an espresso machine every morning' }],
    next: 'ask-outcome',
  });

  assert.equal(envelope.type, 'PROGRESS');
  assert.equal(envelope.status, 'in-progress');

  const formatted = formatPresentation(envelope);
  assert.ok(formatted.includes('[PROGRESS] (in-progress)'));
  assert.ok(formatted.includes('Recorded coffee grinding preferences.'));
  assert.ok(formatted.includes('"I use an espresso machine every morning" (chat)'));
  assert.ok(formatted.includes('Next: ask-outcome'));
});
