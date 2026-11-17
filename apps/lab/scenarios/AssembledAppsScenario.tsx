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
  GlanceHero,
  ControlTile,
  HeroPrompt,
  StepProgress,
  SettingsGroup,
  Toggle,
  MediaFrame,
  ThemeProvider,
  useTheme,
  type PresetThemeName,
  type PaletteName,
  type RadiusScaleName,
  type DensityScaleName,
  type TypographyScaleName,
  type SurfaceStyleName,
  type ColorMode,
} from '@factory/ui';

type AppId = 'fitness' | 'finance' | 'pantry';

export function AssembledAppsScenario() {
  const [selectedApp, setSelectedApp] = useState<AppId>('fitness');
  const [selectedPage, setSelectedPage] = useState<string>('today');

  // Independent multi-axis state overrides
  const [activePreset, setActivePreset] = useState<PresetThemeName>('wellness-botanical');
  const [activePalette, setActivePalette] = useState<PaletteName>('emerald');
  const [activeRadius, setActiveRadius] = useState<RadiusScaleName>('curved');
  const [activeDensity, setActiveDensity] = useState<DensityScaleName>('spacious');
  const [activeTypography, setActiveTypography] = useState<TypographyScaleName>('default');
  const [activeSurface, setActiveSurface] = useState<SurfaceStyleName>('elevated');
  const [activeMode, setActiveMode] = useState<ColorMode>('light');

  // Interactive mock states
  const [wizardStep, setWizardStep] = useState(1);
  const [bioToggle, setBioToggle] = useState(true);
  const [alertsToggle, setAlertsToggle] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const handleSelectApp = (app: AppId) => {
    setSelectedApp(app);
    if (app === 'fitness') {
      setSelectedPage('today');
      setActivePreset('wellness-botanical');
      setActivePalette('emerald');
      setActiveRadius('curved');
      setActiveDensity('spacious');
      setActiveSurface('elevated');
      setActiveMode('light');
    } else if (app === 'finance') {
      setSelectedPage('portfolio');
      setActivePreset('fintech-midnight');
      setActivePalette('midnight');
      setActiveRadius('sharp');
      setActiveDensity('compact');
      setActiveSurface('outlined');
      setActiveMode('dark');
    } else {
      setSelectedPage('pantry');
      setActivePreset('minimal-pro');
      setActivePalette('default');
      setActiveRadius('smooth');
      setActiveDensity('comfortable');
      setActiveSurface('flat');
      setActiveMode('light');
    }
  };

  return (
    <ScrollView contentContainerStyle={{ paddingBottom: 60 }} showsVerticalScrollIndicator={false}>
      <Stack gap="lg">
        <ScreenHeader
          title="Monad Archetypes & Visual UAT"
          subtitle="Visual verification of the 6 factory-owned archetypes across palettes, densities, and scales"
        />

        {/* 1. App Switcher */}
        <Surface style={{ padding: 16 }}>
          <Stack gap="sm">
            <Text style={{ fontWeight: '700' }}>Select Example Application</Text>
            <SegmentedControl
              label="App"
              value={selectedApp}
              options={[
                { label: 'Botanical Vitality', value: 'fitness' },
                { label: 'Apex Wealth', value: 'finance' },
                { label: 'Pantry Pal', value: 'pantry' },
              ]}
              onValueChange={(val) => handleSelectApp(val as AppId)}
            />
          </Stack>
        </Surface>

        {/* 2. Page & Archetype Selector */}
        <Surface style={{ padding: 16 }}>
          <Stack gap="sm">
            <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ fontWeight: '700' }}>Screen & Archetype</Text>
              <Badge
                label={
                  selectedPage === 'today' || selectedPage === 'portfolio'
                    ? 'glance-dashboard'
                    : selectedPage === 'workouts'
                    ? 'bento-overview'
                    : selectedPage === 'log'
                    ? 'focus-wizard'
                    : selectedPage === 'transfer'
                    ? 'hero-decision'
                    : selectedPage === 'settings'
                    ? 'system-settings'
                    : selectedPage === 'item'
                    ? 'content-canvas'
                    : 'collection'
                }
                tone="accent"
              />
            </Row>

            {selectedApp === 'fitness' ? (
              <SegmentedControl
                label="Screen"
                value={selectedPage}
                options={[
                  { label: 'Today (Glance)', value: 'today' },
                  { label: 'Workouts (Bento)', value: 'workouts' },
                  { label: 'Log (Wizard)', value: 'log' },
                ]}
                onValueChange={setSelectedPage}
              />
            ) : selectedApp === 'finance' ? (
              <SegmentedControl
                label="Screen"
                value={selectedPage}
                options={[
                  { label: 'Portfolio (Glance)', value: 'portfolio' },
                  { label: 'Wire (Hero)', value: 'transfer' },
                  { label: 'Controls (Settings)', value: 'settings' },
                ]}
                onValueChange={setSelectedPage}
              />
            ) : (
              <SegmentedControl
                label="Screen"
                value={selectedPage}
                options={[
                  { label: 'Pantry (Collection)', value: 'pantry' },
                  { label: 'Item (Canvas)', value: 'item' },
                ]}
                onValueChange={setSelectedPage}
              />
            )}
          </Stack>
        </Surface>

        {/* 3. Multi-Axis Theme Controls */}
        <Surface style={{ padding: 16 }}>
          <Stack gap="md">
            <Text style={{ fontWeight: '700' }}>Interactive Design Axes</Text>

            <Row style={{ gap: 8, alignItems: 'center' }}>
              <Text variant="caption" muted style={{ width: 80 }}>Palette:</Text>
              <View style={{ flex: 1 }}>
                <SegmentedControl
                  label="Palette"
                  value={activePalette}
                  options={[
                    { label: 'Emerald', value: 'emerald' },
                    { label: 'Midnight', value: 'midnight' },
                    { label: 'Default', value: 'default' },
                    { label: 'Kyoto', value: 'kyoto' },
                  ]}
                  onValueChange={(p) => setActivePalette(p as PaletteName)}
                />
              </View>
            </Row>

            <Row style={{ gap: 8, alignItems: 'center' }}>
              <Text variant="caption" muted style={{ width: 80 }}>Radius:</Text>
              <View style={{ flex: 1 }}>
                <SegmentedControl
                  label="Radius"
                  value={activeRadius}
                  options={[
                    { label: 'Sharp', value: 'sharp' },
                    { label: 'Smooth', value: 'smooth' },
                    { label: 'Curved', value: 'curved' },
                  ]}
                  onValueChange={(r) => setActiveRadius(r as RadiusScaleName)}
                />
              </View>
            </Row>

            <Row style={{ gap: 8, alignItems: 'center' }}>
              <Text variant="caption" muted style={{ width: 80 }}>Density:</Text>
              <View style={{ flex: 1 }}>
                <SegmentedControl
                  label="Density"
                  value={activeDensity}
                  options={[
                    { label: 'Compact', value: 'compact' },
                    { label: 'Comfortable', value: 'comfortable' },
                    { label: 'Spacious', value: 'spacious' },
                  ]}
                  onValueChange={(d) => setActiveDensity(d as DensityScaleName)}
                />
              </View>
            </Row>

            <Row style={{ gap: 8, alignItems: 'center' }}>
              <Text variant="caption" muted style={{ width: 80 }}>Mode:</Text>
              <View style={{ flex: 1 }}>
                <SegmentedControl
                  label="Mode"
                  value={activeMode}
                  options={[
                    { label: 'Light', value: 'light' },
                    { label: 'Dark', value: 'dark' },
                  ]}
                  onValueChange={(m) => setActiveMode(m as ColorMode)}
                />
              </View>
            </Row>
          </Stack>
        </Surface>

        {/* 4. Native Mobile Frame Preview */}
        <ThemeProvider
          preset={activePreset}
          palette={activePalette}
          radius={activeRadius}
          density={activeDensity}
          typography={activeTypography}
          surface={activeSurface}
          mode={activeMode}
        >
          <RenderPhoneSimulator
            app={selectedApp}
            page={selectedPage}
            wizardStep={wizardStep}
            setWizardStep={setWizardStep}
            bioToggle={bioToggle}
            setBioToggle={setBioToggle}
            alertsToggle={alertsToggle}
            setAlertsToggle={setAlertsToggle}
            notice={notice}
            setNotice={setNotice}
          />
        </ThemeProvider>
      </Stack>
    </ScrollView>
  );
}

