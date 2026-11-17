/**
 * @recipe recipe.detail-screen
 * @summary Item detail: reserved hero media, content slot, error+retry, pinned primary action with pending state, AlertDialog-confirmed destructive undo.
 * @capabilities media.image, action.primary, action.pending, layout.bottom-dock, overlay.confirm
 * @experiences item-detail
 * @uses primitives.stack, primitives.text, composites.mediaframe, patterns.actiondock, controls.button, controls.calmskeleton, composites.alertdialog, composites.emptystate
 * @constraints Destructive actions need explicit confirmation, Caller owns pending and failure
 */
import React, { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Stack, Text, MediaFrame, ActionDock, Button, CalmSkeleton, AlertDialog, EmptyState, useTheme } from '@/src/ui';

export function DetailScreen({ loading, error, onRetry, title, meta, body, imageUrl, children, active, pending, actionError, onActivate, onDeactivate, activeLabel, inactiveLabel, confirmTitle, confirmDescription = 'You can change this again later.' }: {
  loading: boolean; error?: string; onRetry?: () => void; title: string; meta: string; body?: string; imageUrl?: string; children?: React.ReactNode;
  active: boolean; pending: boolean; actionError?: string; onActivate: () => void; onDeactivate: () => void;
  activeLabel: string; inactiveLabel: string; confirmTitle?: string; confirmDescription?: string;
}) {
  const { colors } = useTheme();
  const [confirming, setConfirming] = useState(false);
  if (error) return <View style={{ flex: 1, justifyContent: 'center', padding: 16, backgroundColor: colors.background }}><EmptyState title="Couldn't load this" description={error} action={onRetry ? <Button label="Retry" onPress={onRetry} /> : undefined} /></View>;
  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Stack gap="lg">
          <MediaFrame ratio={16 / 9} source={imageUrl} label={title} />
          {loading ? <CalmSkeleton height={96} /> : <Stack gap="sm"><Text variant="title">{title}</Text><Text muted>{meta}</Text>{body ? <Text>{body}</Text> : null}{children}</Stack>}
        </Stack>
      </ScrollView>
      <ActionDock separated>
        {actionError ? <Text variant="small" accessibilityRole="alert" style={{ color: colors.danger, paddingBottom: 8 }}>{actionError}</Text> : null}
        <Button fullWidth loading={pending} disabled={loading} variant={active ? 'outline' : 'primary'}
          label={active ? activeLabel : inactiveLabel} onPress={active ? () => setConfirming(true) : onActivate} />
      </ActionDock>
      <AlertDialog open={confirming} onOpenChange={setConfirming} title={confirmTitle ?? `${activeLabel}?`} description={confirmDescription}
        destructive confirmLabel={activeLabel} cancelLabel="Keep" onConfirm={() => { setConfirming(false); onDeactivate(); }} />
    </View>
  );
}
