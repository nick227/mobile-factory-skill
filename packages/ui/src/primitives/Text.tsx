import React from 'react';
import { Text as RNText, type TextProps as RNTextProps, type TextStyle } from 'react-native';
import { useTheme } from '../foundation/theme';
import { tokens } from '../foundation/tokens';

export type TextVariant = 'display' | 'title' | 'heading' | 'body' | 'small' | 'caption';

export interface TextProps extends RNTextProps {
  variant?: TextVariant;
  muted?: boolean;
  tabular?: boolean;
}

export function Text({
  variant = 'body',
  muted = false,
  tabular = false,
  style,
  ...props
}: TextProps) {
  const { colors } = useTheme();

  const fontSize =
    variant === 'display'
      ? tokens.typography.display
      : variant === 'title'
      ? tokens.typography.title
      : variant === 'heading'
      ? tokens.typography.heading
      : variant === 'small'
      ? tokens.typography.small
      : variant === 'caption'
      ? tokens.typography.caption
      : tokens.typography.body;

  const lineHeight = Math.round(fontSize * (variant === 'display' ? 1.2 : variant === 'title' ? 1.25 : variant === 'heading' ? 1.3 : 1.45));

  const fontWeight =
    variant === 'display' || variant === 'title' || variant === 'heading'
      ? '700'
      : '400';

  const textStyle: TextStyle = {
    color: muted ? colors.muted : colors.text,
    fontSize,
    lineHeight,
    fontWeight,
    ...(tabular ? { fontVariant: ['tabular-nums'] } : {}),
  };

  return <RNText {...props} style={[textStyle, style]} />;
}
