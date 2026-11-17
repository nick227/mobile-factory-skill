import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { Toggle } from '../src/controls/Toggle';

export const componentUnderTest = 'Toggle';

test('Toggle renders switch with accessible label and responds to changes', () => {
  let toggled = false;
  let root;
  act(() => {
    root = renderer.create(
      <Toggle
        label="Push Notifications"
        description="Receive daily alerts"
        value={false}
        onValueChange={(val) => { toggled = val; }}
      />
    );
  });
  const sw = root.root.findByType('Switch');
  assert.equal(sw.props.accessibilityLabel, 'Push Notifications');
  assert.equal(sw.props.value, false);

  act(() => {
    sw.props.onValueChange(true);
  });
  assert.equal(toggled, true);
});
