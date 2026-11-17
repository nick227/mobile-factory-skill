import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { StepProgress } from '../src/controls/StepProgress';

export const componentUnderTest = 'StepProgress';

test('StepProgress renders progressbar with step and total counts', () => {
  let root;
  act(() => {
    root = renderer.create(<StepProgress step={2} total={4} label="Checkout steps" />);
  });
  const bar = root.root.findByProps({ accessibilityRole: 'progressbar' });
  assert.equal(bar.props.accessibilityLabel, 'Checkout steps');
  assert.deepEqual(bar.props.accessibilityValue, { min: 0, max: 4, now: 2 });
});
