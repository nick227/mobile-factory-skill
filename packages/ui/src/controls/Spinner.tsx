import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { Text } from '../primitives/Text';
import { useTheme } from '../foundation/theme';
export interface SpinnerProps { label?:string; size?:'small'|'large'; }
export function Spinner({label='Loading',size='small'}:SpinnerProps){
 const {colors,tokens}=useTheme();return <View accessibilityRole="progressbar" accessibilityLabel={label} style={{flexDirection:'row',alignItems:'center',gap:tokens.spacing.sm}}><ActivityIndicator size={size} color={colors.primary}/><Text variant="small" muted>{label}</Text></View>;
}
