import React from 'react';
import { View, type ViewProps } from 'react-native';
import { useTheme } from '../foundation/theme';
import { tokens as staticTokens } from '../foundation/tokens';
export interface SpacerProps extends ViewProps { size?: keyof typeof staticTokens.spacing; flexible?: boolean; }
export function Spacer({ size = 'md', flexible = false, style, ...props }: SpacerProps) {
  const { tokens } = useTheme();
  return <View {...props} style={[flexible ? { flex: 1 } : { width: tokens.spacing[size], height: tokens.spacing[size] }, style]} />;
}
