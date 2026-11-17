import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { ChoiceGallery } from '../src/patterns/ChoiceGallery';

export const componentUnderTest = 'ChoiceGallery';

test('ChoiceGallery handles single selection and accessible radio roles', () => {
  let root;
  let lastSelected = null;
  const options = [
    { id: 'opt1', title: 'Option 1', description: 'First choice' },
    { id: 'opt2', title: 'Option 2', description: 'Second choice' },
    { id: 'opt3', title: 'Option 3', disabled: true }
  ];

  act(() => {
    root = renderer.create(
      <ChoiceGallery
        label="Select one"
        options={options}
        selected="opt1"
        mode="single"
        onSelect={(id) => { lastSelected = id; }}
      />
    );
  });

  const pressables = root.root.findAll((n) => n.type === 'Pressable');
  assert.equal(pressables.length, 3);

  const opt1 = root.root.findByProps({ accessibilityLabel: 'Option 1, First choice, selected' });
  const opt2 = root.root.findByProps({ accessibilityLabel: 'Option 2, Second choice' });
  const opt3 = root.root.findByProps({ accessibilityLabel: 'Option 3' });

  // Radio roles and initial checked states
  assert.equal(opt1.props.accessibilityRole, 'radio');
  assert.equal(opt1.props.accessibilityState.checked, true);
  assert.equal(opt2.props.accessibilityState.checked, false);
  assert.equal(opt3.props.accessibilityState.disabled, true);

  // Press second option
  act(() => {
    opt2.props.onPress();
  });
  assert.equal(lastSelected, 'opt2');

  // Disabled option does not fire onSelect
  lastSelected = null;
  act(() => {
    opt3.props.onPress();
  });
  assert.equal(lastSelected, null);
});

test('ChoiceGallery handles multiple selection and checkbox roles', () => {
  let root;
  let updatedList = [];
  const options = [
    { id: 'tag1', title: 'React Native' },
    { id: 'tag2', title: 'TypeScript' }
  ];

  act(() => {
    root = renderer.create(
      <ChoiceGallery
        label="Tags"
        options={options}
        selected={['tag1']}
        mode="multiple"
        onSelect={(_, updated) => { updatedList = updated; }}
      />
    );
  });

  const pressables = root.root.findAll((n) => n.type === 'Pressable');
  assert.equal(pressables[0].props.accessibilityRole, 'checkbox');
  assert.equal(pressables[0].props.accessibilityState.checked, true);
  assert.equal(pressables[1].props.accessibilityState.checked, false);

  // Toggle tag2 on
  act(() => {
    pressables[1].props.onPress();
  });
  assert.deepEqual(updatedList, ['tag1', 'tag2']);
});
