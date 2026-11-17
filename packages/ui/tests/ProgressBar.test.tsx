import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { ProgressBar } from '../src/controls/ProgressBar';

export const componentUnderTest = 'ProgressBar';

test('ProgressBar renders accessible progressbar with bounded values', () => {
  let root;
  act(() => {
    root = renderer.create(<ProgressBar value={40} max={100} label="Upload Progress" />);
  });
  const bar = root.root.findByProps({ accessibilityRole: 'progressbar' });
  assert.equal(bar.props.accessibilityLabel, 'Upload Progress');
  assert.deepEqual(bar.props.accessibilityValue, { min: 0, max: 100, now: 40 });
});
