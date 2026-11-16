import React from 'react';
import { ActivityIndicator, Pressable, type PressableProps } from 'react-native';
import { tokens } from '../foundation/tokens';
import { useTheme } from '../foundation/theme';
export interface IconButtonProps extends Omit<PressableProps, 'children'> { icon: React.ReactNode; label: string; loading?: boolean; variant?: 'plain' | 'surface'; }
export function IconButton({ icon, label, loading = false, disabled, variant = 'plain', style, ...props }: IconButtonProps) {
 const { colors } = useTheme(); const inactive = Boolean(disabled || loading);
 return <Pressable {...props} accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ disabled: inactive, busy: loading }} disabled={inactive} style={s=>[{ minWidth: 48, minHeight: 48, alignItems: 'center', justifyContent: 'center', borderRadius: tokens.radius.md, backgroundColor: variant === 'surface' ? colors.surface : 'transparent', opacity: inactive ? 0.5 : s.pressed ? 0.75 : 1 }, typeof style === 'function' ? style(s) : style]}>{loading ? <ActivityIndicator color={colors.text}/> : icon}</Pressable>;
}
