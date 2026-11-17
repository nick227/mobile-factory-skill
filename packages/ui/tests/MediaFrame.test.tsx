import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { MediaFrame } from '../src/composites/MediaFrame';

export const componentUnderTest = 'MediaFrame';

test('MediaFrame renders image with stable aspect ratio container and label', () => {
  let root;
  act(() => {
    root = renderer.create(
      <MediaFrame
        source="https://example.com/photo.jpg"
        ratio={16 / 9}
        label="Event photo"
      />
    );
  });
  const image = root.root.findByType('Image');
  assert.equal(image.props.accessibilityLabel, 'Event photo');
  assert.equal(image.props.contentFit, 'cover');
});
