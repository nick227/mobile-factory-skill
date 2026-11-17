// Deterministic bridge from validated page IDs to Monad AppSpec page contracts.
// MR 6 produces a DRAFT executable preview using synthetic fixture data.
// MR 7 owns final editorial content, signed approval, and final spec materialization.
import * as inventory from './pages.mjs';
import * as functionality from './functionality.mjs';
import { ARCHETYPE_COMPAT, validateSpec } from './assembler.mjs';

const ID=/^[a-z][a-z0-9-]*$/;
const isObj=v=>v!==null&&typeof v==='object'&&!Array.isArray(v);
const only=(v,allowed,where)=>{
  if(!isObj(v))throw Error(where+': expected an object');
  for(const k of Object.keys(v))if(!allowed.includes(k))throw Error(where+': unknown key '+k);
};
const field=(v,where)=>{
  if(typeof v!=='string'||!ID.test(v))throw Error(where+': expected a field ID');
  return v;
};
const fields=(v,where,required=false)=>{
  if(!Array.isArray(v)||(required&&!v.length)||v.some(x=>typeof x!=='string'||!ID.test(x))||new Set(v).size!==v.length)
    throw Error(where+': expected unique field IDs'+(required?' (nonempty)':''));
  return v;
};
const titleCase=s=>s.split(/[.-]/).map(x=>x[0].toUpperCase()+x.slice(1)).join(' ');
const prop=f=>'{'+f+'}';
const pageId=id=>id.replace(/\./g,'-');
const op=id=>id.split('.').at(-1);
const supported=new Set(['view','search','filter','create','update','remove','complete','pause','progress','add-to-cart','checkout','reschedule','cancel','publish','react','send','read-only']);
const mutableToggle=new Set(['complete','pause','add-to-cart','cancel','publish','react']);
const mutationForm=new Set(['create','update','reschedule','send']);

