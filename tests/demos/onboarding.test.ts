import test from 'node:test';
import assert from 'node:assert/strict';
import { initialState, reducer, fieldErrors, stepValid, maxReachable, planById, type Action, type State } from '../../apps/lab/demos/onboarding/model';

const run = (actions: Action[], s: State = initialState) => actions.reduce(reducer, s);
const profile: Action[] = [{ type: 'edit', field: 'name', value: 'Ren Takahashi' }, { type: 'edit', field: 'handle', value: 'Ren_Arch' }, { type: 'edit', field: 'email', value: 'ren@studio.jp' }];

test('profile validation blocks progress and reveals errors on an attempt', () => {
  let s = reducer(initialState, { type: 'goTo', step: 1 });
  assert.equal(s.step, 0);
  assert.deepEqual(s.touched, { name: true, handle: true, email: true });
  assert.equal(Object.keys(fieldErrors(s)).length, 3);
  s = run(profile, s);
  assert.equal(s.handle, '@ren_arch', 'handle normalised');
  assert.deepEqual(fieldErrors(s), {});
  assert.equal(fieldErrors({ ...s, email: 'nope' }).email, 'Enter a valid email address');
});

test('full journey with back navigation: inputs persist and selection changes stick', () => {
  let s = run([...profile, { type: 'goTo', step: 1 }]);
  assert.equal(s.step, 1);
  assert.equal(stepValid(s), false, 'discipline required');
  s = run([{ type: 'chooseDiscipline', id: 'ceramics' }, { type: 'goTo', step: 2 }, { type: 'choosePlan', id: 'fellow' }, { type: 'goTo', step: 0 }], s);
  assert.equal(s.step, 0);
  assert.equal(s.name, 'Ren Takahashi', 'input preserved after going back');
  assert.equal(s.plan, 'fellow');
  assert.equal(maxReachable(s), 3);
  s = run([{ type: 'goTo', step: 3 }, { type: 'goTo', step: 1 }, { type: 'chooseDiscipline', id: 'printmaking' }, { type: 'goTo', step: 3 }], s);
  assert.equal(s.discipline, 'printmaking');
  assert.equal(planById(s.plan).priceCents, 12000);
  s = reducer(s, { type: 'activate' });
  assert.equal(s.phase, 'submitting');
  assert.equal(reducer(s, { type: 'goTo', step: 0 }).step, 3, 'no edits while activating');
  while (s.phase === 'submitting') s = reducer(s, { type: 'tick' });
  assert.equal(s.phase, 'complete');
  assert.equal(s.progress, 100);
  assert.deepEqual(reducer(s, { type: 'restart' }), initialState);
});

test('activation is refused until every step is valid', () => {
  const s = run([{ type: 'goTo', step: 3 }]);
  assert.equal(reducer(s, { type: 'activate' }).phase, 'wizard');
});
