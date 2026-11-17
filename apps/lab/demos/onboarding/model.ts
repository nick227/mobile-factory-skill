// Pure onboarding model: input persists across steps; validation per step; review with edit; activation.
import { disciplines, plans } from './fixtures';

export const STEPS = ['profile', 'preferences', 'plan', 'review'] as const;
export interface State {
  step: number; name: string; handle: string; email: string; discipline: string | null; plan: string;
  touched: Partial<Record<'name' | 'handle' | 'email', boolean>>; phase: 'wizard' | 'submitting' | 'complete'; progress: number;
}
export type Action =
  | { type: 'edit'; field: 'name' | 'handle' | 'email'; value: string } | { type: 'blur'; field: 'name' | 'handle' | 'email' }
  | { type: 'chooseDiscipline'; id: string } | { type: 'choosePlan'; id: string }
  | { type: 'goTo'; step: number } | { type: 'activate' } | { type: 'tick' } | { type: 'restart' };

export const initialState: State = { step: 0, name: '', handle: '', email: '', discipline: null, plan: 'studio', touched: {}, phase: 'wizard', progress: 0 };

export function fieldErrors(s: Pick<State, 'name' | 'handle' | 'email'>) {
  const e: Partial<Record<'name' | 'handle' | 'email', string>> = {};
  const name = s.name.trim();
  if (name.length < 2) e.name = 'Enter at least 2 characters';
  else if (name.length > 40) e.name = 'Use 40 characters or fewer';
  if (!/^@[a-z0-9_]{3,20}$/.test(s.handle)) e.handle = 'Use @ followed by 3–20 lowercase letters, numbers or _';
  if (!/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(s.email.trim())) e.email = 'Enter a valid email address';
  return e;
}
export const stepValid = (s: State, step = s.step) =>
  step === 0 ? Object.keys(fieldErrors(s)).length === 0 : step === 1 ? Boolean(s.discipline) : step === 2 ? plans.some((p) => p.id === s.plan) : true;
/** Highest step the user may jump to: every earlier step must be valid. */
export const maxReachable = (s: State) => { let i = 0; while (i < STEPS.length - 1 && stepValid(s, i)) i++; return i; };
export const planById = (id: string) => plans.find((p) => p.id === id)!;
export const disciplineById = (id: string | null) => disciplines.find((d) => d.id === id);
/** Handles are normalised as typed: lowercase, leading @ added. */
export const normaliseHandle = (v: string) => { const t = v.trim().toLowerCase().replace(/\s+/g, ''); return t === '' ? '' : t.startsWith('@') ? t : `@${t}`; };

export function reducer(s: State, a: Action): State {
  if (s.phase === 'submitting' && a.type !== 'tick') return s;
  switch (a.type) {
    case 'edit': return { ...s, [a.field]: a.field === 'handle' ? normaliseHandle(a.value) : a.value };
    case 'blur': return { ...s, touched: { ...s.touched, [a.field]: true } };
    case 'chooseDiscipline': return disciplineById(a.id) ? { ...s, discipline: a.id } : s;
    case 'choosePlan': return plans.some((p) => p.id === a.id) ? { ...s, plan: a.id } : s;
    case 'goTo': {
      const target = Math.max(0, Math.min(a.step, STEPS.length - 1));
      // Moving forward needs every step in between to be valid; going back is always allowed.
      if (target > s.step && target > maxReachable(s)) return { ...s, touched: { name: true, handle: true, email: true } };
      return { ...s, step: target };
    }
    case 'activate': return s.step === STEPS.length - 1 && maxReachable(s) === STEPS.length - 1 ? { ...s, phase: 'submitting', progress: 10 } : s;
    case 'tick': {
      if (s.phase !== 'submitting') return s;
      const progress = Math.min(100, s.progress + 30);
      return progress >= 100 ? { ...s, progress: 100, phase: 'complete' } : { ...s, progress };
    }
    case 'restart': return initialState;
  }
}
