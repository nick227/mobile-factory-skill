import React from 'react';
import { Pressable, View, type PressableProps } from 'react-native';
import { Text } from '../primitives/Text';
import { useTheme } from '../foundation/theme';

export interface ListItemProps extends Omit<PressableProps, 'children'> {
  title: string;
  description?: string;
  leading?: React.ReactNode;
  trailing?: React.ReactNode;
  showChevron?: boolean;
}

export function ListItem({
  title,
  description,
  leading,
  trailing,
  showChevron,
  style,
  ...props
}: ListItemProps) {
  const { colors, tokens } = useTheme();
  const isInteractive = Boolean(props.onPress);
  const shouldShowChevron = showChevron ?? (isInteractive && !trailing);

  return (
    <Pressable
      {...props}
      accessibilityRole={isInteractive ? 'button' : undefined}
      style={(state) => [
        {
          minHeight: 56,
          paddingVertical: tokens.spacing.md,
          flexDirection: 'row',
          alignItems: 'center',
          gap: tokens.spacing.md,
          opacity: state.pressed && isInteractive ? 0.7 : 1,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        },
        typeof style === 'function' ? style(state) : style,
      ]}
    >
      {leading}
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={{ fontWeight: '600' }}>{title}</Text>
        {description ? <Text muted variant="small">{description}</Text> : null}
      </View>
      {trailing}
      {shouldShowChevron && (
        <Text style={{ color: colors.muted, fontSize: 20, fontWeight: '300' }}>›</Text>
      )}
    </Pressable>
  );
}
