import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { Select } from '../src/controls/Select';

export const componentUnderTest = 'Select';

test('Select displays label, opens modal, and selects option', () => {
  let root;
  let selected = 'kyoto';
  const options = [
    { label: 'Kyoto', value: 'kyoto' },
    { label: 'Tokyo', value: 'tokyo' },
    { label: 'Osaka (Sold Out)', value: 'osaka', disabled: true },
  ];

  act(() => {
    root = renderer.create(
      <Select
        label="Destination"
        value={selected}
        options={options}
        onValueChange={(val) => { selected = val; }}
      />
    );
  });

  const combobox = root.root.findByProps({ accessibilityRole: 'combobox' });
  assert.equal(combobox.props.accessibilityValue.text, 'Kyoto');

  // Trigger modal open
  act(() => {
    combobox.props.onPress();
  });

  // Find option buttons in modal
  const buttons = root.root.findAll((n) => n.type === 'Pressable' && n.props.accessibilityLabel === 'Tokyo');
  assert.equal(buttons.length, 1);

  // Press Tokyo option
  act(() => {
    buttons[0].props.onPress();
  });
  assert.equal(selected, 'tokyo');
});
