import React from 'react';
import { Stack, useLocalSearchParams } from 'expo-router';
import { DetailScreen } from '@/src/recipes/detail-screen';
import { useResource, useMutation } from '@/src/foundations/api-client/resource';
import { useStore } from '@/src/foundations/persistence/useStore';
import { getEvent, setRsvp } from '@/src/features/events/api';
import { rsvpStore } from '@/src/features/events/store';

export default function EventDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const event = useResource((signal) => getEvent(id, signal), [id]);
  const rsvps = useStore(rsvpStore);
  const attending = Boolean(rsvps.value?.[id]);
  const toggle = useMutation(async (next: boolean) => { await setRsvp(id, next); await rsvps.update((r) => ({ ...r, [id]: next })); event.reload(); });
  const e = event.status === 'ready' ? event.data : undefined;
  return (
    <>
      <Stack.Screen options={{ title: e?.title ?? 'Event' }} />
      <DetailScreen loading={!e} error={event.status === 'error' ? event.error.userMessage : undefined} onRetry={event.reload}
        title={e?.title ?? ''} meta={e ? `${e.date} · ${e.venue} · ${e.rsvpCount} going` : ''} body={e?.description} imageUrl={e?.coverUrl}
        active={attending} pending={toggle.pending || !rsvps.ready} actionError={toggle.error?.userMessage}
        onActivate={() => toggle.mutate(true)} onDeactivate={() => toggle.mutate(false)} activeLabel="Cancel RSVP" inactiveLabel="RSVP"
        confirmDescription="You'll be removed from the guest list. You can RSVP again later." />
    </>
  );
}
