import React from 'react';
import { View } from 'react-native';
import { Text } from '../primitives/Text';
import { tokens } from '../foundation/tokens';
import { useTheme } from '../foundation/theme';
export interface BadgeProps { label: string; tone?: 'neutral' | 'accent'; }
export function Badge({ label, tone = 'neutral' }: BadgeProps) {
  const { colors } = useTheme();
  return <View style={{ alignSelf: 'flex-start', paddingHorizontal: tokens.spacing.sm, paddingVertical: tokens.spacing.xs, borderRadius: tokens.radius.full, backgroundColor: tone === 'accent' ? colors.primary : colors.surface }}>
    <Text variant="small" style={{ color: tone === 'accent' ? colors.onPrimary : colors.text, fontWeight: '600' }}>{label}</Text>
  </View>;
}
