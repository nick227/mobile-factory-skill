// MR 8: one deterministic generation command from an explicitly approved AppSpec.
// No agent/LLM calls, no handwritten per-screen source. Existing projects remain untouched on failed preflight.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as engine from './engine.mjs';
import * as editorial from './editorial.mjs';
import * as assembler from './assembler.mjs';
import { installSource } from '../scripts/install-source.mjs';

const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const walk=dir=>fs.readdirSync(dir,{withFileTypes:true}).flatMap(entry=>{
  const full=path.join(dir,entry.name);
  return entry.isDirectory()?walk(full):[full];
}).sort();
const slug=dir=>path.basename(dir).toLowerCase().replace(/[^a-z0-9-]+/g,'-').replace(/^-+|-+$/g,'')||'factory-app';
function roots(root){
  const library=fs.existsSync(path.join(root,'packages/ui/src'))?path.join(root,'packages/ui/src'):path.join(root,'library');
  const catalog=fs.existsSync(path.join(root,'packages/catalog/registry.json'))?path.join(root,'packages/catalog/registry.json'):path.join(root,'catalog.json');
  const template=path.join(root,'templates/expo-app');
  if(!fs.existsSync(library)||!fs.existsSync(catalog)||!fs.existsSync(template))
    throw Error('Generator needs packaged Expo template, UI library and catalog');
  return {library,catalog,template};
}
function approvedSpec(project) {
  const state=engine.load(project);
  if(!state.batches)throw Error('factory generate requires an opted-in batch blueprint; legacy builds use app scaffold and assemble');
  if(!editorial.approved(state))throw Error('Generation blocked: approval is missing, stale or does not match the current AppSpec');
  const check=engine.audit(state);
  if(!check.ready)throw Error('Generation blocked: blueprint audit failed: '+check.problems.map(p=>p.message).join('; '));
  const finalized=editorial.materialize(state);
  if(finalized.engineering.length)throw Error('Generation blocked: approved custom engineering contracts require controlled construction; use engineering MR 3 workflow');
  if(finalized.hash!==state.approval.appSpecHash||finalized.hash!==state.batches.selections.review.specHash)
    throw Error('Generation blocked: executable AppSpec hash mismatch');
  const validation=assembler.validateSpec(finalized.spec);
  if(!validation.ok)throw Error('Generation blocked: executable AppSpec invalid: '+validation.errors.join('; '));
  return {state,spec:finalized.spec,hash:finalized.hash,revision:state.revision};
}
function configure(stage,state,project){
  const name=slug(project);
  const pkgFile=path.join(stage,'package.json');
  const pkg=JSON.parse(fs.readFileSync(pkgFile,'utf8'));
  pkg.name=name;
  fs.writeFileSync(pkgFile,JSON.stringify(pkg,null,2)+'\n');
  const configFile=path.join(stage,'app.json');
  const app=JSON.parse(fs.readFileSync(configFile,'utf8'));
  app.expo.name=state.name;
  app.expo.slug=name;
  app.expo.scheme=name.replace(/[^a-z0-9]/g,'')||'factoryapp';
  fs.writeFileSync(configFile,JSON.stringify(app,null,2)+'\n');
}
/** Generate into project root. dryRun inspects everything without writing to the project. */
export function generate(projectDir,{dryRun=false,root=ROOT}={}){
  const project=path.resolve(projectDir);
  const approved=approvedSpec(project); // Always verify before creating any destination output.
  const {library,catalog,template}=roots(root);
  const isExisting=fs.existsSync(path.join(project,'package.json'));
  const scratch=fs.mkdtempSync(path.join(os.tmpdir(),'mobile-factory-generate-'));
  try{
    const specFile=path.join(scratch,'approved.spec.json');
    fs.writeFileSync(specFile,JSON.stringify(approved.spec,null,2)+'\n');
    if(isExisting){
      // The assembler owns existing generated files, protects hand edits and removes old owned routes.
      // Its preflight guarantees no writes when conflicts exist; dryRun writes nothing.
      const result=assembler.assemble(specFile,project,{dryRun,root});
      if(!result.ok)return {ok:false,project,revision:approved.revision,appSpecHash:approved.hash,...result};
      return {ok:true,project,revision:approved.revision,appSpecHash:approved.hash,mode:'update',...result};
    }
    // Stage the *complete* app outside the project; only publish after all validation has passed.
    const stage=path.join(scratch,'app');
    fs.cpSync(template,stage,{recursive:true});
    configure(stage,approved.state,project);
    const ui=installSource({libraryDir:library,registryFile:catalog,appDir:stage,all:true});
    if(ui.collisions?.length)throw Error('Unexpected UI source collisions: '+ui.collisions.join(', '));
    // The general installer records wall-clock time; approved generation must be byte-reproducible.
    const installManifest=path.join(stage,'factory-install.json');
    const installed=JSON.parse(fs.readFileSync(installManifest,'utf8'));
    delete installed.installedAt;
    fs.writeFileSync(installManifest,JSON.stringify(installed,null,2)+'\n');
    const result=assembler.assemble(specFile,stage,{root});
    if(!result.ok)throw Error('Assembly preflight failed: '+(result.error??result.errors?.join('; ')));
    const staged=walk(stage).map(file=>path.relative(stage,file)).sort();
    const conflicts=staged.filter(rel=>fs.existsSync(path.join(project,rel)));
    if(conflicts.length)throw Error('Generation would overwrite existing project files: '+conflicts.slice(0,8).join(', '));
    if(dryRun)return {ok:true,project,revision:approved.revision,appSpecHash:approved.hash,mode:'create',dryRun:true,files:staged,pages:result.pages};
    // Recheck current approval in case another process modified the project while staging.
    if(approvedSpec(project).hash!==approved.hash)throw Error('Approved AppSpec changed during generation');
    const created=[];
    try{
      for(const rel of staged){
        const dest=path.join(project,rel);
        fs.mkdirSync(path.dirname(dest),{recursive:true});
        fs.copyFileSync(path.join(stage,rel),dest,fs.constants.COPYFILE_EXCL);
        created.push(dest);
      }
    }catch(error){
      for(const dest of created.reverse())fs.rmSync(dest,{force:true});
      throw error;
    }
    return {ok:true,project,revision:approved.revision,appSpecHash:approved.hash,mode:'create',written:staged,pages:result.pages};
  }finally{
    fs.rmSync(scratch,{recursive:true,force:true});
  }
}
