import React, { useState } from 'react';
import { Stack, SearchBar, ListItem, EmptyState, Badge, SectionHeader } from '@factory/ui';

const data = ['Morning routine', 'Weekend hike', 'Team planning', 'Reading group'];

export function SearchScenario() {
  const [query, setQuery] = useState('');
  const matches = data.filter((item) => item.toLowerCase().includes(query.toLowerCase()));

  return (
    <Stack gap="md">
      <SectionHeader title="Search" description="Search demo entries" />
      <SearchBar
        label="Activities"
        placeholder="Search activities…"
        value={query}
        onChangeText={setQuery}
        showCancelButton={query.length > 0}
        onCancel={() => setQuery('')}
      />
      {matches.length ? (
        matches.map((item) => (
          <ListItem key={item} title={item} trailing={<Badge label="Activity" />} onPress={() => {}} />
        ))
      ) : (
        <EmptyState title="No results" description="Try a different search." />
      )}
    </Stack>
  );
}