/** Inspect a complete selection; all selected page IDs must be explicitly composed. */
export function compile(selection, context) {
  const {type,objects,capabilities,pages,name='Draft Preview'}=context;
  const graph=inventory.resolve(pages,type,objects,capabilities);
  const active=functionality.resolve(capabilities,objects);
  only(selection,graph.pages.map(p=>p.id),'composition');
  for(const p of graph.pages)if(!(p.id in selection))throw Error('composition: missing '+p.id);
  const byId=new Map(graph.pages.map(p=>[p.id,p]));
  const dataFields=new Map();
  const booleanFields=new Set();
  const addField=(src,f)=>{
    if(!src)return;
    if(!dataFields.has(src))dataFields.set(src,new Map());
    if(!dataFields.get(src).has(f))dataFields.get(src).set(f,f==='progress'?0:'Sample '+titleCase(f));
  };
  const spec={name,data:{},pages:{}};
  const achieved=new Set();
  const nav=(page,to,placement,subject,events,specPage)=>{
    if(!page.links.includes(to))throw Error('composition.'+page.id+': navigation to '+to+' not listed in page catalog');
    const target=byId.get(to);
    if(!target)throw Error('composition.'+page.id+': missing target '+to);
    const dynamic=/\[([^\]]+)\]/.exec(target.route);
    if(dynamic&&(placement!=='select'&&placement!=='action'))throw Error('composition.'+page.id+': dynamic target needs row or detail record context');
    if(dynamic&&(!page.object||page.object!==target.object))throw Error('composition.'+page.id+': dynamic route requires matching object namespace');
    if(placement==='select'&&subject.kind!=='collection')throw Error('composition.'+page.id+': select navigation requires collection');
    if(placement==='action'&&subject.kind!=='detail')throw Error('composition.'+page.id+': action navigation requires detail');
    const event='navigate-'+pageId(to);
    events[event]=[{navigate:target.route,...(dynamic?{params:{[dynamic[1]]:'{id}'}}:{})}];
    const label=titleCase(to.split('.').at(-1));
    if(placement==='select')subject.onSelect=event;
    if(placement==='primary') {
      if(specPage.primary)throw Error('composition.'+page.id+': multiple primary actions');
      specPage.primary={label,event};
    }
    if(placement==='header') {
      if(specPage.headerAction)throw Error('composition.'+page.id+': multiple header actions');
      specPage.headerAction={label,event};
    }
    if(placement==='action')subject.actions.push({label,event});
  };
  for(const page of graph.pages){
    const raw=selection[page.id],where='composition.'+page.id;
    only(raw,['kind','archetype','bindings','navigation','actions'],where);
    const {kind,archetype}=raw;
    if(!ARCHETYPE_COMPAT[archetype]||!ARCHETYPE_COMPAT[archetype].includes(kind))
      throw Error(where+': incompatible Monad archetype and subject kind');
    if(!['collection','detail','form','settings','message'].includes(kind))throw Error(where+': unknown subject kind');
    if(page.object===null&&!['message','settings','form'].includes(kind))throw Error(where+': no object available for '+kind);
    if(page.object!==null&&['settings','message'].includes(kind))throw Error(where+': '+kind+' cannot silently discard bound object');
    const bindings=raw.bindings??{};
    const allowed=kind==='collection'?['title','description','search','filter','media']:
      kind==='detail'?['heading','hero','body','facts','media','progress','unit']:
      kind==='form'?['fields']:kind==='settings'?['groups']:['heading','body'];
    only(bindings,allowed,where+'.bindings');
    let subject;
    if(kind==='collection'){
      field(bindings.title,where+'.bindings.title');
      if(bindings.description!==undefined)field(bindings.description,where+'.bindings.description');
      if(bindings.media!==undefined)field(bindings.media,where+'.bindings.media');
      subject={kind,source:page.object,title:prop(bindings.title),...(bindings.description?{description:prop(bindings.description)}:{}),...(bindings.media?{media:{field:bindings.media,ratio:1.5}}:{})};
      for(const k of [bindings.title,bindings.description,bindings.media].filter(Boolean))addField(page.object,k);
      if(bindings.search!==undefined){
        fields(bindings.search,where+'.bindings.search',true);
        subject.search={fields:bindings.search};
        for(const k of bindings.search)addField(page.object,k);
      }
      if(bindings.filter!==undefined){
        field(bindings.filter,where+'.bindings.filter');
        addField(page.object,bindings.filter);
        subject.segments=[{label:'All'},{label:'Active',where:{[bindings.filter]:true}}];
      }
    } else if(kind==='detail'){
      field(bindings.heading,where+'.bindings.heading');
      if(archetype==='glance-dashboard')field(bindings.hero,where+'.bindings.hero');
      else if(bindings.hero!==undefined)throw Error(where+': hero slot requires glance-dashboard');
      if(bindings.body!==undefined)field(bindings.body,where+'.bindings.body');
      if(bindings.media!==undefined)field(bindings.media,where+'.bindings.media');
      if(bindings.progress!==undefined)field(bindings.progress,where+'.bindings.progress');
      if(bindings.unit!==undefined)field(bindings.unit,where+'.bindings.unit');
      fields(bindings.facts??[],where+'.bindings.facts');
      subject={kind,source:page.object,heading:prop(bindings.heading),actions:[],...(archetype==='glance-dashboard'?{glance:{value:prop(bindings.hero),label:prop(bindings.heading),...(bindings.progress?{progressField:bindings.progress}:{}),...(bindings.unit?{unit:prop(bindings.unit)}:{})}}:{}),...(bindings.body?{body:prop(bindings.body)}:{}),
        ...(bindings.media?{media:{field:bindings.media,ratio:1.5}}:{}),
        ...(bindings.facts?.length?{facts:bindings.facts.map(k=>({label:titleCase(k),value:prop(k)}))}:{})};
      for(const k of [bindings.heading,bindings.hero,bindings.body,bindings.media,bindings.progress,bindings.unit,...(bindings.facts??[])].filter(Boolean))addField(page.object,k);
      if(bindings.progress)dataFields.get(page.object).set(bindings.progress,0);
    } else if(kind==='form'){
      fields(bindings.fields,where+'.bindings.fields',true);
      if(!page.object)throw Error(where+': form needs bound object');
      bindings.fields.forEach(f=>addField(page.object,f));
      subject={kind,source:page.object,mode:page.route.includes('[id]')?'edit':'create',fields:bindings.fields.map(k=>({key:k,label:titleCase(k),type:'text',required:true}))};
    } else if(kind==='settings'){
      if(!Array.isArray(bindings.groups)||!bindings.groups.length||bindings.groups.some(g=>typeof g!=='string'||!ID.test(g)))
        throw Error(where+': settings needs group IDs');
      subject={kind,groups:bindings.groups.map(g=>({title:titleCase(g)}))};
    } else {
      if(bindings.heading!==undefined)field(bindings.heading,where+'.bindings.heading');
      if(bindings.body!==undefined)field(bindings.body,where+'.bindings.body');
      subject={kind,heading:titleCase(page.id.split('.').at(-1))};
    }
    const compiled={route:page.route,title:titleCase(page.id.split('.').at(-1)),archetype,subject};
    const events={};
    const n=raw.navigation??[];
    if(!Array.isArray(n))throw Error(where+'.navigation: expected array');
    for(const [i,v] of n.entries()){
      only(v,['to','placement'],where+'.navigation['+i+']');
      if(!['select','action','primary','header'].includes(v.placement))throw Error(where+': invalid navigation placement');
      nav(page,v.to,v.placement,subject,events,compiled);
    }
    const a=raw.actions??[];
    if(!Array.isArray(a))throw Error(where+'.actions: expected array');
    for(const [i,v] of a.entries()){
      only(v,['id','placement','field'],where+'.actions['+i+']');
      if(!active.some(cap=>cap.id===v.id))throw Error(where+': action '+v.id+' was not selected in functionality');
      if(!page.covers.includes(v.id))throw Error(where+': capability '+v.id+' is not assigned to this page');
      if(!['primary','action'].includes(v.placement))throw Error(where+': invalid capability placement');
      if(v.placement==='action'&&kind!=='detail')throw Error(where+': action placement requires detail');
      const operation=op(v.id);
      if(!supported.has(operation)||['view','search','filter','progress','read-only'].includes(operation))
        throw Error(where+': '+v.id+' has no executable action mapping');
      const event='cap-'+operation;
      if(events[event])throw Error(where+': repeated capability action '+v.id);
      let ops;
      if(mutableToggle.has(operation)){
        if(kind!=='detail')throw Error(where+': '+v.id+' toggle requires detail subject');
        field(v.field,where+'.actions['+i+'].field');addField(page.object,v.field);booleanFields.add(page.object+'.'+v.field);
        ops=[{toggle:page.object,field:v.field}];
      }else if(mutationForm.has(operation)){
        if(kind!=='form')throw Error(where+': '+v.id+' requires form subject');
        if(operation==='create'||operation==='send')ops=[{create:page.object,from:'form'}];
        else ops=[{update:page.object,from:'form'}];
      }else if(operation==='remove'){
        if(kind!=='detail')throw Error(where+': remove requires detail');
        ops=[{confirm:{title:'Remove item?',description:'This cannot be undone.',destructive:true},then:[{remove:page.object},{back:true}]}];
      }else if(operation==='checkout'){
        ops=[{notice:'Checkout preview only',tone:'info'}];
      }else throw Error(where+': unsupported action '+operation);
      events[event]=ops;
      const action={label:titleCase(operation),event};
      if(v.placement==='primary'){
        if(compiled.primary)throw Error(where+': multiple primary actions');
        compiled.primary=action;
      }else subject.actions.push(action);
      achieved.add(v.id);
    }
    if(kind==='form'&&!compiled.primary)throw Error(where+': form needs an executable primary submit action');
    for(const cap of active){
      if(!page.covers.includes(cap.id))continue;
      const operation=cap.operation;
      if(operation==='view'&&kind==='detail')achieved.add(cap.id);
      if(operation==='view'&&kind==='collection'&&subject.onSelect)achieved.add(cap.id);
      if(operation==='search'&&kind==='collection'&&subject.search)achieved.add(cap.id);
      if(operation==='filter'&&kind==='collection'&&subject.segments)achieved.add(cap.id);
      if(operation==='progress'&&kind==='detail'&&archetype==='glance-dashboard'&&bindings.progress)achieved.add(cap.id);
    }
    if(Object.keys(events).length)compiled.events=events;
    spec.pages[pageId(page.id)]=compiled;
  }
  for(const cap of active){
    if(cap.operation==='read-only')continue;
    if(cap.id==='auth.basic')throw Error('composition: auth.basic requires a real auth implementation; not available in presentation runtime');
    if(!achieved.has(cap.id))throw Error('composition: selected capability '+cap.id+' has no executable page binding');
  }
  // Fixture data is intentionally synthetic and must be replaced by the editorial batch.
  for(const name of new Set(graph.pages.map(p=>p.object).filter(Boolean))){
    const mock={id:name+'-sample'};
    for(const [key,value] of dataFields.get(name)??[])mock[key]=booleanFields.has(name+'.'+key)?false:value;
    spec.data[name]=[mock];
  }
  // Retain all declared object namespaces even when no page displays them yet.
  for(const name of new Set(graph.pages.map(p=>p.object).filter(Boolean)))spec.data[name]??=[];
  const checked=validateSpec(spec);
  if(!checked.ok)throw Error('composition: AppSpec validation failed: '+checked.errors.join('; '));
  return {spec,status:'draft',source:'catalog-composition',warnings:checked.warnings};
}
