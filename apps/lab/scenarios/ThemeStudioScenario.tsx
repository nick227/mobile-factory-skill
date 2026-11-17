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
  SlideToConfirm,
  MediaFrame,
  ThemeProvider,
  useTheme,
  presets,
  palettes,
  type PresetThemeName,
  type PaletteName,
  type RadiusScaleName,
  type DensityScaleName,
  type TypographyScaleName,
  type SurfaceStyleName,
  type LayoutAxisName,
  type MediaTreatmentName,
  type ColorMode,
} from '@factory/ui';

function StudioWidgetsPreview() {
  const {
    mode,
    palette,
    radius,
    density,
    typography,
    surface,
    layout,
    media,
    preset,
    colors,
    tokens,
  } = useTheme();

  const [pin, setPin] = useState('4829');
  const [rating, setRating] = useState(4.5);
  const [stepperVal, setStepperVal] = useState(2);
  const [searchVal, setSearchVal] = useState('');
  const [confirmed, setConfirmed] = useState(false);

  return (
    <Stack gap="md">
      {/* Active Theme Summary Card */}
      <Surface>
        <Stack gap="sm">
          <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ fontWeight: '700' }}>Active System Matrix</Text>
            <Badge
              label={preset ? presets[preset].name : 'Custom Matrix'}
              tone="accent"
            />
          </Row>
          <Text variant="small" muted>
            Palette: {palette} · Radius: {radius} · Density: {density} · Typography: {typography} · Surface: {surface} · Layout: {layout} · Media: {media}
          </Text>
          <Row style={{ gap: tokens.spacing.xs, flexWrap: 'wrap' }}>
            <Badge label={`Primary: ${colors.primary}`} />
            <Badge label={`Surface: ${colors.surface}`} />
            <Badge label={`Radius: ${tokens.radius.md}pt`} />
            <Badge label={`Spacing: ${tokens.spacing.md}pt`} />
            <Badge label={`Title: ${tokens.typography.title}pt`} />
          </Row>
        </Stack>
      </Surface>

      {/* Live Component Demonstrations */}
      <NoticeBanner
        tone="info"
        title="Theme-Reactive Catalog Components"
        description="Every control, surface, and composite dynamically reads tokens from useTheme() to ensure continuous compliance across all 7 axes."
      />

      <Surface>
        <Stack gap="md">
          <Text variant="heading">Interactive Controls</Text>
          <SearchBar
            placeholder="Search catalog items…"
            value={searchVal}
            onChangeText={setSearchVal}
          />

          <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
            <Stack gap="xs">
              <Text style={{ fontWeight: '600' }}>Party Size</Text>
              <Text variant="small" muted>Responsive stepper</Text>
            </Stack>
            <Stepper
              label="Guests"
              value={stepperVal}
              min={1}
              max={12}
              onValueChange={setStepperVal}
            />
          </Row>

          <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
            <Stack gap="xs">
              <Text style={{ fontWeight: '600' }}>Experience Score</Text>
              <Text variant="small" muted>Interactive rating</Text>
            </Stack>
            <RatingBar
              label="Rating"
              value={rating}
              onValueChange={setRating}
              showValue
            />
          </Row>

          <PinInput
            label="Confirmation Passcode"
            value={pin}
            onChange={setPin}
            length={4}
          />

          <Stack gap="xs">
            <Text style={{ fontWeight: '600' }}>Swipe Authorization</Text>
            <SlideToConfirm
              label="Slide to authorize booking"
              completedLabel="Booking authorized"
              confirmed={confirmed}
              onConfirm={() => setConfirmed(true)}
              onReset={() => setConfirmed(false)}
            />
          </Stack>

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

