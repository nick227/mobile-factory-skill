import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { ScreenHeader } from '../src/composites/ScreenHeader';

export const componentUnderTest = 'ScreenHeader';

test('ScreenHeader renders title and back button callback', () => {
  let backed = false;
  let root;
  act(() => {
    root = renderer.create(
      <ScreenHeader
        title="Event Details"
        subtitle="Live Concert"
        backLabel="Back"
        onBack={() => { backed = true; }}
      />
    );
  });
  const backBtn = root.root.findByProps({ accessibilityRole: 'button' });
  assert.equal(backBtn.props.accessibilityLabel, 'Back');

  act(() => {
    backBtn.props.onPress();
  });
  assert.equal(backed, true);
});
