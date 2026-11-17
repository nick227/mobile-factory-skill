import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { RadioGroup } from '../src/controls/RadioGroup';

export const componentUnderTest = 'RadioGroup';

test('RadioGroup renders radiogroup and options with selection callback', () => {
  let selected = 'opt1';
  let root;
  const options = [
    { label: 'Option 1', value: 'opt1' },
    { label: 'Option 2', value: 'opt2' },
    { label: 'Option 3 (Disabled)', value: 'opt3', disabled: true }
  ];
  act(() => {
    root = renderer.create(
      <RadioGroup
        label="Delivery Method"
        value={selected}
        options={options}
        onValueChange={(val) => { selected = val; }}
      />
    );
  });

  const group = root.root.findByProps({ accessibilityRole: 'radiogroup' });
  assert.equal(group.props.accessibilityLabel, 'Delivery Method');

  const radios = root.root.findAll((n) => n.type === 'Pressable' && n.props.accessibilityRole === 'radio');
  assert.equal(radios.length, 3);
  assert.equal(radios[0].props.accessibilityState.checked, true);
  assert.equal(radios[2].props.accessibilityState.disabled, true);

  act(() => {
    radios[1].props.onPress();
  });
  assert.equal(selected, 'opt2');
});
