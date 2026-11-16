import React from 'react';
import { View } from 'react-native';
import { useTheme } from '../foundation/theme';
export interface StepProgressProps { step: number; total: number; label?: string; }
export function StepProgress({step,total,label}:StepProgressProps){const {colors}=useTheme(); const count=Math.max(1,Math.floor(total));const current=Math.max(0,Math.min(count,Math.floor(step)));return <View accessibilityRole="progressbar" accessibilityLabel={label??'Progress'} accessibilityValue={{min:0,max:count,now:current}} style={{flexDirection:'row',gap:4,minHeight:5}}>{Array.from({length:count},(_,i)=><View key={i} style={{flex:1,height:4,borderRadius:3,backgroundColor:i<current?colors.primary:colors.border}} />)}</View>}
