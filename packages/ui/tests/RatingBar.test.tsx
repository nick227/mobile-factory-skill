import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { RatingBar } from '../src/controls/RatingBar';

export const componentUnderTest = 'RatingBar';

test('RatingBar selects rating, displays value, and supports accessibility actions', () => {
  let rating = 3;

  let root;
  act(() => {
    root = renderer.create(
      <RatingBar
        label="Service quality"
        value={rating}
        max={5}
        onValueChange={(v) => { rating = v; }}
        showValue
      />
    );
  });

  const adjustable = root.root.findByProps({ accessibilityRole: 'adjustable' });
  assert.equal(adjustable.props.accessibilityLabel, 'Service quality');
  assert.equal(adjustable.props.accessibilityValue.now, 3);

  // Press 5th star
  const fifthStar = root.root.findByProps({ accessibilityLabel: '5 of 5 stars' });
  act(() => {
    fifthStar.props.onPress();
  });
  assert.equal(rating, 5);

  // Re-render with new value to test controlled decrement
  act(() => {
    root.update(
      <RatingBar
        label="Service quality"
        value={5}
        max={5}
        onValueChange={(v) => { rating = v; }}
        showValue
      />
    );
  });

  // Accessibility decrement: 5 - 1 = 4
  act(() => {
    adjustable.props.onAccessibilityAction({ nativeEvent: { actionName: 'decrement' } });
  });
  assert.equal(rating, 4);
});
