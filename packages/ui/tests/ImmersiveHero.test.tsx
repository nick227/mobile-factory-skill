import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { ImmersiveHero } from '../src/patterns/ImmersiveHero';

export const componentUnderTest = 'ImmersiveHero';

test('ImmersiveHero renders title, subtitle, badge, and media with accessibility header role', () => {
  let root;
  let backClicked = false;
  let primaryClicked = false;

  act(() => {
    root = renderer.create(
      <ImmersiveHero
        title="Kyoto Guide"
        subtitle="Exploring the ancient capital"
        tag="Featured"
        metadata="By Pat Kay • 10 min"
        image="https://example.com/kyoto.jpg"
        onBack={() => { backClicked = true; }}
        backLabel="All Guides"
        primaryAction={{
          label: 'Start Reading',
          onPress: () => { primaryClicked = true; }
        }}
      />
    );
  });

  // Header accessibility
  const header = root.root.findByProps({ accessibilityRole: 'header' });
  assert.equal(header.props.accessibilityLabel, 'Kyoto Guide');

  // Back button
  const backBtn = root.root.findByProps({ accessibilityLabel: 'All Guides' });
  act(() => {
    backBtn.props.onPress();
  });
  assert.equal(backClicked, true);

  // Primary action button
  const startBtn = root.root.findByProps({ accessibilityLabel: 'Start Reading' });
  act(() => {
    startBtn.props.onPress();
  });
  assert.equal(primaryClicked, true);

  // Image
  const img = root.root.findByType('Image');
  assert.equal(img.props.accessibilityLabel, 'Kyoto Guide');
  assert.equal(img.props.source, 'https://example.com/kyoto.jpg');
});

test('ImmersiveHero renders fallback background when no image is provided', () => {
  let root;
  act(() => {
    root = renderer.create(
      <ImmersiveHero
        title="Audiobook Title"
        subtitle="Narrated by the author"
      />
    );
  });
  const images = root.root.findAllByType('Image');
  assert.equal(images.length, 0);

  const header = root.root.findByProps({ accessibilityRole: 'header' });
  assert.equal(header.props.accessibilityLabel, 'Audiobook Title');
});
