import React, { useEffect, useReducer } from 'react';
import {
  Text,
  Stack,
  Row,
  Surface,
  Button,
  TextField,
  ScreenHeader,
  FocusWizard,
  ChoiceGallery,
  Select,
  StatusTracker,
} from '@factory/ui';
import { disciplines, plans } from '../demos/onboarding/fixtures';
import { initialState, reducer, fieldErrors, stepValid, planById, disciplineById } from '../demos/onboarding/model';
import { formatUSD } from '../demos/shared/money';

export function OnboardingCheckoutScenario() {
  const [s, dispatch] = useReducer(reducer, initialState);
  const errors = fieldErrors(s);
  const plan = planById(s.plan);
  const discipline = disciplineById(s.discipline);

  // Simulated provisioning: progress advances until the membership is active.
  useEffect(() => {
    if (s.phase !== 'submitting') return;
    const t = setTimeout(() => dispatch({ type: 'tick' }), 450);
    return () => clearTimeout(t);
  }, [s.phase, s.progress]);

  if (s.phase === 'complete') {
    return (
      <Stack gap="lg">
        <ScreenHeader title="Membership Active" />
        <StatusTracker
          title="Studio Keycard & Residency Active"
          statusLabel="Provisioned"
          tone="success"
          progress={100}
          description={`${s.name.trim()} (${s.handle}) · ${discipline?.title} · ${plan.name} at ${formatUSD(plan.priceCents)}/mo. Receipt sent to ${s.email.trim()}.`}
          estimatedTime="Digital pass ready in your wallet"
          primaryAction={{ label: 'Start Over', onPress: () => dispatch({ type: 'restart' }) }}
        />
      </Stack>
    );
  }

  if (s.phase === 'submitting') {
    return (
      <Stack gap="lg">
        <ScreenHeader title="Activating Membership" />
        <StatusTracker
          title="Provisioning Studio Credentials"
          statusLabel="Processing"
          tone="info"
          progress={s.progress}
          description={`Setting up ${plan.name} access for ${s.handle}…`}
          estimatedTime="A few seconds"
        />
      </Stack>
    );
  }

  const show = (f: 'name' | 'handle' | 'email') => (s.touched[f] ? errors[f] : undefined);
  const editRow = (label: string, value: string, step: number) => (
    <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
      <Stack gap="xs" style={{ flex: 1 }}>
        <Text muted variant="small">{label}</Text>
        <Text>{value}</Text>
      </Stack>
      <Button label="Edit" variant="ghost" onPress={() => dispatch({ type: 'goTo', step })} accessibilityLabel={`Edit ${label}`} />
    </Row>
  );

  const wizardSteps = [
    {
      id: 'step-identity',
      title: 'Studio Identity',
      subtitle: 'Residency Application · Set your profile name, handle and email',
      isValid: stepValid(s, 0),
      content: (
        <Stack gap="md">
          <TextField label="Studio or Creator Name" value={s.name} onChangeText={(value) => dispatch({ type: 'edit', field: 'name', value })} onBlur={() => dispatch({ type: 'blur', field: 'name' })} error={show('name')} placeholder="e.g. Ren Takahashi Studio" maxLength={40} />
          <TextField label="Studio Handle" value={s.handle} onChangeText={(value) => dispatch({ type: 'edit', field: 'handle', value })} onBlur={() => dispatch({ type: 'blur', field: 'handle' })} error={show('handle')} hint="Lowercase letters, numbers and _" placeholder="@ren_arch" autoCapitalize="none" autoCorrect={false} />
          <TextField label="Email" value={s.email} onChangeText={(value) => dispatch({ type: 'edit', field: 'email', value })} onBlur={() => dispatch({ type: 'blur', field: 'email' })} error={show('email')} placeholder="you@studio.com" keyboardType="email-address" autoCapitalize="none" autoCorrect={false} />
        </Stack>
      ),
    },
    {
      id: 'step-discipline',
      title: 'Craft Discipline',
      subtitle: 'Residency Application · Select facilities focus area',
      isValid: stepValid(s, 1),
      content: (
        <ChoiceGallery options={disciplines} mode="single" selected={s.discipline ?? ''} onSelect={(id) => dispatch({ type: 'chooseDiscipline', id })} />
      ),
    },
    {
      id: 'step-plan',
      title: 'Membership Tier',
      subtitle: 'Residency Application · Select access plan',
      isValid: stepValid(s, 2),
      content: (
        <Stack gap="md">
          <Select label="Membership Plan Tier" value={s.plan} onValueChange={(id) => dispatch({ type: 'choosePlan', id })} options={plans.map((p) => ({ label: `${p.name} (${formatUSD(p.priceCents)}/mo)`, value: p.id }))} />
          <Surface outlined>
            <Stack gap="xs">
              <Text variant="heading">{plan.name} includes</Text>
              {plan.inclusions.map((x) => <Text key={x} muted variant="small">✓ {x}</Text>)}
            </Stack>
          </Surface>
        </Stack>
      ),
    },
    {
      id: 'step-review',
      title: 'Review & Confirm',
      subtitle: 'Check your details before activating. You can edit any section.',
      isValid: true,
      content: (
        <Surface outlined>
          <Stack gap="md">
            {editRow('Profile', `${s.name.trim()} · ${s.handle} · ${s.email.trim()}`, 0)}
            {editRow('Discipline', discipline?.title ?? '—', 1)}
            {editRow('Plan', `${plan.name} · ${formatUSD(plan.priceCents)}/mo`, 2)}
          </Stack>
        </Surface>
      ),
    },
  ];

  return (
    <FocusWizard
        steps={wizardSteps}
        activeStepIndex={s.step}
        onStepChange={(idx) => dispatch({ type: 'goTo', step: idx })}
        onComplete={() => dispatch({ type: 'activate' })}
        completeLabel={`Activate · ${formatUSD(plan.priceCents)}/mo`}
        validationError={s.step === 0 && Object.values(s.touched).some(Boolean) && !stepValid(s, 0) ? 'Fix the highlighted fields to continue.' : undefined}
        style={{ minHeight: 520 }}
      />
  );
}
