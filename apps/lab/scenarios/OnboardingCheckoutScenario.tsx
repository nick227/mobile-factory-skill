import React, { useState } from 'react';
import { View } from 'react-native';
import {
  Text,
  Stack,
  Surface,
  Button,
  TextField,
  Badge,
  ScreenHeader,
  FocusWizard,
  ChoiceGallery,
  Select,
  StatusTracker,
  useTheme,
} from '@factory/ui';

export function OnboardingCheckoutScenario() {
  const { colors } = useTheme();
  const [currentStep, setCurrentStep] = useState(0);
  const [name, setName] = useState('Ren Takahashi');
  const [handle, setHandle] = useState('@ren_arch');
  const [selectedDiscipline, setSelectedDiscipline] = useState<string | null>('architecture');
  const [selectedTier, setSelectedTier] = useState('studio');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  const disciplineOptions = [
    {
      id: 'architecture',
      title: 'Architectural Design',
      subtitle: 'Pavilion, spatial, and interior scale',
      badge: 'Popular',
      badgeTone: 'accent' as const,
      description: 'Access 3D model archives and CAD blueprints.',
    },
    {
      id: 'ceramics',
      title: 'Ceramic Arts',
      subtitle: 'Wheel-thrown stoneware and glazing',
      badge: 'Kiln Access',
      badgeTone: 'neutral' as const,
      description: 'Kiln scheduling and glaze formula database.',
    },
    {
      id: 'printmaking',
      title: 'Woodblock & Intaglio',
      subtitle: 'Relief and lithographic printing',
      badge: 'Studio Press',
      badgeTone: 'neutral' as const,
      description: 'Studio press bookings and archival paper supplies.',
    },
  ];

  const tierOptions = [
    { label: 'Studio Member ($49/mo)', value: 'studio' },
    { label: 'Fellowship Resident ($120/mo)', value: 'fellow' },
    { label: 'Guest Access ($19/mo)', value: 'guest' },
  ];

  const wizardSteps = [
    {
      id: 'step-identity',
      title: 'Studio Identity',
      subtitle: 'Residency Application · Set your profile name and handle',
      isValid: name.trim().length > 0 && handle.trim().length > 0,
      content: (
        <Stack gap="md">
          <TextField
            label="Studio or Creator Name"
            value={name}
            onChangeText={setName}
            placeholder="e.g. Ren Takahashi Studio"
          />
          <TextField
            label="Studio Handle"
            value={handle}
            onChangeText={setHandle}
            placeholder="e.g. @ren_arch"
          />
        </Stack>
      ),
    },
    {
      id: 'step-discipline',
      title: 'Craft Discipline',
      subtitle: 'Residency Application · Select facilities focus area',
      isValid: Boolean(selectedDiscipline),
      content: (
        <ChoiceGallery
          options={disciplineOptions}
          mode="single"
          selected={selectedDiscipline || ''}
          onSelect={(id) => setSelectedDiscipline(id)}
        />
      ),
    },
    {
      id: 'step-plan',
      title: 'Membership Tier',
      subtitle: 'Residency Application · Select access plan',
      isValid: Boolean(selectedTier),
      content: (
        <Stack gap="md">
          <Select
            label="Membership Plan Tier"
            value={selectedTier}
            onValueChange={setSelectedTier}
            options={tierOptions}
          />
          <Surface outlined>
            <Stack gap="xs">
              <Text variant="heading">Plan Inclusions</Text>
              <Text muted variant="small">
                ✓ 24/7 keycard access to Kyoto studio spaces
              </Text>
              <Text muted variant="small">
                ✓ Shared darkroom and kiln access
              </Text>
              <Text muted variant="small">
                ✓ High-speed gigabit fiber and lounge library
              </Text>
            </Stack>
          </Surface>
        </Stack>
      ),
    },
  ];

  const handleFinish = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setIsComplete(true);
    }, 1200);
  };

  if (isComplete) {
    return (
      <Stack gap="lg">
        <ScreenHeader title="Membership Active" />
        <StatusTracker
          title="Studio Keycard & Residency Active"
          statusLabel="Provisioned"
          tone="success"
          progress={100}
          description={`${name} (${handle}) is registered under the ${selectedTier.toUpperCase()} plan.`}
          estimatedTime="Digital pass added to Apple Wallet"
          primaryAction={{
            label: 'Restart Onboarding Demo',
            onPress: () => {
              setIsComplete(false);
              setCurrentStep(0);
            },
          }}
        />
      </Stack>
    );
  }

  if (isSubmitting) {
    return (
      <Stack gap="lg">
        <ScreenHeader title="Activating Membership" />
        <StatusTracker
          title="Provisioning Studio Credentials"
          statusLabel="Processing"
          tone="info"
          progress={65}
          description="Generating encrypted digital pass and allocating studio locker..."
          estimatedTime="Takes ~5 seconds"
        />
      </Stack>
    );
  }

  return (
    <FocusWizard
      steps={wizardSteps}
      activeStepIndex={currentStep}
      onStepChange={(idx) => setCurrentStep(idx)}
      onComplete={handleFinish}
      completeLabel="Activate Residency"
      style={{ minHeight: 520 }}
    />
  );
}
