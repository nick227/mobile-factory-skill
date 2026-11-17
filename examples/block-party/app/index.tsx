import React, { useState } from 'react';
import { router, Stack } from 'expo-router';
import { Button } from '@/src/ui';
import { CollectionScreen, type CollectionState } from '@/src/recipes/collection-screen';
import { useResource } from '@/src/foundations/api-client/resource';
import { listEvents } from '@/src/features/events/api';

export default function Events() {
  const [query, setQuery] = useState('');
  const events = useResource((signal) => listEvents(query, signal), [query]);
  const state: CollectionState = events.status === 'ready'
    ? { status: 'ready', refreshError: events.error?.userMessage, rows: events.data.map((e) => ({ id: e.id, title: e.title, subtitle: `${e.date} · ${e.venue}`, meta: `${e.rsvpCount} going`, imageUrl: e.coverUrl })) }
    : events.status === 'error' ? { status: 'error', message: events.error.userMessage } : { status: 'loading' };
  const create = <Button label="Create event" variant="secondary" onPress={() => router.push('/events/new')} />;
  return (
    <>
      <Stack.Screen options={{ title: 'Events' }} />
      <CollectionScreen state={state} query={query} onQueryChange={setQuery} onRetry={events.reload} onOpen={(id) => router.push(`/events/${id}`)} headerAction={create} emptyAction={create} />
    </>
  );
}
