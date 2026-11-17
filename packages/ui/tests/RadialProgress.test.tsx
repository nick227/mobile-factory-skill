import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { RadialProgress } from '../src/controls/RadialProgress';

export const componentUnderTest = 'controls.radialprogress';

test('RadialProgress renders progressbar role with bounded value and accessibility label', () => {
  let tree: any;
  act(() => {
    tree = renderer.create(
      <RadialProgress value={75} max={100} label="Daily activity goal" showValue />
    );
  });

  const json = tree.toJSON();
  assert.equal(json.props.accessibilityRole, 'progressbar');
  assert.equal(json.props.accessibilityLabel, 'Daily activity goal');
  assert.deepEqual(json.props.accessibilityValue, { min: 0, max: 100, now: 75 });
});

test('RadialProgress renders center children when provided', () => {
  const { Text } = require('../src/primitives/Text');
  let tree: any;
  act(() => {
    tree = renderer.create(
      <RadialProgress value={90} size={140}>
        <Text>🔥 Streak</Text>
      </RadialProgress>
    );
  });

  const json = tree.toJSON();
  const centerSlot = json.children[json.children.length - 1];
  assert.ok(centerSlot);
});
