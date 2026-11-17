import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { View } from 'react-native';
import { Screen } from '../src/primitives/Screen';

export const componentUnderTest = 'Screen';

test('Screen renders view container with theme background', () => {
  let root;
  act(() => {
    root = renderer.create(
      <Screen>
        <View testID="screen-content" />
      </Screen>
    );
  });
  const views = root.root.findAllByType('View');
  assert.ok(views.length >= 2);
});

test('Screen renders ScrollView when scroll enabled', () => {
  let root;
  act(() => {
    root = renderer.create(
      <Screen scroll>
        <View testID="scroll-content" />
      </Screen>
    );
  });
  const scroll = root.root.findByType('ScrollView');
  assert.ok(scroll);
});
