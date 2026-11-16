import React from 'react';
import { View, Pressable } from 'react-native';
import { Text } from '../primitives/Text';
import { useTheme } from '../foundation/theme';
import { tokens } from '../foundation/tokens';
export interface RadioOption { label:string; value:string; disabled?:boolean; }
export interface RadioGroupProps { label:string; value:string; options:RadioOption[]; onValueChange:(value:string)=>void; }
export function RadioGroup({label,value,options,onValueChange}:RadioGroupProps){
 const {colors}=useTheme(); return <View accessibilityRole="radiogroup" accessibilityLabel={label} style={{gap:tokens.spacing.xs}}><Text variant="small" style={{fontWeight:'700'}}>{label}</Text>{options.map(o=><Pressable key={o.value} accessibilityRole="radio" accessibilityState={{checked:value===o.value,disabled:o.disabled}} disabled={o.disabled} onPress={()=>onValueChange(o.value)} style={{minHeight:48,flexDirection:'row',alignItems:'center',gap:tokens.spacing.md,opacity:o.disabled?0.4:1}}><View style={{width:22,height:22,borderRadius:11,borderColor:value===o.value?colors.primary:colors.border,borderWidth:value===o.value?6:2}}/><Text>{o.label}</Text></Pressable>)}</View>;
}
