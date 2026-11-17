import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { ProductShowcase } from '../src/patterns/ProductShowcase';

export const componentUnderTest = 'ProductShowcase';

test('ProductShowcase renders product information and handles add-to-cart', () => {
  let root: any;
  let added = false;
  let cardPressed = false;

  act(() => {
    root = renderer.create(
      <ProductShowcase
        id="p1"
        title="Handcrafted Ceramic Pitcher"
        brand="Kyoto Kilns"
        price="$85.00"
        originalPrice="$110.00"
        rating={4.8}
        reviewCount={32}
        stockStatus="in_stock"
        onAddToCart={() => {
          added = true;
        }}
        onPress={() => {
          cardPressed = true;
        }}
      />
    );
  });

  const summary = root.root.findByProps({ accessibilityRole: 'summary' });
  assert.ok(summary);
  assert.ok(summary.props.accessibilityLabel.includes('Handcrafted Ceramic Pitcher'));
  assert.ok(summary.props.accessibilityLabel.includes('$85.00'));

  // Press Add to Bag button
  const addBtn = root.root.findByProps({ label: 'Add to Bag' });
  assert.ok(addBtn);
  act(() => {
    addBtn.props.onPress();
  });
  assert.equal(added, true);

  // Press card
  const cardBtn = root.root.findByProps({ accessibilityRole: 'button', accessibilityLabel: 'Handcrafted Ceramic Pitcher' });
  assert.ok(cardBtn);
  act(() => {
    cardBtn.props.onPress();
  });
  assert.equal(cardPressed, true);
});
