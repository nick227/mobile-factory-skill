import test from 'node:test';
import assert from 'node:assert/strict';
import { PERSONAS } from '../bench/interview/personas.mjs';
import { InterviewHarness } from '../bench/interview/harness.mjs';
import { InterviewEvaluator, DIMENSION_WEIGHTS } from '../bench/interview/evaluator.mjs';
import { generateReport } from '../bench/interview/report.mjs';

test('Interview Benchmark: exactly 6 diverse personas defined with required attributes', () => {
  assert.equal(PERSONAS.length, 6, 'Six benchmark personas configured');

  const expectedIds = [
    'vague-visionary',
    'contradictory-client',
    'non-technical-founder',
    'feature-creeper',
    'changing-mind',
    'hidden-complexity',
  ];

  for (const id of expectedIds) {
    const p = PERSONAS.find((x) => x.id === id);
    assert.ok(p, `Persona ${id} configured`);
    assert.ok(p.turns.length >= 3, `${id} has at least 3 conversation turns`);
    assert.ok(p.expectedArtDirection, `${id} declares expected art direction`);
    assert.ok(p.expectations, `${id} declares evaluation expectations`);
  }
});

test('Interview Benchmark: dimension weights sum to exactly 1.0 (Art Direction at 30%)', () => {
  assert.equal(DIMENSION_WEIGHTS.artDirection, 0.30, 'Art direction weighted at 30%');
  assert.equal(DIMENSION_WEIGHTS.conversationQuality, 0.25, 'Conversation quality weighted at 25%');
  assert.equal(DIMENSION_WEIGHTS.tradeOffReasoning, 0.20, 'Trade-off reasoning weighted at 20%');
  assert.equal(DIMENSION_WEIGHTS.evidenceFidelity, 0.15, 'Evidence fidelity weighted at 15%');
  assert.equal(DIMENSION_WEIGHTS.scopeDiscipline, 0.10, 'Scope discipline weighted at 10%');

  const total = Object.values(DIMENSION_WEIGHTS).reduce((a, b) => a + b, 0);
  assert.equal(Math.round(total * 100) / 100, 1.0, 'Weights sum to 100%');
});

test('Interview Benchmark: harness runs all 6 personas, checks invariants, and generates scorecard report', async () => {
  const harness = new InterviewHarness();
  const { metadata, results } = await harness.runAll();

  assert.equal(metadata.runnerMode, 'scripted-deterministic');
  assert.ok(metadata.warning.includes('SCRIPTED DETERMINISTIC RUN'));
  assert.equal(results.length, 6);

  for (const r of results) {
    assert.ok(r.invariants.questionDensity.prefer1to2Passed, `${r.persona}: question density <= 2.5 questions/turn`);
    assert.equal(r.invariants.questionDensity.flaggedHighDensity, false, `${r.persona}: no turns with >= 4 questions`);
    assert.equal(r.invariants.quoteFidelity.fidelityRate, 1.0, `${r.persona}: 100% verbatim quote fidelity`);
  }

  const evaluator = new InterviewEvaluator();
  const scoredResults = results.map((r) => evaluator.scoreSession(r));
  const report = generateReport(scoredResults, metadata);

  assert.ok(report.overall >= 4.5, `Overall score ${report.overall} >= 4.5`);
  assert.ok(report.averages.artDirection >= 4.5, 'Art direction average score >= 4.5');
  assert.ok(report.averages.conversationQuality >= 4.5, 'Conversation quality score >= 4.5');
  assert.ok(report.averages.tradeOffReasoning >= 4.5, 'Trade-off reasoning score >= 4.5');
  assert.ok(report.averages.evidenceFidelity >= 4.5, 'Evidence fidelity score >= 4.5');
  assert.ok(report.averages.scopeDiscipline >= 4.5, 'Scope discipline score >= 4.5');

  assert.ok(report.markdown.includes('# Interview Quality Benchmark'));
  assert.ok(report.markdown.includes('The Changing-Mind Client'));
  assert.ok(report.markdown.includes('The Business Owner With Hidden Complexity'));
});
