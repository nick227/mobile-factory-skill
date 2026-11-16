import React,{useState} from 'react';
import { View, Pressable } from 'react-native';
import { Text, Button, TextField, Stack, ScreenHeader, StepProgress, InputStage, ActionDock, CalmSkeleton, MediaFrame, Badge, useTheme } from '@factory/ui';
const prompts=[{title:'Name the project',hint:'One descriptive name is enough.',label:'Project name'},{title:'Describe the goal',hint:'A short summary helps people understand it.',label:'Goal'},{title:'Choose the first action',hint:'What should happen next?',label:'First action'}];
export function FocusJourneyScenario(){
 const [stage,setStage]=useState<'collection'|'detail'|'edit'|'pending'>('collection');const [step,setStep]=useState(0);
 const [values,setValues]=useState(['Project Alpha','Share important updates','Invite the team']);
 const [slow,setSlow]=useState(false),[fail,setFail]=useState(false),[message,setMessage]=useState('');const {colors}=useTheme();
 const back=()=>{if(stage==='edit'&&step>0)setStep(s=>s-1);else {setStage(stage==='detail'?'collection':'detail');setMessage('')}};
 const save=()=>{if(slow){setStage('pending');return} finish()};
 const finish=()=>{if(fail){setStage('edit');setMessage('Save failed. Your changes are preserved. Retry when ready.')}else{setStage('detail');setMessage('Changes saved.')}};
 return <Stack gap="lg">
  <Text variant="small" muted>Journey · Collection → Detail → Focused edit → Return</Text>
  <Pressable accessibilityRole="switch" accessibilityState={{checked:slow}} onPress={()=>setSlow(!slow)}><Text>Simulate delayed save: {slow?'on':'off'}</Text></Pressable>
  <Pressable accessibilityRole="switch" accessibilityState={{checked:fail}} onPress={()=>setFail(!fail)}><Text>Simulate failed save: {fail?'on':'off'}</Text></Pressable>
  {stage==='collection'?<><ScreenHeader title="Projects"/><Button label={values[0]} variant="outline" fullWidth onPress={()=>setStage('detail')}/><Text muted>Tap the content to enter the detail experience.</Text></>:null}
  {stage==='detail'?<><ScreenHeader title="Project detail" onBack={back}/><MediaFrame ratio={16/9} label="Reserved project media"/><Text variant="title">{values[0]}</Text><Text>{values[1]}</Text><Text muted>{values[2]}</Text><ActionDock><Button label="Edit project" fullWidth onPress={()=>{setStep(0);setStage('edit');setMessage('')}}/></ActionDock></>:null}
  {stage==='edit'?<><ScreenHeader title="Edit project" onBack={back}/><StepProgress step={step+1} total={prompts.length}/><InputStage title={prompts[step].title} description={prompts[step].hint}><TextField label={prompts[step].label} value={values[step]} onChangeText={v=>setValues(old=>old.map((x,i)=>i===step?v:x))}/></InputStage><ActionDock><Button label={step===2?'Save changes':'Continue'} fullWidth disabled={!values[step].trim()} onPress={()=>step===2?save():setStep(s=>s+1)}/></ActionDock></>:null}
  {stage==='pending'?<><CalmSkeleton height={64}/><Text>Saving changes without moving the underlying layout.</Text><Button label="Complete simulated request" onPress={finish}/></>:null}
  {message?<Text style={{color:fail?colors.danger:colors.primary}}>{message}</Text>:null}
 </Stack>;
}
