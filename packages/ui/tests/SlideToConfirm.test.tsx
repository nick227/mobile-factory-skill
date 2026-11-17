import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { SlideToConfirm } from '../src/patterns/SlideToConfirm';

export const componentUnderTest = 'SlideToConfirm';

test('SlideToConfirm renders, supports accessible tap confirmation, and handles reset', () => {
  let confirmed = false;
  let reset = false;

  let root;
  act(() => {
    root = renderer.create(
      <SlideToConfirm
        label="Slide to pay"
        completedLabel="Paid"
        confirmed={confirmed}
        onConfirm={() => { confirmed = true; }}
        onReset={() => { reset = true; }}
      />
    );
  });

  // Verify accessible button track is rendered
  const track = root.root.findByProps({ accessibilityRole: 'button', accessibilityHint: 'Double tap to confirm' });
  assert.equal(track.props.accessibilityLabel, 'Slide to pay');

  // Trigger accessible tap confirmation via pressable thumb
  let pressables = root.root.findAllByType('Pressable');
  assert.ok(pressables.length > 0);
  act(() => {
    pressables[0].props.onPress();
  });
  assert.equal(confirmed, true);

  // Re-render in confirmed state
  act(() => {
    root.update(
      <SlideToConfirm
        label="Slide to pay"
        completedLabel="Paid"
        confirmed={true}
        onConfirm={() => {}}
        onReset={() => { reset = true; }}
      />
    );
  });

  pressables = root.root.findAllByType('Pressable');
  assert.ok(pressables.length > 0);
  act(() => {
    pressables[0].props.onPress();
  });
  assert.equal(reset, true);
});
