import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { RichActivityTimeline } from '../src/patterns/RichActivityTimeline';

export const componentUnderTest = 'RichActivityTimeline';

test('RichActivityTimeline renders events with user, badges, and action callbacks', () => {
  let root: any;
  let clickedAction = false;
  let clickedEvent: string | null = null;

  const events = [
    {
      id: 'ev-1',
      user: { name: 'Elena Rostova' },
      title: 'Published Design System v2.0',
      timestamp: 'Just now',
      badge: 'Release',
      badgeTone: 'accent' as const,
      description: 'Updated tokens, added 5 new components.',
      actions: [
        {
          label: 'View Release',
          onPress: () => {
            clickedAction = true;
          },
        },
      ],
    },
  ];

  act(() => {
    root = renderer.create(
      <RichActivityTimeline
        events={events}
        onPressEvent={(id) => {
          clickedEvent = id;
        }}
      />
    );
  });

  const eventButton = root.root.findByProps({
    accessibilityRole: 'button',
    accessibilityLabel: 'Elena Rostova: Published Design System v2.0',
  });
  assert.ok(eventButton);

  act(() => {
    eventButton.props.onPress();
  });
  assert.equal(clickedEvent, 'ev-1');

  // Trigger action button
  const actionBtn = root.root.findByProps({ label: 'View Release' });
  assert.ok(actionBtn);

  act(() => {
    actionBtn.props.onPress();
  });
  assert.equal(clickedAction, true);
});
