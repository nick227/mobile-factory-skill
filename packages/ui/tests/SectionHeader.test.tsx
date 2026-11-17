import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { SectionHeader } from '../src/composites/SectionHeader';

export const componentUnderTest = 'SectionHeader';

test('SectionHeader renders title and optional description', () => {
  let root;
  act(() => {
    root = renderer.create(
      <SectionHeader title="Recent Activity" description="Last 30 days" />
    );
  });
  const texts = root.root.findAllByType('Text');
  assert.equal(texts[0].props.children, 'Recent Activity');
  assert.equal(texts[1].props.children, 'Last 30 days');
});
