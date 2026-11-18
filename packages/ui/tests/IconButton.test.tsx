import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { View } from 'react-native';
import { IconButton } from '../src/controls/IconButton';

export const componentUnderTest = 'IconButton';

test('IconButton renders button role with accessible label', () => {
  let clicked = false;
  let root;
  act(() => {
    root = renderer.create(
      <IconButton
        label="Close dialog"
        icon={<View />}
        onPress={() => { clicked = true; }}
      />
    );
  });
  const pressable = root.root.findByType('Pressable');
  assert.equal(pressable.props.accessibilityRole, 'button');
  assert.equal(pressable.props.accessibilityLabel, 'Close dialog');
  assert.equal(pressable.props.accessibilityState.disabled, false);

  act(() => {
    pressable.props.onPress();
  });
  assert.equal(clicked, true);
});

test('IconButton renders loading state properly', () => {
  let root;
  act(() => {
    root = renderer.create(
      <IconButton
        label="Syncing"
        icon={<View />}
        loading
      />
    );
  });
  const pressable = root.root.findByType('Pressable');
  assert.equal(pressable.props.disabled, true);
  assert.equal(pressable.props.accessibilityState.busy, true);
  assert.ok(root.root.findByType('ActivityIndicator'));
});

test('IconButton pressable has at least 44 × 44 pt minimum geometry', () => {
  let root;
  act(() => { root = renderer.create(<IconButton label="X" icon={<View />} />); });
  const style = Object.assign({}, ...root.root.findByType('Pressable').props.style.flat(Infinity).filter(Boolean));
  assert.ok(style.minWidth >= 44);
  assert.ok(style.minHeight >= 44);
  act(() => root.unmount());
});
