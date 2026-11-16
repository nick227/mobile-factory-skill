import React, { useState } from 'react';
import { ScrollView, Switch, View } from 'react-native';
import { useLocalSearchParams, Stack as RouterStack } from 'expo-router';
import registry from '@factory/catalog/registry.json';
import { Text, Stack, Surface, ThemeProvider, useTheme, SegmentedControl } from '@factory/ui';
import { showcases } from '../../showcases/registry';
export default function ComponentPage() {
 const { id } = useLocalSearchParams<{id: string}>(); const item = registry.find(x=>x.id===id);
 const [mode,setMode]=useState('system');const {colors}=useTheme();const Demo=item?showcases[item.showcase]:undefined;
 return <ScrollView style={{flex:1,backgroundColor:colors.background}} contentContainerStyle={{padding:16}}><RouterStack.Screen options={{title:item?.name??'Component'}}/><Stack gap="lg"><Text muted>{item?.id??'Not found'} · {item?.status??'unknown'}</Text><Surface><SegmentedControl label="Preview theme" value={mode} onValueChange={setMode} options={[{label:'System',value:'system'},{label:'Light',value:'light'},{label:'Dark',value:'dark'}]}/></Surface><ThemeProvider mode={mode==='system'?null:mode==='dark'?'dark':'light'}><Preview>{Demo?<Demo/>:<Text>Showcase unavailable</Text>}</Preview></ThemeProvider><Text muted variant="small">This is the canonical @factory/ui implementation. Preview status does not imply device certification.</Text></Stack></ScrollView>;
}
function Preview({children}:{children:React.ReactNode}){const {colors}=useTheme();return <View style={{backgroundColor:colors.background,padding:20,borderColor:colors.border,borderWidth:1,borderRadius:12}}>{children}</View>}
