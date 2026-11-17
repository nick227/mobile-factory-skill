import React from 'react';
import { ScrollView, View, type ViewProps, type ScrollViewProps } from 'react-native';
import { useTheme } from '../foundation/theme';

export interface ScreenProps extends ViewProps {
  scroll?: boolean;
  scrollProps?: Omit<ScrollViewProps, 'children'>;
}

export function Screen({ scroll = false, scrollProps, style, children, ...props }: ScreenProps) {
  const { colors, tokens, layout } = useTheme();
  const screenPadding =
    layout === 'editorial'
      ? tokens.spacing.xl
      : layout === 'immersive'
      ? 0
      : tokens.spacing.lg;

  const base = { flex: 1 as const, backgroundColor: colors.background };

  if (scroll) {
    return (
      <ScrollView
        {...scrollProps}
        style={[base, style]}
        contentContainerStyle={[{ padding: screenPadding }, scrollProps?.contentContainerStyle]}
      >
        {children}
      </ScrollView>
    );
  }

  return (
    <View {...props} style={[base, { padding: screenPadding }, style]}>
      {children}
    </View>
  );
}
