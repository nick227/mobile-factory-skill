import React from 'react';
import { View } from 'react-native';
import { Text } from '../primitives/Text';
import { useTheme } from '../foundation/theme';
export interface FormFieldProps { label:string; hint?:string; error?:string; children:React.ReactNode; }
export function FormField({label,hint,error,children}:FormFieldProps){const {colors,tokens}=useTheme();return <View style={{gap:tokens.spacing.xs}}><Text variant="small" style={{fontWeight:'700'}}>{label}</Text>{children}{error?<Text accessibilityRole="alert" variant="small" style={{color:colors.danger}}>{error}</Text>:hint?<Text variant="small" muted>{hint}</Text>:null}</View>}