function RenderPhoneSimulator({
  app,
  page,
  wizardStep,
  setWizardStep,
  bioToggle,
  setBioToggle,
  alertsToggle,
  setAlertsToggle,
  notice,
  setNotice,
}: {
  app: AppId;
  page: string;
  wizardStep: number;
  setWizardStep: (s: number | ((prev: number) => number)) => void;
  bioToggle: boolean;
  setBioToggle: (b: boolean) => void;
  alertsToggle: boolean;
  setAlertsToggle: (b: boolean) => void;
  notice: string | null;
  setNotice: (n: string | null) => void;
}) {
  const { colors, tokens } = useTheme();

  return (
    <View
      style={{
        backgroundColor: colors.background,
        borderRadius: tokens.radius.lg * 1.5,
        borderWidth: 2,
        borderColor: colors.border,
        minHeight: 520,
        padding: tokens.spacing.md,
        overflow: 'hidden',
      }}
    >
      {notice && (
        <Surface style={{ padding: 10, borderRadius: tokens.radius.sm, marginBottom: 12 }}>
          <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ color: colors.success, fontSize: 13, fontWeight: '600' }}>{notice}</Text>
            <Button size="sm" variant="ghost" label="Dismiss" onPress={() => setNotice(null)} />
          </Row>
        </Surface>
      )}

      {/* Screen 1: Fitness Today (glance-dashboard) */}
      {app === 'fitness' && page === 'today' && (
        <Stack gap="md">
          <ScreenHeader title="Today" subtitle="Daily mindful activity" />
          <GlanceHero
            value="8,420"
            label="Movement"
            unit="steps"
            status="calm"
            statusText="84% of your daily serenity target achieved"
            radialRing={{ value: 84, max: 100 }}
          />
          <Row gap="sm">
            <Surface style={{ flex: 1, padding: 12, borderRadius: tokens.radius.md }}>
              <Text muted variant="caption">Active Minutes</Text>
              <Text variant="heading" style={{ marginTop: 4 }}>42 min</Text>
            </Surface>
            <Surface style={{ flex: 1, padding: 12, borderRadius: tokens.radius.md }}>
              <Text muted variant="caption">Energy Expended</Text>
              <Text variant="heading" style={{ marginTop: 4 }}>380 kcal</Text>
            </Surface>
          </Row>
          <Button fullWidth label="Log Session" onPress={() => setNotice('Navigated to /log')} />
        </Stack>
      )}

      {/* Screen 2: Fitness Workouts (bento-overview) */}
      {app === 'fitness' && page === 'workouts' && (
        <Stack gap="md">
          <ScreenHeader title="Workouts" subtitle="Mind & body rituals" />
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
            <View style={{ width: '48%' }}>
              <ControlTile
                label="Forest Flow Yoga"
                subtitle="30 mins · Gentle"
                active={true}
                icon={<View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary }} />}
                onPress={() => setNotice('Selected Forest Flow Yoga')}
              />
            </View>
            <View style={{ width: '48%' }}>
              <ControlTile
                label="Cedar Ridge Walk"
                subtitle="45 mins · Moderate"
                active={false}
                icon={<View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary }} />}
                onPress={() => setNotice('Selected Cedar Ridge Walk')}
              />
            </View>
            <View style={{ width: '48%' }}>
              <ControlTile
                label="Twilight Relaxation"
                subtitle="20 mins · Restorative"
                active={false}
                icon={<View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary }} />}
                onPress={() => setNotice('Selected Twilight Relaxation')}
              />
            </View>
          </View>
        </Stack>
      )}

      {/* Screen 3: Fitness Log (focus-wizard) */}
      {app === 'fitness' && page === 'log' && (
        <Stack gap="md" style={{ flex: 1, justifyContent: 'space-between' }}>
          <Stack gap="sm">
            <ScreenHeader title="Log Activity" subtitle="Step-by-step entry" />
            <StepProgress step={wizardStep} total={3} />
            <Text muted variant="caption">{`Step ${wizardStep} of 3`}</Text>
            <Surface style={{ padding: 16, borderRadius: tokens.radius.md, marginTop: 12 }}>
              <Text variant="heading">
                {wizardStep === 1
                  ? 'Activity Name'
                  : wizardStep === 2
                  ? 'Duration in Minutes'
                  : 'Target Intensity'}
              </Text>
              <Text muted style={{ marginTop: 6 }}>
                {wizardStep === 1
                  ? 'e.g. Morning Forest Walk'
                  : wizardStep === 2
                  ? 'e.g. 35 minutes'
                  : 'e.g. Gentle / Moderate / Dynamic'}
              </Text>
            </Surface>
          </Stack>
          <Row gap="sm">
            {wizardStep > 1 && (
              <View style={{ flex: 1 }}>
                <Button variant="outline" fullWidth label="Back" onPress={() => setWizardStep((s) => s - 1)} />
              </View>
            )}
            <View style={{ flex: 2 }}>
              <Button
                fullWidth
                label={wizardStep === 3 ? 'Save Activity' : 'Continue'}
                onPress={() => {
                  if (wizardStep < 3) setWizardStep((s) => s + 1);
                  else {
                    setNotice('Activity saved successfully!');
                    setWizardStep(1);
                  }
                }}
              />
            </View>
          </Row>
        </Stack>
      )}

      {/* Screen 4: Finance Portfolio (glance-dashboard) */}
      {app === 'finance' && page === 'portfolio' && (
        <Stack gap="md">
          <ScreenHeader title="Portfolio" subtitle="Apex Institutional" />
          <GlanceHero
            value="$142,500.00"
            label="Net Assets"
            unit="USD"
            status="active"
            statusText="Capital accounts verified and balanced"
            delta={{ value: "+3.4%", positive: true }}
          />
          <Row gap="sm">
            <Surface style={{ flex: 1, padding: 12, borderRadius: tokens.radius.md }}>
              <Text muted variant="caption">Liquid Cash</Text>
              <Text variant="heading" style={{ marginTop: 4 }}>$12,400.00</Text>
            </Surface>
            <Surface style={{ flex: 1, padding: 12, borderRadius: tokens.radius.md }}>
              <Text muted variant="caption">Portfolio Holdings</Text>
              <Text variant="heading" style={{ marginTop: 4 }}>$130,100.00</Text>
            </Surface>
          </Row>
          <Button fullWidth label="Deploy Capital" onPress={() => setNotice('Navigated to /transfer')} />
        </Stack>
      )}

      {/* Screen 5: Finance Wire (hero-decision) */}
      {app === 'finance' && page === 'transfer' && (
        <Stack gap="md" style={{ flex: 1, justifyContent: 'center' }}>
          <HeroPrompt
            title="Authorize $5,000 Transfer"
            subtitle="Funds settle instantly to your high-yield treasury reserve."
            primaryAction={{
              label: 'Authorize Settlement',
              onPress: () => setNotice('Settlement authorized successfully!'),
            }}
            secondaryAction={{
              label: 'Cancel',
              onPress: () => setNotice('Transfer cancelled'),
            }}
            docked={false}
            align="center"
          />
        </Stack>
      )}

      {/* Screen 6: Finance Settings (system-settings) */}
      {app === 'finance' && page === 'settings' && (
        <Stack gap="md">
          <ScreenHeader title="Security & Controls" />
          <SettingsGroup
            title="Authentication"
            entries={[
              {
                id: 'bio',
                title: 'Face ID Authorization',
                description: 'Require biometrics for wire transfers',
              },
            ]}
          />
          <Toggle
            label="Face ID Authorization"
            description="Require biometrics for wire transfers"
            value={bioToggle}
            onValueChange={setBioToggle}
          />
          <Toggle
            label="Transaction Telemetry"
            description="Push alerts on capital allocation"
            value={alertsToggle}
            onValueChange={setAlertsToggle}
          />
        </Stack>
      )}

      {/* Screen 7: Pantry Item (content-canvas) */}
      {app === 'pantry' && page === 'item' && (
        <Stack gap="md">
          <ScreenHeader title="Milk" />
          <MediaFrame ratio={16 / 9} source="https://images.unsplash.com/photo-1550583724-b2692b85b150" radius={tokens.radius.md} />
          <Text style={{ fontSize: tokens.typography.display * 0.9, fontWeight: '800', letterSpacing: -0.8 }}>Milk</Text>
          <Text muted style={{ fontSize: 16 }}>Whole milk, opened Sunday</Text>
          <Surface style={{ padding: 14, borderRadius: tokens.radius.md }}>
            <Row style={{ justifyContent: 'space-between' }}>
              <Text muted>Quantity</Text>
              <Text style={{ fontWeight: '600' }}>1 carton</Text>
            </Row>
          </Surface>
          <Button fullWidth label="Mark Used Up" onPress={() => setNotice('Item marked used up')} />
        </Stack>
      )}

      {/* Screen 8: Pantry List (collection) */}
      {app === 'pantry' && page === 'pantry' && (
        <Stack gap="sm">
          <ScreenHeader title="Pantry" subtitle="Soonest expiry first" />
          <Surface style={{ padding: 12, borderRadius: tokens.radius.md }}>
            <Row style={{ justifyContent: 'space-between' }}>
              <Text style={{ fontWeight: '600' }}>Spinach</Text>
              <Badge label="1 day left" tone="warning" />
            </Row>
            <Text muted variant="small" style={{ marginTop: 2 }}>2 bags</Text>
          </Surface>
          <Surface style={{ padding: 12, borderRadius: tokens.radius.md }}>
            <Row style={{ justifyContent: 'space-between' }}>
              <Text style={{ fontWeight: '600' }}>Whole Milk</Text>
              <Badge label="2 days left" tone="neutral" />
            </Row>
            <Text muted variant="small" style={{ marginTop: 2 }}>1 carton</Text>
          </Surface>
          <Button fullWidth label="Add Item" onPress={() => setNotice('Navigated to /items/new')} />
        </Stack>
      )}
    </View>
  );
}
