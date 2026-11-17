import React, { useState } from 'react';
import { router, Stack } from 'expo-router';
import { FormScreen, type FieldSpec } from '@/src/recipes/form-screen';
import { useMutation } from '@/src/foundations/api-client/resource';
import { validatorFor } from '@/src/foundations/validation/form';
import { createEvent } from '@/src/features/events/api';
import { NewEventForm } from '@/src/features/events/schema';

const fields: FieldSpec[] = [
  { key: 'title', label: 'Title', input: { maxLength: 80, autoCapitalize: 'sentences' } },
  { key: 'date', label: 'Date', hint: 'YYYY-MM-DD', input: { placeholder: '2026-12-24', keyboardType: 'numbers-and-punctuation', maxLength: 10 } },
  { key: 'venue', label: 'Venue' },
  { key: 'description', label: 'Description', hint: 'Optional, up to 500 characters', input: { multiline: true, maxLength: 500 } },
];
export default function NewEvent() {
  const [values, setValues] = useState<Record<string, string>>({});
  const save = useMutation(async () => { await createEvent(NewEventForm.parse(values)); router.back(); });
  return (
    <>
      <Stack.Screen options={{ title: 'New event', presentation: 'modal' }} />
      <FormScreen fields={fields} values={values} onChange={(k, v) => setValues((s) => ({ ...s, [k]: v }))} validate={validatorFor(NewEventForm)}
        saving={save.pending} submitError={save.error?.userMessage} onSubmit={() => save.mutate(undefined)} submitLabel="Create event" />
    </>
  );
}
