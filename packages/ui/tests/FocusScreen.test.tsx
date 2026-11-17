import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { View } from 'react-native';
import { FocusScreen } from '../src/patterns/FocusScreen';

export const componentUnderTest = 'FocusScreen';

test('FocusScreen renders keyboard avoiding container with top, content and action areas', () => {
  let root;
  act(() => {
    root = renderer.create(
      <FocusScreen
        top={<View testID="top-bar" />}
        action={<View testID="bottom-action" />}
      >
        <View testID="main-content" />
      </FocusScreen>
    );
  });
  const container = root.root.findByType('KeyboardAvoidingView');
  assert.ok(container);
  const scroll = root.root.findByType('ScrollView');
  assert.equal(scroll.props.keyboardShouldPersistTaps, 'handled');
});
