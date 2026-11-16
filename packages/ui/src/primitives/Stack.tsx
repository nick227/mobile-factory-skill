import React from 'react';
import { View, type ViewProps, type ViewStyle } from 'react-native';
import { tokens } from '../foundation/tokens';
export type Space = keyof typeof tokens.spacing;
export interface StackProps extends ViewProps { gap?: Space; align?: ViewStyle['alignItems']; justify?: ViewStyle['justifyContent']; }
export function Stack({ gap = 'md', align, justify, style, ...props }: StackProps) {
  return <View {...props} style={[{ gap: tokens.spacing[gap], alignItems: align, justifyContent: justify }, style]} />;
}
