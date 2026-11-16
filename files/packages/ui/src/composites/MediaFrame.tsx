import React, {useState} from 'react';
import { View, type ImageStyle } from 'react-native';
import { Image, type ImageSource } from 'expo-image';
import { useTheme } from '../foundation/theme';
import { geometry } from '../foundation/tokens';
export interface MediaFrameProps { source?: ImageSource | string | number | null; ratio: number; fit?: 'cover'|'contain'; placeholder?: ImageSource | string | number; label?: string; radius?: number; style?: ImageStyle; }
export function MediaFrame({source,ratio,fit='cover',placeholder,label,radius=16,style}:MediaFrameProps){
 const {colors}=useTheme(); const [failed,setFailed]=useState(false);
 const usable=Number.isFinite(ratio)&&ratio>0?ratio:geometry.mediaRatios.square;
 return <View style={{width:'100%',aspectRatio:usable,borderRadius:radius,overflow:'hidden',backgroundColor:colors.surface}}>
  {source && !failed?<Image source={source} placeholder={placeholder} contentFit={fit} transition={0} cachePolicy="memory-disk" accessibilityLabel={label} onError={()=>setFailed(true)} style={[{width:'100%',height:'100%'},style]}/>:null}
 </View>;
}
