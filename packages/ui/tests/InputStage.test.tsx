import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { View } from 'react-native';
import { InputStage } from '../src/composites/InputStage';

export const componentUnderTest = 'InputStage';

test('InputStage renders title, description, and form stage container', () => {
  let root;
  act(() => {
    root = renderer.create(
      <InputStage title="What is your email?" description="We use this to send confirmation.">
        <View testID="input-element" />
      </InputStage>
    );
  });
  const texts = root.root.findAllByType('Text');
  assert.equal(texts[0].props.children, 'What is your email?');
  assert.equal(texts[1].props.children, 'We use this to send confirmation.');
});
