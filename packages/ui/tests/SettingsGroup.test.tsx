import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { SettingsGroup } from '../src/patterns/SettingsGroup';

export const componentUnderTest = 'SettingsGroup';

test('SettingsGroup renders header and list items', () => {
  let clicked = false;
  let root;
  const entries = [
    { id: 'profile', title: 'Edit Profile', onPress: () => { clicked = true; } },
    { id: 'notifications', title: 'Notifications' }
  ];
  act(() => {
    root = renderer.create(
      <SettingsGroup title="Account Preferences" entries={entries} />
    );
  });
  const texts = root.root.findAllByType('Text');
  assert.ok(texts.some((t) => t.props.children === 'Account Preferences'));
  assert.ok(texts.some((t) => t.props.children === 'Edit Profile'));

  const buttons = root.root.findAll((n) => n.type === 'Pressable' && n.props.accessibilityRole === 'button');
  assert.equal(buttons.length, 1);
  act(() => {
    buttons[0].props.onPress();
  });
  assert.equal(clicked, true);
});
