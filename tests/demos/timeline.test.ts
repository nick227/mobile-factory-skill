import test from 'node:test';
import assert from 'node:assert/strict';
import { initialState, reducer, openRequired, canSignOff, marks, agenda, feed, type Action, type State } from '../../apps/lab/demos/timeline/model';

const run = (actions: Action[], s: State = initialState) => actions.reduce(reducer, s);

test('feed links open the related task and calendar day', () => {
  let s = reducer(initialState, { type: 'openTask', id: 'task-3' });
  assert.equal(s.tab, 'tasks');
  assert.equal(s.highlightTaskId, 'task-3');
  s = reducer(s, { type: 'openVisit', id: 'v2' });
  assert.equal(s.tab, 'calendar');
  assert.equal(s.date, '2026-11-20');
  assert.deepEqual(agenda(s).due.map((t) => t.id), ['task-3']);
});

test('completing tasks updates feed, open counts, calendar marks and enables a one-time sign-off', () => {
  assert.equal(openRequired(initialState), 1);
  assert.equal(canSignOff(initialState), false);
  assert.equal(marks(initialState)['2026-11-20'].kind, 'both');
  let s = reducer(initialState, { type: 'toggleTask', id: 'task-3', completed: true });
  assert.equal(openRequired(s), 0);
  assert.equal(feed(s)[0].title, 'Completed: Install shoji screen track runners');
  assert.equal(marks(s)['2026-11-20'].kind, 'visit', 'done tasks stop marking their due date');
  assert.equal(reducer(s, { type: 'toggleTask', id: 'task-3', completed: true }), s, 'idempotent');
  s = reducer(s, { type: 'signOff' });
  assert.equal(s.signedOff, true);
  assert.equal(feed(s)[0].title, 'Submitted site sign-off');
  assert.equal(agenda(s, '2026-11-18').activity[0].title, 'Submitted site sign-off', 'calendar shows today\'s activity');
  assert.equal(reducer(s, { type: 'signOff' }), s);
  assert.equal(reducer(s, { type: 'toggleTask', id: 'task-4', completed: true }), s, 'locked after sign-off');
  const reopened = run([{ type: 'toggleTask', id: 'task-3', completed: true }, { type: 'toggleTask', id: 'task-3', completed: false }]);
  assert.equal(canSignOff(reopened), false);
  assert.equal(feed(reopened)[0].badge, 'Reopened');
});
