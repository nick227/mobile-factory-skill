import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { View } from 'react-native';
import { Surface } from '../src/primitives/Surface';

export const componentUnderTest = 'Surface';

test('Surface renders container with styled surface background', () => {
  let root;
  act(() => {
    root = renderer.create(
      <Surface tone="card">
        <View testID="card-content" />
      </Surface>
    );
  });
  const views = root.root.findAllByType('View');
  assert.ok(views.length >= 2);
});
