// Engineering exceptions are optional content-level contracts, NOT a new decision batch.
// They authorize a bounded scope to be implemented later; they never imply executable code exists.
import * as pages from './pages.mjs';
import { routeFile } from './assembler.mjs';
const ID=/^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/;
const REQUIREMENT=/^[a-z][a-z0-9]*(?:[.-][a-z0-9]+)*$/;
const object=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
const keys=(x,allowed,at)=>{
  if(!object(x))throw Error(at+': expected object');
  for(const key of Object.keys(x))if(!allowed.includes(key))throw Error(at+': unknown key '+key);
};
const text=(x,at)=>{if(typeof x!=='string'||!x.trim())throw Error(at+': nonempty string required');return x.trim();};
const strings=(x,at,nonempty=false)=>{
  if(!Array.isArray(x)||(nonempty&&!x.length)||x.some(v=>typeof v!=='string'||!v.trim())||new Set(x).size!==x.length)
    throw Error(at+': expected unique '+(nonempty?'nonempty ':'')+'string array');
  return x;
};
export function resolve(input=[],context={}){
  if(!Array.isArray(input))throw Error('engineering: expected array');
  const knownPages=new Map();
  if(context.pages&&context.type&&context.objects&&context.capabilities){
    const graph=pages.resolve(context.pages,context.type,context.objects,context.capabilities);
    for(const page of graph.pages)knownPages.set(page.id,page);
  }
  const ids=new Set(),routes=new Set();
  return input.map((item,i)=>{
    const at='engineering['+i+']';
    keys(item,['id','requirement','strategy','reason','contract','acceptance','platforms','page'],at);
    if(typeof item.id!=='string'||!ID.test(item.id))throw Error(at+'.id: invalid identifier');
    if(ids.has(item.id))throw Error(at+'.id: duplicate '+item.id);
    ids.add(item.id);
    if(typeof item.requirement!=='string'||!REQUIREMENT.test(item.requirement))
      throw Error(at+'.requirement: expected requirement ID such as audio.range-selection');
    if(!['extension','adapter','ejection'].includes(item.strategy))throw Error(at+'.strategy: extension | adapter | ejection');
    text(item.reason,at+'.reason');
    keys(item.contract,['inputs','outputs','events'],at+'.contract');
    for(const field of ['inputs','outputs','events']){
      strings(item.contract[field]??[],at+'.contract.'+field);
      if((item.contract[field]??[]).some(v=>!ID.test(v)))throw Error(at+'.contract.'+field+': expected field IDs');
    }
    if(!(item.contract.outputs?.length||item.contract.events?.length))throw Error(at+'.contract: outputs or events required');
    const wire=[...(item.contract.inputs??[]),...(item.contract.outputs??[]),...(item.contract.events??[])];
    if(new Set(wire).size!==wire.length)throw Error(at+'.contract: names must be unique across inputs, outputs and events');
    strings(item.acceptance,at+'.acceptance',true);
    const platforms=item.platforms??['ios','android'];
    strings(platforms,at+'.platforms',true);
    if(platforms.some(p=>!['ios','android'].includes(p)))throw Error(at+'.platforms: ios | android only');
    if(item.strategy!=='ejection'&&item.page!==undefined)throw Error(at+'.page: only ejections can name a page');
    let scope;
    if(item.strategy==='ejection'){
      if(typeof item.page!=='string'||!knownPages.has(item.page))throw Error(at+'.page: registered selected page required');
      const route=routeFile(knownPages.get(item.page).route);
      if(routes.has(route))throw Error(at+': multiple ejections target '+route);
      routes.add(route);
      scope=[route];
    }else scope=[(item.strategy==='extension'?'src/extensions/':'src/adapters/')+item.id+'/**'];
    return {id:item.id,requirement:item.requirement,strategy:item.strategy,reason:item.reason.trim(),
      contract:{inputs:[...(item.contract.inputs??[])],outputs:[...(item.contract.outputs??[])],events:[...(item.contract.events??[])]},
      scope,acceptance:[...item.acceptance],platforms:[...platforms],
      ...(item.strategy==='ejection'?{page:item.page}:{}),status:'planned'};
  });
}
export function fromProject(p,selection=p.batches?.selections?.content){
  const s=p.batches?.selections;
  if(!s)throw Error('engineering: batch planning required');
  return resolve(selection?.engineering??[],{
    type:s.classification?.type,objects:s.objects,
    capabilities:s.functionality,pages:s.pages
  });
}
