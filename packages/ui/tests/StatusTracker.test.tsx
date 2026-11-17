import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { StatusTracker } from '../src/patterns/StatusTracker';

export const componentUnderTest = 'StatusTracker';

test('StatusTracker renders summary with progress and action', () => {
  let root: any;
  let actionFired = false;

  act(() => {
    root = renderer.create(
      <StatusTracker
        title="Delivery Package"
        statusLabel="Out for Delivery"
        tone="info"
        description="Driver is 4 stops away."
        progress={75}
        estimatedTime="ETA 1:30 PM"
        primaryAction={{
          label: 'Track Driver',
          onPress: () => {
            actionFired = true;
          },
        }}
      />
    );
  });

  const summary = root.root.findByProps({ accessibilityRole: 'summary' });
  assert.ok(summary);
  assert.ok(summary.props.accessibilityLabel.includes('Delivery Package: Out for Delivery'));
  assert.ok(summary.props.accessibilityLabel.includes('75% complete'));

  const actionButton = root.root.findByProps({ label: 'Track Driver' });
  assert.ok(actionButton);

  act(() => {
    actionButton.props.onPress();
  });
  assert.equal(actionFired, true);
});
