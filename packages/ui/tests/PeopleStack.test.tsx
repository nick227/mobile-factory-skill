import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { PeopleStack } from '../src/composites/PeopleStack';

export const componentUnderTest = 'PeopleStack';

test('PeopleStack renders avatars and displays overflow count pill', () => {
  let root: any;
  let pressed = false;
  const people = [
    { id: '1', name: 'Alice Walker' },
    { id: '2', name: 'Bob Dylan' },
    { id: '3', name: 'Charlie Mingus' },
    { id: '4', name: 'Diana Ross' },
    { id: '5', name: 'Ella Fitzgerald' },
  ];

  act(() => {
    root = renderer.create(
      <PeopleStack
        people={people}
        maxVisible={3}
        onPress={() => {
          pressed = true;
        }}
      />
    );
  });

  const button = root.root.findByProps({ accessibilityRole: 'button' });
  assert.ok(button);
  assert.ok(button.props.accessibilityLabel.includes('Group of 5 people'));

  act(() => {
    button.props.onPress();
  });
  assert.equal(pressed, true);

  // Check overflow text (+2)
  const overflow = root.root.findAll((n: any) => n.props.children === '+2');
  assert.ok(overflow.length >= 1, 'Should show +2 overflow count for 5 people with maxVisible=3');
});
