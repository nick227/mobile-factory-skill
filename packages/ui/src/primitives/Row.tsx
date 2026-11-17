import React from 'react';
import { View, type ViewProps } from 'react-native';
import { useTheme } from '../foundation/theme';
import type { Space } from './Stack';

export interface RowProps extends ViewProps {
  gap?: Space;
  align?: 'flex-start' | 'center' | 'flex-end' | 'stretch';
}

export function Row({ gap = 'md', align = 'center', style, ...props }: RowProps) {
  const { tokens } = useTheme();
  return (
    <View
      {...props}
      style={[{ flexDirection: 'row', alignItems: align, gap: tokens.spacing[gap] }, style]}
    />
  );
}
