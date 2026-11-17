import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { View } from 'react-native';
import { Stack } from '../src/primitives/Stack';

export const componentUnderTest = 'Stack';

test('Stack renders vertical layout with children and alignment', () => {
  let root;
  act(() => {
    root = renderer.create(
      <Stack align="center" gap="md">
        <View testID="child-1" />
        <View testID="child-2" />
      </Stack>
    );
  });
  const views = root.root.findAllByType('View');
  assert.ok(views.length >= 3);
});
