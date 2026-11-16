import React from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../foundation/theme';
import { geometry } from '../foundation/tokens';
export interface ActionDockProps { children: React.ReactNode; separated?: boolean; }
export function ActionDock({children,separated=false}:ActionDockProps){const insets=useSafeAreaInsets();const {colors}=useTheme();return <View style={{backgroundColor:colors.background,paddingHorizontal:geometry.screenGutter,paddingTop:12,paddingBottom:Math.max(insets.bottom,12),borderTopWidth:separated?1:0,borderColor:colors.border}}>{children}</View>}
