import React from 'react';
import { Text as RNText, type TextProps as RNTextProps } from 'react-native';
import { useTheme } from '../foundation/theme';
import { tokens } from '../foundation/tokens';
export interface TextProps extends RNTextProps { variant?: 'body' | 'small' | 'heading' | 'title'; muted?: boolean; }
export function Text({ variant = 'body', muted = false, style, ...props }: TextProps) {
  const { colors } = useTheme();
  const fontSize = variant === 'title' ? tokens.typography.title : variant === 'heading' ? tokens.typography.heading : variant === 'small' ? tokens.typography.small : tokens.typography.body;
  return <RNText {...props} style={[{ color: muted ? colors.muted : colors.text, fontSize, fontWeight: variant === 'heading' || variant === 'title' ? '700' : '400' }, style]} />;
}
