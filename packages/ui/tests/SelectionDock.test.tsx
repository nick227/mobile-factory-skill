import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { SelectionDock } from '../src/patterns/SelectionDock';

export const componentUnderTest = 'SelectionDock';

test('SelectionDock renders selection summary and handles primary/clear actions', () => {
  let root: any;
  let primaryFired = false;
  let cleared = false;

  act(() => {
    root = renderer.create(
      <SelectionDock
        selectedCount={3}
        primaryAction={{
          label: 'Export Files',
          onPress: () => {
            primaryFired = true;
          },
        }}
        onClear={() => {
          cleared = true;
        }}
      />
    );
  });

  const toolbar = root.root.findByProps({ accessibilityRole: 'toolbar' });
  assert.ok(toolbar);
  assert.equal(toolbar.props.accessibilityLabel, '3 items selected');

  const buttons = root.root.findAll((n: any) => n.type === 'Pressable' && n.props.accessibilityRole === 'button');
  assert.equal(buttons.length, 2); // clear button + primary action button

  act(() => {
    buttons[1].props.onPress();
  });
  assert.equal(primaryFired, true);

  act(() => {
    buttons[0].props.onPress();
  });
  assert.equal(cleared, true);

  // Hidden when count is 0
  let hiddenRoot: any;
  act(() => {
    hiddenRoot = renderer.create(
      <SelectionDock
        selectedCount={0}
        primaryAction={{ label: 'Export', onPress: () => {} }}
      />
    );
  });
  assert.equal(hiddenRoot.toJSON(), null);
});
