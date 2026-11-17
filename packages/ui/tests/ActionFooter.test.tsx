import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { ActionFooter } from '../src/patterns/ActionFooter';

export const componentUnderTest = 'ActionFooter';

test('ActionFooter renders primary and optional secondary action buttons', () => {
  let primaryClicked = false;
  let secondaryClicked = false;
  let root;
  act(() => {
    root = renderer.create(
      <ActionFooter
        primary={{ label: 'Continue', onPress: () => { primaryClicked = true; } }}
        secondary={{ label: 'Cancel', onPress: () => { secondaryClicked = true; } }}
      />
    );
  });
  const buttons = root.root.findAll((n) => n.type === 'Pressable');
  assert.equal(buttons.length, 2);

  act(() => {
    buttons[0].props.onPress();
    buttons[1].props.onPress();
  });
  assert.equal(primaryClicked, true);
  assert.equal(secondaryClicked, true);
});
