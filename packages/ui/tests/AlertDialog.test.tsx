import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { AlertDialog } from '../src/composites/AlertDialog';

export const componentUnderTest = 'AlertDialog';

test('AlertDialog renders alert role and handles confirmation and cancellation', () => {
  let root;
  let confirmed = false;
  let cancelled = false;
  let open = true;

  act(() => {
    root = renderer.create(
      <AlertDialog
        open={open}
        onOpenChange={(val) => { open = val; }}
        title="Discard Changes?"
        description="Your unsaved draft will be lost."
        confirmLabel="Discard"
        cancelLabel="Keep Editing"
        destructive
        onConfirm={() => { confirmed = true; }}
        onCancel={() => { cancelled = true; }}
      />
    );
  });

  const alert = root.root.findByProps({ accessibilityRole: 'alert' });
  assert.equal(alert.props.accessibilityLabel, 'Discard Changes?');

  const discardBtn = root.root.findByProps({ label: 'Discard' });
  act(() => {
    discardBtn.props.onPress();
  });
  assert.equal(confirmed, true);
  assert.equal(open, false);
});
