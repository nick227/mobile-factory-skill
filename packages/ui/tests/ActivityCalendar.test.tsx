import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { ActivityCalendar } from '../src/patterns/ActivityCalendar';

export const componentUnderTest = 'ActivityCalendar';

test('ActivityCalendar renders month days and handles date selection', () => {
  let root: any;
  let selected = '2026-11-18';

  const marks = {
    '2026-11-18': { hasEvents: true },
    '2026-11-20': { hasEvents: true },
  };

  act(() => {
    root = renderer.create(
      <ActivityCalendar
        year={2026}
        month={11}
        selectedDate={selected}
        onSelectDate={(d) => {
          selected = d;
        }}
        markedDates={marks}
      />
    );
  });

  // Find day 18 button
  const day18 = root.root.findByProps({ accessibilityLabel: 'November 18, 2026, has events' });
  assert.ok(day18);
  assert.equal(day18.props.accessibilityState.selected, true);

  // Find day 20 button
  const day20 = root.root.findByProps({ accessibilityLabel: 'November 20, 2026, has events' });
  assert.ok(day20);
  assert.equal(day20.props.accessibilityState.selected, false);

  // Select day 20
  act(() => {
    day20.props.onPress();
  });
  assert.equal(selected, '2026-11-20');
});
