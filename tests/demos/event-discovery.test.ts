import test from 'node:test';
import assert from 'node:assert/strict';
import { initialState, reducer, visibleEvents, filterOptions, canConfirm, totalCents, seatsLeft, isDayOpen, bookingFor, type Action, type State } from '../../apps/lab/demos/event-discovery/model';

const run = (actions: Action[], s: State = initialState) => actions.reduce(reducer, s);

test('search and category filters narrow results; counts follow search; "all" clears', () => {
  let s = run([{ type: 'toggleCategory', id: 'culinary' }]);
  assert.deepEqual(visibleEvents(s).map((e) => e.id), ['e4', 'e6']);
  s = reducer(s, { type: 'search', query: 'sake' });
  assert.deepEqual(visibleEvents(s).map((e) => e.id), ['e4']);
  assert.equal(filterOptions(s).find((o) => o.id === 'all')!.count, 1);
  s = reducer(s, { type: 'search', query: 'zzz' });
  assert.equal(visibleEvents(s).length, 0, 'empty state is reachable');
  s = reducer(s, { type: 'clearFilters' });
  assert.equal(visibleEvents(s).length, 6);
  assert.deepEqual(run([{ type: 'toggleCategory', id: 'temples' }, { type: 'toggleCategory', id: 'all' }]).categories, []);
});

test('full journey: discover → detail → booking → confirmation, with coherent booking state', () => {
  let s = run([{ type: 'open', eventId: 'e1' }]);
  assert.equal(s.screen, 'detail');
  s = reducer(s, { type: 'startBooking' });
  assert.equal(s.screen, 'booking');
  assert.equal(s.slotId, null);
  assert.equal(canConfirm(s), false, 'no slot chosen yet');
  assert.equal(reducer(s, { type: 'requestConfirm' }).confirming, false);
  s = run([{ type: 'selectSlot', slotId: 'pm' }, { type: 'setGuests', guests: 2 }], s);
  assert.equal(totalCents(s), 15000);
  s = run([{ type: 'requestConfirm' }, { type: 'submit' }], s);
  assert.equal(s.submitting, true);
  assert.equal(reducer(s, { type: 'cancelConfirm' }).confirming, true, 'cannot dismiss while paying');
  s = reducer(s, { type: 'submitted' });
  assert.equal(s.screen, 'confirmed');
  const b = bookingFor(s, 'e1')!;
  assert.equal(b.guests, 2);
  assert.equal(b.totalCents, 15000);
  assert.equal(b.ref, s.lastBookingRef);
  s = run([{ type: 'restart' }, { type: 'open', eventId: 'e1' }, { type: 'cancelBooking', ref: b.ref }], s);
  assert.equal(bookingFor(s, 'e1'), undefined);
});

test('availability: full slots, closed days and guest limits are enforced', () => {
  let s = run([{ type: 'open', eventId: 'e1' }, { type: 'startBooking' }]);
  assert.equal(s.date, '2026-11-20');
  assert.equal(seatsLeft('e1', '2026-11-20', 'am'), 0);
  assert.equal(reducer(s, { type: 'selectSlot', slotId: 'am' }).slotId, null, 'full slot cannot be chosen');
  assert.equal(isDayOpen('e1', '2026-11-22'), false);
  assert.equal(reducer(s, { type: 'selectDate', date: '2026-11-22' }).date, '2026-11-20', 'closed day cannot be chosen');
  s = run([{ type: 'selectDate', date: '2026-11-21' }, { type: 'selectSlot', slotId: 'pm' }, { type: 'setGuests', guests: 4 }], s);
  assert.equal(s.guests, 2, 'only 2 seats left at 1:30 PM on the 21st');
  s = run([{ type: 'selectDate', date: '2026-11-23' }, { type: 'selectSlot', slotId: 'am' }, { type: 'setGuests', guests: 3 }, { type: 'selectDate', date: '2026-11-21' }], s);
  assert.equal(s.slotId, 'am', 'slot kept when it still has room');
  const e6 = run([{ type: 'open', eventId: 'e6' }, { type: 'startBooking' }]);
  assert.equal(e6.date, '2026-11-20', 'first open day for the kaiseki class');
  assert.equal(seatsLeft('e6', '2026-11-20', 'eve'), 0);
  assert.equal(isDayOpen('e6', '2026-11-22'), false);
});
