import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { View } from 'react-native';
import { PortalProvider, PortalHost, Portal } from '../src/primitives/Portal';

export const componentUnderTest = 'Portal';

test('Portal renders nodes into specified PortalHost', () => {
  let root;
  act(() => {
    root = renderer.create(
      <PortalProvider>
        <View testID="screen-content">
          <Portal hostName="root">
            <View testID="teleported-content" />
          </Portal>
        </View>
        <PortalHost name="root" />
      </PortalProvider>
    );
  });

  const teleported = root.root.findByProps({ testID: 'teleported-content' });
  assert.ok(teleported);
});
