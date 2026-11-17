/**
 * @recipe recipe.detail-screen
 * @summary Item detail with reserved hero media, content, pinned primary action with pending state, and confirmed destructive undo.
 * @capabilities media.image, action.primary, action.pending, layout.bottom-dock
 * @experiences item-detail
 * @uses primitives.screen, primitives.stack, primitives.text, composites.mediaframe, patterns.actiondock, controls.button, controls.calmskeleton
 * @constraints Destructive actions need explicit confirmation, Caller owns pending and failure
 */
import React from 'react';
import { Alert, ScrollView, View } from 'react-native';
import { Stack, Text, MediaFrame, ActionDock, Button, CalmSkeleton, useTheme } from '@/src/ui';

export function DetailScreen({ loading, title, meta, body, imageUrl, active, pending, onActivate, onDeactivate, activeLabel, inactiveLabel }: {
  loading: boolean; title: string; meta: string; body?: string; imageUrl?: string; active: boolean; pending: boolean;
  onActivate: () => void; onDeactivate: () => void; activeLabel: string; inactiveLabel: string;
}) {
  const { colors } = useTheme();
  const confirmDeactivate = () => Alert.alert(`${activeLabel}?`, 'You can change this again later.', [
    { text: 'Keep', style: 'cancel' }, { text: activeLabel, style: 'destructive', onPress: onDeactivate },
  ]);
  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Stack gap="lg">
          <MediaFrame ratio={16 / 9} source={imageUrl} label={title} />
          {loading ? <CalmSkeleton height={96} /> : <Stack gap="sm"><Text variant="title">{title}</Text><Text muted>{meta}</Text>{body ? <Text>{body}</Text> : null}</Stack>}
        </Stack>
      </ScrollView>
      <ActionDock separated>
        <Button fullWidth loading={pending} disabled={loading} variant={active ? 'outline' : 'primary'}
          label={active ? activeLabel : inactiveLabel} onPress={active ? confirmDeactivate : onActivate} />
      </ActionDock>
    </View>
  );
}
