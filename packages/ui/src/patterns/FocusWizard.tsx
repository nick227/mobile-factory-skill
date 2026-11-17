import React from 'react';
import { View, ScrollView, KeyboardAvoidingView, Platform, type ViewStyle, type StyleProp } from 'react-native';
import { useTheme } from '../foundation/theme';
import { geometry, tokens } from '../foundation/tokens';
import { Text } from '../primitives/Text';
import { Button } from '../controls/Button';
import { StepProgress } from '../controls/StepProgress';
import { ScreenHeader } from '../composites/ScreenHeader';
import { ActionDock } from './ActionDock';

export interface FocusWizardStep {
  id: string;
  title: string;
  subtitle?: string;
  isValid?: boolean;
  content: React.ReactNode;
}

export interface FocusWizardProps {
  steps: readonly FocusWizardStep[];
  activeStepIndex: number;
  onStepChange: (nextIndex: number, stepId: string) => void;
  onComplete: () => void;
  onCancel?: () => void;
  nextLabel?: string;
  backLabel?: string;
  completeLabel?: string;
  cancelLabel?: string;
  showProgress?: boolean;
  validationError?: string;
  style?: StyleProp<ViewStyle>;
}

export function FocusWizard({
  steps,
  activeStepIndex,
  onStepChange,
  onComplete,
  onCancel,
  nextLabel = 'Continue',
  backLabel = 'Back',
  completeLabel = 'Complete',
  cancelLabel = 'Cancel',
  showProgress = true,
  validationError,
  style,
}: FocusWizardProps) {
  const { colors } = useTheme();

  const totalSteps = steps.length;
  const currentIndex = Math.max(0, Math.min(totalSteps - 1, activeStepIndex));
  const currentStep = steps[currentIndex];
  const isFirstStep = currentIndex === 0;
  const isLastStep = currentIndex === totalSteps - 1;

  const isStepValid = currentStep?.isValid ?? true;

  const handleNext = () => {
    if (!isStepValid) return;
    if (isLastStep) {
      onComplete();
    } else {
      const nextIdx = currentIndex + 1;
      onStepChange(nextIdx, steps[nextIdx].id);
    }
  };

  const handleBack = () => {
    if (isFirstStep) {
      onCancel?.();
    } else {
      const prevIdx = currentIndex - 1;
      onStepChange(prevIdx, steps[prevIdx].id);
    }
  };

  if (!currentStep) return null;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={[{ flex: 1, backgroundColor: colors.background }, style]}
    >
      {/* Header with Title and Optional Back/Cancel */}
      <ScreenHeader
        title={currentStep.title}
        subtitle={currentStep.subtitle}
        backLabel={isFirstStep ? cancelLabel : backLabel}
        onBack={isFirstStep ? onCancel : handleBack}
        trailing={
          showProgress && totalSteps > 1 ? (
            <Text muted variant="small" style={{ fontWeight: '600' }}>
              {currentIndex + 1} of {totalSteps}
            </Text>
          ) : undefined
        }
      />

      {/* Progress Bar Indicator */}
      {showProgress && totalSteps > 1 ? (
        <View style={{ paddingHorizontal: geometry.screenGutter, paddingVertical: 8 }}>
          <StepProgress
            step={currentIndex + 1}
            total={totalSteps}
            label={`Step ${currentIndex + 1} of ${totalSteps}`}
          />
        </View>
      ) : null}

      {/* Step Content in Scrollable Canvas */}
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: geometry.screenGutter,
          paddingVertical: tokens.spacing.md,
          flexGrow: 1,
        }}
        keyboardShouldPersistTaps="handled"
      >
        {currentStep.content}

        {validationError ? (
          <Text style={{ color: colors.danger, fontSize: 13, marginTop: 12 }}>
            {validationError}
          </Text>
        ) : null}
      </ScrollView>

      {/* Bottom Sticky Action Dock */}
      <ActionDock separated>
        <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
          {!isFirstStep ? (
            <View style={{ flex: 1 }}>
              <Button
                label={backLabel}
                variant="outline"
                fullWidth
                onPress={handleBack}
              />
            </View>
          ) : onCancel ? (
            <View style={{ flex: 1 }}>
              <Button
                label={cancelLabel}
                variant="ghost"
                fullWidth
                onPress={onCancel}
              />
            </View>
          ) : null}

          <View style={{ flex: 2 }}>
            <Button
              label={isLastStep ? completeLabel : nextLabel}
              variant="primary"
              disabled={!isStepValid}
              fullWidth
              onPress={handleNext}
            />
          </View>
        </View>
      </ActionDock>
    </KeyboardAvoidingView>
  );
}