function StudioRealisticScreenPreview() {
  const { colors, tokens, layout, media } = useTheme();
  const [guests, setGuests] = useState(2);
  const [confirmed, setConfirmed] = useState(false);

  const containerPadding =
    layout === 'editorial'
      ? tokens.spacing.xl
      : layout === 'immersive'
      ? 0
      : tokens.spacing.md;

  return (
    <View style={{ backgroundColor: colors.background, padding: containerPadding, borderRadius: tokens.radius.lg }}>
      <Stack gap="md">
        {/* Visual Media Header */}
        <MediaFrame
          source="https://images.unsplash.com/photo-1578632767115-351597cf2477?w=800"
          ratio={media === 'edge-to-edge' ? 16 / 9 : 4 / 3}
          label="Kyoto Master Craftsman Workshop"
        />

        <Stack gap="xs" style={{ paddingHorizontal: layout === 'immersive' ? tokens.spacing.md : 0 }}>
          <Row style={{ gap: tokens.spacing.xs, alignItems: 'center' }}>
            <Badge label="Artisan Masterclass" tone="accent" />
            <Badge label="Gion District" />
            <Text variant="caption" muted>
              2.5 Hours · Kyoto
            </Text>
          </Row>

          <Text variant="display" style={{ fontWeight: '700' }}>
            Private Raku Pottery & Tea Ceremony
          </Text>

          <Text muted style={{ lineHeight: 22 }}>
            Join 15th-generation artisan Kazuhiro in his preserved Gion studio. Experience hands-on hand-building, clay shaping, and traditional wood-fire glazing followed by matcha.
          </Text>
        </Stack>

        {/* Configuration / Booking Panel */}
        <Surface style={{ marginHorizontal: layout === 'immersive' ? tokens.spacing.md : 0 }}>
          <Stack gap="md">
            <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
              <Stack gap="xs">
                <Text style={{ fontWeight: '700' }}>Guest Reservation</Text>
                <Text variant="small" muted>
                  Includes all materials & matcha
                </Text>
              </Stack>
              <Stepper
                label="Guests"
                value={guests}
                min={1}
                max={6}
                onValueChange={setGuests}
              />
            </Row>

            <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ fontWeight: '600' }}>Total Investment</Text>
              <Text variant="heading" style={{ color: colors.primary, fontWeight: '700' }}>
                ¥{guests * 18000}
              </Text>
            </Row>

            <SlideToConfirm
              label="Slide to reserve date"
              completedLabel="Reservation Secured"
              confirmed={confirmed}
              onConfirm={() => setConfirmed(true)}
              onReset={() => setConfirmed(false)}
            />
          </Stack>
        </Surface>
      </Stack>
    </View>
  );
}

function StudioJsonPreview({
  preset,
  palette,
  radius,
  density,
  typography,
  surface,
  layout,
  media,
  mode,
}: {
  preset: PresetThemeName;
  palette: PaletteName;
  radius: RadiusScaleName;
  density: DensityScaleName;
  typography: TypographyScaleName;
  surface: SurfaceStyleName;
  layout: LayoutAxisName;
  media: MediaTreatmentName;
  mode: ColorMode;
}) {
  const config = {
    $schema: './standards/design/factory-design.schema.json',
    preset,
    mode,
    overrides: {
      palette,
      radius,
      density,
      typography,
      surface,
      layout,
      media,
    },
  };

  return (
    <Surface>
      <Stack gap="md">
        <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
          <Text variant="heading">Factory Design Artifact</Text>
          <Badge label="factory-design.json" tone="accent" />
        </Row>
        <Text variant="small" muted>
          This is the deterministic artifact Claude generates when asked to configure an application. The factory reads this single JSON file to style all screens without writing custom JSX styles.
        </Text>
        <View
          style={{
            backgroundColor: '#1E1E2E',
            padding: 16,
            borderRadius: 8,
          }}
        >
          <Text
            style={{
              fontFamily: 'Courier',
              fontSize: 13,
              color: '#A6E3A1',
              lineHeight: 20,
            }}
          >
            {JSON.stringify(config, null, 2)}
          </Text>
        </View>
      </Stack>
    </Surface>
  );
}

