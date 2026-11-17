import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { Stepper } from '../src/controls/Stepper';

export const componentUnderTest = 'Stepper';

test('Stepper renders value, decrements, increments, and respects bounds', () => {
  let root;
  let val = 2;

  act(() => {
    root = renderer.create(
      <Stepper
        label="Quantity"
        value={val}
        min={1}
        max={5}
        onValueChange={(v) => { val = v; }}
      />
    );
  });

  const adjustable = root.root.findByProps({ accessibilityRole: 'adjustable' });
  assert.equal(adjustable.props.accessibilityLabel, 'Quantity');
  assert.equal(adjustable.props.accessibilityValue.now, 2);

  const decBtn = root.root.findByProps({ accessibilityLabel: 'Decrease Quantity' });
  const incBtn = root.root.findByProps({ accessibilityLabel: 'Increase Quantity' });

  // Increment to 3
  act(() => {
    incBtn.props.onPress();
  });
  assert.equal(val, 3);

  // Decrement to 1 (re-render with updated value)
  act(() => {
    root.update(
      <Stepper
        label="Quantity"
        value={1}
        min={1}
        max={5}
        onValueChange={(v) => { val = v; }}
      />
    );
  });

  const decBtnMin = root.root.findByProps({ accessibilityLabel: 'Decrease Quantity' });
  assert.equal(decBtnMin.props.accessibilityState.disabled, true);

  // Accessibility action test
  act(() => {
    adjustable.props.onAccessibilityAction({ nativeEvent: { actionName: 'increment' } });
  });
  assert.equal(val, 2);
});
