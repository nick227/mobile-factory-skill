// Form values are strings (text inputs) or booleans (toggles); coercion happens on submit.
import type { FieldSpec } from './spec';
export type FormValues = Record<string, string | boolean>;
export type FormErrors = Record<string, string | undefined>;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function initialValues(fields: FieldSpec[], rec?: Record<string, unknown>): FormValues {
  return Object.fromEntries(fields.map((f) => {
    const v = rec?.[f.key] ?? f.default;
    return [f.key, f.type === 'toggle' ? Boolean(v) : v === undefined || v === null ? '' : String(v)];
  }));
}
export function validate(fields: FieldSpec[], values: FormValues): FormErrors {
  const errors: FormErrors = {};
  for (const f of fields) {
    if (f.type === 'toggle') continue;
    const raw = String(values[f.key] ?? '').trim();
    if (!raw) { if (f.required) errors[f.key] = `${f.label} is required`; continue; }
    if (f.type === 'number') {
      const n = Number(raw);
      if (!Number.isFinite(n)) errors[f.key] = `${f.label} must be a number`;
      else if (f.min !== undefined && n < f.min) errors[f.key] = `${f.label} must be at least ${f.min}`;
      else if (f.max !== undefined && n > f.max) errors[f.key] = `${f.label} must be at most ${f.max}`;
    } else if (f.type === 'date') {
      if (!ISO_DATE.test(raw) || Number.isNaN(Date.parse(raw))) errors[f.key] = `${f.label} must be a date (YYYY-MM-DD)`;
    } else if (f.type === 'email' && !EMAIL.test(raw)) errors[f.key] = `${f.label} must be an email address`;
    else if (f.min !== undefined && raw.length < f.min) errors[f.key] = `${f.label} needs at least ${f.min} characters`;
    else if (f.max !== undefined && raw.length > f.max) errors[f.key] = `${f.label} allows at most ${f.max} characters`;
  }
  return errors;
}
export function coerce(fields: FieldSpec[], values: FormValues): Record<string, unknown> {
  return Object.fromEntries(fields.map((f) => {
    const v = values[f.key];
    if (f.type === 'toggle') return [f.key, Boolean(v)];
    const s = String(v ?? '').trim();
    return [f.key, f.type === 'number' ? (s ? Number(s) : null) : s];
  }));
}
