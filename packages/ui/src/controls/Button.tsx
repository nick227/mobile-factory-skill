import React from 'react';
import { ActivityIndicator, Pressable, type PressableProps, type ViewStyle } from 'react-native';
import { Text } from '../primitives/Text';
import { useTheme } from '../foundation/theme';
import { tokens } from '../foundation/tokens';
export interface ButtonProps extends Omit<PressableProps, 'children'> { label: string; variant?: 'primary' | 'secondary' | 'outline' | 'ghost'; loading?: boolean; fullWidth?: boolean; }
export function Button({ label, variant = 'primary', disabled, loading = false, fullWidth = false, style, onPress, ...props }: ButtonProps) {
  const { colors } = useTheme();
  const inactive = Boolean(disabled || loading);
  const solid = variant === 'primary';
  const bg = solid ? colors.primary : variant === 'secondary' ? colors.surface : 'transparent';
  const fg = solid ? colors.onPrimary : colors.text;
  const border = variant === 'outline' ? 1 : 0;
  return <Pressable {...props} accessibilityRole="button" accessibilityState={{ disabled: inactive, busy: loading }} disabled={inactive} onPress={onPress} style={(state) => [
    { minHeight: 48, borderRadius: tokens.radius.md, paddingHorizontal: tokens.spacing.lg, alignItems: 'center', justifyContent: 'center', backgroundColor: bg, borderWidth: border, borderColor: colors.border, opacity: inactive ? 0.45 : state.pressed ? 0.8 : 1, alignSelf: fullWidth ? 'stretch' : 'flex-start' } as ViewStyle,
    typeof style === 'function' ? style(state) : style,
  ]}>
    {loading ? <ActivityIndicator color={fg} /> : <Text style={{ color: fg, fontWeight: '700' }}>{label}</Text>}
  </Pressable>;
}
