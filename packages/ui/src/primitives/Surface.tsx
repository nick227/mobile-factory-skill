import React from 'react';
import { View, type ViewProps } from 'react-native';
import { tokens } from '../foundation/tokens';
import { useTheme } from '../foundation/theme';
export interface SurfaceProps extends ViewProps { padded?: boolean; outlined?: boolean; }
export function Surface({ padded = true, outlined = false, style, ...props }: SurfaceProps) {
  const { colors } = useTheme();
  return <View {...props} style={[{ backgroundColor: colors.surface, borderRadius: tokens.radius.md, padding: padded ? tokens.spacing.lg : 0, borderWidth: outlined ? 1 : 0, borderColor: colors.border }, style]} />;
}
