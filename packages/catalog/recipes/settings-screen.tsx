/**
 * @recipe recipe.settings-screen
 * @summary Settings: immediate toggles plus grouped navigation rows.
 * @capabilities list.grouped, input.boolean
 * @experiences settings
 * @uses primitives.screen, primitives.stack, controls.toggle, patterns.settingsgroup
 * @constraints Toggles apply immediately with no Save button
 */
import React from 'react';
import { Screen, Stack, Toggle, SettingsGroup, type SettingsEntry } from '@/src/ui';

export function SettingsScreen({ toggles, groups }: {
  toggles: readonly { key: string; label: string; description?: string; value: boolean; onChange: (v: boolean) => void }[];
  groups: readonly { title: string; entries: SettingsEntry[] }[];
}) {
  return (
    <Screen scroll>
      <Stack gap="xl">
        <Stack gap="sm">{toggles.map((t) => <Toggle key={t.key} label={t.label} description={t.description} value={t.value} onValueChange={t.onChange} />)}</Stack>
        {groups.map((g) => <SettingsGroup key={g.title} title={g.title} entries={g.entries} />)}
      </Stack>
    </Screen>
  );
}
