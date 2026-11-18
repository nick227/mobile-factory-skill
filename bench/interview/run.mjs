#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { InterviewHarness } from './harness.mjs';
import { InterviewEvaluator } from './evaluator.mjs';
import { generateReport } from './report.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const resultsDir = path.join(root, 'bench/results');
fs.mkdirSync(resultsDir, { recursive: true });

async function main() {
  console.log('\n======================================================');
  console.log('Mobile Software Factory: Interview Quality Benchmark');
  console.log('======================================================\n');

  const harness = new InterviewHarness();
  const { metadata, results } = await harness.runAll();

  if (metadata.warning) {
    console.log(`⚠️  NOTE: ${metadata.warning}\n`);
  }

  const evaluator = new InterviewEvaluator();
  const scoredResults = results.map((r) => evaluator.scoreSession(r));

  const report = generateReport(scoredResults, metadata);

  // Write outputs
  const jsonPath = path.join(resultsDir, 'interview-benchmark.json');
  const mdPath = path.join(resultsDir, 'interview-benchmark.md');

  fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2) + '\n');
  fs.writeFileSync(mdPath, report.markdown);

  // Format terminal summary matching user requested layout
  console.log(`Interview Quality Benchmark`);
  console.log(`Mode: [${metadata.runnerMode.toUpperCase()}]\n`);
  console.log(`${report.overall.toFixed(1)} / 5.0\n`);

  console.log(`Art direction                  ${report.averages.artDirection.toFixed(1)}`);
  console.log(`Conversation quality           ${report.averages.conversationQuality.toFixed(1)}`);
  console.log(`Trade-off reasoning            ${report.averages.tradeOffReasoning.toFixed(1)}`);
  console.log(`Evidence fidelity              ${report.averages.evidenceFidelity.toFixed(1)}`);
  console.log(`Scope discipline               ${report.averages.scopeDiscipline.toFixed(1)}\n`);

  console.log('Key Persona Findings:');
  for (const r of scoredResults) {
    console.log(`\n• ${r.title} (${r.compositeScore.toFixed(1)}/5.0)`);
    for (const f of r.findings.slice(0, 2)) {
      console.log(`  - ${f}`);
    }
  }

  console.log(`\nDetailed reports saved to:`);
  console.log(`  - ${path.relative(root, jsonPath)}`);
  console.log(`  - ${path.relative(root, mdPath)}\n`);
}

main().catch((err) => {
  console.error('Benchmark execution error:', err);
  process.exit(1);
});
