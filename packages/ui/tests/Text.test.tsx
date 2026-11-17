import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { Text } from '../src/primitives/Text';

export const componentUnderTest = 'Text';

test('Text renders content with heading, body, and muted styles', () => {
  let root;
  act(() => {
    root = renderer.create(<Text variant="heading">Hello World</Text>);
  });
  const text = root.root.findByType('Text');
  assert.equal(text.props.children, 'Hello World');
  assert.equal(text.props.style[0].fontWeight, '700');

  act(() => {
    root = renderer.create(<Text muted variant="small">Muted small</Text>);
  });
  const smallText = root.root.findByType('Text');
  assert.equal(smallText.props.children, 'Muted small');
  assert.equal(smallText.props.style[0].fontWeight, '400');
});
