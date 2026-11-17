import React from 'react';
import { Switch, View, type SwitchProps } from 'react-native';
import { Text } from '../primitives/Text';
import { useTheme } from '../foundation/theme';
export interface ToggleProps extends SwitchProps { label: string; description?: string; }
export function Toggle({label,description,...props}: ToggleProps) {
 const { colors, tokens } = useTheme();
 return <View style={{minHeight:48, flexDirection:'row',alignItems:'center',gap:tokens.spacing.md}}><View style={{flex:1,gap:tokens.spacing.xs}}><Text>{label}</Text>{description ? <Text variant="small" muted>{description}</Text> : null}</View><Switch {...props} accessibilityLabel={props.accessibilityLabel ?? label} trackColor={{false:colors.border,true:colors.primary}} /></View>;
}
