import React from 'react';
import { View } from 'react-native';
import { Text } from '../primitives/Text';
export interface InputStageProps { title: string; description?: string; children: React.ReactNode; }
export function InputStage({title,description,children}:InputStageProps){return <View style={{gap:16}}><Text variant="title">{title}</Text>{description?<Text muted>{description}</Text>:null}{children}</View>}
