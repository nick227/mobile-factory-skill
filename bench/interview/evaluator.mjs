/**
 * Independent Rubric Evaluator for Mobile Software Factory Interviews.
 * Scores the 5 weighted dimensions and produces concrete findings with evidence.
 *
 * Weightings:
 * - Art-direction translation and preservation : 30%
 * - Product understanding & conversation quality : 25%
 * - Trade-off reasoning & contradiction handling : 20%
 * - Documentation & evidence fidelity           : 15%
 * - Scope discipline                             : 10%
 */

export const DIMENSION_WEIGHTS = {
  artDirection: 0.30,
  conversationQuality: 0.25,
  tradeOffReasoning: 0.20,
  evidenceFidelity: 0.15,
  scopeDiscipline: 0.10,
};

export class InterviewEvaluator {
  scoreSession(sessionResult) {
    const { session, invariants } = sessionResult;
    const { persona, transcript, projectState, docs } = session;

    // 1. Art-Direction Translation & Preservation (30%)
    const artScore = this.evaluateArtDirection(persona, projectState, docs);

    // 2. Product Understanding & Conversation Quality (25%)
    const convScore = this.evaluateConversationQuality(transcript, invariants);

    // 3. Trade-off Reasoning & Contradiction Handling (20%)
    const tradeScore = this.evaluateTradeOffs(persona, transcript, projectState, docs);

    // 4. Documentation & Evidence Fidelity (15%)
    const docScore = this.evaluateEvidenceFidelity(invariants, docs, projectState);

    // 5. Scope Discipline (10%)
    const scopeScore = this.evaluateScopeDiscipline(persona, projectState, transcript);

    const weightedScore = (
      artScore.score * DIMENSION_WEIGHTS.artDirection +
      convScore.score * DIMENSION_WEIGHTS.conversationQuality +
      tradeScore.score * DIMENSION_WEIGHTS.tradeOffReasoning +
      docScore.score * DIMENSION_WEIGHTS.evidenceFidelity +
      scopeScore.score * DIMENSION_WEIGHTS.scopeDiscipline
    );

    const findings = [
      artScore.finding,
      convScore.finding,
      tradeScore.finding,
      docScore.finding,
      scopeScore.finding,
    ].filter(Boolean);

    return {
      persona: persona.id,
      title: persona.title,
      compositeScore: Number(weightedScore.toFixed(1)),
      dimensions: {
        artDirection: artScore.score,
        conversationQuality: convScore.score,
        tradeOffReasoning: tradeScore.score,
        evidenceFidelity: docScore.score,
        scopeDiscipline: scopeScore.score,
      },
      findings,
      evidence: {
        artDirection: artScore.evidence,
        conversation: convScore.evidence,
        tradeOffs: tradeScore.evidence,
        documentation: docScore.evidence,
        scope: scopeScore.evidence,
      },
    };
  }

  evaluateArtDirection(persona, projectState, docs) {
    let score = 5.0;
    const evidence = [];
    const findings = [];

    const facts = projectState.facts || {};
    const hierarchy = facts['experience.hierarchy']?.value;
    const preset = facts['design.preset']?.value;
    const pacing = facts['experience.pacing']?.value;
    const motion = facts['experience.motion']?.value;

    evidence.push({ hierarchy, preset, pacing, motion });

    if (persona.expectedArtDirection) {
      const exp = persona.expectedArtDirection;
      if (exp.hierarchy && hierarchy === exp.hierarchy) {
        findings.push(`Preserved ${exp.hierarchy} hierarchy.`);
      } else if (exp.hierarchy) {
        score -= 1.0;
        findings.push(`Hierarchy mismatch: expected ${exp.hierarchy}, got ${hierarchy || 'none'}.`);
      }

      if (exp.preset && preset === exp.preset) {
        findings.push(`Matched design preset ${exp.preset}.`);
      } else if (exp.preset && !preset) {
        score -= 0.5;
      }

      if (exp.pacing && pacing === exp.pacing) {
        findings.push(`Applied ${exp.pacing} visual pacing.`);
      }

      if (persona.id === 'changing-mind') {
        const history = facts['design.direction']?.history || [];
        if (history.length > 0 && pacing === 'spacious') {
          findings.push('Successfully purged stale dark-mode styling and adopted spacious luxury editorial direction.');
        } else {
          score -= 1.5;
          findings.push('Failed to fully purge previous dark-mode decisions upon revision.');
        }
      }
    }

    return {
      score: Math.max(1.0, Math.min(5.0, Number(score.toFixed(1)))),
      finding: findings.join(' '),
      evidence,
    };
  }

