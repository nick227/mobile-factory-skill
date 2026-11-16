import React from 'react';
import { View } from 'react-native';
import { Text } from '../primitives/Text';
import { tokens } from '../foundation/tokens';
export interface SectionHeaderProps { title:string; description?:string; action?:React.ReactNode; }
export function SectionHeader({title,description,action}:SectionHeaderProps){return <View style={{flexDirection:'row',alignItems:'center',gap:tokens.spacing.sm}}><View style={{flex:1,gap:tokens.spacing.xs}}><Text variant="heading">{title}</Text>{description?<Text variant="small" muted>{description}</Text>:null}</View>{action}</View>}
