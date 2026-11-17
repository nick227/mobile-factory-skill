import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { ProgressJourney } from '../src/patterns/ProgressJourney';

export const componentUnderTest = 'ProgressJourney';

test('ProgressJourney renders steps with correct statuses and handles interactions', () => {
  let root: any;
  let clickedStep: string | null = null;

  const steps = [
    { id: 'step-1', title: 'Submitted', status: 'completed' as const, timestamp: '10:00 AM' },
    { id: 'step-2', title: 'Under Review', status: 'active' as const },
    { id: 'step-3', title: 'Approved', status: 'upcoming' as const },
  ];

  act(() => {
    root = renderer.create(
      <ProgressJourney
        steps={steps}
        onPressStep={(id) => {
          clickedStep = id;
        }}
      />
    );
  });

  const buttons = root.root.findAll((n: any) => n.type === 'TouchableOpacity' && n.props.accessibilityRole === 'button');
  assert.equal(buttons.length, 3);

  // Click step 2
  act(() => {
    buttons[1].props.onPress();
  });
  assert.equal(clickedStep, 'step-2');

  // Verify completion icon ✓
  const checkIcons = root.root.findAll((n: any) => n.props.children === '✓');
  assert.ok(checkIcons.length >= 1);
});