export function ThemeStudioScenario() {
  const [selectedPreset, setSelectedPreset] = useState<PresetThemeName>('kyoto-craft');
  const [activeTab, setActiveTab] = useState<'widgets' | 'screen' | 'json'>('widgets');

  const [mode, setMode] = useState<ColorMode>('light');
  const [palette, setPalette] = useState<PaletteName>('kyoto');
  const [radius, setRadius] = useState<RadiusScaleName>('sharp');
  const [density, setDensity] = useState<DensityScaleName>('spacious');
  const [typography, setTypography] = useState<TypographyScaleName>('editorial');
  const [surface, setSurface] = useState<SurfaceStyleName>('outlined');
  const [layout, setLayout] = useState<LayoutAxisName>('editorial');
  const [media, setMedia] = useState<MediaTreatmentName>('edge-to-edge');

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
    setSurface(def.surface);
    setLayout(def.layout);
    setMedia(def.media);
  };

  return (
    <ScrollView contentContainerStyle={{ paddingBottom: 60 }} showsVerticalScrollIndicator={false}>
      <Stack gap="lg">
        <ScreenHeader
          title="Multi-Axis Design Studio"
          subtitle="Composable 7-axis design system with deterministic factory artifacts"
        />

        {/* Studio View Tabs */}
        <SegmentedControl
          label="View Mode"
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as any)}
          options={[
            { label: 'Interactive Widgets', value: 'widgets' },
            { label: 'Full App Screen', value: 'screen' },
            { label: 'Factory JSON Artifact', value: 'json' },
          ]}
        />

        {/* 1. Prefabbed Presets */}
        <Surface>
          <Stack gap="md">
            <Text variant="heading">Prefabbed Presets (Archetypes)</Text>
            <Text variant="small" muted>
              One-click baseline configurations across all 7 design axes.
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
        <Surface>
          <Stack gap="md">
            <Text variant="heading">The 7 Independent Design Axes</Text>

            {/* Mode Axis */}
            <Stack gap="xs">
              <Text variant="small" style={{ fontWeight: '700' }}>Color Appearance Mode</Text>
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
              <Text variant="small" style={{ fontWeight: '700' }}>1. Palette Axis</Text>
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
              <Text variant="small" style={{ fontWeight: '700' }}>2. Geometry / Radius Axis</Text>
              <SegmentedControl
                label="Radius"
                value={radius}
                onValueChange={(r) => setRadius(r as RadiusScaleName)}
                options={[
                  { label: 'Sharp (2-4pt)', value: 'sharp' },
                  { label: 'Smooth (8-12pt)', value: 'smooth' },
                  { label: 'Curved (16-24pt)', value: 'curved' },
                ]}
              />
            </Stack>

            {/* Density Axis */}
            <Stack gap="xs">
              <Text variant="small" style={{ fontWeight: '700' }}>3. Spacing / Density Axis</Text>
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
              <Text variant="small" style={{ fontWeight: '700' }}>4. Typography Scale Axis</Text>
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

            {/* Surface Axis */}
            <Stack gap="xs">
              <Text variant="small" style={{ fontWeight: '700' }}>5. Surface Treatment Axis</Text>
              <SegmentedControl
                label="Surface"
                value={surface}
                onValueChange={(s) => setSurface(s as SurfaceStyleName)}
                options={[
                  { label: 'Flat', value: 'flat' },
                  { label: 'Outlined', value: 'outlined' },
                  { label: 'Elevated', value: 'elevated' },
                ]}
              />
            </Stack>

            {/* Layout Axis */}
            <Stack gap="xs">
              <Text variant="small" style={{ fontWeight: '700' }}>6. Page Layout Axis</Text>
              <SegmentedControl
                label="Layout"
                value={layout}
                onValueChange={(l) => setLayout(l as LayoutAxisName)}
                options={[
                  { label: 'Standard', value: 'standard' },
                  { label: 'Editorial', value: 'editorial' },
                  { label: 'Immersive', value: 'immersive' },
                ]}
              />
            </Stack>

            {/* Media Treatment Axis */}
            <Stack gap="xs">
              <Text variant="small" style={{ fontWeight: '700' }}>7. Media Frame Treatment Axis</Text>
              <SegmentedControl
                label="Media"
                value={media}
                onValueChange={(m) => setMedia(m as MediaTreatmentName)}
                options={[
                  { label: 'Contained', value: 'contained' },
                  { label: 'Edge-to-Edge', value: 'edge-to-edge' },
                  { label: 'Mosaic', value: 'mosaic' },
                ]}
              />
            </Stack>
          </Stack>
        </Surface>

        {/* 3. Dynamic Live Preview Canvas */}
        <ThemeProvider
          mode={mode}
          palette={palette}
          radius={radius}
          density={density}
          typography={typography}
          surface={surface}
          layout={layout}
          media={media}
          preset={selectedPreset}
        >
          {activeTab === 'widgets' ? (
            <StudioWidgetsPreview />
          ) : activeTab === 'screen' ? (
            <StudioRealisticScreenPreview />
          ) : (
            <StudioJsonPreview
              preset={selectedPreset}
              palette={palette}
              radius={radius}
              density={density}
              typography={typography}
              surface={surface}
              layout={layout}
              media={media}
              mode={mode}
            />
          )}
        </ThemeProvider>
      </Stack>
    </ScrollView>
  );
}
