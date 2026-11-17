import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { MetricSpotlight } from '../src/patterns/MetricSpotlight';

export const componentUnderTest = 'MetricSpotlight';

test('MetricSpotlight renders value, unit, delta and sparkline', () => {
  let root: any;

  act(() => {
    root = renderer.create(
      <MetricSpotlight
        label="Monthly Active Users"
        value="48,250"
        unit="users"
        delta={{ value: '+14.2%', direction: 'up', period: 'vs last month', tone: 'positive' }}
        sparklineData={[10, 20, 15, 30, 45, 40, 60]}
        description="Active accounts in current billing period"
      />
    );
  });

  const summary = root.root.findByProps({ accessibilityRole: 'summary' });
  assert.ok(summary);
  assert.ok(summary.props.accessibilityLabel.includes('Monthly Active Users: 48,250 users'));
  assert.ok(summary.props.accessibilityLabel.includes('up +14.2%'));

  // Test skeleton loading state
  let loadingRoot: any;
  act(() => {
    loadingRoot = renderer.create(
      <MetricSpotlight
        loading
        label="Monthly Active Users"
        value="48,250"
      />
    );
  });

  const skeletons = loadingRoot.root.findAll((n: any) => n.props.accessibilityLabel === 'Loading content');
  assert.ok(skeletons.length >= 2, 'Should render skeleton loaders when loading is true');
});
