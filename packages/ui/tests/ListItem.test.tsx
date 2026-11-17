import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { ListItem } from '../src/composites/ListItem';

export const componentUnderTest = 'ListItem';

test('ListItem renders title and acts as accessible button when onPress provided', () => {
  let clicked = false;
  let root;
  act(() => {
    root = renderer.create(
      <ListItem
        title="Account Settings"
        description="Manage profile and security"
        onPress={() => { clicked = true; }}
      />
    );
  });
  const pressable = root.root.findByType('Pressable');
  assert.equal(pressable.props.accessibilityRole, 'button');

  act(() => {
    pressable.props.onPress();
  });
  assert.equal(clicked, true);
});

test('ListItem renders plain container without button role when not clickable', () => {
  let root;
  act(() => {
    root = renderer.create(
      <ListItem
        title="Read-only Item"
        description="Information only"
      />
    );
  });
  const pressable = root.root.findByType('Pressable');
  assert.equal(pressable.props.accessibilityRole, undefined);
});
