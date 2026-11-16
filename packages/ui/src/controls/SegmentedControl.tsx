import React from 'react';
import { View, Pressable } from 'react-native';
import { Text } from '../primitives/Text';
import { useTheme } from '../foundation/theme';
import { tokens } from '../foundation/tokens';
export interface Segment {label:string; value:string;}
export interface SegmentedControlProps { value:string; onValueChange:(value:string)=>void; options:Segment[]; label:string; }
export function SegmentedControl({value,onValueChange,options,label}:SegmentedControlProps){
 const {colors}=useTheme();return <View accessibilityRole="radiogroup" accessibilityLabel={label} style={{flexDirection:'row',padding:3,backgroundColor:colors.surface,borderRadius:tokens.radius.md,gap:3}}>{options.map(o=><Pressable key={o.value} accessibilityRole="radio" accessibilityState={{checked:value===o.value}} onPress={()=>onValueChange(o.value)} style={{flex:1,minHeight:44,alignItems:'center',justifyContent:'center',backgroundColor:value===o.value?colors.background:'transparent',borderRadius:tokens.radius.sm}}><Text variant="small" style={{fontWeight:value===o.value?'700':'400'}}>{o.label}</Text></Pressable>)}</View>;
}
