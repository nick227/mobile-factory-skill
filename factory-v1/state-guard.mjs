// MR 2 — Provenance & State Guard for Mobile Software Factory
// Enforces message-ID-backed quotations, immutable user evidence transcripts,
// atomic application of validated operations, and revision checks.
// Invariant: An AI response cannot authorize a state change merely because it is structurally valid.

import fs from 'node:fs';
import path from 'node:path';
import * as engine from './engine.mjs';
import * as plan from './planner.mjs';
import { assertValidResponse } from './response-registry.mjs';

const norm = (s) => (s || '').toLowerCase().replace(/\s+/g, ' ').trim();

/**
 * Returns the path to the project's immutable transcript.
 */
export function transcriptPath(dir) {
  return path.join(path.resolve(dir), '.factory', 'transcript.jsonl');
}

/**
 * Append an immutable message to the project transcript.
 * @param {string} dir
 * @param {{ id?: string, role: 'user' | 'assistant', content: string, timestamp?: string }} message
 * @returns {{ id: string, role: string, content: string, timestamp: string }}
 */
export function appendTranscript(dir, message) {
  if (!message || typeof message !== 'object') throw new Error('Message must be an object');
  if (!['user', 'assistant'].includes(message.role)) throw new Error('role must be "user" or "assistant"');
  if (typeof message.content !== 'string' || !message.content.trim()) {
    throw new Error('content must be a non-empty string');
  }

  const file = transcriptPath(dir);
  fs.mkdirSync(path.dirname(file), { recursive: true });

  const existing = fs.existsSync(file) ? fs.readFileSync(file, 'utf8').split('\n').filter(Boolean) : [];
  const id = message.id || `${message.role}-msg-${existing.length + 1}`;
  const timestamp = message.timestamp || new Date().toISOString();

  const record = {
    id,
    role: message.role,
    content: message.content.trim(),
    timestamp,
  };

  fs.appendFileSync(file, JSON.stringify(record) + '\n');
  return record;
}

/**
 * Load all messages from the project transcript.
 * @param {string} dir
 * @returns {Array<{ id: string, role: string, content: string, timestamp: string }>}
 */
export function loadTranscript(dir) {
  const file = transcriptPath(dir);
  if (!fs.existsSync(file)) return [];
  const lines = fs.readFileSync(file, 'utf8').split('\n').filter(Boolean);
  return lines.map((l) => JSON.parse(l));
}

/**
 * Extract all user utterances from the transcript or given messages list.
 */
export function getUserUtterances(dirOrMessages) {
  const messages = Array.isArray(dirOrMessages) ? dirOrMessages : loadTranscript(dirOrMessages);
  return messages.filter((m) => m.role === 'user');
}

/**
 * Verify quotation provenance against immutable user messages.
 * Enforces message-ID-backed quotations and substring resolution.
 * Rejects fabricated quotes that do not exist in the user transcript.
 *
 * @param {string} quote
 * @param {{ dir?: string, messageId?: string, transcript?: Array }} options
 * @returns {{ verified: boolean, messageId: string, quote: string }}
 */
export function verifyQuoteProvenance(quote, { dir, messageId, transcript } = {}) {
  if (!quote || typeof quote !== 'string' || !quote.trim()) {
    throw new Error('Quote must be a non-empty string');
  }

  const userMessages = getUserUtterances(transcript || (dir ? loadTranscript(dir) : []));
  if (userMessages.length === 0) {
    throw new Error('Provenance check failed: no user messages in transcript to verify quote against');
  }

  const normalizedQuote = norm(quote);

  if (messageId) {
    const target = userMessages.find((m) => m.id === messageId);
    if (!target) {
      throw new Error(`Provenance check failed: user message ID "${messageId}" not found in transcript`);
    }
    const targetContent = norm(target.content);
    if (!targetContent.includes(normalizedQuote)) {
      throw new Error(
        `Provenance check failed: quote "${quote}" is not a substring of message ${messageId} ("${target.content}")`
      );
    }
    return { verified: true, messageId, quote };
  }

  // If messageId not specified, find matching user message in transcript
  const match = userMessages.find((m) => norm(m.content).includes(normalizedQuote));
  if (!match) {
    throw new Error(
      `Provenance check failed: fabricated quote "${quote}" does not match any user utterance in transcript`
    );
  }

  return { verified: true, messageId: match.id, quote };
}

/**
 * Apply a validated AI response through the State Guard.
 *
 * Guarantees:
 * 1. Atomic execution: failed validation leaves .factory/project.json completely unchanged.
 * 2. Revision check: ensures the project has not changed since the response was generated.
 * 3. State Guard invariant: an AI response cannot authorize state changes on its own.
 *    - APPROVAL requires explicit user confirmation linked to an authentic user utterance.
 *    - CONFIRM cannot manufacture confirmation evidence; quotes are verified against transcript.
 *
 * @param {string} dir Project directory
 * @param {object} envelope Validated response envelope
 * @param {object} [userAuthorization] Explicit user authorization details: { confirmed: boolean, messageId?: string, quote?: string }
 * @param {object} [options] { expectedRevision?: number, transcript?: Array }
 */
