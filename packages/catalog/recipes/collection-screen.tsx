/**
 * @recipe recipe.collection-screen
 * @summary Searchable list with first-load skeletons, empty, error+retry, and stable media rows.
 * @capabilities list.row, feedback.skeleton, feedback.empty, input.text, media.image
 * @experiences browse-collection
 * @uses primitives.screen, primitives.stack, controls.textfield, controls.calmskeleton, composites.emptystate, composites.listitem, composites.mediaframe, controls.button
 * @constraints Keep previous rows visible during refresh, Key rows by record id, Use FlatList for lists
 */
import React from 'react';
import { FlatList, View } from 'react-native';
import { Screen, Stack, TextField, CalmSkeleton, EmptyState, ListItem, MediaFrame, Button } from '@/src/ui';

export interface CollectionRow { id: string; title: string; subtitle?: string; imageUrl?: string }
export type CollectionState = { status: 'loading' } | { status: 'error'; message: string } | { status: 'ready'; rows: readonly CollectionRow[] };

export function CollectionScreen({ state, query, onQueryChange, onOpen, onRetry, emptyAction }: {
  state: CollectionState; query: string; onQueryChange: (q: string) => void; onOpen: (id: string) => void; onRetry: () => void; emptyAction?: React.ReactNode;
}) {
  const search = <TextField label="Search" value={query} onChangeText={onQueryChange} autoCorrect={false} returnKeyType="search" />;
  if (state.status === 'loading') return <Screen><Stack gap="md">{search}{[0, 1, 2].map((k) => <CalmSkeleton key={k} height={72} />)}</Stack></Screen>;
  if (state.status === 'error') return <Screen><EmptyState title="Couldn't load" description={state.message} action={<Button label="Retry" onPress={onRetry} />} /></Screen>;
  return (
    <Screen>
      <FlatList
        data={state.rows}
        keyExtractor={(row) => row.id}
        ListHeaderComponent={<View style={{ paddingBottom: 12 }}>{search}</View>}
        ListEmptyComponent={<EmptyState title={query ? 'No matches' : 'Nothing here yet'} description={query ? 'Try a different search.' : undefined} action={query ? undefined : emptyAction} />}
        renderItem={({ item }) => (
          <ListItem title={item.title} description={item.subtitle} onPress={() => onOpen(item.id)} accessibilityLabel={`Open ${item.title}`}
            leading={item.imageUrl ? <View style={{ width: 56 }}><MediaFrame ratio={1} source={item.imageUrl} radius={8} /></View> : undefined} />
        )}
      />
    </Screen>
  );
}
