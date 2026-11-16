import React from 'react';
import { ScrollView, View } from 'react-native';
import { useLocalSearchParams, Stack as RouterStack } from 'expo-router';
import { useTheme, Text, ThemeProvider } from '@factory/ui';
import { scenarios } from '../../scenarios';
export default function ScenarioPage(){const {id}=useLocalSearchParams<{id:string}>();const {colors}=useTheme();const Scenario=scenarios[id];return <ThemeProvider mode={null}><ScrollView style={{flex:1,backgroundColor:colors.background}} contentContainerStyle={{padding:20}}><RouterStack.Screen options={{title:id}}/>{Scenario?<Scenario/>:<Text>Scenario not found</Text>}</ScrollView></ThemeProvider>}
