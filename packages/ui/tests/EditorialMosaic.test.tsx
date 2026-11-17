import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { View } from 'react-native';
import { EditorialMosaic } from '../src/patterns/EditorialMosaic';

export const componentUnderTest = 'EditorialMosaic';

test('EditorialMosaic renders items distributed in columns with accessibility and callbacks', () => {
  let root;
  let clickedItem = null;
  const items = [
    { id: '1', title: 'Fushimi Inari', subtitle: 'Kyoto', badge: 'Must See', aspectRatio: 3 / 4 },
    { id: '2', title: 'Bamboo Forest', subtitle: 'Sagano', aspectRatio: 1 },
    { id: '3', title: 'Golden Pavilion', aspectRatio: 4 / 3 }
  ];

  act(() => {
    root = renderer.create(
      <EditorialMosaic
        items={items}
        columns={2}
        density="comfortable"
        onItemPress={(item) => { clickedItem = item; }}
      />
    );
  });

  const pressables = root.root.findAll((n) => n.type === 'Pressable');
  assert.equal(pressables.length, 3);
  assert.equal(pressables[0].props.accessibilityRole, 'button');
  assert.equal(pressables[0].props.accessibilityLabel, 'Fushimi Inari, Kyoto');

  // Trigger press
  act(() => {
    pressables[0].props.onPress();
  });
  assert.equal(clickedItem?.id, '1');
  assert.equal(clickedItem?.title, 'Fushimi Inari');
});

test('EditorialMosaic handles empty state gracefully', () => {
  let root;
  act(() => {
    root = renderer.create(
      <EditorialMosaic
        items={[]}
        emptyState={<View testID="empty-mosaic" />}
      />
    );
  });
  const empty = root.root.findByProps({ testID: 'empty-mosaic' });
  assert.ok(empty);
});
