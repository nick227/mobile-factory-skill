import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { IdentityHeader } from '../src/patterns/IdentityHeader';

export const componentUnderTest = 'IdentityHeader';

test('IdentityHeader renders profile info, stats, and handles actions', () => {
  let root: any;
  let actionTriggered = false;

  const stats = [
    { label: 'Followers', value: '12.4K' },
    { label: 'Following', value: '256' },
  ];

  act(() => {
    root = renderer.create(
      <IdentityHeader
        name="Elena Rostova"
        handle="@elena"
        verified
        bio="Mobile architect and interface craftsman."
        stats={stats}
        primaryAction={{
          label: 'Follow',
          onPress: () => {
            actionTriggered = true;
          },
        }}
      />
    );
  });

  const nameText = root.root.findAll((n: any) => n.props.children === 'Elena Rostova');
  assert.ok(nameText.length >= 1);

  const verifiedBadge = root.root.findAll((n: any) => n.props.children === '✓');
  assert.ok(verifiedBadge.length >= 1);

  const buttons = root.root.findAll((n: any) => n.props.accessibilityRole === 'button');
  assert.ok(buttons.length >= 1);

  act(() => {
    buttons[0].props.onPress();
  });
  assert.equal(actionTriggered, true);
});
