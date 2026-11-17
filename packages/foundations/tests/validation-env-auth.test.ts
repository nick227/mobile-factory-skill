import test from 'node:test';
import assert from 'node:assert/strict';
import { z } from 'zod';
import { fieldErrors, validatorFor } from '../src/validation/form';
import { isoDate, isoDateNotPast, optionalText, requiredText, todayIso } from '../src/validation/schemas';
import { EnvError, readEnv } from '../src/env/env';
import { authReducer, createMockAuthAdapter, isExpired, AuthError, type Session } from '../src/auth/auth';

const now = () => new Date(2026, 10, 16, 12, 0, 0);
const EventForm = z.object({ title: requiredText('Title', 3, 80), date: isoDateNotPast('Date', now), venue: requiredText('Venue'), description: optionalText('Description', 500) });

test('form schema yields one user-facing message per field', () => {
  const errors = fieldErrors(EventForm, { title: 'ab', date: '2026-02-30', venue: '  ', description: 'x'.repeat(501) });
  assert.deepEqual(Object.keys(errors).sort(), ['date', 'description', 'title', 'venue']);
  assert.equal(errors.title, 'Title must be at least 3 characters');
  assert.equal(errors.venue, 'Venue is required');
  assert.equal(errors.date, 'Date is not a real date');
  assert.deepEqual(validatorFor(EventForm)({ title: 'Block party', date: '2026-11-16', venue: 'Park', description: '' }), {});
});

test('dates: format, real calendar day, and not in the past (local day)', () => {
  assert.equal(isoDate().safeParse('2026-1-5').success, false);
  assert.equal(isoDate().safeParse('2028-02-29').success, true);
  assert.equal(isoDateNotPast('Date', now).safeParse('2026-11-15').success, false);
  assert.equal(isoDateNotPast('Date', now).safeParse('2026-11-16').success, true);
  assert.equal(todayIso(now()), '2026-11-16');
});

test('env: only EXPO_PUBLIC_ keys, all problems reported together', () => {
  const Schema = z.object({ EXPO_PUBLIC_API_URL: z.url(), EXPO_PUBLIC_MODE: z.enum(['mock', 'live']) });
  assert.deepEqual(readEnv(Schema, { EXPO_PUBLIC_API_URL: 'https://api.example.com', EXPO_PUBLIC_MODE: 'mock' }).EXPO_PUBLIC_MODE, 'mock');
  assert.throws(() => readEnv(Schema, { EXPO_PUBLIC_API_URL: 'nope' }), (e: EnvError) => e.problems.length === 2);
  assert.throws(() => readEnv(z.object({ API_SECRET: z.string() }), { API_SECRET: 'x' }), /keep secrets on a server/);
});

test('auth reducer and mock adapter: restore, sign-in errors, expiry, sign-out', async () => {
  let stored: Session | null = null;
  const adapter = createMockAuthAdapter({ users: { 'a@b.co': 'pw' }, latencyMs: 0, store: { load: async () => stored, save: async (s) => { stored = s; } } });
  assert.equal(await adapter.restore(), null);
  await assert.rejects(adapter.signIn({ email: 'a@b.co', password: 'bad' }), AuthError);
  const s = await adapter.signIn({ email: ' A@B.co ', password: 'pw' });
  assert.equal(s.userId, 'a@b.co');
  assert.equal((await adapter.restore())?.userId, 'a@b.co');
  stored = { ...s, expiresAt: '2000-01-01T00:00:00Z' };
  assert.equal(await adapter.restore(), null, 'expired sessions are not restored');
  assert.equal(isExpired(stored), true);
  await adapter.signOut(s);
  assert.equal(stored, null);
  let st = authReducer({ status: 'restoring' }, { type: 'restored', session: null });
  st = authReducer(st, { type: 'sign-in-start' });
  assert.deepEqual(st, { status: 'signed-out', pending: true });
  st = authReducer(st, { type: 'sign-in-failed', error: 'nope' });
  assert.deepEqual(st, { status: 'signed-out', error: 'nope' });
});
