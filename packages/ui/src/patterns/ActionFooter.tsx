import React from 'react';
import { View } from 'react-native';
import { Button, type ButtonProps } from '../controls/Button';
import { useTheme } from '../foundation/theme';
import { tokens } from '../foundation/tokens';
export interface ActionFooterProps {primary:ButtonProps; secondary?:ButtonProps; }
export function ActionFooter({primary,secondary}:ActionFooterProps){const {colors}=useTheme();return <View style={{borderTopWidth:1,borderColor:colors.border,padding:tokens.spacing.lg,gap:tokens.spacing.sm,backgroundColor:colors.background}}><Button {...primary} fullWidth/>{secondary?<Button {...secondary} variant={secondary.variant??'ghost'} fullWidth/>:null}</View>}
