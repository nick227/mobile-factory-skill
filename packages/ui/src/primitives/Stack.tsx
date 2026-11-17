import React from 'react';
import { View, type ViewProps, type ViewStyle } from 'react-native';
import { tokens as staticTokens } from '../foundation/tokens';
import { useTheme } from '../foundation/theme';

export type Space = keyof typeof staticTokens.spacing;
export interface StackProps extends ViewProps {
  gap?: Space;
  align?: ViewStyle['alignItems'];
  justify?: ViewStyle['justifyContent'];
}

export function Stack({ gap = 'md', align, justify, style, ...props }: StackProps) {
  const { tokens } = useTheme();
  return (
    <View
      {...props}
      style={[{ gap: tokens.spacing[gap], alignItems: align, justifyContent: justify }, style]}
    />
  );
}
