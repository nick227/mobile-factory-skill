import React from 'react';
import { Pressable, View, type PressableProps } from 'react-native';
import { Text } from '../primitives/Text';
import { useTheme } from '../foundation/theme';
import { tokens } from '../foundation/tokens';
export interface ListItemProps extends Omit<PressableProps, 'children'> { title: string; description?: string; leading?: React.ReactNode; trailing?: React.ReactNode; }
export function ListItem({ title, description, leading, trailing, style, ...props }: ListItemProps) {
  const { colors } = useTheme();
  return <Pressable {...props} accessibilityRole={props.onPress ? 'button' : undefined} style={(state) => [
    { minHeight: 56, paddingVertical: tokens.spacing.md, flexDirection: 'row', alignItems: 'center', gap: tokens.spacing.md, opacity: state.pressed && props.onPress ? 0.7 : 1, borderBottomWidth: 1, borderBottomColor: colors.border },
    typeof style === 'function' ? style(state) : style,
  ]}>
    {leading}
    <View style={{ flex: 1, gap: tokens.spacing.xs }}><Text style={{ fontWeight: '600' }}>{title}</Text>{description ? <Text muted variant="small">{description}</Text> : null}</View>
    {trailing}
  </Pressable>;
}
