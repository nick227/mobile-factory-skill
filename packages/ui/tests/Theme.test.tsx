import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { View } from 'react-native';
import renderer, { act } from 'react-test-renderer';
import {
  ThemeProvider,
  useTheme,
  palettes,
  presets,
  radiusScales,
  spacingScales,
  typographyScales,
} from '../src';

export const componentUnderTest = 'Theme';

test('useTheme returns default theme outside ThemeProvider', () => {
  let themeValues: any;
  function TestConsumer() {
    themeValues = useTheme();
    return <View />;
  }

  act(() => {
    renderer.create(<TestConsumer />);
  });

  assert.equal(themeValues.palette, 'default');
  assert.equal(themeValues.radius, 'smooth');
  assert.equal(themeValues.density, 'comfortable');
  assert.equal(themeValues.typography, 'default');
  assert.equal(themeValues.colors.primary, '#1D4ED8');
});

test('ThemeProvider applies prefabbed preset', () => {
  let themeValues: any;
  function TestConsumer() {
    themeValues = useTheme();
    return <View />;
  }

  act(() => {
    renderer.create(
      <ThemeProvider preset="kyoto-craft" mode="light">
        <TestConsumer />
      </ThemeProvider>
    );
  });

  assert.equal(themeValues.preset, 'kyoto-craft');
  assert.equal(themeValues.palette, 'kyoto');
  assert.equal(themeValues.typography, 'editorial');
  assert.equal(themeValues.colors.primary, palettes.kyoto.light.primary);
  assert.equal(themeValues.tokens.typography.title, typographyScales.editorial.title);
});

test('ThemeProvider allows independent multi-axis mix & match', () => {
  let themeValues: any;
  function TestConsumer() {
    themeValues = useTheme();
    return <View />;
  }

  act(() => {
    renderer.create(
      <ThemeProvider
        palette="midnight"
        radius="sharp"
        density="compact"
        typography="compact"
        mode="dark"
      >
        <TestConsumer />
      </ThemeProvider>
    );
  });

  assert.equal(themeValues.mode, 'dark');
  assert.equal(themeValues.palette, 'midnight');
  assert.equal(themeValues.radius, 'sharp');
  assert.equal(themeValues.density, 'compact');
  assert.equal(themeValues.typography, 'compact');

  // Verify colors and tokens match the multi-axis matrix
  assert.equal(themeValues.colors.primary, palettes.midnight.dark.primary);
  assert.equal(themeValues.tokens.radius.md, radiusScales.sharp.md);
  assert.equal(themeValues.tokens.spacing.md, spacingScales.compact.md);
  assert.equal(themeValues.tokens.typography.body, typographyScales.compact.body);
});

test('ThemeProvider updates theme dynamically via setTheme and setPreset', () => {
  let themeValues: any;
  function TestConsumer() {
    themeValues = useTheme();
    return <View />;
  }

  act(() => {
    renderer.create(
      <ThemeProvider preset="minimal-pro" mode="light">
        <TestConsumer />
      </ThemeProvider>
    );
  });

  assert.equal(themeValues.preset, 'minimal-pro');
  assert.equal(themeValues.palette, 'default');

  // Switch preset at runtime
  act(() => {
    themeValues.setPreset('wellness-botanical');
  });

  assert.equal(themeValues.preset, 'wellness-botanical');
  assert.equal(themeValues.palette, 'emerald');
  assert.equal(themeValues.radius, 'curved');
  assert.equal(themeValues.density, 'spacious');

  // Override individual axis
  act(() => {
    themeValues.setTheme({ radius: 'sharp', mode: 'dark' });
  });

  assert.equal(themeValues.radius, 'sharp');
  assert.equal(themeValues.mode, 'dark');
  assert.equal(themeValues.colors.primary, palettes.emerald.dark.primary);
});

test('components react dynamically to theme radius and media axes', () => {
  const { Button } = require('../src/controls/Button');
  const { MediaFrame } = require('../src/composites/MediaFrame');
  const { Screen } = require('../src/primitives/Screen');

  let sharpTree: any;
  act(() => {
    sharpTree = renderer.create(
      <ThemeProvider radius="sharp" media="edge-to-edge" layout="immersive">
        <Screen>
          <Button label="Sharp Action" />
          <MediaFrame source="https://example.com/photo.jpg" />
        </Screen>
      </ThemeProvider>
    );
  });

  const sharpJson = sharpTree.toJSON();
  // Screen immersive padding should be 0
  assert.equal(sharpJson.props.style.find((s: any) => s && s.padding !== undefined)?.padding, 0);

  // Button in sharp theme should have radius of 2 (sharp scale)
  const buttonView = sharpJson.children[0];
  const buttonStyle = Array.isArray(buttonView.props.style)
    ? buttonView.props.style.find((s: any) => s && s.borderRadius !== undefined)
    : buttonView.props.style;
  assert.equal(buttonStyle.borderRadius, radiusScales.sharp.md);

  // MediaFrame with media="edge-to-edge" should have 0 radius and 0 borderWidth
  const mediaContainer = sharpJson.children[1];
  const mediaStyle = Array.isArray(mediaContainer.props.style)
    ? mediaContainer.props.style.find((s: any) => s && s.borderRadius !== undefined)
    : mediaContainer.props.style;
  assert.equal(mediaStyle.borderRadius, 0);
  assert.equal(mediaStyle.borderWidth, 0);
});
