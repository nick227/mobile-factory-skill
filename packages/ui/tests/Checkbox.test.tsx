import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { Checkbox } from '../src/controls/Checkbox';

export const componentUnderTest = 'Checkbox';

test('Checkbox renders accessible checkbox role and responds to press', () => {
  let toggled = false;
  let root;
  act(() => {
    root = renderer.create(
      <Checkbox
        label="Accept Terms"
        value={false}
        onValueChange={(val) => { toggled = val; }}
      />
    );
  });
  const pressable = root.root.findByType('Pressable');
  assert.equal(pressable.props.accessibilityRole, 'checkbox');
  assert.equal(pressable.props.accessibilityLabel, 'Accept Terms');
  assert.equal(pressable.props.accessibilityState.checked, false);
  assert.equal(pressable.props.accessibilityState.disabled, false);

  act(() => {
    pressable.props.onPress();
  });
  assert.equal(toggled, true);
});

test('Checkbox respects disabled state', () => {
  let root;
  act(() => {
    root = renderer.create(
      <Checkbox
        label="Disabled Checkbox"
        value={true}
        disabled
        onValueChange={() => {}}
      />
    );
  });
  const pressable = root.root.findByType('Pressable');
  assert.equal(pressable.props.disabled, true);
  assert.equal(pressable.props.accessibilityState.disabled, true);
  assert.equal(pressable.props.accessibilityState.checked, true);
});
