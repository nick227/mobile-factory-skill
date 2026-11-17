/**
 * @recipe recipe.detail-screen
 * @summary Item detail with reserved hero media, content, pinned primary action with pending state, and confirmed destructive undo.
 * @capabilities media.image, action.primary, action.pending, layout.bottom-dock
 * @experiences item-detail
 * @uses primitives.stack, primitives.text, composites.mediaframe, patterns.actiondock, controls.button, controls.calmskeleton, composites.alertdialog
 * @constraints Destructive actions need explicit confirmation, Caller owns pending and failure
 */
import React, { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Stack, Text, MediaFrame, ActionDock, Button, CalmSkeleton, AlertDialog, useTheme } from '@/src/ui';

export function DetailScreen({ loading, title, meta, body, imageUrl, active, pending, onActivate, onDeactivate, activeLabel, inactiveLabel }: {
  loading: boolean; title: string; meta: string; body?: string; imageUrl?: string; active: boolean; pending: boolean;
  onActivate: () => void; onDeactivate: () => void; activeLabel: string; inactiveLabel: string;
}) {
  const { colors } = useTheme();
  const [confirming, setConfirming] = useState(false);
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
          label={active ? activeLabel : inactiveLabel} onPress={active ? () => setConfirming(true) : onActivate} />
      </ActionDock>
      <AlertDialog open={confirming} onOpenChange={setConfirming} title={`${activeLabel}?`} description="You can change this again later."
        destructive confirmLabel={activeLabel} cancelLabel="Keep" onConfirm={() => { setConfirming(false); onDeactivate(); }} />
    </View>
  );
}
