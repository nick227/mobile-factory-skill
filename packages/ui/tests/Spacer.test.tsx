import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { Spacer } from '../src/primitives/Spacer';

export const componentUnderTest = 'Spacer';

test('Spacer renders spacing layout with custom size', () => {
  let root;
  act(() => {
    root = renderer.create(<Spacer size="xl" />);
  });
  const view = root.root.findByType('View');
  assert.ok(view);
});
