import React, { useState } from 'react';
import { FlatList, Pressable, SafeAreaView, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import registry from '@factory/catalog/registry.json';
import { Text, Badge, useTheme, tokens, SegmentedControl } from '@factory/ui';
const scenarios = [
  { id: 'eventDiscovery', name: 'Event Discovery & Booking', description: 'Curated editorial feed, story rail, filters, calendar booking, dialog confirmation', category: 'editorial' },
  { id: 'marketplaceCommerce', name: 'Artisan Marketplace & Cart', description: 'Product showcase cards, category filters, selection dock, and checkout modal', category: 'commerce' },
  { id: 'onboardingCheckout', name: 'Creator Onboarding & Checkout', description: 'Multi-step wizard, discipline gallery, tier selection, and live provisioning', category: 'onboarding' },
  { id: 'progressDashboard', name: 'Residency Progress Dashboard', description: 'Studio KPI spotlight, residency milestone roadmap, and workshop protocol tabs', category: 'dashboard' },
  { id: 'activityTimeline', name: 'Pavilion Construction Hub', description: 'Live architectural audit logs, on-site quality punch lists, and site visit calendar', category: 'collaboration' },
  { id: 'focus', name: 'Focus-First Journey', description: 'Minimalist single-task focus sequence with calm loading and error recovery', category: 'focus' },
  { id: 'settings', name: 'Settings & Preferences', description: 'Grouped configuration options, toggles, and account profiles', category: 'settings' },
  { id: 'search', name: 'Search & Results Feed', description: 'Instant search filtering, result count badges, and empty states', category: 'search' },
  { id: 'form', name: 'Form & Input Stages', description: 'Controlled form validation, error states, and responsive actions', category: 'form' },
] as const;
const categories = ['foundation','primitives','controls','composites','patterns'] as const;
export default function Index() {
 const [query,setQuery]=useState('');const [tab,setTab]=useState('components');const [category,setCategory]=useState('all');const {colors}=useTheme();
 const items=registry.filter(item=>(category==='all'||item.category===category)&&`${item.name} ${item.category} ${item.id}`.toLowerCase().includes(query.toLowerCase()));
 return <SafeAreaView style={{flex:1,backgroundColor:colors.background}}><View style={{padding:16,gap:12}}><Text variant="title">Mobile UI Lab</Text><Text muted>Canonical source · Interactive previews · Scenario testing</Text><SegmentedControl label="Lab section" value={tab} onValueChange={setTab} options={[{label:'Components',value:'components'},{label:'Scenarios',value:'scenarios'}]}/>{tab==='components'?<><TextInput accessibilityLabel="Search components" placeholder="Search component catalog" placeholderTextColor={colors.muted} value={query} onChangeText={setQuery} style={{padding:12,borderWidth:1,borderColor:colors.border,backgroundColor:colors.surface,color:colors.text,borderRadius:tokens.radius.md}}/><View style={{flexDirection:'row',flexWrap:'wrap',gap:6}}><Pressable onPress={()=>setCategory('all')} accessibilityRole="button" style={{padding:5}}><Text variant="small" muted={category!=='all'}>All</Text></Pressable>{categories.filter(x=>x!=='foundation').map(c=><Pressable key={c} onPress={()=>setCategory(c)} accessibilityRole="button" style={{padding:5}}><Text variant="small" muted={category!==c}>{c}</Text></Pressable>)}</View></>:null}</View>
 {tab==='scenarios'?<FlatList data={scenarios} keyExtractor={x=>x.id} renderItem={({item})=><Pressable accessibilityRole="button" onPress={()=>router.push({pathname:'/scenario/[id]',params:{id:item.id}})} style={{padding:16,marginHorizontal:16,marginVertical:6,backgroundColor:colors.surface,borderRadius:12,borderWidth:1,borderColor:colors.border,gap:6}}><View style={{flexDirection:'row',justifyContent:'space-between',alignItems:'center'}}><Text variant="heading">{item.name}</Text><Badge label={item.category} tone="accent"/></View><Text muted variant="small">{item.description}</Text></Pressable>}/>:<FlatList data={items} keyExtractor={item=>item.id} ListEmptyComponent={<Text style={{padding:24}}>No components match this search.</Text>} renderItem={({item})=><Pressable accessibilityRole="button" onPress={()=>router.push({pathname:'/component/[id]',params:{id:item.id}})} style={{padding:16,marginHorizontal:16,marginVertical:4,borderRadius:12,backgroundColor:colors.surface,gap:8}}><Text variant="heading">{item.name}</Text><View style={{flexDirection:'row',gap:8}}><Badge label={item.category}/><Badge label={item.status}/></View></Pressable>}/>}
 </SafeAreaView>;
}
