import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { View } from 'react-native';
import { Accordion } from '../src/composites/Accordion';

export const componentUnderTest = 'Accordion';

test('Accordion renders items and toggles expansion state', () => {
  let root;
  let toggledId = null;
  const items = [
    { id: 'sec1', title: 'Section 1', content: <View testID="content-1" /> },
    { id: 'sec2', title: 'Section 2', content: <View testID="content-2" /> },
  ];

  act(() => {
    root = renderer.create(
      <Accordion
        items={items}
        expandedIds={['sec1']}
        onToggle={(id) => { toggledId = id; }}
      />
    );
  });

  const buttons = root.root.findAll((n) => n.type === 'Pressable');
  assert.equal(buttons.length, 2);
  assert.equal(buttons[0].props.accessibilityState.expanded, true);
  assert.equal(buttons[1].props.accessibilityState.expanded, false);

  // Content 1 is visible, content 2 is not
  assert.ok(root.root.findByProps({ testID: 'content-1' }));
  assert.equal(root.root.findAll((n) => n.props.testID === 'content-2').length, 0);

  // Toggle section 2
  act(() => {
    buttons[1].props.onPress();
  });
  assert.equal(toggledId, 'sec2');
});
