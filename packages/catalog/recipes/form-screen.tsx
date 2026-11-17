/**
 * @recipe recipe.form-screen
 * @summary Create/edit form: top-aligned keyboard-aware fields, inline errors after first submit, per-field input props, submit error, safe-area submit action.
 * @capabilities input.text, form.validation-message, action.primary, action.pending, layout.bottom-dock
 * @experiences form-entry
 * @uses primitives.stack, primitives.text, controls.textfield, controls.button, patterns.actiondock
 * @constraints Show errors after first submit attempt, Disable submit while saving, Keep short related fields on one screen, Title and cancel come from the router header
 */
import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Stack, Text, TextField, Button, ActionDock, useTheme, type TextFieldProps } from '@/src/ui';

export interface FieldSpec { key: string; label: string; hint?: string; input?: Omit<TextFieldProps, 'label' | 'value' | 'onChangeText' | 'error' | 'hint'> }
export type FieldErrors = Partial<Record<string, string>>;

export function FormScreen({ fields, values, onChange, validate, saving, submitError, onSubmit, submitLabel = 'Save' }: {
  fields: readonly FieldSpec[]; values: Record<string, string>; onChange: (key: string, value: string) => void;
  /** e.g. validatorFor(Schema) from module.validation */
  validate: (values: Record<string, string>) => FieldErrors; saving: boolean; submitError?: string; onSubmit: () => void; submitLabel?: string;
}) {
  const { colors } = useTheme();
  const [attempted, setAttempted] = useState(false);
  const errors: FieldErrors = attempted ? validate(values) : {};
  const submit = () => { setAttempted(true); if (Object.values(validate(values)).every((e) => !e)) onSubmit(); };
  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.background }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 16 }}>
        <Stack gap="lg">
          {fields.map((f) => (
            <TextField key={f.key} label={f.label} hint={f.hint} {...f.input} value={values[f.key] ?? ''} error={errors[f.key]} onChangeText={(v) => onChange(f.key, v)} />
          ))}
        </Stack>
      </ScrollView>
      <ActionDock separated>
        {submitError ? <Text variant="small" accessibilityRole="alert" style={{ color: colors.danger, paddingBottom: 8 }}>{submitError}</Text> : null}
        <Button label={submitLabel} loading={saving} disabled={saving} onPress={submit} fullWidth />
      </ActionDock>
    </KeyboardAvoidingView>
  );
}
