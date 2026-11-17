import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { Button } from '../src/controls/Button';

export const componentUnderTest = 'Button';

test('Button renders accessible role and label', () => {
  let root;
  let clicked = false;
  act(() => {
    root = renderer.create(<Button label="Submit" onPress={() => { clicked = true; }} />);
  });
  const pressable = root.root.findByType('Pressable');
  assert.equal(pressable.props.accessibilityRole, 'button');
  assert.equal(pressable.props.accessibilityState.disabled, false);
  assert.equal(pressable.props.accessibilityState.busy, false);

  act(() => {
    pressable.props.onPress();
  });
  assert.equal(clicked, true);
});

test('Button respects disabled and loading states', () => {
  let root;
  act(() => {
    root = renderer.create(<Button label="Disabled" disabled />);
  });
  const disabledBtn = root.root.findByType('Pressable');
  assert.equal(disabledBtn.props.disabled, true);
  assert.equal(disabledBtn.props.accessibilityState.disabled, true);

  act(() => {
    root = renderer.create(<Button label="Loading" loading />);
  });
  const loadingBtn = root.root.findByType('Pressable');
  assert.equal(loadingBtn.props.disabled, true);
  assert.equal(loadingBtn.props.accessibilityState.busy, true);
  assert.equal(loadingBtn.props.accessibilityState.disabled, true);
  assert.ok(root.root.findByType('ActivityIndicator'));
});
