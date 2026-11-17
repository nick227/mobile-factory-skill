import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { Text } from '../src/primitives/Text';
import { ControlTile } from '../src/composites/ControlTile';

export const componentUnderTest = 'composites.controltile';

test('ControlTile renders button role with selection state and handles press', () => {
  let pressed = false;
  let tree: any;
  act(() => {
    tree = renderer.create(
      <ControlTile
        label="Deep Focus"
        subtitle="Active until 11:00 AM"
        icon={<Text>🌙</Text>}
        active={true}
        onPress={() => {
          pressed = true;
        }}
      />
    );
  });

  const json = tree.toJSON();
  assert.equal(json.props.accessibilityRole, 'button');
  assert.equal(json.props.accessibilityState.selected, true);
  assert.ok(json.props.accessibilityLabel.includes('Deep Focus'));

  act(() => {
    json.props.onPress();
  });
  assert.equal(pressed, true);
});

test('ControlTile respects disabled state', () => {
  let pressed = false;
  let tree: any;
  act(() => {
    tree = renderer.create(
      <ControlTile
        label="Cellular Data"
        icon={<Text>📶</Text>}
        disabled={true}
        onPress={() => {
          pressed = true;
        }}
      />
    );
  });

  const json = tree.toJSON();
  assert.equal(json.props.accessibilityState.disabled, true);
  assert.equal(json.props.accessibilityRole, 'button');
});
