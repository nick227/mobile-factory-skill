import React from 'react';
import { View, Pressable } from 'react-native';
import { Text } from '../primitives/Text';
import { useTheme } from '../foundation/theme';
import { geometry } from '../foundation/tokens';
export interface ScreenHeaderProps { title: string; subtitle?: string; backLabel?: string; onBack?: () => void; trailing?: React.ReactNode; }
export function ScreenHeader({title,subtitle,backLabel='Back',onBack,trailing}:ScreenHeaderProps){
 const {colors}=useTheme();
 return <View style={{minHeight:56,flexDirection:'row',alignItems:'center',gap:12,paddingHorizontal:geometry.screenGutter}}>
  {onBack?<Pressable accessibilityRole="button" accessibilityLabel={backLabel} onPress={onBack} style={{minWidth:48,minHeight:48,justifyContent:'center'}}><Text style={{color:colors.primary}}>{backLabel}</Text></Pressable>:null}
  <View style={{flex:1}}><Text variant="heading" numberOfLines={2}>{title}</Text>{subtitle?<Text muted variant="small">{subtitle}</Text>:null}</View>
  {trailing}</View>;
}
