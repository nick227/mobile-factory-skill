import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { GlanceHero } from '../src/patterns/GlanceHero';

export const componentUnderTest = 'patterns.glancehero';

test('GlanceHero renders monumental value, category label, and status summary', () => {
  let tree: any;
  act(() => {
    tree = renderer.create(
      <GlanceHero
        value="08:42"
        unit="HRS"
        label="Deep Rest"
        status="calm"
        statusText="Optimal recovery score"
        delta={{ value: "+42m", positive: true }}
      />
    );
  });

  const json = tree.toJSON();
  assert.equal(json.props.accessibilityRole, 'summary');
  assert.ok(json.props.accessibilityLabel.includes('Deep Rest: 08:42 HRS'));
  assert.ok(json.props.accessibilityLabel.includes('Optimal recovery score'));
});

test('GlanceHero acts as accessible button when onPress is provided', () => {
  let pressed = false;
  let tree: any;
  act(() => {
    tree = renderer.create(
      <GlanceHero
        value="72°"
        label="Kyoto Weather"
        statusText="Clear twilight"
        onPress={() => {
          pressed = true;
        }}
      />
    );
  });

  const json = tree.toJSON();
  assert.equal(json.props.accessibilityRole, 'button');
  act(() => {
    json.props.onPress();
  });
  assert.equal(pressed, true);
});
