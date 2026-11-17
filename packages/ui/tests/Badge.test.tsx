import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { Badge } from '../src/controls/Badge';

export const componentUnderTest = 'Badge';

test('Badge renders label text with neutral and accent tone', () => {
  let root;
  act(() => {
    root = renderer.create(<Badge label="Beta" tone="accent" />);
  });
  const text = root.root.findByType('Text');
  assert.equal(text.props.children, 'Beta');

  act(() => {
    root = renderer.create(<Badge label="Archived" tone="neutral" />);
  });
  const neutralText = root.root.findByType('Text');
  assert.equal(neutralText.props.children, 'Archived');
});
