import React from 'react';
import { View, StyleSheet, type ViewStyle } from 'react-native';
import { Text } from '../primitives/Text';
import { tokens } from '../foundation/tokens';
import { useTheme } from '../foundation/theme';

export type BadgeTone = 'neutral' | 'accent' | 'success' | 'warning' | 'danger';

export interface BadgeProps {
  label: string;
  tone?: BadgeTone;
  style?: ViewStyle;
}

export function Badge({ label, tone = 'neutral', style }: BadgeProps) {
  const { colors } = useTheme();

  let bg: string = colors.surface;
  let fg: string = colors.text;

  if (tone === 'accent') {
    bg = colors.primary;
    fg = colors.onPrimary;
  } else if (tone === 'success') {
    bg = `${colors.success}20`;
    fg = colors.success;
  } else if (tone === 'warning') {
    bg = `${colors.warning}20`;
    fg = colors.warning;
  } else if (tone === 'danger') {
    bg = `${colors.danger}20`;
    fg = colors.danger;
  }

  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: bg, borderColor: tone === 'neutral' ? colors.border : 'transparent' },
        style,
      ]}
    >
      <Text
        variant="caption"
        style={{ color: fg, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 }}
      >
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: tokens.spacing.sm,
    paddingVertical: 3,
    borderRadius: tokens.radius.full,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
