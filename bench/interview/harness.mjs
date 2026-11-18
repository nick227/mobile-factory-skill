import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { PERSONAS } from './personas.mjs';
import { InterviewAdapter } from './adapter.mjs';

/**
 * Harness that runs and inspects interview sessions.
 */
export class InterviewHarness {
  constructor(options = {}) {
    this.adapter = new InterviewAdapter(options);
    this.results = [];
  }

  async runAll(personas = PERSONAS) {
    this.results = [];
    const rootTemp = fs.mkdtempSync(path.join(os.tmpdir(), 'interview-bench-'));

    for (const persona of personas) {
      const personaDir = path.join(rootTemp, persona.id);
      fs.mkdirSync(personaDir, { recursive: true });

      const session = await this.adapter.runSession(persona, personaDir);
      const invariantChecks = this.evaluateInvariants(session);

      this.results.push({
        persona: persona.id,
        title: persona.title,
        session,
        invariants: invariantChecks,
      });
    }

    return {
      metadata: this.adapter.getRunnerMetadata(),
      results: this.results,
    };
  }

  /**
   * Evaluates deterministic invariant rules:
   * - Question count per turn (prefer 1-2, flag 4+)
   * - Verbatim quote fidelity for attributed evidence
   * - Scripted conflict detection
   * - Scope discipline (checks exclusions where appropriate)
   */
  evaluateInvariants(session) {
    const { persona, transcript, projectState, docs } = session;

    // 1. Question density per turn
    const turnQuestions = [];
    let flaggedHighDensity = false;
    for (const entry of transcript) {
      if (entry.role === 'assistant') {
        const text = entry.content || '';
        const questions = (text.match(/\?/g) || []).length;
        turnQuestions.push({ turn: entry.turn, questions });
        if (questions >= 4) {
          flaggedHighDensity = true;
        }
      }
    }
    const avgQuestionsPerTurn = turnQuestions.length
      ? Number((turnQuestions.reduce((a, b) => a + b.questions, 0) / turnQuestions.length).toFixed(1))
      : 0;

    // 2. Verbatim quote fidelity in attributed evidence
    const userUtterances = transcript
      .filter((t) => t.role === 'user')
      .map((t) => t.content.toLowerCase().replace(/\s+/g, ' '));

    const allFacts = Object.entries(projectState.facts || {});
    const quotesChecked = [];
    let invalidQuotes = 0;

    for (const [key, fact] of allFacts) {
      for (const src of fact.sources || []) {
        if (src.id === 'chat' && src.quote) {
          const normQuote = src.quote.toLowerCase().replace(/\s+/g, ' ');
          const found = userUtterances.some((u) => u.includes(normQuote) || normQuote.includes(u));
          quotesChecked.push({ key, quote: src.quote, valid: found });
          if (!found) invalidQuotes++;
        }
      }
    }

    // 3. Scripted conflict detection
    let conflictHandled = true;
    if (persona.expectations.scriptedConflict) {
      const historyHasRevisions = allFacts.some(([, f]) => (f.history || []).length > 0);
      const resolvedConflictLogged = docs.decisions.includes('History:') || historyHasRevisions;
      conflictHandled = resolvedConflictLogged;
    }

    // 4. Scope discipline: check exclusions when expected
    let scopeDisciplineSatisfied = true;
    if (persona.expectations.scopeExclusionExpected) {
      const excluded = projectState.facts?.['product.excluded']?.value;
      const hasExclusions = Array.isArray(excluded) && excluded.length > 0;
      scopeDisciplineSatisfied = hasExclusions;
    }

    // 5. Aesthetic translation: check that art direction exists in state
    let artDirectionPreserved = true;
    if (persona.expectedArtDirection) {
      const exp = persona.expectedArtDirection;
      const hierarchy = projectState.facts?.['experience.hierarchy']?.value;
      const preset = projectState.facts?.['design.preset']?.value;
      const pacing = projectState.facts?.['experience.pacing']?.value;

      if (exp.hierarchy && hierarchy !== exp.hierarchy) artDirectionPreserved = false;
      if (exp.pacing && pacing !== exp.pacing) artDirectionPreserved = false;
      if (exp.preset && preset !== exp.preset) artDirectionPreserved = false;
    }

    return {
      questionDensity: {
        avgQuestionsPerTurn,
        maxPerTurn: Math.max(...turnQuestions.map((q) => q.questions), 0),
        prefer1to2Passed: avgQuestionsPerTurn <= 2.5,
        flaggedHighDensity,
      },
      quoteFidelity: {
        totalQuotes: quotesChecked.length,
        validQuotes: quotesChecked.length - invalidQuotes,
        fidelityRate: quotesChecked.length ? Number(((quotesChecked.length - invalidQuotes) / quotesChecked.length).toFixed(2)) : 1.0,
      },
      conflictDetection: {
        required: Boolean(persona.expectations.scriptedConflict),
        passed: conflictHandled,
      },
      scopeDiscipline: {
        exclusionExpected: Boolean(persona.expectations.scopeExclusionExpected),
        passed: scopeDisciplineSatisfied,
      },
      artDirection: {
        expected: persona.expectedArtDirection,
        passed: artDirectionPreserved,
      },
    };
  }
}
