import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { CalmSkeleton } from '../src/controls/CalmSkeleton';

export const componentUnderTest = 'CalmSkeleton';

test('CalmSkeleton renders accessible placeholder frame', () => {
  let root;
  act(() => {
    root = renderer.create(<CalmSkeleton height={64} width="80%" radius={8} />);
  });
  const view = root.root.findByProps({ accessibilityLabel: 'Loading content' });
  assert.ok(view);
  assert.equal(view.props.accessible, true);
});
