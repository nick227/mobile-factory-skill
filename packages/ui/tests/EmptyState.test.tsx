import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { Button } from '../src/controls/Button';
import { EmptyState } from '../src/composites/EmptyState';

export const componentUnderTest = 'EmptyState';

test('EmptyState renders title, description, and action button', () => {
  let root;
  act(() => {
    root = renderer.create(
      <EmptyState
        title="No Saved Events"
        description="Browse available events to add favorites"
        action={<Button label="Explore Events" onPress={() => {}} />}
      />
    );
  });
  const texts = root.root.findAllByType('Text');
  assert.ok(texts.some((t) => t.props.children === 'No Saved Events'));
  assert.ok(texts.some((t) => t.props.children === 'Browse available events to add favorites'));
  assert.ok(root.root.findByType('Pressable'));
});
