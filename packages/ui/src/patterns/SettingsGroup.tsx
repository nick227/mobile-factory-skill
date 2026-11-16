import React from 'react';
import { Stack } from '../primitives/Stack';
import { Text } from '../primitives/Text';
import { Surface } from '../primitives/Surface';
import { ListItem } from '../composites/ListItem';
export interface SettingsEntry { id: string; title: string; description?: string; onPress?: () => void; }
export function SettingsGroup({ title, entries }: { title: string; entries: SettingsEntry[] }) {
  return <Stack gap="sm"><Text variant="heading">{title}</Text><Surface>{entries.map(entry => <ListItem key={entry.id} title={entry.title} description={entry.description} onPress={entry.onPress} />)}</Surface></Stack>;
}
