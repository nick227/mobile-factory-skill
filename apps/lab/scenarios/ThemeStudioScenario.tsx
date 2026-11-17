import React, { useState } from 'react';
import { View, ScrollView } from 'react-native';
import {
  Text,
  Stack,
  Row,
  Surface,
  Button,
  Badge,
  SegmentedControl,
  ScreenHeader,
  NoticeBanner,
  Stepper,
  RatingBar,
  PinInput,
  SearchBar,
  ThemeProvider,
  useTheme,
  presets,
  palettes,
  type PresetThemeName,
  type PaletteName,
  type RadiusScaleName,
  type DensityScaleName,
  type TypographyScaleName,
  type ColorMode,
} from '@factory/ui';

function StudioCanvas() {
  const {
    mode,
    palette,
    radius,
    density,
    typography,
    preset,
    colors,
    tokens,
  } = useTheme();

  const [pin, setPin] = useState('4829');
  const [rating, setRating] = useState(4);
  const [stepperVal, setStepperVal] = useState(2);
  const [searchVal, setSearchVal] = useState('');

  return (
    <Stack gap="md">
      {/* Active Theme Summary Card */}
      <Surface outlined>
        <Stack gap="sm">
          <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ fontWeight: '700' }}>Active Configuration</Text>
            <Badge
              label={preset ? presets[preset].name : 'Custom Matrix'}
              tone="accent"
            />
          </Row>
          <Text variant="small" muted>
            Palette: {palette} · Radius: {radius} · Density: {density} · Typography: {typography} · Mode: {mode}
          </Text>
          <Row style={{ gap: tokens.spacing.xs, flexWrap: 'wrap' }}>
            <Badge label={`Primary: ${colors.primary}`} />
            <Badge label={`Surface: ${colors.surface}`} />
            <Badge label={`Radius: ${tokens.radius.md}px`} />
            <Badge label={`Spacing: ${tokens.spacing.md}px`} />
          </Row>
        </Stack>
      </Surface>

      {/* Live Component Demonstrations */}
      <NoticeBanner
        tone="info"
        title="Dynamic Multi-Axis Reactivity"
        description="All components below immediately update their geometry, color palette, spacing, and font scale based on the active axis settings."
      />

      <Surface outlined>
        <Stack gap="md">
          <Text variant="heading">Interactive Controls</Text>
          <SearchBar
            placeholder="Search items…"
            value={searchVal}
            onChangeText={setSearchVal}
          />

          <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
            <Stack gap="xs">
              <Text style={{ fontWeight: '600' }}>Quantity</Text>
              <Text variant="small" muted>Bounded counter</Text>
            </Stack>
            <Stepper
              label="Quantity"
              value={stepperVal}
              min={1}
              max={10}
              onValueChange={setStepperVal}
            />
          </Row>

          <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
            <Stack gap="xs">
              <Text style={{ fontWeight: '600' }}>Experience Rating</Text>
              <Text variant="small" muted>Interactive score</Text>
            </Stack>
            <RatingBar
              label="Score"
              value={rating}
              onValueChange={setRating}
              showValue
            />
          </Row>

          <PinInput
            label="Security PIN"
            value={pin}
            onChange={setPin}
            length={4}
          />

          <Row style={{ gap: tokens.spacing.sm }}>
            <Button label="Primary" onPress={() => {}} />
            <Button label="Secondary" variant="secondary" onPress={() => {}} />
            <Button label="Outline" variant="outline" onPress={() => {}} />
          </Row>
        </Stack>
      </Surface>
    </Stack>
  );
}

