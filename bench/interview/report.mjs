import fs from 'node:fs';
import path from 'node:path';
import { DIMENSION_WEIGHTS } from './evaluator.mjs';

export function generateReport(scoredResults, metadata) {
  const scores = scoredResults.map((r) => r.dimensions);

  const avg = (key) => Number(
    (scores.reduce((sum, s) => sum + s[key], 0) / scores.length).toFixed(1)
  );

  const avgArtDirection = avg('artDirection');
  const avgConversation = avg('conversationQuality');
  const avgTradeOffs = avg('tradeOffReasoning');
  const avgEvidence = avg('evidenceFidelity');
  const avgScope = avg('scopeDiscipline');

  const overall = Number(
    (
      avgArtDirection * DIMENSION_WEIGHTS.artDirection +
      avgConversation * DIMENSION_WEIGHTS.conversationQuality +
      avgTradeOffs * DIMENSION_WEIGHTS.tradeOffReasoning +
      avgEvidence * DIMENSION_WEIGHTS.evidenceFidelity +
      avgScope * DIMENSION_WEIGHTS.scopeDiscipline
    ).toFixed(1)
  );

  const allFindings = scoredResults.flatMap((r) => r.findings);

  // Markdown Report Output
  const md = [
    '# Interview Quality Benchmark',
    '',
    `> **Execution Mode**: \`${metadata.runnerMode}\` (${metadata.model})`,
    metadata.warning ? `> [!NOTE]\n> ${metadata.warning}\n` : '',
    '',
    `## Overall Score: **${overall.toFixed(1)} / 5.0**`,
    '',
    '### Dimension Scorecard',
    '',
    '| Dimension | Weight | Score | Target | Rating |',
    '| :--- | :---: | :---: | :---: | :--- |',
    `| **Art-Direction Translation & Preservation** | 30% | **${avgArtDirection.toFixed(1)}** / 5.0 | $\\ge 4.5$ | ${ratingBadge(avgArtDirection)} |`,
    `| **Product Understanding & Conversation** | 25% | **${avgConversation.toFixed(1)}** / 5.0 | $\\ge 4.0$ | ${ratingBadge(avgConversation)} |`,
    `| **Trade-Off Reasoning & Contradictions** | 20% | **${avgTradeOffs.toFixed(1)}** / 5.0 | $\\ge 4.0$ | ${ratingBadge(avgTradeOffs)} |`,
    `| **Documentation & Evidence Fidelity** | 15% | **${avgEvidence.toFixed(1)}** / 5.0 | $\\ge 4.5$ | ${ratingBadge(avgEvidence)} |`,
    `| **Scope Discipline** | 10% | **${avgScope.toFixed(1)}** / 5.0 | $\\ge 4.0$ | ${ratingBadge(avgScope)} |`,
    '',
    '---',
    '',
    '### Persona Findings & Evidence Summary',
    '',
    ...scoredResults.map((r) => [
      `#### ${r.title} — **${r.compositeScore.toFixed(1)} / 5.0**`,
      '',
      `- **Art Direction**: ${r.dimensions.artDirection.toFixed(1)}/5.0`,
      `- **Conversation**: ${r.dimensions.conversationQuality.toFixed(1)}/5.0`,
      `- **Trade-Offs**: ${r.dimensions.tradeOffReasoning.toFixed(1)}/5.0`,
      `- **Evidence**: ${r.dimensions.evidenceFidelity.toFixed(1)}/5.0`,
      `- **Scope**: ${r.dimensions.scopeDiscipline.toFixed(1)}/5.0`,
      '',
      '**Evaluator Findings:**',
      ...r.findings.map((f) => `- ${f}`),
      '',
    ].join('\n')),
    '',
  ].join('\n');

  return {
    overall,
    averages: {
      artDirection: avgArtDirection,
      conversationQuality: avgConversation,
      tradeOffReasoning: avgTradeOffs,
      evidenceFidelity: avgEvidence,
      scopeDiscipline: avgScope,
    },
    metadata,
    results: scoredResults,
    markdown: md,
  };
}

function ratingBadge(score) {
  if (score >= 4.5) return '🟢 **Exceptional**';
  if (score >= 4.0) return '🟢 **Strong**';
  if (score >= 3.0) return '🟡 **Satisfactory**';
  return '🔴 **Needs Improvement**';
}
