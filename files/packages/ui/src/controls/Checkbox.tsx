import React from 'react';
import { Pressable, View } from 'react-native';
import { Text } from '../primitives/Text';
import { useTheme } from '../foundation/theme';
import { tokens } from '../foundation/tokens';
export interface CheckboxProps {label:string; value:boolean; onValueChange:(value:boolean)=>void; disabled?:boolean; }
export function Checkbox({label,value,onValueChange,disabled=false}:CheckboxProps){
 const {colors}=useTheme();return <Pressable accessibilityRole="checkbox" accessibilityLabel={label} accessibilityState={{checked:value,disabled}} disabled={disabled} onPress={()=>onValueChange(!value)} style={({pressed})=>({flexDirection:'row',gap:tokens.spacing.md,alignItems:'center',minHeight:48,opacity:disabled?0.4:pressed?0.7:1})}><View style={{width:22,height:22,borderRadius:tokens.radius.sm,borderWidth:2,borderColor:value?colors.primary:colors.border,backgroundColor:value?colors.primary:'transparent',alignItems:'center',justifyContent:'center'}}>{value?<Text style={{color:colors.onPrimary,fontSize:14,fontWeight:'700'}}>✓</Text>:null}</View><Text>{label}</Text></Pressable>;
}
