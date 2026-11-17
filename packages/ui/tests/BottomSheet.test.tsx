import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { View, Text } from 'react-native';
import renderer, { act } from 'react-test-renderer';
import { BottomSheet } from '../src/composites/BottomSheet';

export const componentUnderTest = 'BottomSheet';

test('BottomSheet renders title, children, and handles dismiss', () => {
  let open = true;

  let root;
  act(() => {
    root = renderer.create(
      <BottomSheet
        open={open}
        onOpenChange={(v) => { open = v; }}
        title="Quick Filters"
        subtitle="Filter by category and price"
      >
        <View accessibilityLabel="sheet-content">
          <Text>Filter Content</Text>
        </View>
      </BottomSheet>
    );
  });

  const content = root.root.findByProps({ accessibilityLabel: 'sheet-content' });
  assert.ok(content);

  // Close via backdrop
  const backdrop = root.root.findByProps({ accessibilityLabel: 'Dismiss sheet' });
  act(() => {
    backdrop.props.onPress();
  });
  assert.equal(open, false);
});
