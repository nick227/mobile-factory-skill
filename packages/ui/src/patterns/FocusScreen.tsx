import React from 'react';
import { View, KeyboardAvoidingView, Platform, ScrollView, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../foundation/theme';
import { geometry } from '../foundation/tokens';
export interface FocusScreenProps { children: React.ReactNode; top?: React.ReactNode; action?: React.ReactNode; style?: ViewStyle; }
export function FocusScreen({children,top,action,style}:FocusScreenProps){
 const insets=useSafeAreaInsets(); const {colors}=useTheme();
 return <KeyboardAvoidingView behavior={Platform.OS==='ios'?'padding':undefined} style={[{flex:1,backgroundColor:colors.background},style]}>
   <View style={{paddingTop:insets.top,paddingHorizontal:geometry.screenGutter}}>{top}</View>
   <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{flexGrow:1,justifyContent:'center',padding:geometry.screenGutter}}>{children}</ScrollView>
   {action?<View style={{paddingHorizontal:geometry.screenGutter,paddingTop:12,paddingBottom:Math.max(insets.bottom,12)}}>{action}</View>:null}
 </KeyboardAvoidingView>;
}
