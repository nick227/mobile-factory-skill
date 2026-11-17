import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { SchedulePicker } from '../src/patterns/SchedulePicker';

export const componentUnderTest = 'SchedulePicker';

test('SchedulePicker renders days and slots, allowing controlled selection', () => {
  let root: any;
  let selectedDate = '2026-11-18';
  let selectedSlot: string | null = null;

  const days = [
    { date: '2026-11-17', dayName: 'Tue', dayNumber: 17 },
    { date: '2026-11-18', dayName: 'Wed', dayNumber: 18 },
    { date: '2026-11-19', dayName: 'Thu', dayNumber: 19, isAvailable: false },
  ];

  const slots = [
    { id: 's1', time: '09:00 AM', period: 'morning' as const, available: true, price: '$50' },
    { id: 's2', time: '11:00 AM', period: 'morning' as const, available: false, price: '$50' },
    { id: 's3', time: '02:00 PM', period: 'afternoon' as const, available: true, price: '$60' },
  ];

  act(() => {
    root = renderer.create(
      <SchedulePicker
        days={days}
        slots={slots}
        selectedDate={selectedDate}
        onSelectDate={(d) => {
          selectedDate = d;
        }}
        selectedSlot={selectedSlot}
        onSelectSlot={(s) => {
          selectedSlot = s;
        }}
        title="Choose a session"
        timeZone="PST"
      />
    );
  });

  // Verify days
  const dayButtons = root.root.findAll(
    (n: any) => n.type === 'TouchableOpacity' && (n.props.accessibilityLabel?.includes('Tue') || n.props.accessibilityLabel?.includes('Wed') || n.props.accessibilityLabel?.includes('Thu'))
  );
  assert.equal(dayButtons.length, 3);
  assert.equal(dayButtons[0].props.accessibilityState.selected, false);
  assert.equal(dayButtons[1].props.accessibilityState.selected, true);
  assert.equal(dayButtons[2].props.accessibilityState.disabled, true);

  // Select day 1
  act(() => {
    dayButtons[0].props.onPress();
  });
  assert.equal(selectedDate, '2026-11-17');

  // Verify slots
  const slotButtons = root.root.findAll(
    (n: any) => n.type === 'TouchableOpacity' && (n.props.accessibilityLabel?.includes('09:00 AM') || n.props.accessibilityLabel?.includes('11:00 AM') || n.props.accessibilityLabel?.includes('02:00 PM'))
  );
  assert.equal(slotButtons.length, 3);
  assert.equal(slotButtons[0].props.accessibilityState.disabled, false);
  assert.equal(slotButtons[1].props.accessibilityState.disabled, true);

  // Select available slot
  act(() => {
    slotButtons[0].props.onPress();
  });
  assert.equal(selectedSlot, 's1');
});
