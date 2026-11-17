import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { View } from 'react-native';
import { Row } from '../src/primitives/Row';

export const componentUnderTest = 'Row';

test('Row renders horizontal layout with children', () => {
  let root;
  act(() => {
    root = renderer.create(
      <Row align="center" gap="sm">
        <View testID="item-1" />
        <View testID="item-2" />
      </Row>
    );
  });
  const views = root.root.findAllByType('View');
  assert.ok(views.length >= 3);
});
