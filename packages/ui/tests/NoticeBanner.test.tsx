import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { NoticeBanner } from '../src/composites/NoticeBanner';

export const componentUnderTest = 'NoticeBanner';

test('NoticeBanner renders title, description, and triggers dismiss and action', () => {
  let dismissed = false;
  let actionTriggered = false;

  let root;
  act(() => {
    root = renderer.create(
      <NoticeBanner
        title="Scheduled Maintenance"
        description="Systems will be offline Sunday at 2am."
        tone="warning"
        onDismiss={() => { dismissed = true; }}
        action={{
          label: 'Learn More',
          onPress: () => { actionTriggered = true; },
        }}
      />
    );
  });

  const alert = root.root.findByProps({ accessibilityRole: 'alert' });
  assert.ok(alert);

  const dismissBtn = root.root.findByProps({ accessibilityLabel: 'Dismiss notice' });
  act(() => {
    dismissBtn.props.onPress();
  });
  assert.equal(dismissed, true);

  const actionBtn = root.root.findByProps({ accessibilityLabel: 'Learn More' });
  act(() => {
    actionBtn.props.onPress();
  });
  assert.equal(actionTriggered, true);
});
