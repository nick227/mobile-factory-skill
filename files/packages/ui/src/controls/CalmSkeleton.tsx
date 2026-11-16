import React from 'react';
import { View, type ViewStyle } from 'react-native';
import { useTheme } from '../foundation/theme';
export interface CalmSkeletonProps { height: number; width?: number | `${number}%`; radius?: number; style?: ViewStyle; }
export function CalmSkeleton({height,width='100%',radius=12,style}:CalmSkeletonProps){const {colors}=useTheme();return <View accessible accessibilityLabel="Loading content" style={[{height,width,borderRadius:radius,backgroundColor:colors.surface},style]}/>}
