// Canonical AI response registry and schema validator for Mobile Software Factory.
// Enforces 8 canonical response types, discriminated payload unions,
// catalog bounds, evidence preservation, and strict envelope validation.

import { DESIGN_AXES } from './assembler.mjs';

export const RESPONSE_TYPES = Object.freeze([
  'QUESTION',
  'CONFIRM',
  'CONFLICT',
  'DESIGN',
  'PROGRESS',
  'APPROVAL',
  'BUILD',
  'HANDOFF',
]);

export const EXPERIENCE_AXES = Object.freeze({
  hierarchy: ['media-led', 'typography-led', 'data-led', 'task-led'],
  motion: ['subtle', 'expressive', 'none'],
  pacing: ['compact', 'relaxed', 'monumental'],
});

const ENVELOPE_KEYS = Object.freeze(['type', 'status', 'message', 'payload', 'evidence', 'next']);

const isObj = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
const isNonEmptyStr = (v) => typeof v === 'string' && v.trim().length > 0;

/**
 * Validate an evidence item: { source: string, quote: string, ... }
 */
function validateEvidenceItem(item, path, errors) {
  if (!isObj(item)) {
    errors.push(`${path}: must be an object`);
    return;
  }
  const allowed = ['source', 'quote', 'id', 'messageId', 'timestamp'];
  for (const k of Object.keys(item)) {
    if (!allowed.includes(k)) {
      errors.push(`${path}.${k}: unknown key (allowed: ${allowed.join(', ')})`);
    }
  }
  if (!isNonEmptyStr(item.source)) {
    errors.push(`${path}.source: non-empty string required`);
  }
  if (!isNonEmptyStr(item.quote)) {
    errors.push(`${path}.quote: non-empty string required`);
  }
}

/**
 * Validates payload for a specific response type.
 */
