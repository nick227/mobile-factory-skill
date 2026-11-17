import React from 'react';
import { View } from 'react-native';
import { Text } from '../primitives/Text';
import { Stack } from '../primitives/Stack';
import { useTheme } from '../foundation/theme';
export interface EmptyStateProps { title:string; description?:string; action?:React.ReactNode; icon?:React.ReactNode; }
export function EmptyState({title,description,action,icon}:EmptyStateProps){const {tokens}=useTheme();return <View style={{padding:tokens.spacing.xl,alignItems:'center'}}><Stack align="center" gap="sm">{icon}<Text variant="heading" style={{textAlign:'center'}}>{title}</Text>{description?<Text muted style={{textAlign:'center'}}>{description}</Text>:null}{action}</Stack></View>}
