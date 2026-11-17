import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { StoryRail } from '../src/patterns/StoryRail';

export const componentUnderTest = 'StoryRail';

test('StoryRail renders stories with live/unread badges and handles presses', () => {
  let root: any;
  let clickedStory: string | null = null;
  let added = false;

  const stories = [
    { id: 's1', name: 'Kensho', isLive: true },
    { id: 's2', name: 'Maya', hasUnread: true },
    { id: 's3', name: 'Tariq', hasUnread: false },
  ];

  act(() => {
    root = renderer.create(
      <StoryRail
        stories={stories}
        onPressStory={(id) => {
          clickedStory = id;
        }}
        onPressAdd={() => {
          added = true;
        }}
      />
    );
  });

  const buttons = root.root.findAll((n: any) => n.type === 'TouchableOpacity' && n.props.accessibilityRole === 'button');
  assert.equal(buttons.length, 4); // 1 add button + 3 stories

  // Press add button
  act(() => {
    buttons[0].props.onPress();
  });
  assert.equal(added, true);

  // Press second story (Maya)
  act(() => {
    buttons[2].props.onPress();
  });
  assert.equal(clickedStory, 's2');

  // Verify live label exists
  const liveText = root.root.findAll((n: any) => n.props.children === 'LIVE');
  assert.ok(liveText.length >= 1);
});