export function ThemeStudioScenario() {
  const [selectedPreset, setSelectedPreset] = useState<PresetThemeName>('kyoto-craft');
  const [mode, setMode] = useState<ColorMode>('light');
  const [palette, setPalette] = useState<PaletteName>('kyoto');
  const [radius, setRadius] = useState<RadiusScaleName>('smooth');
  const [density, setDensity] = useState<DensityScaleName>('comfortable');
  const [typography, setTypography] = useState<TypographyScaleName>('editorial');

  const presetList: PresetThemeName[] = [
    'minimal-pro',
    'kyoto-craft',
    'fintech-midnight',
    'wellness-botanical',
    'editorial-luxury',
    'playful-consumer',
  ];

  const handleSelectPreset = (p: PresetThemeName) => {
    setSelectedPreset(p);
    const def = presets[p];
    setPalette(def.palette);
    setRadius(def.radius);
    setDensity(def.density);
    setTypography(def.typography);
  };

  return (
    <ScrollView contentContainerStyle={{ paddingBottom: 60 }} showsVerticalScrollIndicator={false}>
      <Stack gap="lg">
        <ScreenHeader
          title="Multi-Axis Design Studio"
          subtitle="Prefabricated themes and independent axis controls for AI agents"
        />

        {/* 1. Prefabbed Presets */}
        <Surface outlined>
          <Stack gap="md">
            <Text variant="heading">Prefabbed Presets (AI Recipes)</Text>
            <Text variant="small" muted>
              One-click archetypes that configure all design axes simultaneously.
            </Text>
            <Row style={{ gap: 8, flexWrap: 'wrap' }}>
              {presetList.map((p) => {
                const isSelected = selectedPreset === p;
                return (
                  <Button
                    key={p}
                    label={presets[p].name}
                    variant={isSelected ? 'primary' : 'outline'}
                    size="sm"
                    onPress={() => handleSelectPreset(p)}
                  />
                );
              })}
            </Row>
            <Text variant="small" style={{ fontStyle: 'italic' }}>
              {presets[selectedPreset].description}
            </Text>
          </Stack>
        </Surface>

        {/* 2. Independent Axis Controls */}
        <Surface outlined>
          <Stack gap="md">
            <Text variant="heading">Independent Design Axes</Text>

            {/* Mode Axis */}
            <Stack gap="xs">
              <Text variant="small" style={{ fontWeight: '700' }}>Color Mode</Text>
              <SegmentedControl
                label="Mode"
                value={mode}
                onValueChange={(m) => setMode(m as ColorMode)}
                options={[
                  { label: 'Light', value: 'light' },
                  { label: 'Dark', value: 'dark' },
                ]}
              />
            </Stack>

            {/* Palette Axis */}
            <Stack gap="xs">
              <Text variant="small" style={{ fontWeight: '700' }}>Color Palette Axis</Text>
              <SegmentedControl
                label="Palette"
                value={palette}
                onValueChange={(p) => setPalette(p as PaletteName)}
                options={[
                  { label: 'Default', value: 'default' },
                  { label: 'Kyoto', value: 'kyoto' },
                  { label: 'Midnight', value: 'midnight' },
                  { label: 'Emerald', value: 'emerald' },
                  { label: 'Crimson', value: 'crimson' },
                  { label: 'Amber', value: 'amber' },
                ]}
              />
            </Stack>

            {/* Radius Axis */}
            <Stack gap="xs">
              <Text variant="small" style={{ fontWeight: '700' }}>Geometry / Radius Axis</Text>
              <SegmentedControl
                label="Radius"
                value={radius}
                onValueChange={(r) => setRadius(r as RadiusScaleName)}
                options={[
                  { label: 'Sharp (2-6px)', value: 'sharp' },
                  { label: 'Smooth (6-18px)', value: 'smooth' },
                  { label: 'Curved (10-26px)', value: 'curved' },
                ]}
              />
            </Stack>

            {/* Density Axis */}
            <Stack gap="xs">
              <Text variant="small" style={{ fontWeight: '700' }}>Spacing / Density Axis</Text>
              <SegmentedControl
                label="Density"
                value={density}
                onValueChange={(d) => setDensity(d as DensityScaleName)}
                options={[
                  { label: 'Compact', value: 'compact' },
                  { label: 'Comfortable', value: 'comfortable' },
                  { label: 'Spacious', value: 'spacious' },
                ]}
              />
            </Stack>

            {/* Typography Axis */}
            <Stack gap="xs">
              <Text variant="small" style={{ fontWeight: '700' }}>Typography Scale Axis</Text>
              <SegmentedControl
                label="Typography"
                value={typography}
                onValueChange={(t) => setTypography(t as TypographyScaleName)}
                options={[
                  { label: 'Compact', value: 'compact' },
                  { label: 'Default', value: 'default' },
                  { label: 'Editorial', value: 'editorial' },
                ]}
              />
            </Stack>
          </Stack>
        </Surface>

        {/* 3. Live Canvas wrapped in Dynamic ThemeProvider */}
        <ThemeProvider
          mode={mode}
          palette={palette}
          radius={radius}
          density={density}
          typography={typography}
          preset={selectedPreset}
        >
          <StudioCanvas />
        </ThemeProvider>
      </Stack>
    </ScrollView>
  );
}
