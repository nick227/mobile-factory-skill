import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { PinInput } from '../src/controls/PinInput';

export const componentUnderTest = 'PinInput';

test('PinInput renders 4 cells, updates digits, and triggers onComplete', () => {
  let code = '';
  let completedCode = '';

  let root;
  act(() => {
    root = renderer.create(
      <PinInput
        value={code}
        onChange={(v) => { code = v; }}
        length={4}
        onComplete={(c) => { completedCode = c; }}
      />
    );
  });

  const input = root.root.findByType('TextInput');
  assert.equal(input.props.maxLength, 4);

  // Type full 4 digits
  act(() => {
    input.props.onChangeText('1234');
  });

  assert.equal(code, '1234');
  assert.equal(completedCode, '1234');

  // Verify non-numeric characters are filtered out
  act(() => {
    input.props.onChangeText('12ab34');
  });
  assert.equal(code, '1234');
});

test('PinInput displays error alert message when invalid', () => {
  let root;
  act(() => {
    root = renderer.create(
      <PinInput
        value="12"
        onChange={() => {}}
        error="Invalid verification code"
      />
    );
  });

  const errorText = root.root.findByProps({ accessibilityRole: 'alert' });
  assert.ok(errorText);
});
