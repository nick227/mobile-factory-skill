import React from 'react';
import { View, type ViewProps } from 'react-native';
import { tokens } from '../foundation/tokens';
export interface SpacerProps extends ViewProps { size?: keyof typeof tokens.spacing; flexible?: boolean; }
export function Spacer({ size = 'md', flexible = false, style, ...props }: SpacerProps) {
  return <View {...props} style={[flexible ? { flex: 1 } : { width: tokens.spacing[size], height: tokens.spacing[size] }, style]} />;
}