export function applyGuardedResponse(dir, envelope, userAuthorization = {}, options = {}) {
  // 1. Validate response envelope structure against canonical contracts
  assertValidResponse(envelope);

  // 2. Snapshot current state for atomic rollback guarantee
  const projectFile = path.join(path.resolve(dir), '.factory', 'project.json');
  if (!fs.existsSync(projectFile)) {
    throw new Error('Project does not exist; initialize project first');
  }
  const snapshot = fs.readFileSync(projectFile, 'utf8');
  const project = JSON.parse(snapshot);
  const currentRevision = project.revision || 1;

  // 3. Revision Check
  if (options.expectedRevision !== undefined && options.expectedRevision !== currentRevision) {
    throw new Error(
      `Revision check failed: expected revision ${options.expectedRevision}, but project is at revision ${currentRevision}`
    );
  }
  if (envelope.payload?.revision !== undefined && envelope.payload.revision !== currentRevision) {
    throw new Error(
      `Revision mismatch: response specifies revision ${envelope.payload.revision}, but project is at revision ${currentRevision}`
    );
  }

  const transcript = options.transcript || loadTranscript(dir);

  try {
    switch (envelope.type) {
      case 'APPROVAL': {
        // State Guard Invariant: AI APPROVAL response CANNOT authorize approval on its own.
        // It must be accompanied by explicit user authorization.
        if (!userAuthorization || !userAuthorization.confirmed) {
          // Response is structurally valid, but state remains unapproved
          return {
            applied: false,
            status: 'pending_user_approval',
            message: 'Blueprint is proposed for approval, but user approval is required to advance state.',
            revision: currentRevision,
          };
        }

        // Verify user authorization quote against transcript
        const approvalQuote = userAuthorization.quote;
        if (!approvalQuote) {
          throw new Error('User approval authorization requires user quote evidence');
        }

        const verified = verifyQuoteProvenance(approvalQuote, {
          dir,
          messageId: userAuthorization.messageId,
          transcript,
        });

        // Ensure user message expresses affirmative approval
        const affirmativeRegex = /\b(approve|approved|looks good|confirm|confirmed|proceed|lgtm|yes|ship it)\b/i;
        if (!affirmativeRegex.test(approvalQuote)) {
          throw new Error(`User utterance "${approvalQuote}" does not express affirmative approval of the blueprint`);
        }

        // Record user confirmation decision bound to current revision and verified quote
        plan.setBlueprint(dir, {
          decisions: [
            {
              type: 'user-confirmation',
              value: `USER-APPROVED: ${verified.quote}`,
              revision: currentRevision,
              source: { id: 'chat', messageId: verified.messageId, quote: verified.quote },
            },
          ],
        });

        // Advance to approved state through engine
        const approval = engine.approve(dir);
        const updated = engine.load(dir);

        return {
          applied: true,
          status: 'approved',
          revision: updated.revision,
          approval,
        };
      }

      case 'CONFIRM': {
        // Invariant: CONFIRM envelope cannot manufacture confirmation evidence
        const items = envelope.payload.items || [];
        const targets = [];
        const values = {};

        // Verify evidence for all confirmed items
        for (const item of items) {
          const itemQuote = item.quote || envelope.evidence?.find((e) => norm(e.quote))?.quote;
          if (!itemQuote) {
            throw new Error(`Confirmation item "${item.key}" has no attributed quote to verify`);
          }

          const verified = verifyQuoteProvenance(itemQuote, {
            dir,
            messageId: item.messageId,
            transcript,
          });

          targets.push(item.key);
          values[item.key] = item.value;

          // Record verified fact
          plan.record(dir, [
            {
              key: item.key,
              value: item.value,
              status: 'confirmed',
              source: { id: 'chat', messageId: verified.messageId, quote: verified.quote },
            },
          ]);
        }

        const updated = engine.load(dir);
        return {
          applied: true,
          status: 'confirmed',
          confirmedKeys: targets,
          revision: updated.revision,
        };
      }

      case 'DESIGN': {
        // Verify user aesthetic evidence quotes in transcript
        for (const ev of envelope.evidence || []) {
          verifyQuoteProvenance(ev.quote, { dir, messageId: ev.messageId, transcript });
        }

        // Record design direction facts atomically if present
        const findings = [];
        const choices = envelope.payload.visualChoices;
        if (choices.preset) {
          findings.push({
            key: 'design.preset',
            value: choices.preset,
            status: 'stated',
            source: envelope.evidence?.[0] ? { id: 'chat', quote: envelope.evidence[0].quote } : { id: 'chat' },
          });
        }
        if (choices.hierarchy) {
          findings.push({
            key: 'experience.hierarchy',
            value: choices.hierarchy,
            status: 'stated',
            source: envelope.evidence?.[0] ? { id: 'chat', quote: envelope.evidence[0].quote } : { id: 'chat' },
          });
        }
        if (choices.pacing) {
          findings.push({
            key: 'experience.pacing',
            value: choices.pacing,
            status: 'stated',
            source: envelope.evidence?.[0] ? { id: 'chat', quote: envelope.evidence[0].quote } : { id: 'chat' },
          });
        }
        if (envelope.payload.direction) {
          findings.push({
            key: 'design.direction',
            value: envelope.payload.direction,
            status: 'stated',
            source: envelope.evidence?.[0] ? { id: 'chat', quote: envelope.evidence[0].quote } : { id: 'chat' },
          });
        }

        if (findings.length > 0) {
          plan.record(dir, findings);
        }

        const updated = engine.load(dir);
        return {
          applied: true,
          status: 'design_recorded',
          revision: updated.revision,
        };
      }

      case 'QUESTION':
      case 'PROGRESS':
      case 'CONFLICT':
      case 'BUILD':
      case 'HANDOFF': {
        // Consultative and reporting responses do not mutate project state directly
        return {
          applied: true,
          status: 'acknowledged',
          type: envelope.type,
          revision: currentRevision,
        };
      }

      default:
        throw new Error(`Unsupported response type: ${envelope.type}`);
    }
  } catch (err) {
    // Atomic rollback guarantee: restore original project.json if anything fails
    fs.writeFileSync(projectFile, snapshot);
    throw err;
  }
}
