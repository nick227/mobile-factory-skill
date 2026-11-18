import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { detectJargon } from '../bench/interview/evaluator.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const resultsDir = path.join(root, 'bench/results');

test('Jargon Detector: exact word-boundary matching prevents substring false positives', () => {
  const terms = ['SQL', 'schema', 'routing', 'AST', 'ORM', 'SQLite', 'CRUD', 'REST endpoint', 'SMS gateway API'];

  // Test false-positive immunity
  const coffeeSentence = "Also, what specific roast variables (temperature curves, crack times, origin) should baristas record, and do you need photo filters for bean appearance?";
  assert.deepEqual(detectJargon(coffeeSentence, terms), [], 'Does not match AST inside roast');

  const stormSentence = "We had a thunderstorm during normal formatting on the platform.";
  assert.deepEqual(detectJargon(stormSentence, terms), [], 'Does not match ORM inside storm, normal, format, platform');

  const fastSentence = "Fast tasting notes and master roaster profile.";
  assert.deepEqual(detectJargon(fastSentence, terms), [], 'Does not match AST inside fast, tasting, master');

  // Test true-positive detection
  const sqliteCrudSentence = "We recommend an SQLite local database schema with an asynchronous persistence layer and CRUD operations.";
  const matchedSqliteCrud = detectJargon(sqliteCrudSentence, terms);
  assert.ok(matchedSqliteCrud.includes('SQLite'), 'Matches SQLite');
  assert.ok(matchedSqliteCrud.includes('CRUD'), 'Matches CRUD');
  assert.ok(matchedSqliteCrud.includes('schema'), 'Matches schema');
  assert.equal(matchedSqliteCrud.includes('AST'), false, 'Does not match AST');

  // Test multi-word jargon matching
  const multiWordSentence = "We can set up a REST endpoint and an SMS gateway API for driver dispatch.";
  const matchedMulti = detectJargon(multiWordSentence, terms);
  assert.ok(matchedMulti.includes('REST endpoint'), 'Matches REST endpoint');
  assert.ok(matchedMulti.includes('SMS gateway API'), 'Matches SMS gateway API');

  // Case insensitivity
  assert.deepEqual(detectJargon('use an ast parser', ['AST']), ['AST'], 'Matches case-insensitively');
  assert.deepEqual(detectJargon('we need an orm layer', ['ORM']), ['ORM'], 'Matches case-insensitively');
});

test('Report Integrity: audit reports must use injected-trace-audit mode and keep liveExecutionScore null', () => {
  const jsonPath = path.join(resultsDir, 'live-interview-benchmark.json');
  assert.ok(fs.existsSync(jsonPath), 'Benchmark JSON report exists');

  const report = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

  // Integrity constraint 1: Must be labeled injected-trace-audit, not live model
  assert.equal(report.runnerMode, 'injected-trace-audit', 'runnerMode must be injected-trace-audit');
  assert.equal(report.benchmarkType, 'Injected-Trace Audit & Guardrail Verification');

  // Integrity constraint 2: Live execution score must remain null until authentic unscripted agent execution succeeds
  assert.equal(report.scores.liveExecutionScore, null, 'liveExecutionScore must be null');
  assert.equal(report.liveExecutionScore, null, 'top-level liveExecutionScore must be null');
  assert.equal(report.scores.liveExecutionStatus, 'pending_agent_authentication');
  assert.ok(typeof report.scores.injectedStressScore === 'number', 'injectedStressScore is a number');

  // Integrity constraint 3: Jargon detector false positive fix reflected in benchmark data
  const vagueVisionary = report.results.find((r) => r.persona === 'vague-visionary');
  assert.ok(vagueVisionary, 'vague-visionary found');
  assert.equal(vagueVisionary.invariants.jargonViolationsCount, 0, 'vague-visionary has zero jargon violations');
  assert.deepEqual(vagueVisionary.jargonViolations, [], 'vague-visionary jargonViolations is empty array');

  // Integrity constraint 4: Injected jargon accurately flagged in non-technical founder
  const nonTechFounder = report.results.find((r) => r.persona === 'non-technical-founder');
  assert.ok(nonTechFounder, 'non-technical-founder found');
  assert.equal(nonTechFounder.invariants.jargonViolationsCount, 2, 'non-tech founder caught 2 injected jargon terms');
  const nonTechTerms = nonTechFounder.jargonViolations.map((j) => j.jargon);
  assert.ok(nonTechTerms.includes('SQLite'), 'Caught SQLite');
  assert.ok(nonTechTerms.includes('CRUD'), 'Caught CRUD');

  // Integrity constraint 5: Markdown deliverables do not falsely claim live model execution
  const mdPath = path.join(resultsDir, 'live-interview-benchmark.md');
  const findingsPath = path.join(resultsDir, 'live-findings.md');

  assert.ok(fs.existsSync(mdPath), 'live-interview-benchmark.md exists');
  assert.ok(fs.existsSync(findingsPath), 'live-findings.md exists');

  const mdContent = fs.readFileSync(mdPath, 'utf8');
  assert.ok(mdContent.includes('`injected-trace-audit`'), 'Markdown specifies injected-trace-audit');
  assert.ok(mdContent.includes('Live Agent Execution Score**: **`null`**'), 'Markdown clarifies live score is null');

  const findingsContent = fs.readFileSync(findingsPath, 'utf8');
  assert.ok(!findingsContent.includes('live model observed'), 'Findings do not claim "live model observed"');
  assert.ok(!findingsContent.includes('the unconstrained AI opened by suggesting'), 'Findings do not claim unconstrained AI opened');
  assert.ok(findingsContent.includes('Injected Failure Scenarios'), 'Findings accurately label injected failure scenarios');
});
