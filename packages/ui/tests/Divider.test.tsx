import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { Divider } from '../src/primitives/Divider';

export const componentUnderTest = 'Divider';

test('Divider renders hairline border line', () => {
  let root;
  act(() => {
    root = renderer.create(<Divider />);
  });
  const view = root.root.findByType('View');
  assert.ok(view);
});
