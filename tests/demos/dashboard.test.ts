import test from 'node:test';
import assert from 'node:assert/strict';
import { initialState, reducer, totalHours, progress, completedCount, activeMilestone, activitiesFor, isComplete, type Action, type State } from '../../apps/lab/demos/dashboard/model';

const run = (actions: Action[], s: State = initialState) => actions.reduce(reducer, s);

test('logging hours updates the active milestone, weekly series, total and feedback together', () => {
  const before = totalHours(initialState);
  const s = run([{ type: 'logHours', hours: 2 }]);
  assert.equal(totalHours(s), before + 2);
  assert.equal(s.week[s.week.length - 1], initialState.week[initialState.week.length - 1] + 2);
  assert.equal(activitiesFor(s, 'm3').length, activitiesFor(initialState, 'm3').length + 1);
  assert.match(s.feedback!, /Logged 2 hrs to Full-Scale Model Construction/);
});

test('milestones → details → complete: progress, counts and the next active milestone stay consistent', () => {
  let s = run([{ type: 'openMilestone', id: 'm3' }]);
  assert.equal(s.tab, 'milestones');
  assert.equal(s.openMilestoneId, 'm3');
  assert.equal(completedCount(s), 2);
  assert.equal(progress(s), 63);
  s = reducer(s, { type: 'completeActive' });
  assert.equal(completedCount(s), 3);
  assert.equal(activeMilestone(s)!.id, 'm4');
  assert.equal(progress(s), 75, 'm4 has no logged work yet');
  const blocked = reducer(s, { type: 'completeActive' });
  assert.match(blocked.feedback!, /Log work/);
  assert.equal(completedCount(blocked), 3);
  s = run([{ type: 'logHours', hours: 3 }, { type: 'completeActive' }], s);
  assert.equal(isComplete(s), true);
  assert.equal(progress(s), 100);
  assert.equal(activeMilestone(s), null);
  assert.match(reducer(s, { type: 'logHours', hours: 1 }).feedback!, /complete/);
});
