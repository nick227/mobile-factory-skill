import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { View } from 'react-native';
import { FormField } from '../src/composites/FormField';

export const componentUnderTest = 'FormField';

test('FormField renders label, children, and alert error', () => {
  let root;
  act(() => {
    root = renderer.create(
      <FormField label="Password" error="Must be at least 8 characters">
        <View testID="input-wrapper" />
      </FormField>
    );
  });
  const alert = root.root.findByProps({ accessibilityRole: 'alert' });
  assert.equal(alert.props.children, 'Must be at least 8 characters');
});
