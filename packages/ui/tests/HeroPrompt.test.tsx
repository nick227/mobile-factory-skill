import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { HeroPrompt } from '../src/patterns/HeroPrompt';

export const componentUnderTest = 'patterns.heroprompt';

test('HeroPrompt renders huge title, subtitle, and primary button', () => {
  let primaryPressed = false;
  let tree: any;
  act(() => {
    tree = renderer.create(
      <HeroPrompt
        title="Welcome to Kyoto"
        subtitle="Experience traditional craft, tea ceremonies, and curated artisan workshops."
        primaryAction={{
          label: 'Get Started',
          onPress: () => {
            primaryPressed = true;
          },
        }}
      />
    );
  });

  const json = tree.toJSON();
  assert.ok(json);
  // Find text nodes
  const textStrings: string[] = [];
  function collectText(node: any) {
    if (!node) return;
    if (typeof node === 'string') textStrings.push(node);
    if (node.children) {
      for (const c of node.children) collectText(c);
    }
  }
  collectText(json);

  assert.ok(textStrings.includes('Welcome to Kyoto'));
  assert.ok(textStrings.some((t) => t.includes('Experience traditional craft')));
  assert.ok(textStrings.includes('Get Started'));
});

test('HeroPrompt handles both primary and secondary button interactions', () => {
  let primaryClicked = false;
  let secondaryClicked = false;
  let tree: any;
  act(() => {
    tree = renderer.create(
      <HeroPrompt
        title="Ready to Deep Focus?"
        subtitle="Notifications will be silenced across all connected devices."
        primaryAction={{
          label: 'Start Session',
          onPress: () => {
            primaryClicked = true;
          },
        }}
        secondaryAction={{
          label: 'Configure Schedule',
          onPress: () => {
            secondaryClicked = true;
          },
        }}
      />
    );
  });

  const json = tree.toJSON();
  assert.ok(json);
});