function validatePayload(type, payload, evidence, errors) {
  if (!isObj(payload)) {
    errors.push('$.payload: must be a JSON object');
    return;
  }

  const checkUnknown = (allowed, path = '$.payload') => {
    for (const k of Object.keys(payload)) {
      if (!allowed.includes(k)) {
        errors.push(`${path}.${k}: unknown key (allowed: ${allowed.join(', ')})`);
      }
    }
  };

  switch (type) {
    case 'QUESTION': {
      checkUnknown(['questions']);
      if (!Array.isArray(payload.questions)) {
        errors.push('$.payload.questions: array required');
      } else {
        if (payload.questions.length < 1) {
          errors.push('$.payload.questions: must contain at least 1 question');
        } else if (payload.questions.length > 2) {
          errors.push(`$.payload.questions: maximum 2 questions allowed per turn (found ${payload.questions.length})`);
        }
        payload.questions.forEach((q, idx) => {
          const qPath = `$.payload.questions[${idx}]`;
          if (!isObj(q)) {
            errors.push(`${qPath}: must be an object`);
            return;
          }
          for (const k of Object.keys(q)) {
            if (!['id', 'prompt', 'options', 'defaultOption', 'key'].includes(k)) {
              errors.push(`${qPath}.${k}: unknown key`);
            }
          }
          if (!isNonEmptyStr(q.prompt)) {
            errors.push(`${qPath}.prompt: non-empty string required`);
          }
          if (q.options !== undefined) {
            if (!Array.isArray(q.options) || q.options.some((o) => !isNonEmptyStr(o))) {
              errors.push(`${qPath}.options: array of non-empty strings required`);
            }
          }
          if (q.defaultOption !== undefined) {
            if (typeof q.defaultOption !== 'string') {
              errors.push(`${qPath}.defaultOption: string required`);
            } else if (Array.isArray(q.options) && !q.options.includes(q.defaultOption)) {
              errors.push(`${qPath}.defaultOption: must match one of options`);
            }
          }
        });
      }
      break;
    }

    case 'CONFIRM': {
      checkUnknown(['items', 'inferenceSummary']);
      if (!Array.isArray(payload.items) || payload.items.length === 0) {
        errors.push('$.payload.items: non-empty array required');
      } else {
        payload.items.forEach((item, idx) => {
          const iPath = `$.payload.items[${idx}]`;
          if (!isObj(item)) {
            errors.push(`${iPath}: must be an object`);
            return;
          }
          for (const k of Object.keys(item)) {
            if (!['key', 'value', 'inference', 'source', 'quote'].includes(k)) {
              errors.push(`${iPath}.${k}: unknown key`);
            }
          }
          if (!isNonEmptyStr(item.key)) {
            errors.push(`${iPath}.key: non-empty string required`);
          }
          if (item.value === undefined) {
            errors.push(`${iPath}.value: required`);
          }
        });
      }
      // Confirmation invariant: requires explicit user evidence
      const hasEnvelopeEvidence = Array.isArray(evidence) && evidence.some((e) => isNonEmptyStr(e?.quote));
      const hasItemEvidence = Array.isArray(payload.items) && payload.items.some((i) => isNonEmptyStr(i?.quote));
      if (!hasEnvelopeEvidence && !hasItemEvidence) {
        errors.push('$.evidence: CONFIRM response requires explicit user evidence (envelope or item quote)');
      }
      break;
    }

    case 'CONFLICT': {
      checkUnknown(['conflicts', 'options', 'impact']);
      if (!Array.isArray(payload.conflicts) || payload.conflicts.length === 0) {
        errors.push('$.payload.conflicts: non-empty array required');
      } else {
        payload.conflicts.forEach((c, idx) => {
          const cPath = `$.payload.conflicts[${idx}]`;
          if (!isObj(c)) {
            errors.push(`${cPath}: must be an object`);
            return;
          }
          for (const k of Object.keys(c)) {
            if (!['key', 'description', 'requirementA', 'requirementB', 'options'].includes(k)) {
              errors.push(`${cPath}.${k}: unknown key`);
            }
          }
          if (!isNonEmptyStr(c.key)) errors.push(`${cPath}.key: non-empty string required`);
          if (!isNonEmptyStr(c.description)) errors.push(`${cPath}.description: non-empty string required`);
          if (!Array.isArray(c.options) || c.options.length < 2) {
            errors.push(`${cPath}.options: array with at least 2 resolution options required`);
          }
        });
      }
      break;
    }

    case 'DESIGN': {
      checkUnknown(['direction', 'rationale', 'visualChoices', 'previewReference']);
      if (!isNonEmptyStr(payload.direction)) errors.push('$.payload.direction: non-empty string required');
      if (!isNonEmptyStr(payload.rationale)) errors.push('$.payload.rationale: non-empty string required');
      if (!isNonEmptyStr(payload.previewReference)) errors.push('$.payload.previewReference: non-empty string required');

      if (!isObj(payload.visualChoices)) {
        errors.push('$.payload.visualChoices: object required');
      } else {
        const allowedChoices = [
          'preset',
          'hierarchy',
          'motion',
          'pacing',
          'palette',
          'radius',
          'density',
          'typography',
          'surface',
          'layout',
          'media',
          'colorMode',
        ];
        for (const k of Object.keys(payload.visualChoices)) {
          if (!allowedChoices.includes(k)) {
            errors.push(`$.payload.visualChoices.${k}: unknown key`);
          }
        }
        // preset is required and catalog-checked
        if (!isNonEmptyStr(payload.visualChoices.preset)) {
          errors.push('$.payload.visualChoices.preset: required non-empty string');
        } else if (!DESIGN_AXES.preset.includes(payload.visualChoices.preset)) {
          errors.push(
            `$.payload.visualChoices.preset: invalid value "${payload.visualChoices.preset}" (allowed: ${DESIGN_AXES.preset.join(', ')})`
          );
        }
        // Validate experience directions if provided
        for (const axis of ['hierarchy', 'motion', 'pacing']) {
          const val = payload.visualChoices[axis];
          if (val !== undefined) {
            if (!EXPERIENCE_AXES[axis].includes(val)) {
              errors.push(
                `$.payload.visualChoices.${axis}: invalid value "${val}" (allowed: ${EXPERIENCE_AXES[axis].join(', ')})`
              );
            }
          }
        }
        // Validate other design axes
        for (const axis of ['palette', 'radius', 'density', 'typography', 'surface', 'layout', 'media', 'colorMode']) {
          const val = payload.visualChoices[axis];
          if (val !== undefined) {
            if (!DESIGN_AXES[axis]?.includes(val)) {
              errors.push(
                `$.payload.visualChoices.${axis}: invalid value "${val}" (allowed: ${DESIGN_AXES[axis].join(', ')})`
              );
            }
          }
        }
      }

      // Design Invariant: Must preserve user aesthetic evidence
      const hasAestheticEvidence = Array.isArray(evidence) && evidence.length > 0 && evidence.some((e) => isNonEmptyStr(e?.quote));
      if (!hasAestheticEvidence) {
        errors.push('$.evidence: DESIGN response requires non-empty user aesthetic evidence quotes');
      }
      break;
    }

    case 'PROGRESS': {
      checkUnknown(['completed', 'currentSegment', 'pending', 'metrics']);
      if (!Array.isArray(payload.completed)) errors.push('$.payload.completed: array required');
      if (!isNonEmptyStr(payload.currentSegment)) errors.push('$.payload.currentSegment: non-empty string required');
      if (!Array.isArray(payload.pending)) errors.push('$.payload.pending: array required');
      break;
    }

    case 'APPROVAL': {
      checkUnknown(['blueprintHash', 'revision', 'summary', 'approvalGate']);
      if (!isNonEmptyStr(payload.blueprintHash)) errors.push('$.payload.blueprintHash: non-empty string required');
      if (typeof payload.revision !== 'number' || payload.revision < 1 || !Number.isInteger(payload.revision)) {
        errors.push('$.payload.revision: positive integer required');
      }
      if (!payload.summary || (!isObj(payload.summary) && !isNonEmptyStr(payload.summary))) {
        errors.push('$.payload.summary: object or non-empty string summary required');
      }
      break;
    }

    case 'BUILD': {
      checkUnknown(['operation', 'status', 'files', 'tests', 'diagnostics']);
      if (!isNonEmptyStr(payload.operation)) errors.push('$.payload.operation: non-empty string required');
      if (!['success', 'failure', 'in-progress'].includes(payload.status)) {
        errors.push('$.payload.status: must be one of success, failure, in-progress');
      }
      if (!Array.isArray(payload.files)) errors.push('$.payload.files: array of string filepaths required');
      break;
    }

    case 'HANDOFF': {
      checkUnknown(['revision', 'summary', 'verification', 'instructions', 'demoRoute']);
      if (typeof payload.revision !== 'number' || payload.revision < 1 || !Number.isInteger(payload.revision)) {
        errors.push('$.payload.revision: positive integer required');
      }
      if (!isNonEmptyStr(payload.summary)) errors.push('$.payload.summary: non-empty string required');
      if (!payload.verification || (!isObj(payload.verification) && !Array.isArray(payload.verification))) {
        errors.push('$.payload.verification: object or array required');
      }
      if (!isNonEmptyStr(payload.instructions) && (!Array.isArray(payload.instructions) || payload.instructions.length === 0)) {
        errors.push('$.payload.instructions: non-empty string or array of strings required');
      }
      break;
    }
  }
}

