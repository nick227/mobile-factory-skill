import React from 'react';
import { Image, View } from 'react-native';
import { Text } from '../primitives/Text';
import { useTheme } from '../foundation/theme';
export interface AvatarProps { name:string; uri?:string; size?:number; }
export function Avatar({name,uri,size=44}:AvatarProps){
 const {colors}=useTheme();const initials=name.trim().split(/\s+/).slice(0,2).map(x=>x[0]||'').join('').toUpperCase(); const shape={width:size,height:size,borderRadius:size/2};return uri?<Image source={{uri}} accessibilityLabel={name} style={shape}/>:<View accessibilityLabel={name} style={[shape,{backgroundColor:colors.surface,alignItems:'center',justifyContent:'center'}]}><Text style={{fontSize:Math.max(12,size*0.3),fontWeight:'700'}}>{initials || '?'}</Text></View>;
}
