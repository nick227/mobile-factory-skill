import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { DiscoveryFilters } from '../src/patterns/DiscoveryFilters';

export const componentUnderTest = 'DiscoveryFilters';

test('DiscoveryFilters toggles filter items and triggers clear', () => {
  let root: any;
  let selected = ['kyoto'];
  let cleared = false;

  const options = [
    { id: 'kyoto', label: 'Kyoto', count: 42 },
    { id: 'temples', label: 'Temples', count: 18 },
  ];

  act(() => {
    root = renderer.create(
      <DiscoveryFilters
        options={options}
        selectedIds={selected}
        onToggle={(id) => {
          selected = selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id];
        }}
        onClear={() => {
          cleared = true;
          selected = [];
        }}
      />
    );
  });

  const buttons = root.root.findAll((n: any) => n.type === 'TouchableOpacity' && n.props.accessibilityRole === 'button');
  assert.equal(buttons.length, 3); // 1 clear button + 2 filter options

  // Verify first option selected state
  assert.equal(buttons[1].props.accessibilityState.selected, true);
  assert.equal(buttons[2].props.accessibilityState.selected, false);

  // Toggle second option
  act(() => {
    buttons[2].props.onPress();
  });
  assert.deepEqual(selected, ['kyoto', 'temples']);

  // Clear button
  act(() => {
    buttons[0].props.onPress();
  });
  assert.equal(cleared, true);
});
