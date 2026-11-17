import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { View } from 'react-native';
import { SwipePager } from '../src/patterns/SwipePager';

export const componentUnderTest = 'SwipePager';

test('SwipePager renders paging scrollview with previous/next controls', () => {
  let root;
  const items = [
    { id: 'p1', content: <View testID="page-1" /> },
    { id: 'p2', content: <View testID="page-2" /> }
  ];
  act(() => {
    root = renderer.create(<SwipePager items={items} label="Tutorial pages" />);
  });
  const scroll = root.root.findByType('ScrollView');
  assert.equal(scroll.props.pagingEnabled, true);
  assert.equal(scroll.props.accessibilityLabel, 'Tutorial pages');

  const buttons = root.root.findAll((n) => n.type === 'Pressable');
  assert.equal(buttons.length, 2);
  // Previous button disabled at index 0
  assert.equal(buttons[0].props.disabled, true);
  // Next button enabled
  assert.equal(buttons[1].props.disabled, false);
});