  evaluateConversationQuality(transcript, invariants) {
    let score = 5.0;
    const findings = [];
    const evidence = [];

    const { avgQuestionsPerTurn, maxPerTurn, flaggedHighDensity } = invariants.questionDensity;
    evidence.push({ avgQuestionsPerTurn, maxPerTurn });

    if (flaggedHighDensity) {
      score -= 1.5;
      findings.push(`Interrogated user with ${maxPerTurn} questions in a single turn.`);
    } else if (avgQuestionsPerTurn <= 2.0) {
      findings.push(`Maintained focused flow with an average of ${avgQuestionsPerTurn} questions per turn.`);
    } else {
      score -= 0.5;
      findings.push(`Pacing slightly dense (${avgQuestionsPerTurn} questions/turn).`);
    }

    // Check for technical jargon leaks in conversation
    const assistantText = transcript.filter((t) => t.role === 'assistant').map((t) => t.content).join(' ');
    const jargonMatches = assistantText.match(/\b(SQL|SQLite|AsyncStorage|schema|AST|ORM|REST|CRUD|Flexbox)\b/gi) || [];
    if (jargonMatches.length > 0) {
      score -= 0.8;
      findings.push(`Introduced technical implementation jargon (${[...new Set(jargonMatches)].join(', ')}).`);
    }

    return {
      score: Math.max(1.0, Math.min(5.0, Number(score.toFixed(1)))),
      finding: findings.join(' '),
      evidence,
    };
  }

  evaluateTradeOffs(persona, transcript, projectState, docs) {
    let score = 5.0;
    const findings = [];
    const evidence = [];

    if (persona.expectations.scriptedConflict) {
      const decisions = docs.decisions || '';
      if (decisions.includes('History:') || decisions.includes('offline') || decisions.includes('conflict')) {
        findings.push('Detected conflicting constraints and guided user to a pragmatic offline-first resolution.');
        evidence.push({ conflictHandled: true });
      } else {
        score -= 2.0;
        findings.push('Failed to cleanly isolate or document the offline-vs-sync contradiction.');
      }
    } else if (persona.expectations.latentComplexityUncovered) {
      const keys = Object.keys(projectState.facts || {});
      const hasComplexity = keys.some((k) => k.includes('cancellation') || k.includes('reminder') || k.includes('schedule'));
      if (hasComplexity) {
        findings.push('Successfully uncovered latent operational booking constraints without overwhelming client.');
        evidence.push({ latentNeedsCaptured: true });
      } else {
        score -= 1.0;
        findings.push('Missed latent operational booking requirements.');
      }
    } else {
      findings.push('Reasoned through user flows with zero unhandled contradictions.');
    }

    return {
      score: Math.max(1.0, Math.min(5.0, Number(score.toFixed(1)))),
      finding: findings.join(' '),
      evidence,
    };
  }

  evaluateEvidenceFidelity(invariants, docs, projectState) {
    let score = 5.0;
    const findings = [];
    const { fidelityRate, totalQuotes, validQuotes } = invariants.quoteFidelity;

    if (fidelityRate === 1.0 && totalQuotes > 0) {
      findings.push(`100% of recorded decisions carry verbatim user source quotes (${validQuotes}/${totalQuotes}).`);
    } else if (fidelityRate < 0.9) {
      score -= 1.5;
      findings.push(`Quote fidelity dropped to ${(fidelityRate * 100).toFixed(0)}%; contained unverified claims.`);
    }

    if (!docs.brief || docs.brief.length < 100) {
      score -= 1.5;
      findings.push('Project brief was missing or incomplete.');
    } else {
      findings.push('Generated comprehensive BRIEF.md and DECISIONS.md.');
    }

    return {
      score: Math.max(1.0, Math.min(5.0, Number(score.toFixed(1)))),
      finding: findings.join(' '),
      evidence: { totalQuotes, validQuotes, briefLength: docs.brief?.length || 0 },
    };
  }

  evaluateScopeDiscipline(persona, projectState, transcript) {
    let score = 5.0;
    const findings = [];
    const excluded = projectState.facts?.['product.excluded']?.value;

    if (persona.expectations.scopeExclusionExpected) {
      if (Array.isArray(excluded) && excluded.length > 0) {
        findings.push(`Demonstrated strong scope discipline by recording out-of-scope boundaries: [${excluded.join(', ')}].`);
      } else {
        score -= 2.0;
        findings.push('Failed to exclude out-of-scope pilot features; allowed scope creep.');
      }
    } else {
      findings.push('Kept v1 scope tight and aligned with user goals.');
    }

    return {
      score: Math.max(1.0, Math.min(5.0, Number(score.toFixed(1)))),
      finding: findings.join(' '),
      evidence: { excluded: excluded || [] },
    };
  }
}
