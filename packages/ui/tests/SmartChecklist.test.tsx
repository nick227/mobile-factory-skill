import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { SmartChecklist } from '../src/patterns/SmartChecklist';

export const componentUnderTest = 'SmartChecklist';

test('SmartChecklist renders items, reports progress, and toggles checks', () => {
  let root: any;
  let toggledId: string | null = null;
  let toggledState: boolean | null = null;
  let actionFired = false;

  const items = [
    { id: 'item-1', title: 'Submit Blueprints', completed: true, required: true },
    { id: 'item-2', title: 'Acoustic Review', completed: false, required: true },
  ];

  act(() => {
    root = renderer.create(
      <SmartChecklist
        title="Project Checklist"
        items={items}
        onToggle={(id, next) => {
          toggledId = id;
          toggledState = next;
        }}
        action={{
          label: 'Submit Final',
          onPress: () => {
            actionFired = true;
          },
        }}
      />
    );
  });

  const checkboxes = root.root.findAll((n: any) => n.type === 'TouchableOpacity' && n.props.accessibilityRole === 'checkbox');
  assert.equal(checkboxes.length, 2);
  assert.equal(checkboxes[0].props.accessibilityState.checked, true);
  assert.equal(checkboxes[1].props.accessibilityState.checked, false);

  // Toggle item 2
  act(() => {
    checkboxes[1].props.onPress();
  });
  assert.equal(toggledId, 'item-2');
  assert.equal(toggledState, true);

  // Press submit action
  const submitBtn = root.root.findByProps({ accessibilityLabel: undefined, label: 'Submit Final' });
  assert.ok(submitBtn);
  act(() => {
    submitBtn.props.onPress();
  });
  assert.equal(actionFired, true);
});
