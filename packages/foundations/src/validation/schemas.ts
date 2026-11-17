// Reusable field schemas with user-facing messages.
import { z } from 'zod';

export const requiredText = (label: string, min = 1, max = 200) =>
  z.string().trim()
    .min(min, min <= 1 ? `${label} is required` : `${label} must be at least ${min} characters`)
    .max(max, `${label} must be at most ${max} characters`);

export const optionalText = (label: string, max: number) =>
  z.string().trim().max(max, `${label} must be at most ${max} characters`).optional().or(z.literal('').transform(() => undefined));

const ISO = /^\d{4}-\d{2}-\d{2}$/;
const isRealDate = (s: string) => { const d = new Date(`${s}T00:00:00Z`); return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s; };
/** Local calendar date as YYYY-MM-DD. */
export const todayIso = (now = new Date()) => `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

export const isoDate = (label = 'Date') =>
  z.string().trim().regex(ISO, `${label} must look like YYYY-MM-DD`).refine(isRealDate, `${label} is not a real date`);

export const isoDateNotPast = (label = 'Date', now: () => Date = () => new Date()) =>
  isoDate(label).refine((s) => s >= todayIso(now()), `${label} can't be in the past`);
