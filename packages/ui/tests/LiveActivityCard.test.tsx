import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { Text } from '../src/primitives/Text';
import { LiveActivityCard } from '../src/patterns/LiveActivityCard';

export const componentUnderTest = 'patterns.liveactivitycard';

test('LiveActivityCard renders live activity summary and metric ticker', () => {
  let tree: any;
  act(() => {
    tree = renderer.create(
      <LiveActivityCard
        title="Shinkansen Nozomi 42"
        subtitle="Kyoto → Tokyo · On Schedule"
        leadingIcon={<Text>🚄</Text>}
        trailingMetric="42 min"
        progress={0.68}
        statusTone="live"
      />
    );
  });

  const json = tree.toJSON();
  assert.equal(json.props.accessibilityRole, 'summary');
  assert.ok(json.props.accessibilityLabel.includes('Shinkansen Nozomi 42'));
  assert.ok(json.props.accessibilityLabel.includes('42 min'));
});

test('LiveActivityCard acts as expandable button when onToggleExpand is provided', () => {
  let toggled = false;
  let tree: any;
  act(() => {
    tree = renderer.create(
      <LiveActivityCard
        title="Deep Sleep Cycle"
        subtitle="REM Phase Active"
        leadingIcon={<Text>🌙</Text>}
        trailingMetric="6.2h"
        onToggleExpand={() => {
          toggled = true;
        }}
      />
    );
  });

  const json = tree.toJSON();
  assert.equal(json.props.accessibilityRole, 'button');
  act(() => {
    json.props.onPress();
  });
  assert.equal(toggled, true);
});
