import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { SearchBar } from '../src/controls/SearchBar';

export const componentUnderTest = 'SearchBar';

test('SearchBar renders input, updates text, and handles clear', () => {
  let root;
  let text = 'initial query';
  let cleared = false;
  let submitted = '';

  act(() => {
    root = renderer.create(
      <SearchBar
        value={text}
        onChangeText={(v) => { text = v; }}
        onClear={() => { cleared = true; }}
        onSearch={(v) => { submitted = v; }}
        placeholder="Search items"
      />
    );
  });

  const input = root.root.findByProps({ accessibilityRole: 'search' });
  assert.equal(input.props.value, 'initial query');
  assert.equal(input.props.placeholder, 'Search items');

  // Test submit editing with current text
  act(() => {
    input.props.onSubmitEditing();
  });
  assert.equal(submitted, 'initial query');

  // Find clear button and trigger it
  const clearBtn = root.root.findByProps({ accessibilityLabel: 'Clear Search' });
  act(() => {
    clearBtn.props.onPress();
  });

  assert.equal(cleared, true);
  assert.equal(text, '');
});

test('SearchBar renders cancel button and loading spinner', () => {
  let cancelled = false;

  let root;
  act(() => {
    root = renderer.create(
      <SearchBar
        value="query"
        onChangeText={() => {}}
        loading={true}
        showCancelButton={true}
        onCancel={() => { cancelled = true; }}
      />
    );
  });

  const cancelBtn = root.root.findByProps({ accessibilityLabel: 'Cancel' });
  act(() => {
    cancelBtn.props.onPress();
  });
  assert.equal(cancelled, true);

  // Clear button is not rendered when loading is true
  const clearBtns = root.root.findAll((n) => n.props.accessibilityLabel === 'Clear Search');
  assert.equal(clearBtns.length, 0);
});
