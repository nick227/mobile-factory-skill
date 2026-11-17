import React from 'react';
import { ActivityIndicator, Pressable, View, type PressableProps, type ViewStyle } from 'react-native';
import { Text } from '../primitives/Text';
import { useTheme } from '../foundation/theme';
import { tokens } from '../foundation/tokens';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';
export type ButtonTone = 'default' | 'danger';

export interface ButtonProps extends Omit<PressableProps, 'children'> {
  label: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  tone?: ButtonTone;
  icon?: React.ReactNode;
  trailingIcon?: React.ReactNode;
  loading?: boolean;
  fullWidth?: boolean;
}

export function Button({
  label,
  variant = 'primary',
  size = 'md',
  tone = 'default',
  icon,
  trailingIcon,
  disabled,
  loading = false,
  fullWidth = false,
  style,
  onPress,
  ...props
}: ButtonProps) {
  const { colors } = useTheme();
  const inactive = Boolean(disabled || loading);
  const solid = variant === 'primary';
  const isDanger = tone === 'danger';

  let bg: string = 'transparent';
  let fg: string = colors.text;
  let borderColor: string = colors.border;

  if (solid) {
    bg = isDanger ? colors.danger : colors.primary;
    fg = colors.onPrimary;
    borderColor = bg;
  } else if (variant === 'secondary') {
    bg = isDanger ? `${colors.danger}15` : colors.surface;
    fg = isDanger ? colors.danger : colors.text;
    borderColor = colors.border;
  } else if (variant === 'outline') {
    bg = 'transparent';
    fg = isDanger ? colors.danger : colors.text;
    borderColor = isDanger ? colors.danger : colors.border;
  } else if (variant === 'ghost') {
    bg = 'transparent';
    fg = isDanger ? colors.danger : colors.primary;
    borderColor = 'transparent';
  }

  // Compact buttons stay at the 44pt minimum touch target (standards/design/geometry.md).
  const minHeight = size === 'sm' ? 44 : size === 'lg' ? 56 : 48;
  const paddingHorizontal = size === 'sm' ? tokens.spacing.md : size === 'lg' ? tokens.spacing.xl : tokens.spacing.lg;
  const fontSize = size === 'sm' ? tokens.typography.small : tokens.typography.body;

  return (
    <Pressable
      {...props}
      accessibilityRole="button"
      accessibilityState={{ disabled: inactive, busy: loading }}
      disabled={inactive}
      onPress={onPress}
      style={(state) => [
        {
          minHeight,
          borderRadius: tokens.radius.md,
          paddingHorizontal,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: tokens.spacing.sm,
          backgroundColor: bg,
          borderWidth: variant === 'outline' ? 1 : 0,
          borderColor,
          opacity: inactive ? 0.45 : state.pressed ? 0.8 : 1,
          alignSelf: fullWidth ? 'stretch' : 'flex-start',
        } as ViewStyle,
        typeof style === 'function' ? style(state) : style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={fg} size={size === 'sm' ? 'small' : 'small'} />
      ) : (
        <>
          {icon}
          <Text style={{ color: fg, fontWeight: '700', fontSize }}>{label}</Text>
          {trailingIcon}
        </>
      )}
    </Pressable>
  );
}
