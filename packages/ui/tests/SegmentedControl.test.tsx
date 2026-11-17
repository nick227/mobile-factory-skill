import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { SegmentedControl } from '../src/controls/SegmentedControl';

export const componentUnderTest = 'SegmentedControl';

test('SegmentedControl renders radio group and options with checked state', () => {
  let selected = 'week';
  let root;
  const options = [
    { label: 'Day', value: 'day' },
    { label: 'Week', value: 'week' },
    { label: 'Month', value: 'month' }
  ];
  act(() => {
    root = renderer.create(
      <SegmentedControl
        label="Time range"
        value={selected}
        options={options}
        onValueChange={(val) => { selected = val; }}
      />
    );
  });

  const group = root.root.findByProps({ accessibilityRole: 'radiogroup' });
  assert.equal(group.props.accessibilityLabel, 'Time range');

  const radios = root.root.findAll((n) => n.type === 'Pressable' && n.props.accessibilityRole === 'radio');
  assert.equal(radios.length, 3);
  assert.equal(radios[1].props.accessibilityState.checked, true);
  assert.equal(radios[0].props.accessibilityState.checked, false);

  act(() => {
    radios[0].props.onPress();
  });
  assert.equal(selected, 'day');
});
