/**
 * @recipe recipe.form-screen
 * @summary Focused create/edit form: inline errors after submit attempt, disabled submit while saving, safe-area action.
 * @capabilities layout.focus, input.text, form.validation-message, action.primary, action.pending
 * @experiences form-entry
 * @uses patterns.focusscreen, primitives.stack, controls.textfield, controls.button, composites.screenheader
 * @constraints Show errors after first submit attempt, Disable submit while saving, Keep short related fields on one screen
 */
import React, { useState } from 'react';
import { Stack, TextField, Button, FocusScreen, ScreenHeader } from '@/src/ui';

export interface FieldSpec { key: string; label: string; hint?: string; multiline?: boolean }

export function FormScreen({ title, fields, values, onChange, validate, saving, onSubmit, onCancel, submitLabel = 'Save' }: {
  title: string; fields: readonly FieldSpec[]; values: Record<string, string>; onChange: (key: string, value: string) => void;
  validate: (values: Record<string, string>) => Record<string, string | undefined>; saving: boolean; onSubmit: () => void; onCancel: () => void; submitLabel?: string;
}) {
  const [attempted, setAttempted] = useState(false);
  const errors = attempted ? validate(values) : {};
  const submit = () => { setAttempted(true); if (Object.values(validate(values)).every((e) => !e)) onSubmit(); };
  return (
    <FocusScreen top={<ScreenHeader title={title} backLabel="Cancel" onBack={onCancel} />}
      action={<Button label={submitLabel} loading={saving} disabled={saving} onPress={submit} fullWidth />}>
      <Stack gap="lg">
        {fields.map((f) => (
          <TextField key={f.key} label={f.label} hint={f.hint} multiline={f.multiline} value={values[f.key] ?? ''} error={errors[f.key]} onChangeText={(v) => onChange(f.key, v)} />
        ))}
      </Stack>
    </FocusScreen>
  );
}
