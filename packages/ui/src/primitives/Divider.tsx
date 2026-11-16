import React from 'react';
import { View, type ViewProps } from 'react-native';
import { useTheme } from '../foundation/theme';
export function Divider({ style, ...props }: ViewProps) {
  const { colors } = useTheme();
  return <View {...props} accessible={false} style={[{ height: 1, backgroundColor: colors.border }, style]} />;
}
