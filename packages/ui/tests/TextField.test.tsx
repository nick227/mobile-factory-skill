import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { TextField } from '../src/controls/TextField';

export const componentUnderTest = 'TextField';

test('TextField renders input with accessible label and handles text change', () => {
  let text = '';
  let root;
  act(() => {
    root = renderer.create(
      <TextField
        label="Email Address"
        value={text}
        onChangeText={(val) => { text = val; }}
        placeholder="you@domain.com"
      />
    );
  });
  const input = root.root.findByType('TextInput');
  assert.equal(input.props.accessibilityLabel, 'Email Address');
  assert.equal(input.props.placeholder, 'you@domain.com');

  act(() => {
    input.props.onChangeText('test@example.com');
  });
  assert.equal(text, 'test@example.com');
});

test('TextField renders error alert when invalid', () => {
  let root;
  act(() => {
    root = renderer.create(
      <TextField
        label="Username"
        value=""
        error="Username is required"
      />
    );
  });
  const texts = root.root.findAllByType('Text');
  const alertText = texts.find((t) => t.props.accessibilityRole === 'alert');
  assert.ok(alertText);
  assert.equal(alertText.props.children, 'Username is required');
});
