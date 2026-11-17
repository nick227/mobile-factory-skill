import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { View } from 'react-native';
import { Dialog } from '../src/composites/Dialog';

export const componentUnderTest = 'Dialog';

test('Dialog renders accessible dialog with title, description, and action buttons', () => {
  let root;
  let primaryClicked = false;
  let secondaryClicked = false;

  act(() => {
    root = renderer.create(
      <Dialog
        open={true}
        onOpenChange={() => {}}
        title="Confirm Reservation"
        description="Check your details before confirming."
        primaryAction={{
          label: 'Confirm',
          onPress: () => { primaryClicked = true; },
        }}
        secondaryAction={{
          label: 'Cancel',
          onPress: () => { secondaryClicked = true; },
        }}
      >
        <View testID="dialog-child" />
      </Dialog>
    );
  });

  const dialog = root.root.findByProps({ role: 'dialog' });
  assert.equal(dialog.props.accessibilityLabel, 'Confirm Reservation');
  assert.ok(root.root.findByProps({ testID: 'dialog-child' }));

  const confirmBtn = root.root.findByProps({ label: 'Confirm' });
  act(() => {
    confirmBtn.props.onPress();
  });
  assert.equal(primaryClicked, true);

  const cancelBtn = root.root.findByProps({ label: 'Cancel' });
  act(() => {
    cancelBtn.props.onPress();
  });
  assert.equal(secondaryClicked, true);
});
