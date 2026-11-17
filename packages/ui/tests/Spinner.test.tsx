import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { Spinner } from '../src/controls/Spinner';

export const componentUnderTest = 'Spinner';

test('Spinner renders accessible loading indicator with label', () => {
  let root;
  act(() => {
    root = renderer.create(<Spinner label="Fetching events" size="large" />);
  });
  const bar = root.root.findByProps({ accessibilityRole: 'progressbar' });
  assert.equal(bar.props.accessibilityLabel, 'Fetching events');
  const indicator = root.root.findByType('ActivityIndicator');
  assert.equal(indicator.props.size, 'large');
});
