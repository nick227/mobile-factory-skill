import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { View } from 'react-native';
import { FocusWizard } from '../src/patterns/FocusWizard';

export const componentUnderTest = 'FocusWizard';

test('FocusWizard steps forward and backward with controlled step state', () => {
  let root;
  let nextStepArgs = null;
  let completed = false;

  const steps = [
    { id: 's1', title: 'Step 1', content: <View testID="step-1" /> },
    { id: 's2', title: 'Step 2', content: <View testID="step-2" /> }
  ];

  act(() => {
    root = renderer.create(
      <FocusWizard
        steps={steps}
        activeStepIndex={0}
        onStepChange={(idx, id) => { nextStepArgs = { idx, id }; }}
        onComplete={() => { completed = true; }}
      />
    );
  });

  // Check KeyboardAvoidingView exists
  assert.ok(root.root.findByType('KeyboardAvoidingView'));

  // Step 1 content is rendered
  assert.ok(root.root.findByProps({ testID: 'step-1' }));

  // Next button labeled "Continue"
  const nextBtn = root.root.findByProps({ label: 'Continue' });
  assert.equal(nextBtn.props.disabled, false);

  act(() => {
    nextBtn.props.onPress();
  });
  assert.deepEqual(nextStepArgs, { idx: 1, id: 's2' });
});

test('FocusWizard respects step validation and complete trigger on final step', () => {
  let root;
  let stepChanged = false;
  let completed = false;

  const steps = [
    { id: 'invalid-step', title: 'Invalid', isValid: false, content: <View /> },
    { id: 'final-step', title: 'Final', isValid: true, content: <View /> }
  ];

  // Render invalid step
  act(() => {
    root = renderer.create(
      <FocusWizard
        steps={steps}
        activeStepIndex={0}
        onStepChange={() => { stepChanged = true; }}
        onComplete={() => { completed = true; }}
      />
    );
  });

  const continueBtn = root.root.findByProps({ label: 'Continue' });
  assert.equal(continueBtn.props.disabled, true);

  // Render final valid step
  act(() => {
    root = renderer.create(
      <FocusWizard
        steps={steps}
        activeStepIndex={1}
        onStepChange={() => { stepChanged = true; }}
        onComplete={() => { completed = true; }}
      />
    );
  });

  const completeBtn = root.root.findByProps({ label: 'Complete' });
  assert.equal(completeBtn.props.disabled, false);

  act(() => {
    completeBtn.props.onPress();
  });
  assert.equal(completed, true);
});
