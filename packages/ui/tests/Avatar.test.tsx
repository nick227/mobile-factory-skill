import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { Avatar } from '../src/composites/Avatar';

export const componentUnderTest = 'Avatar';

test('Avatar computes initials when uri is absent and includes accessible name', () => {
  let root;
  act(() => {
    root = renderer.create(<Avatar name="Jane Doe" size={48} />);
  });
  const view = root.root.findByProps({ accessibilityLabel: 'Jane Doe' });
  assert.ok(view);
  const text = root.root.findByType('Text');
  assert.equal(text.props.children, 'JD');
});
