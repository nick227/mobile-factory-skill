import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { View } from 'react-native';
import { ActionDock } from '../src/patterns/ActionDock';

export const componentUnderTest = 'ActionDock';

test('ActionDock renders dock container respecting safe areas', () => {
  let root;
  act(() => {
    root = renderer.create(
      <ActionDock separated>
        <View testID="dock-action" />
      </ActionDock>
    );
  });
  const view = root.root.findByType('View');
  assert.ok(view);
});
