import React from 'react';
import { ScrollView, View, type ViewProps, type ScrollViewProps } from 'react-native';
import { tokens } from '../foundation/tokens';
import { useTheme } from '../foundation/theme';
export interface ScreenProps extends ViewProps { scroll?: boolean; scrollProps?: Omit<ScrollViewProps, 'children'>; }
export function Screen({ scroll = false, scrollProps, style, children, ...props }: ScreenProps) {
  const { colors } = useTheme();
  const base = { flex: 1 as const, backgroundColor: colors.background };
  if (scroll) return <ScrollView {...scrollProps} style={[base, style]} contentContainerStyle={[{ padding: tokens.spacing.lg }, scrollProps?.contentContainerStyle]}>{children}</ScrollView>;
  return <View {...props} style={[base, { padding: tokens.spacing.lg }, style]}>{children}</View>;
}
