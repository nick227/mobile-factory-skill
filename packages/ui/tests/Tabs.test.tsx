import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { Tabs } from '../src/controls/Tabs';

export const componentUnderTest = 'Tabs';

test('Tabs renders tablist with selection state and switches tabs', () => {
  let root;
  let activeTab = 'overview';
  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'schedule', label: 'Schedule', badge: '3' },
  ];

  act(() => {
    root = renderer.create(
      <Tabs
        tabs={tabs}
        value={activeTab}
        onValueChange={(val) => { activeTab = val; }}
      />
    );
  });

  const tabList = root.root.findByProps({ accessibilityRole: 'tablist' });
  assert.ok(tabList);

  const tabButtons = root.root.findAll((n) => n.type === 'Pressable' && n.props.accessibilityRole === 'tab');
  assert.equal(tabButtons.length, 2);
  assert.equal(tabButtons[0].props.accessibilityState.selected, true);
  assert.equal(tabButtons[1].props.accessibilityState.selected, false);

  act(() => {
    tabButtons[1].props.onPress();
  });
  assert.equal(activeTab, 'schedule');
});
