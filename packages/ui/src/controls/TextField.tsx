import React from 'react';
import { TextInput, View, type TextInputProps } from 'react-native';
import { Text } from '../primitives/Text';
import { useTheme } from '../foundation/theme';
import { tokens } from '../foundation/tokens';
export interface TextFieldProps extends TextInputProps { label: string; error?: string; hint?: string; }
export function TextField({ label, error, hint, style, ...props }: TextFieldProps) {
  const { colors } = useTheme();
  return <View style={{ gap: tokens.spacing.xs }}>
    <Text variant="small" style={{ fontWeight: '700' }}>{label}</Text>
    <TextInput {...props} accessibilityLabel={props.accessibilityLabel ?? label} placeholderTextColor={colors.muted} style={[{ color: colors.text, backgroundColor: colors.surface, borderWidth: 1, borderColor: error ? colors.danger : colors.border, borderRadius: tokens.radius.md, minHeight: 48, paddingHorizontal: tokens.spacing.md, fontSize: tokens.typography.body }, style]} />
    {error ? <Text variant="small" accessibilityRole="alert" style={{ color: colors.danger }}>{error}</Text> : hint ? <Text variant="small" muted>{hint}</Text> : null}
  </View>;
}
