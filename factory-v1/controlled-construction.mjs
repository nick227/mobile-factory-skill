// Engineering construction: authorization, isolated agent work orders and non-bypassable scope checks.
// This module does not invoke an AI agent, perform native verification or assert production readiness.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';
import * as engine from './engine.mjs';
import * as editorial from './editorial.mjs';
import * as generator from './generate.mjs';
import * as assembler from './assembler.mjs';

const EXCLUDE=new Set(['.factory','.git','node_modules','.expo','dist']);
const sha=buffer=>crypto.createHash('sha256').update(buffer).digest('hex');
const json=(file)=>JSON.parse(fs.readFileSync(file,'utf8'));
const atomic=(file,value)=>{fs.mkdirSync(path.dirname(file),{recursive:true});const tmp=file+'.tmp';fs.writeFileSync(tmp,JSON.stringify(value,null,2)+'\n');fs.renameSync(tmp,file);};
const marker=dir=>path.join(dir,'.factory','engineering-authorization.json');
const taskDir=id=>'tests/engineering/'+id+'/';
const normalize=s=>s.replaceAll('\\','/');
const fileMatch=(rel,scope)=>scope.endsWith('/**')?rel.startsWith(scope.slice(0,-2)):rel===scope;
const workOrders=contracts=>contracts.map(c=>({
  id:c.id,requirement:c.requirement,strategy:c.strategy,reason:c.reason,
  contract:c.contract,platforms:c.platforms,acceptance:c.acceptance,
  allowedSource:c.scope,allowedTests:[taskDir(c.id)+'**'],
  restrictions:['Do not modify generated routes, UI library, runtime or factory state outside the authorized scope',
    'Do not claim production behavior from local mocks',
    'Add automated tests and verify the required platform behavior']
}));
function state(project){
  const p=engine.load(project);
  if(!editorial.approved(p))throw Error('Engineering authorization blocked: current blueprint is not explicitly approved');
  const material=editorial.materialize(p);
  if(!material.engineering.length)throw Error('Engineering authorization blocked: no approved exception contracts');
  if(p.approval.blueprintHash!==material.blueprintHash)throw Error('Engineering authorization blocked: blueprint hash mismatch');
  return {p,material};
}
function snapshot(dir){
  const out={};
  const walk=(base,relative='')=>{
    for(const entry of fs.readdirSync(base,{withFileTypes:true})){
      if(!relative&&EXCLUDE.has(entry.name))continue;
      const rel=relative?relative+'/'+entry.name:entry.name;
      const full=path.join(base,entry.name),stat=fs.lstatSync(full);
      if(stat.isSymbolicLink())throw Error('Engineering safety: symbolic link not allowed: '+rel);
      if(stat.isDirectory())walk(full,rel);
      else if(stat.isFile())out[normalize(rel)]=sha(fs.readFileSync(full));
      else throw Error('Engineering safety: unexpected file type: '+rel);
    }
  };
  walk(dir);return out;
}
function ejection(project,contract,material){
  const rel=contract.scope[0],manifestFile=path.join(project,'factory-assembly.json');
  const manifest=json(manifestFile),generated=path.join(project,rel);
  const pageId=contract.page.replaceAll('.','-');
  if(manifest.ejected?.[rel]){
    if(manifest.ejected[rel].pageId!==pageId)throw Error('Different page already ejected at '+rel);
    return;
  }
  if(!fs.existsSync(generated)||!manifest.files?.[rel]||sha(fs.readFileSync(generated))!==manifest.files[rel])
    throw Error('Refusing to eject a modified or unowned route: '+rel);
  const temp=fs.mkdtempSync(path.join(os.tmpdir(),'engineering-eject-'));
  try{
    const spec=path.join(temp,'app.spec.json');
    fs.writeFileSync(spec,JSON.stringify(material.spec));
    const result=assembler.ejectPage(spec,project,pageId);
    if(!result.ok)throw Error('AEP ejection failed: '+result.error);
  }finally{fs.rmSync(temp,{recursive:true,force:true});}
}
function approvedAuthorization(project){
  const {p,material}=state(project),file=marker(project);
  if(!fs.existsSync(file))throw Error('Run engineering prepare before verification');
  const auth=json(file);
  if(auth.revision!==p.revision||auth.blueprintHash!==material.blueprintHash)
    throw Error('Engineering authorization is stale; stop, review and prepare the newly approved blueprint');
  const contracts=material.engineering;
  if(JSON.stringify(auth.workOrders)!==JSON.stringify(workOrders(contracts)))
    throw Error('Engineering work orders differ from approved contracts');
  return {p,material,auth,contracts};
}
export function prepare(projectDir,{root}={}){
  const project=path.resolve(projectDir);
  const {p,material}=state(project);
  const file=marker(project);
  if(fs.existsSync(file)){
    const {auth}=approvedAuthorization(project);
    return {ok:true,prepared:true,unchanged:true,revision:p.revision,blueprintHash:material.blueprintHash,workOrders:auth.workOrders};
  }
  // Only the controlled workflow may request deterministic generation with pending code.
  const generated=generator.generate(project,{allowPending:true,...(root?{root}:{})});
  if(!generated.ok)throw Error('Engineering preparation blocked: '+(generated.error||generated.conflicts?.join(', ')));
  for(const contract of material.engineering.filter(x=>x.strategy==='ejection'))ejection(project,contract,material);
  const auth={schemaVersion:1,revision:p.revision,blueprintHash:material.blueprintHash,
    workOrders:workOrders(material.engineering),baseline:snapshot(project)};
  atomic(file,auth);
  return {ok:true,prepared:true,unchanged:false,revision:p.revision,
    blueprintHash:material.blueprintHash,workOrders:auth.workOrders,codeStatus:'pending'};
}
export function tasks(projectDir){
  const project=path.resolve(projectDir);
  const {auth}=approvedAuthorization(project);
  return {blueprintHash:auth.blueprintHash,workOrders:auth.workOrders};
}
export function inspect(projectDir,{runChecks=false}={}){
  const project=path.resolve(projectDir),{auth,contracts}=approvedAuthorization(project);
  const current=snapshot(project),before=auth.baseline;
  const changed=Object.keys({...before,...current}).filter(k=>before[k]!==current[k]).sort();
  const allowed=contracts.flatMap(c=>[...c.scope,taskDir(c.id)+'**']);
  const outside=changed.filter(k=>!allowed.some(scope=>fileMatch(k,scope)));
  const checks=contracts.map(c=>{
    const source=changed.filter(k=>c.scope.some(s=>fileMatch(k,s))&&current[k]);
    const tests=changed.filter(k=>fileMatch(k,taskDir(c.id)+'**')&&/\.test\.mjs$/.test(k)&&current[k]);
    const missing=[];
    if(!source.length)missing.push('No changed implementation source within approved scope');
    if(!tests.length)missing.push('No new or modified Node test within tests/engineering/'+c.id);
    if(source.some(k=>fs.readFileSync(path.join(project,k),'utf8').includes('Unrolled ejected content')))
      missing.push('Ejected screen still contains placeholder content');
    // AEP output must remain registered so regenerate cannot silently overwrite an ejected route.
    if(c.strategy==='ejection'){
      const manifest=json(path.join(project,'factory-assembly.json'));
      if(manifest.ejected?.[c.scope[0]]?.pageId!==c.page.replaceAll('.','-'))
        missing.push('Missing Assembly Ejection Protocol registration');
    }
    return {id:c.id,source,tests,errors:missing};
  });
  const errors=outside.map(k=>'Out-of-scope code change: '+k)
    .concat(checks.flatMap(c=>c.errors.map(msg=>c.id+': '+msg)));
  const result={ok:false,scopeValid:errors.length===0,changed,outside,contracts:checks,
    testsRan:false,testsPassed:false,typecheckPassed:false,errors,
    manualAcceptanceRequired:contracts.map(c=>({id:c.id,platforms:c.platforms,criteria:c.acceptance}))};
  if(!runChecks||errors.length)return result;
  const testFiles=checks.flatMap(c=>c.tests);
  const tests=spawnSync(process.execPath,['--test',...testFiles],{cwd:project,encoding:'utf8',timeout:120000});
  const typecheck=spawnSync('pnpm',['run','typecheck'],{cwd:project,encoding:'utf8',timeout:120000});
  result.testsRan=true;
  result.testsPassed=tests.status===0&&!tests.error;
  result.typecheckPassed=typecheck.status===0&&!typecheck.error;
  if(!result.testsPassed)result.errors.push('Node tests failed: '+(tests.stderr||tests.error?.message||tests.stdout||'unknown').slice(0,700));
  if(!result.typecheckPassed)result.errors.push('Typecheck failed: '+(typecheck.stderr||typecheck.error?.message||typecheck.stdout||'unknown').slice(0,700));
  result.ok=result.errors.length===0;
  // Passing automated checks is not equivalent to manual iOS/Android acceptance or deployment readiness.
  return result;
}
