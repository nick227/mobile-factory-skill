import React from 'react';
import { View, Platform, type ViewProps, type ViewStyle } from 'react-native';
import { tokens as staticTokens } from '../foundation/tokens';
import { useTheme } from '../foundation/theme';

export interface SurfaceProps extends ViewProps {
  padded?: boolean;
  outlined?: boolean;
  elevated?: boolean;
  radius?: keyof typeof staticTokens.radius;
}

export function Surface({
  padded = true,
  outlined = false,
  elevated = false,
  radius = 'md',
  style,
  ...props
}: SurfaceProps) {
  const { colors, mode, tokens, surface: themeSurface } = useTheme();

  const isElevated = elevated || themeSurface === 'elevated';
  const isOutlined = outlined || themeSurface === 'outlined';

  const elevationStyle: ViewStyle = isElevated
    ? Platform.select({
        ios: {
          shadowColor: '#000000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: mode === 'dark' ? 0.35 : 0.06,
          shadowRadius: 8,
        },
        android: {
          elevation: 2,
        },
        default: {
          // Web box-shadow
          boxShadow: mode === 'dark' ? '0 2px 8px rgba(0,0,0,0.4)' : '0 2px 8px rgba(0,0,0,0.06)',
        } as any,
      }) ?? {}
    : {};

  return (
    <View
      {...props}
      style={[
        {
          backgroundColor: colors.surface,
          borderRadius: tokens.radius[radius],
          padding: padded ? tokens.spacing.lg : 0,
          borderWidth: isOutlined ? 1 : 0,
          borderColor: colors.border,
        },
        elevationStyle,
        style,
      ]}
    />
  );
}