/**
 * Validates a response envelope against the 8 canonical response contracts.
 * @param {any} response
 * @param {object} [options]
 * @returns {{ valid: boolean, type?: string, errors: string[] }}
 */
export function validateResponse(response, options = {}) {
  const errors = [];

  if (!isObj(response)) {
    return { valid: false, errors: ['$: response must be a JSON object'] };
  }

  // Reject unknown top-level envelope keys
  for (const k of Object.keys(response)) {
    if (!ENVELOPE_KEYS.includes(k)) {
      errors.push(`$.${k}: unknown envelope key (allowed: ${ENVELOPE_KEYS.join(', ')})`);
    }
  }

  // Type validation
  if (!response.type || typeof response.type !== 'string') {
    errors.push('$.type: required string');
  } else if (!RESPONSE_TYPES.includes(response.type)) {
    errors.push(`$.type: unknown response type "${response.type}" (allowed: ${RESPONSE_TYPES.join(', ')})`);
  }

  // Status validation
  if (!isNonEmptyStr(response.status)) {
    errors.push('$.status: required non-empty string');
  }

  // Message validation
  if (!isNonEmptyStr(response.message)) {
    errors.push('$.message: required non-empty string');
  }

  // Next validation
  if (!isNonEmptyStr(response.next)) {
    errors.push('$.next: required non-empty string');
  }

  // Evidence validation if present
  if (response.evidence !== undefined) {
    if (!Array.isArray(response.evidence)) {
      errors.push('$.evidence: must be an array');
    } else {
      response.evidence.forEach((item, idx) => {
        validateEvidenceItem(item, `$.evidence[${idx}]`, errors);
      });
    }
  }

  // Payload validation
  if (response.type && RESPONSE_TYPES.includes(response.type)) {
    validatePayload(response.type, response.payload, response.evidence, errors);
  }

  const valid = errors.length === 0;

  if (!valid && options.throwOnError) {
    const err = new Error(`Response validation failed:\n  - ${errors.join('\n  - ')}`);
    err.validationErrors = errors;
    throw err;
  }

  return {
    valid,
    type: response.type,
    errors,
  };
}

/**
 * Assert that a response envelope is valid, throwing if invalid.
 */
export function assertValidResponse(response) {
  return validateResponse(response, { throwOnError: true });
}

/**
 * Helper to create a canonical response envelope.
 */
export function createResponse(type, { status, message, payload, evidence, next }) {
  const envelope = {
    type,
    status,
    message,
    payload,
    ...(evidence ? { evidence } : {}),
    next,
  };
  assertValidResponse(envelope);
  return envelope;
}

/**
 * Format a validated response for presentation to the client or CLI.
 * Ensures the presentation is derived from the contract.
 */
export function formatPresentation(envelope) {
  assertValidResponse(envelope);
  let out = `[${envelope.type}] (${envelope.status})\n${envelope.message}\n`;

  if (envelope.evidence && envelope.evidence.length > 0) {
    out += `\nEvidence:\n` + envelope.evidence.map((e) => `  • "${e.quote}" (${e.source})`).join('\n') + '\n';
  }

  out += `\nNext: ${envelope.next}\n`;
  return out;
}
