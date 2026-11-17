import React from 'react';
import { View } from 'react-native';
import { useTheme } from '../foundation/theme';
export interface ProgressBarProps { value:number; max?:number; label:string; }
export function ProgressBar({value,max=100,label}:ProgressBarProps){
 const {colors,tokens}=useTheme();const pct=Math.max(0,Math.min(100,max>0?value/max*100:0));return <View accessibilityRole="progressbar" accessibilityLabel={label} accessibilityValue={{min:0,max:100,now:Math.round(pct)}} style={{height:8,backgroundColor:colors.border,borderRadius:tokens.radius.full,overflow:'hidden'}}><View style={{height:'100%',backgroundColor:colors.primary,width:`${pct}%`}} /></View>;
}
